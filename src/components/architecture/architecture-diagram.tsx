"use client";

/* eslint-disable @next/next/no-img-element -- local static brand/product SVGs */

import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  BaseEdge,
  getNodesBounds,
  getSmoothStepPath,
  Handle,
  MarkerType,
  Position,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useStoreApi,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ArrowPathIcon,
  BellAlertIcon,
  CloudIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  ServerStackIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, MouseEvent as ReactMouseEvent, SVGProps } from "react";
import { cn } from "@/lib/utils";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

// Shared hover state so nodes and edges can react to the currently hovered node:
// the node and the edges touching it are emphasized while the rest dim out
// (mirrors the roadmap Gantt hover effect).
const HoverContext = createContext<string | null>(null);
const useHoveredId = () => useContext(HoverContext);

function hoverClasses(id: string | undefined, hoveredId: string | null) {
  if (!id || hoveredId === null) return undefined;
  return id === hoveredId
    ? "border-brand/60 shadow-md ring-2 ring-brand/40"
    : "opacity-70";
}

// rationaleTitle / rationale render an extra "Why this product?" section in the
// popup, explaining why the tool was chosen over alternatives.
// items / itemsTitle render an extra titled list inside the popup (e.g. breaking
// down a single diagram box into the underlying Cloud Functions).
type PopoverItem = { name: string; description: string };

type ServiceData = {
  title: string;
  subtitle?: string;
  description: string;
  Icon?: IconType;
  logo?: string;
  itemsTitle?: string;
  items?: PopoverItem[];
  rationaleTitle?: string;
  rationale?: string;
};

type GroupData = { title?: string };
type LabelData = {
  title: string;
  subtitle?: string;
  Icon?: IconType;
  logo?: string;
  description?: string;
  rationaleTitle?: string;
  rationale?: string;
};
type StorageData = {
  title: string;
  description: string;
  logo?: string;
  rationaleTitle?: string;
  rationale?: string;
};
type BrandsData = {
  title: string;
  description: string;
  brands: { name: string; logo: string }[];
};

// Invisible handles on all four sides so edges can attach from any direction
const HANDLE_SIDES = [
  Position.Top,
  Position.Right,
  Position.Bottom,
  Position.Left,
] as const;

const handleClass = "!h-1.5 !w-1.5 !min-w-0 !border-0 !bg-transparent";

function NodeHandles() {
  return (
    <>
      {HANDLE_SIDES.map((side) => (
        <Fragment key={side}>
          <Handle id={`${side}-s`} type="source" position={side} className={handleClass} />
          <Handle id={`${side}-t`} type="target" position={side} className={handleClass} />
        </Fragment>
      ))}
      {/* Offset right-side handles to fan out edges that would otherwise stack on
          the centered handle (e.g. three connections on "Envío de campañas"). */}
      <Handle id="right-s-hi" type="source" position={Position.Right} className={handleClass} style={{ top: "25%" }} />
      <Handle id="right-t-hi" type="target" position={Position.Right} className={handleClass} style={{ top: "25%" }} />
      <Handle id="right-s-lo" type="source" position={Position.Right} className={handleClass} style={{ top: "75%" }} />
      <Handle id="right-t-lo" type="target" position={Position.Right} className={handleClass} style={{ top: "75%" }} />
      {/* Offset top-side handles so an outgoing edge's origin dot doesn't land on
          the same point as another edge's incoming arrow (e.g. "Service Account"). */}
      <Handle id="top-s-r" type="source" position={Position.Top} className={handleClass} style={{ left: "72%" }} />
      <Handle id="top-t-r" type="target" position={Position.Top} className={handleClass} style={{ left: "72%" }} />
      {/* Offset left-side handles to separate an incoming arrow from an outgoing
          edge that would otherwise stack on the left-center (e.g. "Extracción OSS Data"). */}
      <Handle id="left-s-hi" type="source" position={Position.Left} className={handleClass} style={{ top: "28%" }} />
      <Handle id="left-t-hi" type="target" position={Position.Left} className={handleClass} style={{ top: "28%" }} />
      <Handle id="left-s-lo" type="source" position={Position.Left} className={handleClass} style={{ top: "72%" }} />
      <Handle id="left-t-lo" type="target" position={Position.Left} className={handleClass} style={{ top: "72%" }} />
    </>
  );
}

// Base card styling. Width is decided per-popup (wider when it carries an items
// list). max-h / max-w are viewport-relative so the popup always fits on screen,
// scrolling internally if the content is very tall.
const popoverClass =
  "rounded-xl border border-foreground/10 bg-white/80 px-4 py-3 text-left shadow-lg backdrop-blur-md max-h-[80vh] overflow-y-auto";

