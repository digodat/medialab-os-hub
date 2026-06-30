// Roadmap domain model and timeline helpers.
//
// The chart is a month-grouped, week-granular Gantt: each epic is a horizontal
// bar placed on a week grid. Week indices are 0-based and relative to the
// timeline start (TIMELINE_START). Each month is a fixed block of
// WEEKS_PER_MONTH weeks. With the current config (Jun–Dic 2026, 7 months × 4
// weeks = 28 weeks):
//   0-3   -> Jun '26 (S1-S4)
//   4-7   -> Jul '26
//   8-11  -> Ago '26
//   12-15 -> Sep '26
//   16-19 -> Oct '26
//   20-23 -> Nov '26
//   24-27 -> Dic '26

export type RoadmapStatus = "planned" | "in-progress" | "done";

export type RoadmapEpic = {
  // Unique, stable, kebab-case id. It is the handle used by `dependsOn` and as
  // a React key, so it must be unique across the whole ROADMAP_EPICS array and
  // should not change once other epics depend on it.
  id: string;
  // Bar label shown on the chart and as the dialog title.
  title: string;
  // Swimlane this epic belongs to. MUST match a `RoadmapGroup.id` from
  // ROADMAP_GROUPS (e.g. "infra" | "datos" | "app"). An epic whose group does
  // not exist there is silently dropped (it is filtered out by group in the
  // layout), so double-check the id.
  group: string;
  // Inclusive week indices relative to the timeline start (TIMELINE_START).
  // See the file header for the week -> month mapping. A single-week epic uses
  // startWeek === endWeek. The bar spans (endWeek - startWeek + 1) weeks.
  // Both must stay within [0, totalWeeks - 1]; to place a bar later than the
  // current horizon, extend TIMELINE_MONTHS rather than overflowing the index.
  startWeek: number;
  endWeek: number;
  status: RoadmapStatus;
  // Subtasks shown as a bullet list in the task detail popup. Plain strings,
  // one bullet each. UI copy in Spanish with correct accents.
  detail: string[];
  // IDs of epics that must finish before this one. Each id is rendered as a
  // dashed dependency arrow from the source's end to this epic's start. See the
  // "DEPENDENCIES" section in the ROADMAP_EPICS guide below for the rules.
  dependsOn?: string[];
  // Optional owner of the epic, rendered as a circular initial badge on the bar
  // and as a "Owner:" pill in the dialog (e.g. "Falabella").
  owner?: string;
};

// Bar height (px). Shared so the server layout and the client bars agree.
export const BAR_H = 26;

export const STATUS_STYLES: Record<
  RoadmapStatus,
  { bar: string; dot: string; label: string }
> = {
  done: {
    bar: "border-emerald-300/70 bg-emerald-50/85 text-emerald-900",
    dot: "bg-emerald-500",
    label: "Completado",
  },
  "in-progress": {
    bar: "border-brand/30 bg-brand-subtle text-brand",
    dot: "bg-brand",
    label: "En curso",
  },
  planned: {
    bar: "border-foreground/15 bg-white/70 text-foreground/80",
    dot: "bg-foreground/35",
    label: "Planificado",
  },
};

export type RoadmapGroup = {
  id: string;
  name: string;
};

// Timeline starts at June 2026 (month index 5, 0-based) and spans 7 months
// (Jun–Dic 2026). Each month is split into WEEKS_PER_MONTH equal week columns
// so bars can be placed at weekly granularity while the header stays month-based.
export const TIMELINE_START = { year: 2026, month: 5 } as const;
export const TIMELINE_MONTHS = 7;
export const WEEKS_PER_MONTH = 4;

const MONTH_ABBR = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export const ROADMAP_GROUPS: RoadmapGroup[] = [
  { id: "infra", name: "Infraestructura" },
  { id: "datos", name: "Migración de datos" },
  { id: "app", name: "Aplicación" },
];

