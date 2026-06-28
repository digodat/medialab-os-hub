# Medialab OS Hub — CLAUDE.md

## Sobre el proyecto

Plataforma de documentación para una herramienta interna que se está construyendo en Medialab. El objetivo es tener un hub centralizado donde el equipo pueda consultar cómo funciona la herramienta, sus decisiones de diseño y su estado actual.

## Principios de diseño

- **Minimalista** — sin elementos decorativos innecesarios. Cada componente tiene que justificar su presencia.
- **Liviana y rápida** — priorizar rendimiento percibido. Usar SSR/SSG donde sea posible, evitar bundles grandes en el cliente.
- **Contenido primero** — la documentación es el producto. El diseño sirve al contenido, no al revés.
- **Solo escritorio** — la app NO está pensada para móvil. No invertir esfuerzo en responsive para pantallas chicas. Por debajo de 1100px de ancho se muestra un overlay (en `src/app/layout.tsx`) que pide una pantalla más ancha; ese es el único caso a contemplar para anchos menores. Diseñar y verificar siempre para escritorio (>= 1100px).

## Identidad visual

- **Color de fondo global**: `var(--app-background)` — definido en `:root` de `globals.css`. El valor actual es `#f5f7f5`. NUNCA hardcodear este color directamente; siempre usar la variable CSS.
- **Color de highlight/brand**: `var(--brand)` — definido en `:root` de `globals.css`. El valor actual es `#2a0c97` (violeta). Es el color de acento de todos los componentes (botones, focus rings, links activos, animación del landing). `--primary`, `--ring`, `--sidebar-primary` y `--sidebar-ring` referencian `var(--brand)`. NUNCA hardcodear este color; siempre usar la variable o las utilidades de Tailwind (`text-brand`, `bg-brand`, `border-brand`).
- **Efecto grain**: se aplica globalmente vía `body::after` en `globals.css` usando un SVG con `feTurbulence`. No agregar grain extra a componentes individuales.
- **Ancho del contenido de secciones**: el contenido de todas las secciones internas (todo menos la home) debe ocupar como máximo el 80% del ancho disponible y estar centrado. Esto se aplica de forma centralizada en el layout del route group `(hub)` (`src/app/(hub)/layout.tsx`) con `mx-auto w-4/5`, así que las páginas de sección NO deben volver a definir su propio `max-w`/`px` de contenedor; solo manejan el padding vertical y el espaciado interno. La home queda exenta.
- **Bordes redondeados**: todos los elementos deben estar bien redondeados. El radio base es la variable `--radius` (actual `1rem`) en `:root` de `globals.css`, de la que derivan los tokens `rounded-sm/md/lg/xl/2xl`. Convención: botones, inputs y badges/pills usan `rounded-full`; recuadros/cards usan `rounded-xl` (o `rounded-2xl` para contenedores grandes). Nunca usar esquinas casi rectas (`rounded-[2px]` y similares). Para ajustar la redondez global, modificar `--radius`, no hardcodear radios.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + tw-animate-css
- shadcn/ui (style: base-nova, base: Base UI)
- @base-ui/react, @heroicons/react, lucide-react
- Recharts para gráficos (cuando aplique)
- @xyflow/react (React Flow) para diagramas interactivos basados en nodos

## Componentes reutilizables

- **Animación de éxito (`SuccessCheck`)**: para CUALQUIER mensaje o estado de éxito (confirmaciones de guardado, acciones completadas, etc.) usar SIEMPRE el componente `src/components/ui/success-check.tsx` en lugar de crear animaciones nuevas. Es la animación oficial de success (fade + rotate + blur + bob + stroke-draw del ícono), basada en los estilos `.t-success-check` de `globals.css`. Acepta cualquier ícono como children (default: checkmark con `currentColor`); el tamaño y color se controlan por className del padre (ej. `text-[64px] text-emerald-600`). Mide el largo de cada `path` en runtime, así el stroke-draw funciona con cualquier ícono. Respeta `prefers-reduced-motion`.

