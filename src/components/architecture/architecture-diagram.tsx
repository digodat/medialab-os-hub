"use client";

/* eslint-disable @next/next/no-img-element -- local static brand/product SVGs */

import { Fragment, useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Handle,
  MarkerType,
  NodeToolbar,
  Position,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
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
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, MouseEvent as ReactMouseEvent, SVGProps } from "react";
import { cn } from "@/lib/utils";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

type ToolbarAlign = "start" | "center" | "end";

// rationaleTitle / rationale render an extra "Why this product?" section in the
// popup, explaining why the tool was chosen over alternatives.
type ServiceData = {
  title: string;
  subtitle?: string;
  description: string;
  Icon?: IconType;
  logo?: string;
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

// Popup placement is derived from each node's real position (provided by React
// Flow on every render), so popups always open toward the inside of the canvas
// and never get clipped by its edges. Computing it at render time (instead of
// precomputing into node data) also keeps it correct across Fast Refresh.
const LAYOUT_MID_Y = 320;
const LEFT_EDGE_X = 260;
const RIGHT_EDGE_X = 940;

function toolbarPlacement(
  x: number,
  y: number,
  w?: number,
  h?: number,
): { position: Position; align: ToolbarAlign } {
  const centerX = x + (w ?? 0) / 2;
  const centerY = y + (h ?? 0) / 2;
  return {
    position: centerY < LAYOUT_MID_Y ? Position.Bottom : Position.Top,
    align:
      centerX < LEFT_EDGE_X ? "start" : centerX > RIGHT_EDGE_X ? "end" : "center",
  };
}

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
    </>
  );
}

const popoverClass =
  "max-w-[280px] rounded-xl border border-foreground/10 bg-white/80 px-4 py-3 text-left shadow-lg backdrop-blur-md";