// =============================================================================
// HOW TO EDIT THE ROADMAP (read this before changing anything below)
// =============================================================================
//
// This array is the SINGLE SOURCE OF TRUTH for the Gantt chart. Everything else
// is derived from it automatically: bars, swimlanes, the month/week axis,
// dependency arrows, hover highlighting and the detail popup. To update the
// roadmap you almost always only touch THIS array (and occasionally the
// timeline / group constants above). You do NOT need to edit any .tsx file to
// add, move or remove a task.
//
// -----------------------------------------------------------------------------
// 1. ADD A NEW TASK (epic)
// -----------------------------------------------------------------------------
// Append (or insert near its siblings) a new RoadmapEpic object. Minimum shape:
//
//   {
//     id: "mi-epica",            // unique, kebab-case, never reused
//     title: "Título visible",   // Spanish, shown on the bar
//     group: "app",              // must be a RoadmapGroup.id (see ROADMAP_GROUPS)
//     startWeek: 8,              // 0-based week index from TIMELINE_START
//     endWeek: 9,                // inclusive; === startWeek for a 1-week bar
//     status: "planned",         // "planned" | "in-progress" | "done"
//     detail: ["Subtarea 1", "Subtarea 2"], // bullets in the popup
//     // dependsOn: ["otra-epica"], // optional, see DEPENDENCIES below
//     // owner: "Falabella",        // optional badge
//   }
//
// Array order only matters as a tie-breaker; vertical placement inside a group
// is computed by packLanes() from startWeek/endWeek and dependencies, so you
// don't manually choose a row. Grouping the objects by topic (as done below,
// with a leading comment per block) keeps the file readable.
//
// -----------------------------------------------------------------------------
// 2. WEEKS AND DATES (where a bar lands horizontally)
// -----------------------------------------------------------------------------
// Weeks are 0-based indices relative to TIMELINE_START, in fixed blocks of
// WEEKS_PER_MONTH (see the mapping table in the file header). Quick math:
//   weekIndex = (monthsFromStart * WEEKS_PER_MONTH) + (weekInMonth - 1)
// e.g. "S2 de agosto" with start = Jun '26 -> month offset 2, week 2 ->
//   (2 * 4) + (2 - 1) = 9. Use formatWeekLabel(index) mentally to verify.
// If a task falls AFTER the current horizon, do NOT push the index past the end:
// bump TIMELINE_MONTHS (and the header table) so the axis grows to include it.
// To shift the whole timeline, change TIMELINE_START.
//
// -----------------------------------------------------------------------------
// 3. SWIMLANES / GROUPS
// -----------------------------------------------------------------------------
// `group` must equal an existing RoadmapGroup.id in ROADMAP_GROUPS. The order of
// ROADMAP_GROUPS is the top-to-bottom order of the swimlanes. To add a new lane,
// add an entry to ROADMAP_GROUPS first, then point epics at its id. The "N
// épicas" counter in the sidebar is derived automatically.
//
// -----------------------------------------------------------------------------
// 4. DEPENDENCIES (the dashed arrows)
// -----------------------------------------------------------------------------
// `dependsOn` lists the ids of epics that must finish before this one starts.
// Each id draws one dashed arrow from the SOURCE's end (endWeek + 1) to THIS
// epic's start (startWeek). Rules and gotchas:
//
//   * Every id in dependsOn MUST exist in this array. Unknown ids are skipped
//     silently (no arrow, no error), which usually means a typo.
//   * Arrows are meant to flow forward in time. For a clean left-to-right arrow,
//     keep target.startWeek >= source.endWeek + 1. If the target starts before
//     the source ends, the curve will point backwards and look wrong.
//   * SAME-GROUP dependencies also affect vertical layout: packLanes() forces a
//     dependent epic onto a lane strictly BELOW all of its in-group
//     dependencies, so arrows within a swimlane always flow downward. Adding an
//     in-group dependency can therefore add a row to that group.
//   * CROSS-GROUP dependencies (e.g. an "app" epic depending on a "datos" epic)
//     are allowed and common; they only draw an arrow across lanes and do not
//     constrain lane packing.
//   * Avoid dependency cycles (A depends on B and B depends on A). Nothing
//     enforces acyclicity; a cycle produces nonsensical arrows/lanes.
//   * Removing or renaming an epic id means you must update every dependsOn that
//     referenced it. Search the file for the old id before deleting.
//
// The arrow geometry, hover highlighting and the "Depende de" row in the popup
// are all generated from dependsOn in roadmap-gantt.tsx / roadmap-bars.tsx — no
// manual wiring needed.
//
// -----------------------------------------------------------------------------
// 5. STATUS AND OWNER
// -----------------------------------------------------------------------------
// status drives the bar colors and the legend (see STATUS_STYLES):
//   "done"        -> green   ("Completado")
//   "in-progress" -> brand   ("En curso")
//   "planned"     -> neutral ("Planificado")
// owner (optional) shows a one-letter circular badge on the bar and an "Owner:"
// pill in the dialog. Use it for work driven by an external team (e.g.
// "Falabella").
// =============================================================================
//
// Cloud SQL (PostgreSQL) es el destino confirmado del almacenamiento de datos.
// Hoy todo vive en BigQuery (datasets `falabella_medialab_os` y
// `platform_performance`); estas épicas son la migración de BigQuery a Cloud SQL
// representada en el diagrama de arquitectura. Se consolida en 3 épicas (una por
// grupo) y el detalle fino de cada fase vive en el popup de cada barra.
export const ROADMAP_EPICS: RoadmapEpic[] = [
  // Infraestructura
  {
    id: "sql-infra",
    title: "Aprovisionar Cloud SQL (PostgreSQL)",
    group: "infra",
    startWeek: 4,
    endWeek: 4,
    status: "in-progress",
    owner: "Falabella",
    detail: [
      "Crear la instancia de Cloud SQL para PostgreSQL en sandbox-mm-f con alta disponibilidad, backups automáticos y ventana de mantenimiento.",
      "Dimensionar tier y almacenamiento para el volumen actual de OSS y performance.",
      "Conectar Cloud Run y las Cloud Functions por IP privada (VPC connector o Cloud SQL Auth Proxy).",
      "Crear la Service Account con permisos mínimos y guardar las credenciales de conexión en Secret Manager.",
    ],
  },

  // Migración de datos
  {
    id: "sql-datos",
    title: "Esquema y migración de datos",
    group: "datos",
    startWeek: 4,
    endWeek: 5,
    status: "in-progress",
    detail: [
      "Modelar el esquema relacional de las tablas del diagrama (Usuarios, Actividades, Alertas, campañas OSS, campañas plataformas) con claves foráneas e índices.",
      "Incluir la Tabla Actividades en el modelo: catálogo de acciones auditables, índices por usuario/fecha y política de retención.",
      "Reproducir la jerarquía OSS campaign → service → strategy y resolver el multi-país (CL/CO/PE) que hoy cubren las tablas sufijadas.",
      "Migrar los datos desde BigQuery (oss_*_{cl,co,pe}, deploy_jobs, performance gads/meta/tiktok) con ETL idempotente y validación de conteos.",
      "Reescribir las ingestas (oss-ingest + performance) para escribir en Cloud SQL con upserts, reemplazando el patrón append-only + vistas _latest.",
    ],
  },

  // Aplicación
  {
    id: "sql-app",
    title: "Migración de la app y cutover",
    group: "app",
    startWeek: 6,
    endWeek: 7,
    status: "planned",
    dependsOn: ["sql-infra", "sql-datos"],
    detail: [
      "Apuntar las lecturas de la app (/api/oss-campaigns y src/lib/performance/*) a Cloud SQL.",
      "Migrar la persistencia de los jobs de envío (deploy_jobs) a Cloud SQL, aprovechando que el acceso ya está aislado en repositorios delgados (sin tocar API routes, hooks ni UI).",
      "Período de doble escritura para validar la paridad de datos.",
      "Dejar las lecturas conmutables a Cloud SQL, listas para el switch definitivo (se ejecuta en la épica de QA y cutover).",
    ],
  },

  // SSO — hoy la app usa Google OAuth (cookies httpOnly + requireUserSession).
  // El diagrama apunta a un gate SSO + Tabla Usuarios; el mecanismo concreto (IAP
  // o SSO corporativo de Workspace) aún no está definido. Estas épicas cubren esa
  // migración. auth-datos depende de Cloud SQL (sql-datos); auth-app cierra el bloque.
  {
    id: "auth-infra",
    title: "Configurar SSO de acceso en Cloud Run",
    group: "infra",
    startWeek: 4,
    endWeek: 4,
    status: "planned",
    owner: "Falabella",
    detail: [
      "Definir el mecanismo de acceso: Identity-Aware Proxy (IAP) o SSO corporativo de Google Workspace (aún sin definir).",
      "Poner el control de acceso delante del servicio Cloud Run según el mecanismo elegido (load balancer + backend service si aplica).",
      "Restringir el acceso al dominio corporativo del equipo.",
      "Validar el flujo de login con cuentas reales y documentar la URL de acceso y el onboarding para nuevos operadores.",
    ],
  },
  {
    id: "auth-datos",
    title: "Tabla Usuarios y permisos",
    group: "datos",
    startWeek: 5,
    endWeek: 5,
    status: "planned",
    dependsOn: ["sql-datos"],
    detail: [
      "Implementar la Tabla Usuarios en Cloud SQL (email, rol, permisos, activo/inactivo).",
      "Cargar el listado inicial de operadores autorizados (seed desde Workspace o lista acordada).",
      "Exponer la consulta de autorización: el SSO entrega el email → la app valida contra la tabla.",
      "Definir al menos dos roles iniciales (ej. operador y admin) y qué acciones habilita cada uno.",
    ],
  },
  {
    id: "auth-app",
    title: "Integrar el SSO en la aplicación",
    group: "app",
    startWeek: 6,
    endWeek: 7,
    status: "planned",
    dependsOn: ["auth-infra", "auth-datos"],
    detail: [
      "Reemplazar requireUserSession (cookie OAuth) por la identidad que entrega la capa de SSO.",
      "Resolver el operador en deploy_jobs y auditoría con el email del SSO, sin depender de tokeninfo.",
      "Mantener el OAuth de Google Ads/Sheets solo para llamadas a APIs de plataforma (scopes de Ads, Content, Sheets), separado del gate de acceso a la UI.",
      "Retirar el flujo de login OAuth como requisito para entrar a la app y validar acceso end-to-end.",
    ],
  },

  // Logs de actividades — hoy solo existe auditoría de envíos (deploy_jobs) e
  // ingesta (sync_runs / *_history), no un log general de actividad de usuario.
  // El diagrama apunta a un módulo "Logs de Actividades". La Tabla Actividades
  // se modela dentro de "Esquema y migración de datos" (sql-datos); acá queda el
  // módulo completo: captura (backend) + visualización (frontend), S4 jul.
  {
    id: "activity-logs",
    title: "Módulo de Logs de Actividades",
    group: "app",
    startWeek: 7,
    endWeek: 7,
    status: "planned",
    dependsOn: ["sql-datos"],
    detail: [
      "Instrumentar las API routes y acciones de la app para registrar cada acción del operador en la Tabla Actividades.",
      "Usar la identidad de IAP (email) como autor de cada registro y registrar de forma no bloqueante (after()) para no afectar la latencia.",
      "Cubrir las acciones clave: login, creación/envío de campañas y cambios de configuración.",
      "Construir la vista de Logs de Actividades con listado paginado y filtros por usuario, tipo de acción y rango de fechas.",
      "Enlazar cada registro con la entidad afectada (campaña, job, configuración) y restringir el acceso al módulo según el rol del usuario (Tabla Usuarios).",
    ],
  },

  // QA y cutover — cierra el combo Cloud SQL + SSO con una validación end-to-end
  // antes del switch definitivo. Hace explícito lo que antes vivía implícito en
  // sql-app y auth-app, y es donde se ejecuta el switch + baja de BigQuery.
  {
    id: "cutover-qa",
    title: "QA y cutover (Cloud SQL + SSO)",
    group: "app",
    startWeek: 8,
    endWeek: 8,
    status: "planned",
    dependsOn: ["sql-app", "auth-app"],
    detail: [
      "Pruebas de regresión end-to-end del combo Cloud SQL + SSO antes del switch definitivo.",
      "Validar la paridad de datos tras el período de doble escritura.",
      "Validar el acceso vía SSO y la autorización contra la Tabla Usuarios en todos los módulos.",
      "Switch definitivo de lecturas a Cloud SQL y baja de los datasets de BigQuery una vez confirmada la estabilidad.",
    ],
  },

  // Alertas — hoy la lógica vive en el cliente (AlertsContext) cruzando OSS (BQ)
  // con GAds (Google Sheets), solo canal Teams y sin persistencia. El diagrama
  // apunta a lógica server-side + Tabla Alertas (modelada en sql-datos) + canales.
  // El trabajo arrancó en junio (exploración + MVP, ya hecho); en julio se pausa
  // y se retoma tras S2 agosto para el cierre (pruebas finales e integración).
  {
    id: "alertas-mvp",
    title: "Exploración y MVP de alertas",
    group: "app",
    startWeek: 0,
    endWeek: 3,
    status: "done",
    detail: [
      "Explorar y cruzar los datos para alertas (OSS en BigQuery + performance de GAds en Google Sheets).",
      "Delinear los tipos de alerta: no_activity, budget_underexecution y budget_mismatch.",
      "MVP de la lógica de detección en el cliente (AlertsContext) con notificación por Teams (webhook).",
      "Validar el flujo con datos reales, con la nav de Alertas oculta tras un flag.",
    ],
  },
  {
    id: "alertas-final",
    title: "Integración de alertas",
    group: "app",
    startWeek: 10,
    endWeek: 11,
    status: "planned",
    detail: [
      "Mover la lógica de detección de alertas al server-side (hoy vive en el cliente, AlertsContext).",
      "Persistir las alertas en la Tabla Alertas de Cloud SQL (modelada en 'Esquema y migración de datos').",
      "Pruebas finales end-to-end de los tres tipos de alerta y de los canales de notificación.",
      "Habilitar la nav de Alertas.",
    ],
  },
  {
    id: "alertas-canales",
    title: "Notificaciones de alertas (Teams y Gmail)",
    group: "app",
    startWeek: 9,
    endWeek: 11,
    status: "planned",
    detail: [
      "Implementar el envío de notificaciones de alertas por Microsoft Teams (webhook) y por Gmail (correo).",
      "Definir las plantillas de mensaje por canal y por tipo de alerta.",
      "Configurar credenciales y destinatarios por canal (webhook de Teams, cuenta de envío de Gmail).",
      "Probar la entrega end-to-end de los tres tipos de alerta en ambos canales.",
    ],
  },

  // Extracción de documentos — hoy los documentos se traen on-demand desde OSS
  // (/api/oss/campaign-documents) y los media plans .xlsx se parsean al vuelo;
  // GCS solo se usa para subir creativos al enviar. El diagrama apunta a una
  // Cloud Function batch que procesa documentos → GCS. Estas épicas cubren ese
  // pipeline (S4 jun – S2 jul). Pendiente de decisión: batch vs on-demand final.
  {
    id: "doc-infra",
    title: "Aprovisionar extracción de documentos",
    group: "infra",
    startWeek: 3,
    endWeek: 3,
    status: "planned",
    detail: [
      "Crear la Cloud Function de extracción de documentos (HTTP) y su disparador en Cloud Scheduler.",
      "Aprovisionar el bucket de GCS de destino con una Service Account dedicada y permisos mínimos.",
      "Guardar las credenciales y la configuración de acceso a OSS en Secret Manager.",
    ],
  },
  {
    id: "doc-pipeline",
    title: "Pipeline de extracción de documentos",
    group: "app",
    startWeek: 4,
    endWeek: 5,
    status: "planned",
    dependsOn: ["doc-infra"],
    detail: [
      "Implementar la extracción batch de documentos de campaña desde OSS hacia GCS.",
      "Parsear y normalizar los media plans (.xlsx) dentro del proceso batch.",
      "Hacer la ingesta idempotente y registrar el resultado de cada corrida (sync log).",
      "Validar la paridad contra el flujo on-demand actual antes de cambiar el origen.",
    ],
  },

  // Completar integraciones de plataforma — features parcialmente implementadas
  // que el diagrama objetivo asume como nativas y consolidadas. Hoy: TikTok en
  // standby, Meta parte por n8n, parser de media plans solo para CL y alertas
  // dependiendo de Google Sheets. Estas épicas cierran esa transición.
  {
    id: "parser-paises",
    title: "Parser de media plan CO/PE",
    group: "app",
    startWeek: 4,
    endWeek: 5,
    status: "in-progress",
    detail: [
      "Extender el parser de media plans (.xlsx) a Colombia y Perú (hoy solo Chile está soportado).",
      "Mapear las diferencias de formato y columnas de cada mercado.",
      "Validar la extracción contra media plans reales de CO y PE.",
      "Integrar el parseo multi-país al flujo de documentos existente.",
    ],
  },
  {
    id: "alertas-sheets",
    title: "Alertas sin dependencia de Sheets",
    group: "app",
    startWeek: 8,
    endWeek: 9,
    status: "planned",
    detail: [
      "Migrar el origen de datos de GAds de las alertas: de Google Sheets (legacy) a la fuente nativa (BigQuery / Cloud SQL).",
      "Eliminar la dependencia de las hojas de cálculo en la lógica de detección.",
      "Validar que los tres tipos de alerta siguen funcionando con la nueva fuente.",
      "Dejar el origen de datos listo para la integración final de alertas (server-side + persistencia).",
    ],
  },
  {
    id: "tiktok-nativo",
    title: "Deploy nativo de TikTok",
    group: "app",
    startWeek: 4,
    endWeek: 5,
    status: "planned",
    detail: [
      "Retomar el flujo de deploy nativo de TikTok (rama feat/tiktok-native-flow, hoy en standby).",
      "Completar la creación de campañas vía la Marketing API de TikTok, reemplazando el paso legacy.",
      "Cubrir los tipos de campaña en alcance y el manejo de errores y reintentos.",
      "Validar end-to-end con cuentas reales por mercado (CL/CO/PE).",
    ],
  },
  {
    id: "meta-n8n",
    title: "Migrar Meta fuera de n8n",
    group: "app",
    startWeek: 3,
    endWeek: 4,
    status: "in-progress",
    detail: [
      "Migrar el flujo de Meta que aún pasa por n8n a los endpoints propios de la app.",
      "Consolidar la creación y actualización de campañas de Meta en la Marketing API nativa.",
      "Retirar los webhooks legacy de n8n una vez validada la paridad.",
      "Probar el envío end-to-end por mercado.",
    ],
  },

  // Seguridad — auditoría de código y ethical hacking a cargo de Falabella
  // (Jul S1-S3, en paralelo), seguidas de la corrección de los hallazgos
  // (Jul S3-S4). La corrección depende de ambas auditorías y se solapa a
  // propósito con su cierre porque arranca a medida que aparecen los hallazgos.
  {
    id: "sec-code-audit",
    title: "Chequeo de seguridad del código",
    group: "app",
    startWeek: 4,
    endWeek: 6,
    status: "planned",
    owner: "Falabella",
    detail: [
      "Revisión de seguridad sobre el código de la aplicación (análisis estático y revisión manual).",
      "Identificar vulnerabilidades, malas prácticas y manejo inseguro de credenciales o datos.",
      "Documentar los hallazgos priorizados por severidad.",
    ],
  },
  {
    id: "sec-ethical-hacking",
    title: "Ethical hacking sobre la app",
    group: "app",
    startWeek: 4,
    endWeek: 6,
    status: "planned",
    owner: "Falabella",
    detail: [
      "Ejercicio de ethical hacking / pentest sobre la aplicación desplegada.",
      "Probar vectores de acceso, autenticación, autorización y exposición de datos.",
      "Documentar los hallazgos priorizados por severidad.",
    ],
  },
  {
    id: "sec-fixes",
    title: "Corrección de hallazgos de seguridad",
    group: "app",
    startWeek: 6,
    endWeek: 7,
    status: "planned",
    dependsOn: ["sec-code-audit", "sec-ethical-hacking"],
    detail: [
      "Corregir los puntos de seguridad detectados por el chequeo de código y el ethical hacking.",
      "Priorizar por severidad y validar cada corrección.",
      "Reverificar los hallazgos críticos con quien ejecutó la auditoría.",
    ],
  },
];

