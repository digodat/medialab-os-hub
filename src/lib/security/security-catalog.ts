import type { Severity } from "@/lib/security/security-status";

export type CategoryKey =
  | "iam"
  | "secrets"
  | "deps"
  | "platform"
  | "data"
  | "ops";

export type SecurityFinding = {
  id: string;
  severity: Severity;
  category: CategoryKey;
  title: string;
  detail: string;
};

export type NumberedSecurityFinding = SecurityFinding & {
  number: number;
  code: string;
};

// Categories stay in code: they are structural and rarely change. The findings
// themselves live in Firestore. Each category has a single-letter prefix used
// to build the human-facing identifier (e.g. "P01").
export const SECURITY_CATEGORIES: {
  key: CategoryKey;
  name: string;
  letter: string;
}[] = [
  { key: "iam", name: "Identidad y control de acceso", letter: "I" },
  { key: "secrets", name: "Gestión de secretos y credenciales", letter: "S" },
  { key: "deps", name: "Dependencias y cadena de suministro", letter: "D" },
  { key: "platform", name: "Configuración y hardening de la plataforma", letter: "P" },
  { key: "data", name: "Validación de entrada y protección de datos", letter: "V" },
  { key: "ops", name: "Observabilidad, abuso y calidad de código", letter: "O" },
];

const CATEGORY_LETTERS = new Map<CategoryKey, string>(
  SECURITY_CATEGORIES.map((category) => [category.key, category.letter]),
);

// Builds the human-facing identifier: the category letter followed by the
// zero-padded sequential number (e.g. "P01").
export function formatFindingCode(finding: {
  category: CategoryKey;
  number: number;
}): string {
  const letter = CATEGORY_LETTERS.get(finding.category) ?? "";
  return `${letter}${String(finding.number).padStart(2, "0")}`;
}

export const SEVERITY_VALUES: Severity[] = [
  "CRÍTICO",
  "ALTO",
  "MEDIO",
  "BAJO",
  "OK",
];

const CATEGORY_KEYS = new Set<string>(
  SECURITY_CATEGORIES.map((category) => category.key),
);

const SEVERITY_SET = new Set<string>(SEVERITY_VALUES);

export function isCategoryKey(value: unknown): value is CategoryKey {
  return typeof value === "string" && CATEGORY_KEYS.has(value);
}

export function isSeverity(value: unknown): value is Severity {
  return typeof value === "string" && SEVERITY_SET.has(value);
}
