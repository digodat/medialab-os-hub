# Medialab OS Hub

Plataforma de documentación para una herramienta interna de Medialab. Es un hub
centralizado donde el equipo consulta cómo funciona la herramienta, sus
decisiones de diseño y su estado actual.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + tw-animate-css
- shadcn/ui (style: base-nova, base: Base UI)
- @base-ui/react, @heroicons/react, lucide-react
- @xyflow/react (React Flow) para diagramas interactivos
- Recharts para gráficos
- @google-cloud/firestore para persistencia (sección Security)

## Desarrollo

```bash
npm install
npm run dev
```

La app corre en [http://localhost:3000](http://localhost:3000). Está pensada
solo para escritorio (>= 1100px); por debajo se muestra un overlay.

## Persistencia (sección Security)

La sección Security (`/security`) persiste el estado de cada hallazgo en
Firestore. Cada modificación abre un modal que pide una fecha y un motivo, y
agrega una entrada al historial del hallazgo (append-only, no reemplaza). Así
cada fila acumula su historial de cambios: estado, motivo, autor y fecha de
cada actualización.

### Modelo de datos

- Colección: `security-findings`
- Un documento por hallazgo (el id del documento es el `finding.id`)
- Estructura del documento:

```ts
{
  findingId: string,
  currentStatus: TaskStatus,   // última entrada del historial
  updatedAt: string,           // ISO de la última actualización
  history: [
    {
      id: string,              // uuid, hace única cada entrada (arrayUnion)
      status: TaskStatus,
      reason: string,
      author: string,          // email, asignado server-side
      date: string,            // fecha elegida (YYYY-MM-DD)
      createdAt: string,       // timestamp real del registro
    }
  ]
}
```

La escritura usa `FieldValue.arrayUnion` para agregar entradas de forma atómica,
con estrategia last-write-wins sobre `currentStatus`/`updatedAt`.

### Autor del cambio (IAP)

El autor no se pide en el formulario: se toma del header de IAP
`x-goog-authenticated-user-email` del lado del servidor (no spoofeable), igual
que en sentimeli. En local, sin IAP, se usa el fallback
`SECURITY_DEV_AUTHOR_EMAIL`.

### Variables de entorno

| Variable | Obligatoria | Default | Descripción |
| --- | --- | --- | --- |
| `SECURITY_FIRESTORE_DATABASE_ID` | Sí | — | Nombre de la base de Firestore. Usar `(default)` para la base por defecto. |
| `SECURITY_DEV_AUTHOR_EMAIL` | No | `dev@local` | Email del autor en local cuando no hay IAP. |

El **project ID de GCP no se configura**: se infiere automáticamente del
runtime (metadata server en Cloud Run, credenciales ADC en local). No hace falta
ninguna variable de proyecto.

### Credenciales en local

Firestore usa Application Default Credentials. Antes de correr la app en local:

```bash
gcloud auth application-default login
gcloud config set project <TU_PROJECT_ID>
```

### Crear la base e índices de Firestore

1. Crear la base de Firestore en **modo Native** (una sola vez), con el id que
   vayas a poner en `SECURITY_FIRESTORE_DATABASE_ID`:

```bash
# Base por defecto
gcloud firestore databases create --location=<REGION>

# O una base con nombre propio
gcloud firestore databases create \
  --database=<DATABASE_ID> \
  --location=<REGION>
```

2. **Índices**: la query de la sección Security lee la colección completa sin
   filtros ni ordenamientos compuestos, por lo que **no requiere índices
   compuestos** (Firestore indexa los campos simples automáticamente). El
   archivo `firestore.indexes.json` se incluye igualmente con la lista vacía
   para dejar el scaffolding listo y poder versionar índices futuros.

3. Si más adelante se agregan queries con `where` + `orderBy`, agregar el índice
   a `firestore.indexes.json` y deployarlo:

```bash
# Base por defecto
firebase deploy --only firestore:indexes

# Base con nombre propio
firebase deploy --only firestore:indexes --database=<DATABASE_ID>
```

### Reglas de seguridad

`firestore.rules` deniega todo acceso desde clientes. La app accede a Firestore
exclusivamente desde el servidor con ADC, que **bypassea** las reglas, así que
negar el acceso directo de clientes es el default seguro. Deploy:

```bash
firebase deploy --only firestore:rules
# o, para una base con nombre propio:
firebase deploy --only firestore:rules --database=<DATABASE_ID>
```

## Deploy (Cloud Run)

La app se deploya en Cloud Run (igual que sentimeli). Tener en cuenta:

- El project ID se infiere del runtime de Cloud Run; no configurar variables de
  proyecto.
- Setear `SECURITY_FIRESTORE_DATABASE_ID` en el servicio de Cloud Run.
- La service account del servicio necesita permisos de Firestore (rol
  `roles/datastore.user`).
- La identidad de usuario llega vía IAP en el header
  `x-goog-authenticated-user-email`.
