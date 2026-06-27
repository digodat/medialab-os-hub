const IAP_EMAIL_HEADER = "x-goog-authenticated-user-email";
const IAP_EMAIL_NAMESPACE_PREFIX = "accounts.google.com:";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function parseIapEmailHeader(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();
  const emailValue = trimmedValue.startsWith(IAP_EMAIL_NAMESPACE_PREFIX)
    ? trimmedValue.slice(IAP_EMAIL_NAMESPACE_PREFIX.length)
    : trimmedValue;
  const normalizedEmail = normalizeEmail(emailValue);

  return normalizedEmail.includes("@") ? normalizedEmail : null;
}

export function getDevAuthorEmail() {
  return process.env.SECURITY_DEV_AUTHOR_EMAIL?.trim() || "dev@local";
}