function Popover({
  title,
  description,
  rationaleTitle,
  rationale,
}: {
  title: string;
  description: string;
  rationaleTitle?: string;
  rationale?: string;
}) {
  return (
    <div className={popoverClass}>
      <p className="text-sm font-bold tracking-tight text-foreground">{title}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-foreground/55">{description}</p>
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

function ServiceNode({
  data,
  selected,
  positionAbsoluteX,
  positionAbsoluteY,
  width,
  height,
}: NodeProps) {
  const d = data as ServiceData;
  const Icon = d.Icon;
  const placement = toolbarPlacement(positionAbsoluteX, positionAbsoluteY, width, height);
  return (
    <div
      className={cn(
        "flex h-full w-full items-center gap-2 rounded-xl border border-foreground/10 bg-white/70 px-3 py-2 shadow-sm backdrop-blur-sm transition-all duration-150",
        "hover:border-brand/40 hover:shadow-md",
        selected && "border-brand ring-2 ring-brand/30",
      )}
    >
      <NodeHandles />
      <NodeToolbar
        isVisible={selected}
        position={placement.position}
        align={placement.align}
        offset={10}
      >
        <Popover
          title={d.title}
          description={d.description}
          rationaleTitle={d.rationaleTitle}
          rationale={d.rationale}
        />
      </NodeToolbar>
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

function StorageNode({
  data,
  selected,
  positionAbsoluteX,
  positionAbsoluteY,
  width,
  height,
}: NodeProps) {
  const d = data as StorageData;
  const placement = toolbarPlacement(positionAbsoluteX, positionAbsoluteY, width, height);
  return (
    <div
      className={cn(
        "flex h-full w-full items-center gap-2 rounded-xl border border-foreground/10 bg-white/70 px-3 py-2 shadow-sm backdrop-blur-sm transition-all duration-150",
        "hover:border-brand/40 hover:shadow-md",
        selected && "border-brand ring-2 ring-brand/30",
      )}
    >
      <NodeHandles />
      <NodeToolbar
        isVisible={selected}
        position={placement.position}
        align={placement.align}
        offset={10}
      >
        <Popover
          title={d.title}
          description={d.description}
          rationaleTitle={d.rationaleTitle}
          rationale={d.rationale}
        />
      </NodeToolbar>
      {d.logo ? (
        <img src={d.logo} alt="" className="h-5 w-auto shrink-0 object-contain" />
      ) : null}
      <p className="text-[11px] font-semibold leading-tight tracking-tight text-foreground">
        {d.title}
      </p>
    </div>
  );
}

function BrandsNode({
  data,
  selected,
  positionAbsoluteX,
  positionAbsoluteY,
  width,
  height,
}: NodeProps) {
  const d = data as BrandsData;
  const placement = toolbarPlacement(positionAbsoluteX, positionAbsoluteY, width, height);
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col justify-center gap-2 rounded-xl border border-foreground/10 bg-white/70 px-3 py-2 shadow-sm backdrop-blur-sm transition-all duration-150",
        "hover:border-brand/40 hover:shadow-md",
        selected && "border-brand ring-2 ring-brand/30",
      )}
    >
      <NodeHandles />
      <NodeToolbar
        isVisible={selected}
        position={placement.position}
        align={placement.align}
        offset={10}
      >
        <Popover title={d.title} description={d.description} />
      </NodeToolbar>
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
      {d.title && (
        <span className="absolute left-4 top-3 text-[11px] font-bold uppercase tracking-wide text-foreground/45">
          {d.title}
        </span>
      )}
    </div>
  );
}

function LabelNode({
  data,
  selected,
  positionAbsoluteX,
  positionAbsoluteY,
  width,
  height,
}: NodeProps) {
  const d = data as LabelData;
  const Icon = d.Icon;
  const interactive = !!d.description;
  const placement = toolbarPlacement(positionAbsoluteX, positionAbsoluteY, width, height);

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
    <div className="group flex h-full w-full cursor-pointer items-center justify-center gap-2">
      <NodeToolbar
        isVisible={selected}
        position={placement.position}
        align={placement.align}
        offset={10}
      >
        <Popover
          title={d.title}
          description={d.description as string}
          rationaleTitle={d.rationaleTitle}
          rationale={d.rationale}
        />
      </NodeToolbar>
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
const boxStyle = (w: number, h: number) => ({ width: w, height: h, zIndex: 1 });

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
    style: groupStyle(272, 255),
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
    style: boxStyle(150, 32),
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
    style: boxStyle(170, 32),
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
        "Identity-Aware Proxy: autentica al equipo contra la Tabla Usuarios antes de exponer la UI.",
      rationaleTitle: "¿Por qué IAP?",
      rationale:
        "Usamos Identity-Aware Proxy en lugar de implementar autenticación propia para no manejar contraseñas ni sesiones. Se integra con las cuentas de Google de la organización y aplica la autorización a nivel de infraestructura, antes de que el tráfico llegue a la app.",
    },
    style: boxStyle(228, 40),
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
    style: boxStyle(228, 40),
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
    style: boxStyle(228, 40),
  },
  {
    id: "envio_campanas",
    type: "service",
    position: { x: 62, y: 316 },
    data: {
      title: "Envío de campañas a Plataformas",
      Icon: PaperAirplaneIcon,
      description:
        "Publica campañas hacia Google Ads, Meta y TikTok usando la Service Account.",
    },
    style: boxStyle(228, 44),
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
    style: boxStyle(200, 38),
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
    style: boxStyle(200, 38),
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
    style: boxStyle(200, 38),
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
    style: boxStyle(200, 40),
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
    style: boxStyle(200, 40),
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
        "Cron administrado que dispara las Cloud Functions de extracción de forma periódica.",
      rationaleTitle: "¿Por qué Cloud Scheduler?",
      rationale:
        "Preferimos un cron administrado a uno en una VM siempre encendida: no hay servidor que mantener y se integra de forma nativa con las Cloud Functions. Maneja reintentos y zonas horarias sin código adicional.",
    },
    style: boxStyle(184, 50),
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
        "Consume la OSS API y vuelca las campañas en la Tabla campañas OSS.",
      rationaleTitle: "¿Por qué Cloud Functions?",
      rationale:
        "Las tareas de extracción son cortas y se ejecutan por evento, así que una función serverless es más eficiente que un servicio siempre activo. Pagamos solo por ejecución y cada función escala de forma independiente según su carga.",
    },
    style: boxStyle(204, 44),
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
    style: boxStyle(204, 46),
  },
  {
    id: "fn_perf",
    type: "service",
    position: { x: 716, y: 326 },
    data: {
      title: "Extracción de datos de performance de campañas",
      logo: "/logos/cloud-functions.svg",
      description:
        "Obtiene métricas desde Google Ads, Meta y TikTok y las guarda en la Tabla campañas plataformas.",
      rationaleTitle: "¿Por qué Cloud Functions?",
      rationale:
        "Las tareas de extracción son cortas y se ejecutan por evento, así que una función serverless es más eficiente que un servicio siempre activo. Pagamos solo por ejecución y cada función escala de forma independiente según su carga.",
    },
    style: boxStyle(204, 56),
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
    style: boxStyle(130, 50),
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
    style: boxStyle(156, 50),
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
        "Custodia tokens de desarrollador y credenciales. Solo accesible vía la Service Account.",
      rationaleTitle: "¿Por qué Secret Manager?",
      rationale:
        "Centralizamos tokens y credenciales acá en lugar de variables de entorno o archivos en el repo. Ofrece versionado, control de acceso por IAM y auditoría de cada lectura del secreto.",
    },
    style: boxStyle(158, 64),
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
    style: boxStyle(168, 58),
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
    style: boxStyle(178, 80),
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
    },
    style: boxStyle(290, 80),
  },
];