function Popover({
  title,
  description,
  itemsTitle,
  items,
  rationaleTitle,
  rationale,
}: {
  title: string;
  description: string;
  itemsTitle?: string;
  items?: PopoverItem[];
  rationaleTitle?: string;
  rationale?: string;
}) {
  // A popup with an items list needs more room: widen it and lay the items out
  // in two columns so it doesn't grow into a tall, narrow strip.
  const hasItems = !!items && items.length > 0;
  return (
    <div
      className={cn(
        popoverClass,
        hasItems ? "w-[440px] max-w-[90vw]" : "w-[280px] max-w-[90vw]",
      )}
    >
      <p className="text-sm font-bold tracking-tight text-foreground">{title}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-foreground/55">{description}</p>
      {hasItems && (
        <div className="mt-3 border-t border-foreground/10 pt-2.5">
          {itemsTitle && (
            <p className="text-[13px] font-bold tracking-tight text-brand">
              {itemsTitle}
            </p>
          )}
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2.5">
            {items.map((item) => (
              <li key={item.name}>
                <p className="font-mono text-[12px] font-semibold tracking-tight text-foreground">
                  {item.name}
                </p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-foreground/55">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {rationale && (
        <div className="mt-3 border-t border-foreground/10 pt-2.5">
          <p className="text-[13px] font-bold tracking-tight text-brand">
            {rationaleTitle}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-foreground/55">
            {rationale}
          </p>
        </div>
      )}
    </div>
  );
}

function ServiceNode({ id, data, selected }: NodeProps) {
  const d = data as ServiceData;
  const Icon = d.Icon;
  const hoveredId = useHoveredId();
  return (
    <div
      className={cn(
        "flex h-full w-full items-center gap-2 rounded-xl border border-foreground/10 bg-white/70 px-3 py-2 shadow-sm backdrop-blur-sm transition-all duration-150",
        "hover:border-brand/40 hover:shadow-md",
        selected && "border-brand ring-2 ring-brand/30",
        hoverClasses(id, hoveredId),
      )}
    >
      <NodeHandles />
      {d.logo ? (
        <img src={d.logo} alt="" className="h-5 w-auto shrink-0 object-contain" />
      ) : Icon ? (
        <Icon className="h-4 w-4 shrink-0 text-brand" />
      ) : null}
      <div className="min-w-0 leading-tight">
        <p className="truncate text-xs font-semibold tracking-tight text-foreground">
          {d.title}
        </p>
        {d.subtitle && (
          <p className="truncate text-[10px] text-foreground/45">{d.subtitle}</p>
        )}
      </div>
    </div>
  );
}

function StorageNode({ id, data, selected }: NodeProps) {
  const d = data as StorageData;
  const hoveredId = useHoveredId();
  return (
    <div
      className={cn(
        "flex h-full w-full items-center gap-2 rounded-xl border border-foreground/10 bg-white/70 px-3 py-2 shadow-sm backdrop-blur-sm transition-all duration-150",
        "hover:border-brand/40 hover:shadow-md",
        selected && "border-brand ring-2 ring-brand/30",
        hoverClasses(id, hoveredId),
      )}
    >
      <NodeHandles />
      {d.logo ? (
        <img src={d.logo} alt="" className="h-5 w-auto shrink-0 object-contain" />
      ) : null}
      <p className="text-[11px] font-semibold leading-tight tracking-tight text-foreground">
        {d.title}
      </p>
    </div>
  );
}

function BrandsNode({ id, data, selected }: NodeProps) {
  const d = data as BrandsData;
  const hoveredId = useHoveredId();
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col justify-center gap-2 rounded-xl border border-foreground/10 bg-white/70 px-3 py-2 shadow-sm backdrop-blur-sm transition-all duration-150",
        "hover:border-brand/40 hover:shadow-md",
        selected && "border-brand ring-2 ring-brand/30",
        hoverClasses(id, hoveredId),
      )}
    >
      <NodeHandles />
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {d.brands.map((b) => (
          <span
            key={b.name}
            className="flex items-center gap-1.5 rounded-full border border-foreground/10 bg-white/80 px-2.5 py-1 text-[10px] font-semibold tracking-tight text-foreground/70"
          >
            <img src={b.logo} alt="" className="h-3.5 w-auto object-contain" />
            {b.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function GroupNode({ data }: NodeProps) {
  const d = data as GroupData;
  return (
    <div className="relative h-full w-full rounded-2xl border border-dashed border-foreground/25 bg-white/15">
      {/* Target handle so an edge can point at the group as a whole (e.g. the
          scheduler triggering every function inside it). */}
      <Handle id="top-t" type="target" position={Position.Top} className={handleClass} />
      {d.title && (
        <span className="absolute left-4 top-3 text-[11px] font-bold uppercase tracking-wide text-foreground/45">
          {d.title}
        </span>
      )}
    </div>
  );
}

function LabelNode({ id, data, selected }: NodeProps) {
  const d = data as LabelData;
  const Icon = d.Icon;
  const interactive = !!d.description;
  const hoveredId = useHoveredId();

  // Interactive labels (Cloud Run, Cloud SQL, ...) render as platform buttons,
  // matching the rest of the nodes but with the light gray background. Plain
  // labels keep the lightweight header look.
  if (!interactive) {
    return (
      <div className="flex items-center gap-2">
        {d.logo ? (
          <img src={d.logo} alt="" className="h-7 w-auto shrink-0 object-contain" />
        ) : Icon ? (
          <Icon className="h-7 w-7 shrink-0 text-brand" />
        ) : null}
        <div className="leading-tight">
          <p className="text-xs font-bold tracking-tight text-foreground">{d.title}</p>
          {d.subtitle && (
            <p className="text-[10px] text-foreground/45">{d.subtitle}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-xl transition-all duration-150",
        hoverClasses(id, hoveredId),
      )}
    >
      {d.logo ? (
        <img src={d.logo} alt="" className="h-7 w-auto shrink-0 object-contain" />
      ) : Icon ? (
        <Icon className="h-7 w-7 shrink-0 text-brand" />
      ) : null}
      <div className="leading-tight">
        <p
          className={cn(
            "text-xs font-bold tracking-tight text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors group-hover:decoration-brand",
            selected && "text-brand decoration-brand",
          )}
        >
          {d.title}
        </p>
        {d.subtitle && (
          <p className="text-[10px] text-foreground/45">{d.subtitle}</p>
        )}
      </div>
    </div>
  );
}

const nodeTypes = {
  service: ServiceNode,
  storage: StorageNode,
  brands: BrandsNode,
  group: GroupNode,
  label: LabelNode,
};

const groupStyle = (w: number, h: number) => ({ width: w, height: h, zIndex: 0 });
// Higher nodes (smaller y) get a higher z-index so lower nodes never paint over them when zoom overlaps.
const nodeZIndex = (y: number) => 1000 - Math.round(y);
const boxStyle = (w: number, h: number, y: number) => ({
  width: w,
  height: h,
  zIndex: nodeZIndex(y),
});

// Horizontal lane layout (left -> right):
//   A: UI MediaLab OS  |  B: Cloud SQL  |  C: Cloud Functions  |  D: sources/sinks
// Shared services (Secret Manager / Service Account) and outputs sit on a lower
// band. Rows are aligned across lanes so most edges stay short and parallel.
const NODES: Node[] = [
  // Group containers (rendered behind everything)
  {
    id: "g_ui",
    type: "group",
    position: { x: 40, y: 118 },
    // Title omitted: the centered Cloud Run button now heads this box.
    data: {},
    draggable: false,
    selectable: false,
    style: groupStyle(272, 305),
  },
  {
    id: "g_sql",
    type: "group",
    position: { x: 372, y: 118 },
    data: {},
    draggable: false,
    selectable: false,
    style: groupStyle(232, 305),
  },
  {
    id: "g_fn",
    type: "group",
    position: { x: 700, y: 148 },
    data: { title: "Cloud Functions" },
    draggable: false,
    selectable: false,
    style: groupStyle(236, 258),
  },

  // Lane headers
  {
    id: "l_cloudrun",
    type: "label",
    // Centered at the top inside the UI box (g_ui: x40 w272 -> x101 for w150).
    position: { x: 101, y: 124 },
    data: {
      title: "Cloud Run",
      logo: "/logos/cloud-run.svg",
      description:
        "Servicio serverless que aloja la UI de MediaLab OS. Escala automáticamente según la demanda y solo cobra por el uso real.",
      rationaleTitle: "¿Por qué Cloud Run?",
      rationale:
        "Lo elegimos sobre una VM o GKE porque escala a cero y cobra solo por request, sin servidores ni clústeres que mantener. Para una herramienta interna de tráfico intermitente evita el costo fijo de Compute Engine y la complejidad operativa de Kubernetes.",
    },
    draggable: false,
    style: boxStyle(150, 32, 124),
  },
  {
    id: "l_cloudsql",
    type: "label",
    // Centered at the top inside the SQL box (g_sql: x372 w232 -> x403 for w170).
    position: { x: 403, y: 124 },
    data: {
      title: "Cloud SQL",
      subtitle: "(PostgreSQL)",
      logo: "/logos/cloud-sql.svg",
      description:
        "Base de datos PostgreSQL administrada. Almacena usuarios, actividades, alertas y campañas de la plataforma.",
      rationaleTitle: "¿Por qué Cloud SQL?",
      rationale:
        "En vez de auto-gestionar PostgreSQL en una VM, nos da backups, alta disponibilidad y parches automáticos. Frente a Firestore mantenemos un modelo relacional, que encaja mejor con los datos estructurados y los joins que necesita la plataforma.",
    },
    draggable: false,
    style: boxStyle(170, 32, 124),
  },

  // Lane A — UI MediaLab OS (order aligned with the tables they touch)
  {
    id: "sso_iap",
    type: "service",
    position: { x: 62, y: 166 },
    data: {
      title: "SSO / IAP",
      logo: "/logos/identity-aware-proxy.svg",
      description:
        "Capa de acceso que autentica al equipo contra la Tabla Usuarios antes de exponer la UI. El mecanismo concreto (Identity-Aware Proxy o SSO corporativo de Google Workspace) aún no está definido.",
      rationaleTitle: "¿Por qué un gate de acceso gestionado?",
      rationale:
        "Delegamos la autenticación en un servicio gestionado (IAP o SSO corporativo) en lugar de implementar login propio: no manejamos contraseñas ni sesiones, se integra con las cuentas de la organización y la autorización se aplica antes de que el tráfico llegue a la app.",
    },
    style: boxStyle(228, 40, 166),
  },
  {
    id: "logs_actividades",
    type: "service",
    position: { x: 62, y: 216 },
    data: {
      title: "Logs de Actividades",
      Icon: DocumentTextIcon,
      description:
        "Persiste cada acción del usuario en la Tabla Actividades para auditoría.",
    },
    style: boxStyle(228, 40, 216),
  },
  {
    id: "logica_alertas",
    type: "service",
    position: { x: 62, y: 266 },
    data: {
      title: "Lógica de Alertas",
      Icon: BellAlertIcon,
      description:
        "Evalúa condiciones sobre los datos y dispara notificaciones a Teams y Gmail.",
    },
    style: boxStyle(228, 40, 266),
  },
  {
    id: "envio_campanas",
    type: "service",
    position: { x: 62, y: 316 },
    data: {
      title: "Envío de campañas a Plataformas",
      Icon: PaperAirplaneIcon,
      description:
        "Publica campañas hacia Google Ads, Meta y TikTok usando la Service Account. El sistema opera tres mercados independientes (Chile, Colombia y Perú): cada país tiene sus propias credenciales de plataforma (MCC, cuentas de ads y Merchant Center), y el envío resuelve el mercado correcto según la campaña. Cada envío genera un job auditable con seguimiento paso a paso del progreso.",
    },
    style: boxStyle(228, 44, 316),
  },
  {
    id: "backend",
    type: "service",
    position: { x: 62, y: 370 },
    data: {
      title: "Captura de Datos",
      Icon: ServerStackIcon,
      description:
        "Capa de backend de la aplicación. La lógica de negocio vive en las API routes de Next.js (patrón BFF, alrededor de 47 endpoints) que orquestan OSS, las plataformas de publicidad, Cloud Storage y la base de datos; no hay un servicio backend separado. Se autentica ante los servicios de GCP mediante la Service Account.",
    },
    style: boxStyle(228, 40, 370),
  },

  // Lane B — Cloud SQL tables
  {
    id: "tbl_usuarios",
    type: "service",
    position: { x: 388, y: 160 },
    data: {
      title: "Tabla Usuarios",
      Icon: TableCellsIcon,
      description:
        "Almacena las cuentas del equipo, roles y permisos. La consulta el SSO / IAP para autorizar el acceso.",
    },
    style: boxStyle(200, 38, 160),
  },
  {
    id: "tbl_actividades",
    type: "service",
    position: { x: 388, y: 206 },
    data: {
      title: "Tabla Actividades",
      Icon: TableCellsIcon,
      description:
        "Registro de las acciones realizadas en la plataforma. Alimentada por los Logs de Actividades de la UI.",
    },
    style: boxStyle(200, 38, 206),
  },
  {
    id: "tbl_alertas",
    type: "service",
    position: { x: 388, y: 252 },
    data: {
      title: "Tabla Alertas",
      Icon: TableCellsIcon,
      description:
        "Estado y configuración de las alertas. La escribe y lee la Lógica de Alertas de la UI.",
    },
    style: boxStyle(200, 38, 252),
  },
  {
    id: "tbl_camp_oss",
    type: "service",
    position: { x: 388, y: 300 },
    data: {
      title: "Tabla campañas OSS",
      Icon: TableCellsIcon,
      description:
        "Datos de campañas extraídos desde OSS por las Cloud Functions.",
    },
    style: boxStyle(200, 40, 300),
  },
  {
    id: "tbl_camp_plat",
    type: "service",
    position: { x: 388, y: 348 },
    data: {
      title: "Tabla campañas plataformas",
      Icon: TableCellsIcon,
      description:
        "Métricas de performance por plataforma (Google Ads, Meta, TikTok) consolidadas para la UI.",
    },
    style: boxStyle(200, 40, 348),
  },

  // Top — Cloud Scheduler (triggers the functions)
  {
    id: "cloud_scheduler",
    type: "service",
    position: { x: 765, y: 74 },
    data: {
      title: "Cloud Scheduler",
      logo: "/logos/cloud-scheduler.svg",
      description:
        "Cron administrado que dispara periódicamente todas las Cloud Functions de extracción: OSS, las tres de performance (Google Ads, Meta, TikTok) y la de documentos.",
      rationaleTitle: "¿Por qué Cloud Scheduler?",
      rationale:
        "Preferimos un cron administrado a uno en una VM siempre encendida: no hay servidor que mantener y se integra de forma nativa con las Cloud Functions. Maneja reintentos y zonas horarias sin código adicional.",
    },
    style: boxStyle(184, 50, 74),
  },

  // Lane C — Cloud Functions (ordered so each has a clean exit)
  {
    id: "fn_oss",
    type: "service",
    position: { x: 716, y: 198 },
    data: {
      title: "Extracción OSS Data",
      logo: "/logos/cloud-functions.svg",
      description:
        "Consume la OSS API y vuelca las campañas en la Tabla campañas OSS. La ingesta corre por mercado: Chile, Colombia y Perú se procesan de forma independiente, con datos y credenciales separados por país.",
      rationaleTitle: "¿Por qué Cloud Functions?",
      rationale:
        "Las tareas de extracción son cortas y se ejecutan por evento, así que una función serverless es más eficiente que un servicio siempre activo. Pagamos solo por ejecución y cada función escala de forma independiente según su carga.",
    },
    style: boxStyle(204, 44, 198),
  },
  {
    id: "fn_docs",
    type: "service",
    position: { x: 716, y: 256 },
    data: {
      title: "Extracción de Documentos",
      logo: "/logos/cloud-functions.svg",
      description:
        "Procesa documentos y los persiste en Google Cloud Storage.",
      rationaleTitle: "¿Por qué Cloud Functions?",
      rationale:
        "Las tareas de extracción son cortas y se ejecutan por evento, así que una función serverless es más eficiente que un servicio siempre activo. Pagamos solo por ejecución y cada función escala de forma independiente según su carga.",
    },
    style: boxStyle(204, 46, 256),
  },
  {
    id: "fn_perf",
    type: "service",
    position: { x: 716, y: 326 },
    data: {
      title: "Extracción de datos de performance de campañas",
      logo: "/logos/cloud-functions.svg",
      description:
        "Obtiene métricas de performance desde las plataformas de publicidad y las consolida en la Tabla campañas plataformas. Aunque acá se representa como una sola caja, en la implementación son tres Cloud Functions independientes (una por plataforma): cada una expone un endpoint HTTP, la dispara Cloud Scheduler y escribe en el dataset de performance.",
      itemsTitle: "Las tres Cloud Functions",
      items: [
        {
          name: "gads-ingest",
          description:
            "Extrae métricas de Google Ads (inversión, impresiones, clics, conversiones) por campaña.",
        },
        {
          name: "meta-ingest",
          description:
            "Extrae la performance de Meta (Facebook e Instagram Ads) desde la Marketing API.",
        },
        {
          name: "tiktok-ingest",
          description:
            "Extrae la performance de TikTok Ads desde la Marketing API de TikTok.",
        },
      ],
      rationaleTitle: "¿Por qué Cloud Functions?",
      rationale:
        "Las tareas de extracción son cortas y se ejecutan por evento, así que una función serverless es más eficiente que un servicio siempre activo. Pagamos solo por ejecución y cada función escala de forma independiente según su carga.",
    },
    style: boxStyle(204, 56, 326),
  },

  // Lane D — external sources / sinks
  {
    id: "oss_api",
    type: "service",
    position: { x: 1000, y: 206 },
    data: {
      title: "OSS API",
      Icon: CloudIcon,
      description:
        "API externa de OSS desde donde se extraen los datos de campañas.",
    },
    style: boxStyle(130, 50, 206),
  },
  {
    id: "gcs",
    type: "storage",
    position: { x: 996, y: 262 },
    data: {
      title: "Google Cloud Storage",
      logo: "/logos/cloud-storage.svg",
      description:
        "Bucket de objetos donde se almacenan los documentos extraídos.",
      rationaleTitle: "¿Por qué Cloud Storage?",
      rationale:
        "Para archivos y documentos lo elegimos antes que guardarlos en la base: es más barato por GB, escala sin límite y sirve los objetos directamente. Evita inflar Cloud SQL con blobs binarios.",
    },
    style: boxStyle(156, 50, 262),
  },

  // Lower band — shared services
  {
    id: "secret_manager",
    type: "service",
    position: { x: 415, y: 470 },
    data: {
      title: "Secret Manager",
      subtitle: "dev tokens, secrets",
      logo: "/logos/secret-manager.svg",
      description:
        "Custodia tokens y credenciales, incluidas las de cada mercado (MCC, cuentas de ads y Merchant Center de Chile, Colombia y Perú). Solo accesible vía la Service Account.",
      rationaleTitle: "¿Por qué Secret Manager?",
      rationale:
        "Centralizamos tokens y credenciales acá en lugar de variables de entorno o archivos en el repo. Ofrece versionado, control de acceso por IAM y auditoría de cada lectura del secreto.",
    },
    style: boxStyle(158, 64, 470),
  },
  {
    id: "service_account",
    type: "service",
    position: { x: 625, y: 474 },
    data: {
      title: "Service Account",
      logo: "/logos/iam.svg",
      description:
        "Identidad de servicio que conecta la UI, las Cloud Functions y Secret Manager con permisos acotados.",
      rationaleTitle: "¿Por qué IAM / Service Accounts?",
      rationale:
        "Cada componente usa una Service Account con permisos mínimos en vez de credenciales compartidas. IAM permite acotar exactamente qué puede hacer cada servicio y rotar credenciales sin tocar el código.",
    },
    style: boxStyle(168, 58, 474),
  },

  // Outputs
  {
    id: "ext_msg",
    type: "brands",
    position: { x: 60, y: 450 },
    data: {
      title: "Notificaciones",
      brands: [
        { name: "Teams", logo: "/logos/teams.svg" },
        { name: "Gmail", logo: "/logos/gmail.svg" },
      ],
      description:
        "Canales de salida de las alertas: mensajes a Microsoft Teams y correos por Gmail.",
    },
    style: boxStyle(178, 80, 450),
  },
  {
    id: "ext_ads",
    type: "brands",
    position: { x: 560, y: 560 },
    data: {
      title: "Plataformas de publicidad",
      brands: [
        { name: "Google Ads", logo: "/logos/google-ads.svg" },
        { name: "Meta", logo: "/logos/meta.svg" },
        { name: "TikTok", logo: "/logos/tiktok.svg" },
      ],
      description:
        "Plataformas destino del envío de campañas y origen de los datos de performance.",
      itemsTitle: "Tipos de campaña que se pueden enviar",
      items: [
        {
          name: "Google Ads",
          description:
            "Performance Max, Shopping, Search, Demand Gen y Display.",
        },
        {
          name: "Meta",
          description: "Campañas de Meta Ads (Facebook e Instagram).",
        },
        {
          name: "TikTok",
          description: "Campañas de TikTok Ads (deploy nativo en curso).",
        },
      ],
    },
    style: boxStyle(290, 80, 560),
  },
];

const brand = "var(--brand)";
const marker = { type: MarkerType.ArrowClosed, color: brand, width: 16, height: 16 };
// Custom SVG marker (defined in <EdgeMarkerDefs/>) drawing a filled dot at the
// edge origin, so every connection starts with a circle and ends with an arrow.
// Pass just the id: React Flow wraps it into url('#id') itself.
const dotMarker = "arch-edge-dot";
const baseStyle = { stroke: brand, strokeWidth: 1.5, strokeOpacity: 0.55 };

// Hover variants: emphasized (edge touches the hovered node) and dimmed (rest).
const dimColor = "color-mix(in srgb, var(--brand) 40%, transparent)";
const markerEmph = { type: MarkerType.ArrowClosed, color: brand, width: 16, height: 16 };
const markerDim = { type: MarkerType.ArrowClosed, color: dimColor, width: 16, height: 16 };
const dotMarkerDim = "arch-edge-dot-dim";
const emphStyle = { stroke: brand, strokeWidth: 2.5, strokeOpacity: 1 };
const dimStyle = { stroke: brand, strokeWidth: 1.5, strokeOpacity: 0.32 };

// Recompute an edge's look from the hovered node: emphasize edges connected to
// it, dim the rest. With nothing hovered, edges keep their base appearance.
function decorateEdge(e: Edge, hoveredId: string | null): Edge {
  if (!hoveredId) return e;
  const active = e.source === hoveredId || e.target === hoveredId;
  const startIsDot = typeof e.markerStart === "string";
  if (active) {
    return {
      ...e,
      style: emphStyle,
      markerStart: startIsDot ? dotMarker : markerEmph,
      markerEnd: markerEmph,
    };
  }
  return {
    ...e,
    style: dimStyle,
    markerStart: startIsDot ? dotMarkerDim : markerDim,
    markerEnd: markerDim,
  };
}

function EdgeMarkerDefs() {
  return (
    <svg aria-hidden="true" style={{ position: "absolute", width: 0, height: 0 }}>
      <defs>
        <marker
          id="arch-edge-dot"
          markerWidth="5"
          markerHeight="5"
          refX="2.5"
          refY="2.5"
          markerUnits="userSpaceOnUse"
          orient="auto"
        >
          <circle cx="2.5" cy="2.5" r="2.5" fill={brand} fillOpacity={0.55} />
        </marker>
        <marker
          id="arch-edge-dot-dim"
          markerWidth="5"
          markerHeight="5"
          refX="2.5"
          refY="2.5"
          markerUnits="userSpaceOnUse"
          orient="auto"
        >
          <circle cx="2.5" cy="2.5" r="2.5" fill={brand} fillOpacity={0.32} />
        </marker>
      </defs>
    </svg>
  );
}

// Orthogonal edge whose horizontal run is forced through a given Y (data.centerY)
// so it travels along a clear band between node rows instead of behind nodes.
function ChannelEdge(props: EdgeProps) {
  const {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    markerStart,
    markerEnd,
    style,
    data,
  } = props;
  const d = data as { centerY?: number; centerX?: number } | undefined;
  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 24,
    ...(typeof d?.centerY === "number" ? { centerY: d.centerY } : {}),
    ...(typeof d?.centerX === "number" ? { centerX: d.centerX } : {}),
  });
  return (
    <BaseEdge path={path} markerStart={markerStart} markerEnd={markerEnd} style={style} />
  );
}

const edgeTypes = { channel: ChannelEdge };

// Direction encodes the visual style:
//  - "uni": one-way flow -> dashed + animated line, origin dot + end arrow.
//  - "bi":  two-way flow  -> solid (no animation) line, arrowheads on both ends.
function edge(
  id: string,
  source: string,
  sourceHandle: string,
  target: string,
  targetHandle: string,
  dir: "uni" | "bi" = "uni",
  type: "smoothstep" | "straight" = "smoothstep",
): Edge {
  const bi = dir === "bi";
  return {
    id,
    source,
    target,
    sourceHandle,
    targetHandle,
    type,
    animated: !bi,
    markerStart: bi ? marker : dotMarker,
    markerEnd: marker,
    style: baseStyle,
    ...(type === "smoothstep"
      ? { pathOptions: { borderRadius: 24 } }
      : {}),
  } as Edge;
}

const EDGES: Edge[] = [
  // UI (lane A) <-> Cloud SQL (lane B): short, mostly horizontal
  edge("e1", "sso_iap", "right-s", "tbl_usuarios", "left-t", "bi"),
  edge("e2", "logs_actividades", "right-s", "tbl_actividades", "left-t", "uni"),
  edge("e3", "logica_alertas", "right-s", "tbl_alertas", "left-t", "bi"),
  // Tabla campañas OSS <-> Manejo de Rutas. Routed down the inter-group corridor
  // (x ~358, separate from e6 at ~340) and into the right side of "Manejo de Rutas".
  {
    id: "e4",
    source: "tbl_camp_oss",
    sourceHandle: "left-s",
    target: "backend",
    targetHandle: "right-t",
    type: "channel",
    data: { centerX: 358 },
    markerStart: marker,
    markerEnd: marker,
    style: baseStyle,
  } as Edge,
  // UI -> outputs (lower-left). Exits left and runs down the left side so it
  // doesn't cross the "Envío de campañas" node directly below it nor merge with
  // the edges leaving that node's bottom.
  edge("e5", "logica_alertas", "left-s", "ext_msg", "left-t", "uni"),
  // Exits the right of "Envío de campañas" and drops down the clear corridor
  // between the UI and SQL groups (x ~340), then runs along the bottom into the
  // platforms' left side. Routed on the right because "Backend" now sits directly
  // below "Envío", blocking the bottom exit.
  {
    id: "e6",
    source: "envio_campanas",
    sourceHandle: "right-s-lo",
    target: "ext_ads",
    targetHandle: "left-t",
    type: "channel",
    animated: true,
    data: { centerX: 340 },
    markerStart: dotMarker,
    markerEnd: marker,
    style: baseStyle,
  } as Edge,
  // Service Account -> Captura de Datos: leaves the top of Service Account, runs up
  // through the clear band below the UI group and into the bottom of Captura de Datos.
  {
    id: "e16",
    source: "service_account",
    sourceHandle: "top-s",
    target: "backend",
    targetHandle: "bottom-t",
    type: "channel",
    animated: true,
    data: { centerY: 435 },
    markerStart: dotMarker,
    markerEnd: marker,
    style: baseStyle,
  } as Edge,
  edge("e8", "service_account", "left-s", "secret_manager", "right-t", "bi", "straight"),
  // Leaves the top-right of Service Account so its origin dot doesn't sit on the
  // same point where e7's arrow enters the top-center. Enters fn_oss on the lower
  // half of its left side, separate from e11 which leaves the upper half.
  edge("e9", "service_account", "top-s-r", "fn_oss", "left-t-lo", "bi"),
  // Cloud Functions (lane C) -> tables (lane B), leftward. Leaves the upper half
  // of fn_oss's left side so its origin dot doesn't stack with e9's arrow.
  edge("e11", "fn_oss", "left-s-hi", "tbl_camp_oss", "right-t", "uni"),
  edge("e12", "fn_perf", "left-s", "tbl_camp_plat", "right-t", "uni"),
  // Cloud Functions -> sources / sinks (lane D), rightward
  edge("e10", "fn_oss", "right-s", "oss_api", "left-t", "uni"),
  edge("e14", "fn_docs", "right-s", "gcs", "left-t", "bi"),
  // Ad platforms -> Cloud Functions performance: the extraction pulls metrics
  // from the platforms, so the flow points into the function. Routed around the
  // right (empty space between the functions and GCS) so it doesn't cross Service
  // Account, which sits directly above the platforms' top edge.
  edge("e13", "ext_ads", "right-s", "fn_perf", "right-t", "uni"),
  // Scheduler triggers every extraction function. Drawn as a single edge into the
  // Cloud Functions group box (it fires the whole group periodically), avoiding
  // three separate lines through the already crowded sides of the stack.
  edge("e15", "cloud_scheduler", "bottom-s", "g_fn", "top-t", "uni"),
];

// Less top padding so the diagram sits higher in the canvas on first load.
const FIT_VIEW_OPTIONS = {
  padding: { top: 0.04, bottom: 0.14, left: 0.12, right: 0.12 },
};

// Used only to decide when vertical wheel gestures should pan vs scroll the page.
const CONTENT_BOUNDS = getNodesBounds(NODES);

function verticalPanLimits(zoom: number, height: number) {
  const k = zoom;
  return {
    maxY: -CONTENT_BOUNDS.y * k,
    minY: height - (CONTENT_BOUNDS.y + CONTENT_BOUNDS.height) * k,
  };
}

function DiagramInner() {
  const [nodes, , onNodesChange] = useNodesState(NODES);
  const [edges] = useEdgesState(EDGES);
  const { setNodes, fitView, getViewport } = useReactFlow();
  const store = useStoreApi();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Hovered node id: drives the highlight/dim effect on nodes and edges.
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // While a popup is open (a node is selected) we freeze the canvas so the
  // popup stays put: no pan, no zoom. Page scroll is still allowed.
  const hasSelection = nodes.some((n) => n.selected);

  // Edges restyled from the hovered node. Group containers don't take part in
  // the hover effect, so hovering one clears the highlight instead of dimming all.
  const decoratedEdges = useMemo(
    () => edges.map((e) => decorateEdge(e, hoveredId)),
    [edges, hoveredId],
  );

  const handleNodeMouseEnter = useCallback(
    (_: ReactMouseEvent, node: Node) => {
      setHoveredId(node.type === "group" ? null : node.id);
    },
    [],
  );
  const handleNodeMouseLeave = useCallback(() => setHoveredId(null), []);

  // Wheel/trackpad handling. Horizontal gestures (or Shift + wheel) pan sideways.
  // Vertical gestures pan the diagram down/up while it overflows the canvas (i.e.
  // when zoomed in and there's clipped content), and only hand the scroll back to
  // the page once the top/bottom edge is reached — so the lower nodes are always
  // reachable. A native non-passive listener is required because React's onWheel
  // is passive and can't preventDefault.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (hasSelection) return;
      // Pinch-to-zoom and Ctrl/Cmd + wheel are handled by React Flow.
      if (e.ctrlKey || e.metaKey) return;

      const { panBy, width, height, transform } = store.getState();
      if (!width || !height) return;

      const horizontal = e.shiftKey ? e.deltaY : e.deltaX;
      const vertical = e.shiftKey ? 0 : e.deltaY;

      if (Math.abs(horizontal) > Math.abs(vertical)) {
        e.preventDefault();
        void panBy({ x: -horizontal, y: 0 });
        return;
      }

      const k = transform[2];
      if (CONTENT_BOUNDS.height * k <= height) return;

      const vp = getViewport();
      const { minY, maxY } = verticalPanLimits(k, height);
      if (minY >= maxY) return;
      const nextY = Math.min(maxY, Math.max(minY, vp.y - vertical));
      if (nextY === vp.y) return;
      e.preventDefault();
      void panBy({ x: 0, y: -vertical });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [hasSelection, getViewport, store]);

  const handleReset = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
    void fitView({ ...FIT_VIEW_OPTIONS, duration: 400 });
  }, [setNodes, fitView]);

  // Selection is fully controlled here (React Flow's built-in selection is
  // disabled via elementsSelectable) so that, while a popup is open, the first
  // click anywhere only closes it. The user must close the current popup before
  // being able to open another element's popup.
  const handleNodeClick = useCallback(
    (_: ReactMouseEvent, clickedNode: Node) => {
      setNodes((nds) => {
        const anyOpen = nds.some((n) => n.selected);
        if (anyOpen) {
          return nds.map((n) => (n.selected ? { ...n, selected: false } : n));
        }
        // Only nodes that carry a description have a popup; ignore clicks on the
        // rest (group containers, plain lane labels, etc.).
        const target = nds.find((n) => n.id === clickedNode.id);
        const interactive = Boolean(
          (target?.data as { description?: string } | undefined)?.description,
        );
        if (!interactive) return nds;
        return nds.map((n) => ({ ...n, selected: n.id === clickedNode.id }));
      });
    },
    [setNodes],
  );

  const handlePaneClick = useCallback(() => {
    setNodes((nds) =>
      nds.some((n) => n.selected)
        ? nds.map((n) => (n.selected ? { ...n, selected: false } : n))
        : nds,
    );
  }, [setNodes]);

  // The popup is rendered as a single overlay centered in the canvas (instead of
  // a per-node NodeToolbar anchored to the node), so it is always fully visible
  // and never clipped by the canvas edges regardless of where the node sits.
  const selectedData = nodes.find((n) => n.selected)?.data as
    | {
        title?: string;
        description?: string;
        itemsTitle?: string;
        items?: PopoverItem[];
        rationaleTitle?: string;
        rationale?: string;
      }
    | undefined;

  return (
    <div className="space-y-5">
      {/* Header: interaction hint + reset action (section title now lives in the navbar) */}
      <div className="flex items-center justify-between gap-6">
        <p className="max-w-2xl text-sm text-foreground/50 leading-relaxed">
          Diagrama interactivo de la infraestructura. Arrastrá o scrolleá de costado
          para moverte, hacé pinch o Ctrl + rueda para el zoom y clic en cualquier
          componente para ver su detalle.
        </p>
        {/* Fixed so it stays in the top-right corner and visible while scrolling.
            Aligned to the 80% content container's right edge (10vw from the
            viewport edge) and placed just below the fixed navbar. */}
        <button
          type="button"
          onClick={handleReset}
          aria-label="Reiniciar diagrama"
          title="Reiniciar diagrama"
          className="fixed top-[5.5rem] right-[10vw] z-40 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-foreground/10 bg-white/60 text-foreground/55 shadow-sm backdrop-blur-sm transition-all hover:border-brand/40 hover:text-brand"
        >
          <ArrowPathIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Canvas — full-bleed to the viewport width from the centered 80% column. */}
      <div
        ref={canvasRef}
        className="relative h-[680px] w-screen max-w-[100vw] ml-[calc(50%-50vw)] overflow-hidden bg-[var(--app-background)]"
      >
        <EdgeMarkerDefs />
        <HoverContext.Provider value={hoveredId}>
          <ReactFlow
            className="arch-flow"
            nodes={nodes}
            edges={decoratedEdges}
            onNodesChange={onNodesChange}
            onNodeClick={handleNodeClick}
            onNodeMouseEnter={handleNodeMouseEnter}
            onNodeMouseLeave={handleNodeMouseLeave}
            onPaneClick={handlePaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={FIT_VIEW_OPTIONS}
            minZoom={0.3}
            maxZoom={2}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            // Wheel is left to the page (so the section scrolls and its subtitle
            // moves up). preventScrolling={false} is required so React Flow does
            // not preventDefault plain wheel events over the canvas. Pan is done
            // by dragging; zoom via pinch / Ctrl + wheel.
            panOnScroll={false}
            zoomOnScroll={false}
            preventScrolling={false}
            panOnDrag={!hasSelection}
            zoomOnPinch={!hasSelection}
            zoomOnDoubleClick={!hasSelection}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={22}
              size={1.5}
              color="var(--brand-subtle)"
              bgColor="var(--app-background)"
            />
          </ReactFlow>
        </HoverContext.Provider>
        {/* Centered popup overlay. The wrapper ignores pointer events so a click
            outside the card falls through to the pane and closes the popup, while
            the card itself stays interactive. */}
        {selectedData?.description && (
          <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center p-6">
            <div className="pointer-events-auto">
              <Popover
                title={selectedData.title ?? ""}
                description={selectedData.description}
                itemsTitle={selectedData.itemsTitle}
                items={selectedData.items}
                rationaleTitle={selectedData.rationaleTitle}
                rationale={selectedData.rationale}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ArchitectureDiagram() {
  return (
    <ReactFlowProvider>
      <DiagramInner />
    </ReactFlowProvider>
  );
}
