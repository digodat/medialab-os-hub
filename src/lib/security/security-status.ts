export type TaskStatus =
  | "Finalizada"
  | "En proceso"
  | "Despriorizada"
  | "No Aplica"
  | "No comenzada";

export type Severity = "CRÍTICO" | "ALTO" | "MEDIO" | "BAJO" | "OK";

export type SecurityHistoryEntry = {
  id: string;
  status: TaskStatus;
  reason: string;
  author: string;
  date: string;
  createdAt: string;
};

export type SecurityFindingRecord = {
  findingId: string;
  currentStatus: TaskStatus;
  updatedAt: string;
  history: SecurityHistoryEntry[];
};

const TASK_STATUSES: TaskStatus[] = [
  "Finalizada",
  "En proceso",
  "Despriorizada",
  "No Aplica",
  "No comenzada",
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    typeof value === "string" &&
    TASK_STATUSES.includes(value as TaskStatus)
  );
}

export function getDefaultStatusForSeverity(severity: Severity): TaskStatus {
  return severity === "OK" ? "No Aplica" : "No comenzada";
}

export function isValidHistoryDate(value: string) {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);

  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

export function getTodayDateInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(value: string) {
  if (!isValidHistoryDate(value)) {
    return value;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export function getLatestHistoryEntry(record?: SecurityFindingRecord | null) {
  if (!record?.history.length) {
    return null;
  }

  return record.history[record.history.length - 1] ?? null;
}
