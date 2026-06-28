// One-time migration: loads the security findings catalog into Firestore.
// Idempotent: preserves existing operational state (currentStatus / history)
// and only refreshes catalog metadata + order. Run with ADC:
//   SECURITY_FIRESTORE_DATABASE_ID=medialab-os-hub node scripts/seed-security-findings.mjs

import { Firestore } from "@google-cloud/firestore";

const COLLECTION = "security-findings";

const databaseId = process.env.SECURITY_FIRESTORE_DATABASE_ID?.trim();
if (!databaseId) {
  console.error("Falta SECURITY_FIRESTORE_DATABASE_ID");
  process.exit(1);
}

const db = new Firestore(databaseId === "(default)" ? {} : { databaseId });

function defaultStatus(severity) {
  return severity === "OK" ? "No Aplica" : "No comenzada";
}

const FINDINGS = [
  {
    id: "c1-meta-token",
    code: "C1",
    severity: "CRÍTICO",
    category: "secrets",
    title: "Meta access token expuesto al bundle del cliente",
    detail:
      "NEXT_PUBLIC_META_ACCESS_TOKEN se reemplaza en build time y queda en el JS del navegador. Mover el flujo de Meta a un endpoint server-side con token leído de Secret Manager.",
  },
  {
    id: "c2-oss-tls-insecure",
    code: "C2",
    severity: "CRÍTICO",
    category: "platform",
    title: "OSS_TLS_INSECURE=1 hardcoded en el script dev",
    detail:
      "El script npm run dev desactiva la verificación de certificado TLS para todos los requests a OSS. Sacarlo del script y documentar NODE_EXTRA_CA_CERTS como mecanismo legítimo.",
  },
  {
    id: "h1-nextjs-cves",
    code: "H1",
    severity: "ALTO",
    category: "deps",
    title: "Next.js 16.2.3 con 6 CVEs HIGH de routing/middleware",
    detail:
      "DoS en Server Components, bypass de middleware, SSRF en WebSocket upgrades y más. Bumpear a 16.2.6+ y testear rutas dinámicas y flows de auth.",
  },
  {
    id: "h2-localstorage-tokens",
    code: "H2",
    severity: "ALTO",
    category: "iam",
    title: "Tokens de Google/Meta en localStorage (vulnerable a XSS)",
    detail:
      "Cualquier JS de la página accede a localStorage; un XSS exfiltra todos los tokens. Fix correcto: cookies httpOnly + refresh server-side. Pragmático: documentar deuda y reforzar CSP.",
  },
  {
    id: "h3-security-headers",
    code: "H3",
    severity: "ALTO",
    category: "platform",
    title: "Sin headers de seguridad en next.config.ts",
    detail:
      "No hay CSP, HSTS, X-Frame-Options, X-Content-Type-Options ni Referrer-Policy. Agregar headers() async; empezar la CSP en report-only.",
  },
  {
    id: "h4-rate-limiting",
    code: "H4",
    severity: "ALTO",
    category: "ops",
    title: "Rate limiting inexistente en endpoints de Google Ads",
    detail:
      "37 rutas bajo /api/google-ads/** sin límite. Un usuario autenticado puede agotar quota y generar costos reales. Middleware de rate limit por usuario.",
  },
  {
    id: "h5-bigquery-errors",
    code: "H5",
    severity: "ALTO",
    category: "data",
    title: "Errores de BigQuery devueltos crudos al cliente",
    detail:
      "Exponen nombres de tablas, datasets, project IDs y fragmentos de SQL. Loguear server-side y devolver un error genérico al cliente.",
  },
  {
    id: "h6-xlsx-vuln",
    code: "H6",
    severity: "ALTO",
    category: "deps",
    title: "xlsx 0.18.5 con prototype pollution + ReDoS",
    detail:
      "Se usa para parsear el media plan que el PM sube a OSS. Un xlsx malicioso puede ejecutar prototype pollution durante el parseo. Bumpear a 0.20.2+.",
  },
  {
    id: "h7-whoami-token",
    code: "H7",
    severity: "ALTO",
    category: "iam",
    title: "/api/google-ads/whoami expone token + customer-id",
    detail:
      "Endpoint diagnóstico que devuelve un preview del developer token y el loginCustomerId. No devolver token ni customerId; gatear para admins o quitar de prod.",
  },
  {
    id: "h8-country-binding",
    code: "H8",
    severity: "ALTO",
    category: "iam",
    title: "Sin binding usuario↔país (country viene del cliente)",
    detail:
      "Un usuario puede pasar country=co aunque solo deba ver CL. Atar el set de países permitidos a la identidad del usuario y validar en cada ruta.",
  },
  {
    id: "m1-console-logs",
    code: "M1",
    severity: "MEDIO",
    category: "ops",
    title: "console.log con payloads de campañas en producción",
    detail:
      "~46 instancias dumpean customer IDs, budgets y copy a Cloud Logging. Logger central con niveles, debug apagado en prod.",
  },
  {
    id: "m2-source-maps",
    code: "M2",
    severity: "MEDIO",
    category: "platform",
    title: "Source maps activos en cloud function",
    detail:
      "oss-ingest publica los .map en GCS, exponiendo nombres y paths internos del código. Poner sourceMap: false en el tsconfig de prod.",
  },
  {
    id: "m3-gitignore",
    code: "M3",
    severity: "MEDIO",
    category: "secrets",
    title: ".gitignore incompleto",
    detail:
      "No cubre *.key, *.pem, service-account*.json ni *-credentials.json. Hoy no hay archivos así en el repo, pero un dev distraído puede commitearlos.",
  },
  {
    id: "m4-input-validation",
    code: "M4",
    severity: "MEDIO",
    category: "data",
    title: "Validación de input parcial en endpoints",
    detail:
      "La validación Zod corre dentro del builder, no en el boundary del route handler. Parsear con Zod en la primera línea de cada ruta.",
  },
  {
    id: "m5-oss-send-modal",
    code: "M5",
    severity: "MEDIO",
    category: "ops",
    title: "OssSendModal.tsx tiene 8348 líneas",
    detail:
      "~70 useState, ~20 useEffect y la lógica de 8 plataformas en un solo componente. No es riesgo de seguridad, pero es imposible de auditar. Refactor planificado.",
  },
  {
    id: "m6-eslint-rules",
    code: "M6",
    severity: "MEDIO",
    category: "ops",
    title: "ESLint sin reglas de seguridad/calidad explícitas",
    detail:
      "No enforce no-console, no-explicit-any ni no-floating-promises. Agregar reglas al menos como warn; no-console cierra M1 a nivel CI.",
  },
  {
    id: "l1-uuid-regex",
    code: "L1",
    severity: "BAJO",
    category: "data",
    title: "UUID regex laxa en validación de campaignId",
    detail:
      "El patrón acepta cualquier string de 8-64 chars hex+guion. Usar el regex de UUID estándar en media-plan y campaign-documents.",
  },
  {
    id: "l2-package-version",
    code: "L2",
    severity: "BAJO",
    category: "ops",
    title: 'version: "0.0.0" en package.json',
    detail:
      "Confunde a los supply-chain scanners y al CI. Subir a 0.1.0 o 1.0.0-alpha.",
  },
  {
    id: "ok-secrets-env",
    code: "OK",
    severity: "OK",
    category: "secrets",
    title: ".env.local correctamente gitignoreado",
    detail:
      "Existe localmente como debe ser, pero nunca fue commiteado al repo. Verificado con git ls-files.",
  },
  {
    id: "ok-secrets-no-keys",
    code: "OK",
    severity: "OK",
    category: "secrets",
    title: "Sin service-account JSON ni private keys en el repo",
    detail:
      "No hay archivos *.json con el campo private_key trackeados en el repositorio.",
  },
  {
    id: "ok-platform-oss-ingest",
    code: "OK",
    severity: "OK",
    category: "platform",
    title: "Cloud function oss-ingest correctamente protegida",
    detail:
      "Deployada con --no-allow-unauthenticated + OIDC desde Cloud Scheduler.",
  },
  {
    id: "ok-data-bq-whitelist",
    code: "OK",
    severity: "OK",
    category: "data",
    title: "BigQuery con country whitelisting (sin SQL injection)",
    detail:
      'Las queries usan whitelist de países ["cl", "co", "pe"]; no hay SQL injection real.',
  },
  {
    id: "ok-platform-ts-strict",
    code: "OK",
    severity: "OK",
    category: "platform",
    title: "TypeScript strict: true activo",
    detail: "Habilitado tanto en el root como en la cloud function.",
  },
  {
    id: "ok-data-zod",
    code: "OK",
    severity: "OK",
    category: "data",
    title: "Zod schemas en endpoints internos",
    detail:
      "Los schemas existen en src/lib/google-ads/schemas/* y los endpoints internos sí validan.",
  },
  {
    id: "ok-data-no-ts-ignore",
    code: "OK",
    severity: "OK",
    category: "data",
    title: "Sin @ts-ignore ni @ts-expect-error en el código",
    detail: "El código de aplicación no suprime errores de tipos.",
  },
  {
    id: "ok-iam-google-ads-bearer",
    code: "OK",
    severity: "OK",
    category: "iam",
    title: "Auth de Google Ads forwardea el Bearer del usuario",
    detail:
      "Usa la identidad del usuario en lugar de credenciales compartidas.",
  },
  {
    id: "ok-deps-package-lock",
    code: "OK",
    severity: "OK",
    category: "deps",
    title: "package-lock.json commiteado",
    detail: "Presente tanto en el root como en la cloud function.",
  },
];

async function main() {
  let created = 0;
  let updated = 0;

  for (let i = 0; i < FINDINGS.length; i++) {
    const finding = FINDINGS[i];
    const order = i + 1;
    const docRef = db.collection(COLLECTION).doc(finding.id);
    const snapshot = await docRef.get();

    const catalog = {
      findingId: finding.id,
      code: finding.code,
      severity: finding.severity,
      category: finding.category,
      title: finding.title,
      detail: finding.detail,
      order,
    };

    if (snapshot.exists) {
      await docRef.set(catalog, { merge: true });
      updated += 1;
    } else {
      await docRef.set({
        ...catalog,
        currentStatus: defaultStatus(finding.severity),
        updatedAt: new Date().toISOString(),
        history: [],
      });
      created += 1;
    }
  }

  console.log(
    `Seed completo. creados=${created} actualizados=${updated} total=${FINDINGS.length} db=${databaseId}`,
  );
}

main().catch((error) => {
  console.error("Seed falló:", error);
  process.exit(1);
});