const brand = "var(--brand)";
const marker = { type: MarkerType.ArrowClosed, color: brand, width: 16, height: 16 };
const baseStyle = { stroke: brand, strokeWidth: 1.5, strokeOpacity: 0.55 };

function edge(
  id: string,
  source: string,
  sourceHandle: string,
  target: string,
  targetHandle: string,
  animated = false,
  type: "smoothstep" | "straight" = "smoothstep",
): Edge {
  return {
    id,
    source,
    target,
    sourceHandle,
    targetHandle,
    type,
    animated,
    markerEnd: marker,
    style: baseStyle,
    ...(type === "smoothstep"
      ? { pathOptions: { borderRadius: 24 } }
      : {}),
  } as Edge;
}

const EDGES: Edge[] = [
  // UI (lane A) <-> Cloud SQL (lane B): short, mostly horizontal
  edge("e1", "sso_iap", "right-s", "tbl_usuarios", "left-t"),
  edge("e2", "logs_actividades", "right-s", "tbl_actividades", "left-t", true),
  edge("e3", "logica_alertas", "right-s", "tbl_alertas", "left-t", true),
  edge("e4", "tbl_camp_oss", "left-s", "envio_campanas", "right-t"),
  // UI -> outputs (lower-left). Exits left and runs down the left side so it
  // doesn't cross the "Envío de campañas" node directly below it nor merge with
  // the edges leaving that node's bottom.
  edge("e5", "logica_alertas", "left-s", "ext_msg", "left-t", true),
  // Exits right and drops down the open corridor between the UI and SQL lanes,
  // then runs along the bottom into the platforms' right side.
  edge("e6", "envio_campanas", "right-s", "ext_ads", "right-t", true),
  // UI -> shared services. Same right-side corridor avoids crossing Notificaciones
  // directly below "Envío de campañas".
  edge("e7", "envio_campanas", "right-s", "service_account", "top-t"),
  edge("e8", "service_account", "left-s", "secret_manager", "right-t", false, "straight"),
  edge("e9", "service_account", "top-s", "fn_oss", "left-t"),
  // Cloud Functions (lane C) -> tables (lane B), leftward
  edge("e11", "fn_oss", "left-s", "tbl_camp_oss", "right-t", true),
  edge("e12", "fn_perf", "left-s", "tbl_camp_plat", "right-t", true),
  // Cloud Functions -> sources / sinks (lane D), rightward
  edge("e10", "fn_oss", "right-s", "oss_api", "left-t", true),
  edge("e14", "fn_docs", "right-s", "gcs", "left-t", true),
  // Cloud Functions performance -> ad platforms. Routed around the right (empty
  // space between the functions and GCS) so it doesn't cross Service Account,
  // which sits directly above the platforms' top edge.
  edge("e13", "fn_perf", "right-s", "ext_ads", "right-t", true),
  // Scheduler triggers functions (downward)
  edge("e15", "cloud_scheduler", "bottom-s", "fn_oss", "top-t"),
];

const FIT_VIEW_OPTIONS = { padding: 0.12 };

function DiagramInner() {
  const [nodes, , onNodesChange] = useNodesState(NODES);
  const [edges] = useEdgesState(EDGES);
  const { setNodes, fitView, getViewport, setViewport } = useReactFlow();
  const canvasRef = useRef<HTMLDivElement>(null);

  // While a popup is open (a node is selected) we freeze the canvas so the
  // popup stays put: no pan, no zoom. Page scroll is still allowed.
  const hasSelection = nodes.some((n) => n.selected);

  // Horizontal wheel/trackpad (or Shift + wheel) pans the diagram sideways,
  // while vertical wheel is left to the page. A native non-passive listener is
  // required because React's onWheel is passive and can't preventDefault.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (hasSelection) return;
      const horizontal = e.shiftKey ? e.deltaY : e.deltaX;
      const vertical = e.shiftKey ? 0 : e.deltaY;
      // Only act when the gesture is mostly horizontal; otherwise let the page scroll.
      if (Math.abs(horizontal) <= Math.abs(vertical)) return;
      e.preventDefault();
      const vp = getViewport();
      setViewport({ ...vp, x: vp.x - horizontal });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [hasSelection, getViewport, setViewport]);

  // Reset clears any open popup (node selection) and returns the viewport
  // to its initial fitted state.
  const handleReset = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
    fitView({ ...FIT_VIEW_OPTIONS, duration: 400 });
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

  return (
    <div className="space-y-8">
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

      {/* Canvas — full-bleed to the window width. The (hub) layout caps content
          at 80% width and centers it, so we offset by 12.5% of that container on
          each side (= 10% of the viewport) to span the full window width without
          relying on 100vw (which would overflow past the reserved scrollbar gutter). */}
      <div ref={canvasRef} className="h-[680px] -mx-[12.5%] overflow-hidden">
        <ReactFlow
          className="arch-flow"
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
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
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} color="var(--brand-subtle)" />
        </ReactFlow>
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
