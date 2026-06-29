import "server-only";

import { FieldValue, Firestore } from "@google-cloud/firestore";

import {
  type CategoryKey,
  type NumberedSecurityFinding,
  type SecurityFinding,
  formatFindingCode,
  isCategoryKey,
  isSeverity,
} from "@/lib/security/security-catalog";
import {
  getDevAuthorEmail,
  parseIapEmailHeader,
} from "@/lib/security/iap-access";
import {
  type SecurityChangeKind,
  type SecurityFindingRecord,
  type SecurityHistoryEntry,
  type Severity,
  type TaskStatus,
  getDefaultStatusForSeverity,
  isTaskStatus,
  isValidHistoryDate,
} from "@/lib/security/security-status";

const SECURITY_FINDINGS_COLLECTION = "security-findings";

let firestoreSingleton: Firestore | null = null;

export type SecurityFindingWithState = {
  finding: NumberedSecurityFinding;
  record: SecurityFindingRecord | null;
};

export type FindingInput = {
  id: string;
  severity: Severity;
  category: CategoryKey;
  title: string;
  detail: string;
};

export class SecurityPersistenceError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "SecurityPersistenceError";
    this.status = status;
  }
}

function getFirestoreDatabaseId() {
  const databaseId = process.env.SECURITY_FIRESTORE_DATABASE_ID?.trim();

  if (!databaseId) {
    throw new SecurityPersistenceError(
      "SECURITY_FIRESTORE_DATABASE_ID no está configurado.",
      500,
    );
  }

  return databaseId;
}

function getFirestoreClient() {
  if (firestoreSingleton) {
    return firestoreSingleton;
  }

  const databaseId = getFirestoreDatabaseId();

  firestoreSingleton = new Firestore(
    databaseId === "(default)" ? {} : { databaseId },
  );

  return firestoreSingleton;
}

function getSecurityFindingsCollection() {
  return getFirestoreClient().collection(SECURITY_FINDINGS_COLLECTION);
}

function nowIso() {
  return new Date().toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeHistoryEntry(value: unknown): SecurityHistoryEntry | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    !isTaskStatus(value.status) ||
    typeof value.reason !== "string" ||
    typeof value.author !== "string" ||
    typeof value.date !== "string" ||
    typeof value.createdAt !== "string"
  ) {
    return null;
  }

  const kind: SecurityChangeKind | undefined =
    value.kind === "status" || value.kind === "note" ? value.kind : undefined;
  const previousStatus = isTaskStatus(value.previousStatus)
    ? value.previousStatus
    : undefined;

  return {
    id: value.id,
    status: value.status,
    ...(previousStatus ? { previousStatus } : {}),
    ...(kind ? { kind } : {}),
    reason: value.reason,
    author: value.author,
    date: value.date,
    createdAt: value.createdAt,
  };
}

function sanitizeFindingRecord(
  findingId: string,
  value: unknown,
): SecurityFindingRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  const history = Array.isArray(value.history)
    ? value.history
        .map((entry) => sanitizeHistoryEntry(entry))
        .filter((entry): entry is SecurityHistoryEntry => entry !== null)
    : [];

  const currentStatus = isTaskStatus(value.currentStatus)
    ? value.currentStatus
    : history[history.length - 1]?.status;

  if (!currentStatus) {
    return null;
  }

  return {
    findingId,
    currentStatus,
    updatedAt:
      typeof value.updatedAt === "string" ? value.updatedAt : nowIso(),
    history,
  };
}

function sanitizeCatalog(
  findingId: string,
  value: unknown,
): SecurityFinding | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isSeverity(value.severity) ||
    !isCategoryKey(value.category) ||
    typeof value.title !== "string" ||
    typeof value.detail !== "string"
  ) {
    return null;
  }

  return {
    id: findingId,
    severity: value.severity,
    category: value.category,
    title: value.title,
    detail: value.detail,
  };
}

// Reads the full catalog (metadata) and operational state of every finding.
// Findings are ordered by their stored `order` field and renumbered
// sequentially so the displayed `#NN` stays stable and gap-free.
export async function getAllSecurityFindings(): Promise<
  SecurityFindingWithState[]
> {
  const snapshot = await getSecurityFindingsCollection().get();

  const rows: {
    order: number;
    catalog: SecurityFinding;
    storedCode: string | null;
    record: SecurityFindingRecord | null;
  }[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const catalog = sanitizeCatalog(doc.id, data);

    if (!catalog) {
      continue;
    }

    const order =
      typeof data.order === "number" ? data.order : Number.MAX_SAFE_INTEGER;
    const storedCode =
      typeof data.code === "string" && data.code.trim()
        ? data.code.trim()
        : null;

    rows.push({
      order,
      catalog,
      storedCode,
      record: sanitizeFindingRecord(doc.id, data),
    });
  }

  rows.sort(
    (a, b) =>
      a.order - b.order || a.catalog.title.localeCompare(b.catalog.title),
  );

  return rows.map((row, index) => {
    const number = index + 1;
    // Prefer the persisted identifier so it stays stable; fall back to a
    // computed one for documents that predate the backfill.
    const code =
      row.storedCode ??
      formatFindingCode({ category: row.catalog.category, number });

    return {
      finding: { ...row.catalog, number, code },
      record: row.record,
    };
  });
}

