"use server";

import { headers } from "next/headers";

import { SECURITY_FINDING_BY_ID } from "@/lib/security/security-findings";
import {
  SecurityPersistenceError,
  appendSecurityChange,
  getSecurityRequesterEmail,
} from "@/lib/security/security-persistence";
import {
  type SecurityHistoryEntry,
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

export async function appendSecurityChangeAction(payload: {
  findingId: string;
  status: TaskStatus;
  reason: string;
  date: string;
}): Promise<AppendSecurityChangeResult> {
  const findingId = payload.findingId.trim();

  if (!findingId || !SECURITY_FINDING_BY_ID.has(findingId)) {
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