## Convenciones

- Responder en español
- Textos de UI en español con tildes correctas
- Sin emojis en código, comentarios ni respuestas
- Comentarios en código siempre en inglés
- No crear archivos de documentación adicionales salvo que se pida

## Restricciones

- **Sin tests con browser ni Playwright** — nunca usar el browser ni Playwright para verificar cambios, a menos que el usuario lo pida explícitamente
- **Sin git** — el usuario maneja git manualmente
- **Sin bases de datos** — prohibido cualquier comando de base de datos
- **Sin sobrepasar el alcance** — si se pide A, hacer exactamente A

## Mantenimiento de este archivo

Claude debe mantener este archivo actualizado automáticamente. Cada vez que se tome una decisión relevante sobre arquitectura, stack, convenciones o diseño del proyecto, agregar una entrada en la sección de decisiones a continuación. No esperar a que el usuario lo pida.

## Decisiones

- **2026-06-26** — Stack inicial definido: Next.js 16 + shadcn base-nova + Base UI, sin base de datos por ahora. Proyecto orientado a documentación estática/semi-estática.
- **2026-06-26** — Fondo global cambiado a `#f5f7f5` (gris verdoso muy claro) con efecto grain via SVG `feTurbulence` en `body::after`. Color en variable `--app-background` en `:root` de `globals.css`.
- **2026-06-26** — Landing page: animación SVG central (nodo con partículas, color `var(--brand)`) + grid de 5 secciones de navegación. Secciones actuales: THE CORE, ARCHITECTURE, ROADMAP, SECURITY, KNOWLEDGE — actualizar en `src/app/page.tsx` cuando se definan los nombres finales.
- **2026-06-26** — Arquitectura de rutas: secciones internas (core, architecture, roadmap, security, knowledge) viven bajo `src/app/(hub)/` (route group). Este layout agrega la barra de navegación superior (`NavBar` en `src/components/layout/nav-bar.tsx`). La landing `/` mantiene su propio layout sin nav, con el grid de secciones como sistema de navegación. Las secciones nuevas siempre van bajo `(hub)/`.
- **2026-06-26** — Color de highlight/brand cambiado de azul a violeta `#2a0c97`, en variable `--brand` en `:root` de `globals.css`. `--primary`, `--ring`, `--sidebar-primary` y `--sidebar-ring` ahora referencian `var(--brand)`. La animación del landing (`core-animation.tsx`) usa `var(--brand)` (con `color-mix` para las opacidades) en lugar del azul hardcodeado.
- **2026-06-26** — Contenido de secciones internas limitado al 80% del ancho disponible y centrado, aplicado en `src/app/(hub)/layout.tsx` (`mx-auto w-4/5`). Las páginas de sección dejan de definir su propio `max-w`/`px`. La home no se ve afectada.
- **2026-06-26** — App solo para escritorio: overlay de "pantalla demasiado angosta" se muestra por debajo de 1100px de ancho (`min-[1100px]:hidden` en `src/app/layout.tsx`). No priorizar responsive para móvil.
- **2026-06-26** — Bordes redondeados generosos en toda la app: `--radius` subido a `1rem`. Botones, inputs y badges con `rounded-full`; cards con `rounded-xl`. Se eliminó el `rounded-[2px]` del grid del landing (ahora `rounded-xl`).
- **2026-06-26** — Sección Security implementada en `src/app/(hub)/security/`. Incluye: header con botones de acción, lista de tareas interactiva con panel de detalles (componente cliente `TaskList`), y tabla de logs de acceso. Cards con estilo `bg-white/50 backdrop-blur-sm`.
- **2026-06-27** — Sección Architecture implementada en `src/app/(hub)/architecture/` con un diagrama interactivo de la infraestructura GCP usando React Flow (`@xyflow/react`). Componente cliente `ArchitectureDiagram` en `src/components/architecture/`. Nodos custom estilados como glass cards (`bg-white/70 backdrop-blur-sm`), grupos dashed (Cloud SQL, UI MediaLab OS, Cloud Functions), edges `smoothstep` con `animated` en los flujos de datos, y popups por nodo vía `NodeToolbar` (visible al seleccionar). Diagrama solo navegable (zoom/pan), nodos no arrastrables para preservar el layout curado. Atribución de React Flow oculta. Colores de edges/markers vía `var(--brand)`. Layout en carriles verticales (UI → Cloud SQL → Cloud Functions → fuentes/sinks) para lectura horizontal y mínimo cruce de líneas. Los nodos de productos/marcas usan logos reales (SVG a color, fondo transparente) descargados en `public/logos/` (GCP icons del set `gcp:` y marcas del set `logos:` de Iconify); los componentes internos de la app (envío, logs, alertas) y las tablas siguen usando heroicons.
- **2026-06-27** — Persistencia de la sección Security en Firestore (`@google-cloud/firestore`, server-only). Colección `security-findings`, un documento por hallazgo (`finding.id`). Cada cambio agrega una entrada al historial (`arrayUnion`) con status, motivo, fecha, autor y timestamp. El project ID de GCP se infiere del runtime (Cloud Run / ADC); solo `SECURITY_FIRESTORE_DATABASE_ID` es obligatorio. Autor desde header IAP (`x-goog-authenticated-user-email`); en local fallback `SECURITY_DEV_AUTHOR_EMAIL` (default `dev@local`). Escritura vía Server Action `appendSecurityChangeAction`; lectura SSR en `security/page.tsx` (usa `await connection()` para forzar render dinámico en runtime). Hallazgos estáticos en `src/lib/security/security-findings.ts`.
- **2026-06-27** — Config de Firebase para el deploy de Firestore: `firebase.json`, `firestore.rules` (deny-all para clientes; la app accede solo server-side con ADC, que bypassea reglas) y `firestore.indexes.json` (vacío: la query de Security lee la colección sin filtros compuestos, no requiere índices). README reescrito con modelo de datos, env vars, credenciales ADC e instrucciones de creación de base/índices/reglas.
- **2026-06-27** — Convención de títulos de sección: todas las secciones del hub muestran su nombre como sufijo de la marca en el `NavBar` (`MEDIALab OS - <Sección>`) en vez de como heading dentro del contenido. El `NavBar` deriva el sufijo del `label` del link activo en `NAV_LINKS`. Las páginas de sección no deben renderizar un `<h2>` con su propio título. Se removió el `<h2>Seguridad</h2>` de `TaskList` y de `SecurityConnectionError`.
- **2026-06-27** — Deploy en Cloud Run: `Dockerfile` multi-stage (node:20-alpine, standalone output), `.dockerignore`, `.env.example`. Sin dependencias nativas por plataforma en `package.json` (npm resuelve los binarios correctos vía optionalDependencies). Puerto 8080, `HOSTNAME=0.0.0.0`. Patrón alineado con sentimeli.
- **2026-06-28** — Catálogo de hallazgos migrado de estático a Firestore. Se eliminó `src/lib/security/security-findings.ts`; el catálogo (code, severity, category, title, detail, order) ahora vive en la misma colección `security-findings`, fusionado en el mismo documento que el estado operativo (currentStatus, history). `getAllSecurityFindings` en `security-persistence.ts` lee catálogo+estado y renumera por `order`. Las categorías (`SECURITY_CATEGORIES`) y los tipos/guards siguen en código, en el nuevo `src/lib/security/security-catalog.ts`. Alta/edición de hallazgos desde la UI vía `FindingModal` (`src/components/security/finding-modal.tsx`) y Server Action `upsertSecurityFindingAction` (crea con id slug derivado de code+title; editar solo toca campos de catálogo, nunca el estado). Seed inicial idempotente en `scripts/seed-security-findings.mjs` (preserva estado existente); ya ejecutado contra la base prod `medialab-os-hub` (27 hallazgos). La SA del servicio Cloud Run (`multiuso-linus`) tiene `roles/datastore.user`.
