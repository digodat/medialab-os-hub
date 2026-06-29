# Plan de actualización — Sección Arquitectura

Comparación entre el diagrama del hub (visión objetivo / target) y el estado
actual del código en `Documents/dev/falabella-medialab-os`.

**Regla:** el diagrama representa cómo *debería* quedar la herramienta, no cómo
está hoy. No se cambia la estructura visual del diagrama. Cada item enriquece la
información (popovers, notas de "estado actual", badges) manteniendo el target.

Cada item se corrige uno a uno. Marcar con `[x]` cuando esté hecho.

---

## Contexto técnico del código real (referencia)

- Stack: Next.js 16 (App Router, Turbopack) + React 18 + TypeScript.
- Proyecto GCP: `sandbox-mm-f`.
- Multi-país: CL, CO, PE (tablas y credenciales por mercado).
- ~47 API routes dentro de Next.js (no hay backend separado).
- 4 Cloud Functions: `oss-ingest`, `gads-ingest`, `meta-ingest`, `tiktok-ingest`.
- Deploy: Cloud Run (Dockerfile multi-stage, `output: standalone`).

---

## Diferencias a corregir / enriquecer

### Item 1 — Cloud SQL (PostgreSQL) vs BigQuery [LA MÁS IMPORTANTE] [x]

> **Resuelto (2026-06-29):** Cloud SQL es roadmap confirmado. NO se toca el
> diagrama. Las tareas de la migración BigQuery → Cloud SQL se cargaron en el
> roadmap (`src/lib/roadmap/roadmap-data.ts`), reemplazando los epics mock:
> grupos Infraestructura / Migración de datos / Aplicación y 8 épicas
> (provisión, red/credenciales, esquema, ETL, ingestas, lecturas, deploy_jobs,
> cutover).
>
> **Actualización (2026-06-29):** el switch definitivo de lecturas y la baja de
> BigQuery se movieron de `sql-app` a una épica explícita de QA y cutover
> (`cutover-qa`, Ago S1), que valida end-to-end el combo Cloud SQL + SSO
> (depende de `sql-app` y `auth-app`) antes del switch final.


- **Hub (target):** Cloud SQL (PostgreSQL) con 5 tablas.
- **Realidad:** no hay PostgreSQL. Todo el almacenamiento es **BigQuery**.
  - Dataset `falabella_medialab_os`:
    - `oss_campaigns_{cl,co,pe}` + vistas `_latest`
    - `oss_services_{cl,co,pe}` + vistas `_latest`
    - `oss_strategies_{cl,co,pe}` + vistas `_latest`
    - `sync_runs` (log compartido de ingesta)
    - `deploy_jobs` (jobs de envío, append-only + vistas `_latest` / `_implemented`)
  - Dataset `platform_performance`:
    - `gads_campaigns_latest` + `gads_campaigns_metrics`
    - equivalentes para Meta y TikTok
  - Lectura OSS: `/api/oss-campaigns?country=cl`.
  - Lectura performance: `src/lib/performance/*`.
- **Acción propuesta:** nota de "estado actual" en el nodo Cloud SQL aclarando
  que hoy es BigQuery; Cloud SQL queda como roadmap.
- **Pendiente de decisión:** ¿Cloud SQL es roadmap confirmado o solo ilustrativo?

### Item 2 — SSO / IAP vs Google OAuth [x]

> **Resuelto (2026-06-29):** SSO + Tabla Usuarios es roadmap confirmado (alineado
> con el diagrama). NO se toca el diagrama. Las tareas se cargaron en el roadmap:
> `auth-infra` (Configurar SSO de acceso en Cloud Run, owner Falabella),
> `auth-datos` (Tabla Usuarios, depende de sql-datos), `auth-app` (Integrar el SSO
> en la aplicación). El mecanismo concreto (IAP o SSO corporativo de Workspace)
> quedó sin definir, así que el naming de las tres épicas es agnóstico (no fija
> IAP). El switch definitivo del combo se ejecuta en `cutover-qa` (ver Item 1).

- **Hub (target):** Identity-Aware Proxy + Tabla Usuarios (roles/permisos).
- **Realidad:**
  - Autenticación por **Google OAuth** con cookies httpOnly (`requireUserSession`).
  - No hay IAP ni tabla de usuarios/roles.
  - Identidad del operador en jobs: best-effort vía `tokeninfo` (suele ser `sub`,
    no email).
- **Acción propuesta:** aclarar en el popup de SSO/IAP que hoy es Google OAuth;
  IAP es objetivo.
