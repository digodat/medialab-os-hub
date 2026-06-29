"use server";

import { headers } from "next/headers";

import {
  type CategoryKey,
  isCategoryKey,
  isSeverity,
} from "@/lib/security/security-catalog";
import {
  SecurityPersistenceError,
  appendSecurityChange,
  getSecurityRequesterEmail,
  upsertFinding,
} from "@/lib/security/security-persistence";
import {
  type SecurityChangeKind,
  type SecurityHistoryEntry,
  type Severity,
  type TaskStatus,
  isTaskStatus,
  isValidHistoryDate,
} from "@/lib/security/security-status";

export type AppendSecurityChangeResult =
  | {
      success: true;
      entry: SecurityHistoryEntry;
      currentStatus: TaskStatus;
    }
  | {
      success: false;
      error: string;
    };

export type UpsertFindingResult =
  | {
      success: true;
      findingId: string;
    }
  | {
      success: false;
      error: string;
    };

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function appendSecurityChangeAction(payload: {
  findingId: string;
  status: TaskStatus;
  reason: string;
  date: string;
  mode: SecurityChangeKind;
}): Promise<AppendSecurityChangeResult> {
  const findingId = payload.findingId.trim();

  if (!findingId) {
    return {
      success: false,
      error: "No encontramos ese hallazgo de seguridad.",
    };
  }

  if (!isTaskStatus(payload.status)) {
    return {
      success: false,
      error: "El estado seleccionado no es válido.",
    };
  }

  const kind: SecurityChangeKind =
    payload.mode === "note" ? "note" : "status";

  const reason = payload.reason.trim();

  if (!reason) {
    return {
      success: false,
      error: "El motivo del cambio es obligatorio.",
    };
  }

  if (!isValidHistoryDate(payload.date)) {
    return {
      success: false,
      error: "La fecha no es válida.",
    };
  }

  try {
    const requestHeaders = await headers();
    const author = await getSecurityRequesterEmail(requestHeaders);
    const entry = await appendSecurityChange({
      findingId,
      status: payload.status,
      reason,
      date: payload.date,
      author,
      kind,
    });

    return {
      success: true,
      entry,
      currentStatus: payload.status,
    };
  } catch (error) {
    console.error("Security change persistence failed", error);

    if (error instanceof SecurityPersistenceError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "No pudimos guardar el cambio. Intentá de nuevo.",
    };
  }
}

export async function upsertSecurityFindingAction(payload: {
  id?: string;
  severity: Severity;
  category: CategoryKey;
  title: string;
  detail: string;
}): Promise<UpsertFindingResult> {
  const title = payload.title.trim();
  const detail = payload.detail.trim();

  if (!isSeverity(payload.severity)) {
    return { success: false, error: "La severidad no es válida." };
  }

  if (!isCategoryKey(payload.category)) {
    return { success: false, error: "La categoría no es válida." };
  }

  if (!title) {
    return { success: false, error: "El título es obligatorio." };
  }

  if (!detail) {
    return { success: false, error: "El detalle es obligatorio." };
  }

  const existingId = payload.id?.trim();
  const isNew = !existingId;
  // For new findings derive a readable id from the title, falling back to a
  // random suffix to avoid collisions.
  const id =
    existingId ||
    `${slugify(title) || "finding"}-${crypto.randomUUID().slice(0, 8)}`;

  try {
    await upsertFinding(
      { id, severity: payload.severity, category: payload.category, title, detail },
      isNew,
    );

    return { success: true, findingId: id };
  } catch (error) {
    console.error("Security finding upsert failed", error);

    if (error instanceof SecurityPersistenceError) {
      return { success: false, error: error.message };
    }

    return {
      success: false,
      error: "No pudimos guardar el hallazgo. Intentá de nuevo.",
    };
  }
}