function validateFindingInput(input: FindingInput) {
  const id = input.id.trim();
  const title = input.title.trim();
  const detail = input.detail.trim();

  if (!id) {
    throw new SecurityPersistenceError("El identificador es obligatorio.", 400);
  }

  if (!isSeverity(input.severity)) {
    throw new SecurityPersistenceError("La severidad no es válida.", 400);
  }

  if (!isCategoryKey(input.category)) {
    throw new SecurityPersistenceError("La categoría no es válida.", 400);
  }

  if (!title) {
    throw new SecurityPersistenceError("El título es obligatorio.", 400);
  }

  if (!detail) {
    throw new SecurityPersistenceError("El detalle es obligatorio.", 400);
  }

  return { id, title, detail };
}

async function getNextOrder() {
  const snapshot = await getSecurityFindingsCollection().get();
  let maxOrder = 0;

  for (const doc of snapshot.docs) {
    const order = doc.data().order;
    if (typeof order === "number" && order > maxOrder) {
      maxOrder = order;
    }
  }

  return maxOrder + 1;
}

// Creates a new finding or edits the catalog fields of an existing one. Editing
// never touches the operational state (currentStatus / history).
export async function upsertFinding(
  input: FindingInput,
  isNew: boolean,
): Promise<void> {
  const { id, title, detail } = validateFindingInput(input);
  const docRef = getSecurityFindingsCollection().doc(id);
  const existing = await docRef.get();

  if (isNew) {
    if (existing.exists) {
      throw new SecurityPersistenceError(
        "Ya existe un hallazgo con ese identificador.",
        409,
      );
    }

    const order = await getNextOrder();

    await docRef.set({
      findingId: id,
      severity: input.severity,
      category: input.category,
      title,
      detail,
      order,
      code: formatFindingCode({ category: input.category, number: order }),
      currentStatus: getDefaultStatusForSeverity(input.severity),
      updatedAt: nowIso(),
      history: [],
    });

    return;
  }

  if (!existing.exists) {
    throw new SecurityPersistenceError(
      "No encontramos ese hallazgo de seguridad.",
      404,
    );
  }

  // Recompute the identifier on edit so a category change updates the letter
  // while the number (its persisted order) stays put.
  const existingOrder = existing.data()?.order;
  const order =
    typeof existingOrder === "number" ? existingOrder : await getNextOrder();

  await docRef.set(
    {
      severity: input.severity,
      category: input.category,
      title,
      detail,
      code: formatFindingCode({ category: input.category, number: order }),
    },
    { merge: true },
  );
}

export async function appendSecurityChange({
  findingId,
  status,
  reason,
  date,
  author,
  kind,
}: {
  findingId: string;
  status: TaskStatus;
  reason: string;
  date: string;
  author: string;
  kind: SecurityChangeKind;
}): Promise<SecurityHistoryEntry> {
  const trimmedFindingId = findingId.trim();
  const trimmedReason = reason.trim();

  if (!trimmedFindingId) {
    throw new SecurityPersistenceError("El id del hallazgo es obligatorio.", 400);
  }

  if (!trimmedReason) {
    throw new SecurityPersistenceError("El motivo del cambio es obligatorio.", 400);
  }

  if (!isValidHistoryDate(date)) {
    throw new SecurityPersistenceError("La fecha no es válida.", 400);
  }

  const docRef = getSecurityFindingsCollection().doc(trimmedFindingId);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    throw new SecurityPersistenceError(
      "No encontramos ese hallazgo de seguridad.",
      404,
    );
  }

  const data = snapshot.data() ?? {};
  const previousStatus = isTaskStatus(data.currentStatus)
    ? data.currentStatus
    : null;

  const entry: SecurityHistoryEntry = {
    id: crypto.randomUUID(),
    status,
    previousStatus,
    kind,
    reason: trimmedReason,
    author,
    date,
    createdAt: nowIso(),
  };

  await docRef.set(
    {
      findingId: trimmedFindingId,
      currentStatus: status,
      updatedAt: entry.createdAt,
      history: FieldValue.arrayUnion(entry),
    },
    { merge: true },
  );

  return entry;
}

export async function getSecurityRequesterEmail(requestHeaders: Headers) {
  const email = parseIapEmailHeader(
    requestHeaders.get("x-goog-authenticated-user-email"),
  );

  return email ?? getDevAuthorEmail();
}