export type TimelineWeek = { index: number; label: string };
export type TimelineMonth = { label: string; startIndex: number; span: number };

export type Timeline = {
  weeks: TimelineWeek[];
  months: TimelineMonth[];
  totalWeeks: number;
};

// Builds the week axis plus the month groupings from the start config. Each
// month is a fixed block of WEEKS_PER_MONTH weeks; week labels reset per month
// (S1..S{WEEKS_PER_MONTH}).
export function buildTimeline(): Timeline {
  const totalWeeks = TIMELINE_MONTHS * WEEKS_PER_MONTH;
  const weeks: TimelineWeek[] = [];
  const months: TimelineMonth[] = [];

  for (let i = 0; i < totalWeeks; i++) {
    weeks.push({ index: i, label: `S${(i % WEEKS_PER_MONTH) + 1}` });
  }

  for (let m = 0; m < TIMELINE_MONTHS; m++) {
    const absoluteMonth = TIMELINE_START.month + m;
    const monthOfYear = absoluteMonth % 12;
    const year = TIMELINE_START.year + Math.floor(absoluteMonth / 12);
    months.push({
      label: `${MONTH_ABBR[monthOfYear]} '${String(year % 100).padStart(2, "0")}`,
      startIndex: m * WEEKS_PER_MONTH,
      span: WEEKS_PER_MONTH,
    });
  }

  return { weeks, months, totalWeeks };
}