- **Pendiente de decisión:** ~~¿IAP + Tabla Usuarios es prioridad o seguimos con OAuth?~~
  Confirmado: IAP + Tabla Usuarios.

### Item 3 — Logs de actividades [x]

> **Resuelto (2026-06-29):** roadmap confirmado (alineado con el diagrama). NO se
> toca el diagrama. La Tabla Actividades se integró dentro de la épica "Esquema y
> migración de datos" (`sql-datos`). En el Item 3 queda una sola épica,
> `activity-logs` (Módulo de Logs de Actividades, S4 jul – S2 ago, depende de
> `sql-datos`): captura en API routes con identidad IAP + visualización.

- **Hub (target):** módulo "Logs de Actividades" + Tabla Actividades.
- **Realidad:** no hay log general de actividades de usuario. Lo más cercano:
  - `deploy_jobs` en BQ (auditoría de envíos de campañas).
  - `sync_runs` y tablas `*_history` (auditoría de ingesta).
- **Acción propuesta:** aclarar que hoy solo existe auditoría de envíos/ingesta,
  no un log de actividad de usuario general.

### Item 4 — Alertas (lógica, persistencia y canales)

- **Hub (target):** lógica server-side + Tabla Alertas + canales Teams **y Gmail**.
- **Realidad:**
  - Lógica **en el cliente** (`AlertsContext.tsx`): cruza OSS (BQ) con datos de
    **Google Sheets** (legacy GAds).
  - Tipos de alerta: `no_activity`, `budget_underexecution`, `budget_mismatch`.
  - Solo canal **Teams** (webhook guardado en `localStorage`).
  - **Sin Gmail** como canal.
  - Sin tabla de alertas persistida.
  - La nav de Alertas está **oculta** (`SHOW_ALERTS_NAV = false`).
- **Acción propuesta:** aclarar Teams sí / Gmail no, lógica client-side hoy,
  sin persistencia.
- **Pendiente de decisión:** ¿Gmail sigue en scope o solo Teams?

> **Resuelto (2026-06-29):** se agregó junio al inicio del timeline (Jun–Dic 2026,
> 7 meses). Tareas cargadas en el roadmap, grupo `app`: `alertas-mvp` (exploración
> + MVP, junio, estado Completado), `alertas-canales` (Notificaciones por Teams y
> Gmail, Ago S2–S4) y `alertas-final` (Integración de alertas, Ago S3–S4). Julio
> queda sin trabajo de alertas. La Tabla Alertas se modela dentro de `sql-datos`.
> Gmail confirmado como canal (junto con Teams).

### Item 5 — Extracción de documentos

- **Hub (target):** Cloud Function batch que procesa documentos → GCS.
- **Realidad:**
  - Documentos se traen **on-demand** desde OSS (`/api/oss/campaign-documents`).
  - Media plans `.xlsx` se parsean al vuelo (`/api/oss/media-plan/[campaignId]`).
  - GCS se usa para **subir creativos al enviar**, no para ingesta batch.
  - **No existe** una CF de "extracción de documentos".
- **Acción propuesta:** aclarar el modelo on-demand + GCS para creativos.
- **Pendiente de decisión:** ¿la CF de extracción de documentos sigue planificada
  o el modelo on-demand es el diseño final?

> **Resuelto (2026-06-29):** tareas cargadas en el roadmap (S4 jun – S2 jul),
> modeladas según el target del diagrama (CF batch → GCS): `doc-infra`
> (Aprovisionar extracción de documentos, infra) y
> `doc-pipeline` (Pipeline de extracción de documentos, app, depende de
> `doc-infra`). Sigue pendiente la decisión batch vs on-demand final.

### Item 6 — Extracción de performance (1 caja vs 3 CFs)

- **Hub (target):** una sola caja "Extracción de datos de performance".
- **Realidad:** son **3 Cloud Functions** independientes con código completo:
  - `gads-ingest` (Google Ads)
  - `meta-ingest` (Meta)
  - `tiktok-ingest` (TikTok)
  - Todas HTTP, disparadas por Cloud Scheduler, escriben a `platform_performance`.
  - Nota: el `docs/ARCHITECTURE.md` del repo dice que `gads-ingest` "solo tiene
    schema", pero el código ya está implementado (desactualizado en el repo).
- **Acción propuesta:** mencionar las 3 CFs en el popover del nodo de performance.

