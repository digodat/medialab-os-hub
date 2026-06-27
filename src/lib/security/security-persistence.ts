import "server-only";

import { FieldValue, Firestore } from "@google-cloud/firestore";

import {
  getDevAuthorEmail,
  parseIapEmailHeader,
} from "@/lib/security/iap-access";
import {
  type SecurityFindingRecord,
  type SecurityHistoryEntry,
  type TaskStatus,
  isTaskStatus,
  isValidHistoryDate,
} from "@/lib/security/security-status";

const SECURITY_FINDINGS_COLLECTION = "security-findings";

let firestoreSingleton: Firestore | null = null;

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

  return {
    id: value.id,
    status: value.status,
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

export async function getAllSecurityRecords(): Promise<
  Record<string, SecurityFindingRecord>
> {
  // Any failure to reach Firestore propagates so the page can render an error
  // state instead of the findings list. An empty collection returns {} via the
  // normal path (connected, but no data yet).
  const snapshot = await getSecurityFindingsCollection().get();
  const records: Record<string, SecurityFindingRecord> = {};

  for (const doc of snapshot.docs) {
    const record = sanitizeFindingRecord(doc.id, doc.data());

    if (record) {
      records[doc.id] = record;
    }
  }

  return records;
}

export async function appendSecurityChange({
  findingId,
  status,
  reason,
  date,
  author,
}: {
  findingId: string;
  status: TaskStatus;
  reason: string;
  date: string;
  author: string;
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

  const entry: SecurityHistoryEntry = {
    id: crypto.randomUUID(),
    status,
    reason: trimmedReason,
    author,
    date,
    createdAt: nowIso(),
  };

  await getSecurityFindingsCollection()
    .doc(trimmedFindingId)
    .set(
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