// Human-readable "MMM YYYY · SN" label for a week index relative to the start.
export function formatWeekLabel(index: number): string {
  const monthsFromStart = Math.floor(index / WEEKS_PER_MONTH);
  const weekInMonth = (index % WEEKS_PER_MONTH) + 1;
  const absolute = TIMELINE_START.month + monthsFromStart;
  const year = TIMELINE_START.year + Math.floor(absolute / 12);
  const monthOfYear = ((absolute % 12) + 12) % 12;
  return `${MONTH_ABBR[monthOfYear]} ${year} · S${weekInMonth}`;
}

// Fractional week offset of a date relative to the timeline start. Used to
// position the "today" marker. Weeks are nominal (WEEKS_PER_MONTH per month),
// so a date maps to monthOffset * WEEKS_PER_MONTH. Returns null when out of range.
export function weekOffsetOf(date: Date, totalWeeks: number): number | null {
  const startAbsolute = TIMELINE_START.year * 12 + TIMELINE_START.month;
  const dateAbsolute = date.getFullYear() * 12 + date.getMonth();
  const daysInMonth = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
  ).getDate();
  const monthOffset =
    dateAbsolute - startAbsolute + (date.getDate() - 1) / daysInMonth;
  const offset = monthOffset * WEEKS_PER_MONTH;

  if (offset < 0 || offset > totalWeeks) {
    return null;
  }

  return offset;
}

