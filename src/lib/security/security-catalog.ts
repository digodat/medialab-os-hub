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
  code: string;
  severity: Severity;
  category: CategoryKey;
  title: string;
  detail: string;
};

export type NumberedSecurityFinding = SecurityFinding & { number: number };

// Categories stay in code: they are structural and rarely change. The findings
// themselves live in Firestore.
export const SECURITY_CATEGORIES: { key: CategoryKey; name: string }[] = [
  { key: "iam", name: "Identidad y control de acceso" },
  { key: "secrets", name: "Gestión de secretos y credenciales" },
  { key: "deps", name: "Dependencias y cadena de suministro" },
  { key: "platform", name: "Configuración y hardening de la plataforma" },
  { key: "data", name: "Validación de entrada y protección de datos" },
  { key: "ops", name: "Observabilidad, abuso y calidad de código" },
];

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