> **Resuelto (2026-06-29):** en el popup del nodo `fn_perf` ("Extracción de datos
> de performance de campañas") se aclaró que la caja única representa tres Cloud
> Functions HTTP disparadas por Cloud Scheduler, y se agregó una sección dedicada
> ("Las tres Cloud Functions") que lista gads-ingest, meta-ingest y tiktok-ingest
> con qué hace cada una. El `Popover` ahora soporta una lista de ítems
> (`items`/`itemsTitle`). La caja del diagrama se mantiene como target; NO se tocó
> la estructura visual.

### Item 7 — "Captura de Datos" / backend

- **Hub (target):** capa separada "Captura de Datos".
- **Realidad:** ~47 API routes dentro de Next.js que orquestan BQ, OSS,
  plataformas y GCS. No hay backend aparte.
- **Acción propuesta:** aclarar que la lógica de negocio vive en las API routes
  de Next.js (BFF), no en un servicio separado.

> **Resuelto (2026-06-29):** se aclaró en el popup del nodo "Captura de Datos" que
> la lógica vive en ~47 API routes de Next.js (patrón BFF), sin backend separado.
> Junto con esto se enriquecieron otros popups del diagrama: SSO/IAP (mecanismo
> sin definir: IAP o SSO corporativo), Secret Manager (credenciales por mercado
> CL/CO/PE), Cloud Scheduler (dispara todas las CFs) y Envío de campañas (cada
> envío genera un job auditable con seguimiento paso a paso). NO se tocó la
> estructura visual.

### Item 8 — Componentes legacy no representados

- **Realidad (no está en el diagrama):**
  - **Google Sheets**: monitoreo GAds legacy + hojas de "codes".
  - **n8n**: Meta (y Search/Video en parte) siguen por webhook legacy.
  - **Vertex AI / Gemini**: generación de keywords de Search.
  - **Modelo de predicción**: disparado desde `oss-ingest` (`prediction.ts`).
- **Acción propuesta:** decidir si se documentan como "transición/legacy" (badge
  o nota) o se omiten del hub.
- **Pendiente de decisión:** ¿documentar legacy o no?

### Item 9 — Multi-país (CL / CO / PE)

- **Realidad:** el sistema opera 3 mercados independientes con tablas y
  credenciales por país (MCC, cuentas de ads, Merchant Center por país).
- **Acción propuesta:** incorporar el dato multi-país como contexto operativo
  real (no necesariamente nodos nuevos).

> **Resuelto (2026-06-29):** se incorporó el contexto multi-país (CL/CO/PE) en los
> popups de `envio_campanas` (credenciales por mercado en el envío) y `fn_oss`
> (ingesta por mercado). NO se agregaron nodos nuevos al diagrama.

---

## Estado funcional por área (referencia para priorizar)

**Muy maduro**
- Ingesta OSS → BQ (`oss-ingest`, multi-país).
- Envío nativo Google Ads (Shopping, PMax, Display, Demand Gen, Search).
- Sistema de jobs con progreso paso a paso (`/jobs/[jobId]`).
- UI de performance leyendo BQ.
- Ingesta de performance (3 CFs con código completo).

**Parcial / en transición**
- TikTok deploy nativo (rama `feat/tiktok-native-flow`, en standby).
- Meta: endpoints propios, pero parte del flujo sigue en n8n.
- Parser de media plan xlsx (CL listo; CO/PE pendientes).
- Alertas: funcionan pero dependen de Sheets y están fuera de la nav principal.

> **Planificado en roadmap (2026-06-29):** las cuatro cargadas bajo el grupo
> Aplicación. `parser-paises` (Parser media plan CO/PE, Jul S1-S2, en curso),
> `alertas-sheets` (Alertas sin Sheets, Ago S1-S2), `tiktok-nativo` (Deploy
> nativo de TikTok, Jul S1-S2) y `meta-n8n` (Migrar Meta fuera de n8n, Jun S4 - Jul S1,
> en curso). Fechas propuestas, a ajustar.

**No existe aún (respecto al diagrama objetivo)**
- Cloud SQL / tablas relacionales del diagrama.
- IAP + gestión de usuarios/roles.
- Tabla de alertas persistida.
- Notificaciones Gmail.
- CF dedicada de extracción de documentos.
- Log de actividades de usuario.

---

## Preguntas abiertas para alinear documentación

1. ~~¿Cloud SQL es roadmap confirmado o solo ilustrativo?~~ Confirmado.
2. ~~¿IAP + Tabla Usuarios es prioridad o seguimos con OAuth de Google?~~ Confirmado: IAP + Tabla Usuarios.
3. ¿Gmail en alertas sigue en scope o solo Teams?
4. ¿La CF de extracción de documentos sigue planificada o el modelo on-demand
   es el diseño final?
5. ¿Documentar el legacy (Sheets, n8n) como "transición" o omitirlo del hub?