export type LaneLayout = {
  laneOf: Map<string, number>;
  laneCount: number;
};

// Greedy interval packing: places epics into the fewest horizontal lanes so
// non-overlapping epics share a row, mirroring the reference Gantt layout.
// Constraint: a dependent epic is always placed on a lane strictly below all of
// its in-group dependencies, so dependency arrows always flow downward.
export function packLanes(epics: RoadmapEpic[]): LaneLayout {
  const inGroup = new Set(epics.map((e) => e.id));
  // Sort by start week so an epic's in-group dependencies (which start earlier)
  // are placed first and their lanes are known when the dependent is placed.
  const ordered = [...epics].sort((a, b) => a.startWeek - b.startWeek);
  const laneEnds: number[] = [];
  const laneOf = new Map<string, number>();

  for (const epic of ordered) {
    // Force the epic below its in-group dependencies' lanes.
    let minLane = 0;
    for (const depId of epic.dependsOn ?? []) {
      if (!inGroup.has(depId)) continue;
      const depLane = laneOf.get(depId);
      if (depLane !== undefined) minLane = Math.max(minLane, depLane + 1);
    }

    let placed = false;
    for (let lane = minLane; lane < laneEnds.length; lane++) {
      if (epic.startWeek > laneEnds[lane]) {
        laneEnds[lane] = epic.endWeek;
        laneOf.set(epic.id, lane);
        placed = true;
        break;
      }
    }
    if (!placed) {
      // Grow up to minLane first; skipped lanes stay free (-Infinity) so other
      // epics can still reuse them.
      while (laneEnds.length < minLane) {
        laneEnds.push(-Infinity);
      }
      laneEnds.push(epic.endWeek);
      laneOf.set(epic.id, laneEnds.length - 1);
    }
  }

  return { laneOf, laneCount: laneEnds.length };
}
