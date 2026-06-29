// Roadmap domain model and timeline helpers.
//
// The chart is a quarter-based Gantt: each epic is a horizontal bar placed on a
// month grid. Month indices are 0-based and relative to the timeline start
// defined in TIMELINE_START. With the current config (Q2 2026, 4 quarters):
//   0-2  -> Q2 '26 (Abr, May, Jun)
//   3-5  -> Q3 '26 (Jul, Ago, Sep)
//   6-8  -> Q4 '26 (Oct, Nov, Dic)
//   9-11 -> Q1 '27 (Ene, Feb, Mar)

export type RoadmapStatus = "planned" | "in-progress" | "done";

export type RoadmapEpic = {
  id: string;
  title: string;
  group: string;
  // Inclusive month indices relative to the timeline start.
  startMonth: number;
  endMonth: number;
  status: RoadmapStatus;
  // Longer description shown in the task detail popup.
  detail: string;
  // IDs of epics that must finish before this one (drawn as arrows).
  dependsOn?: string[];
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

// Timeline starts at Q2 2026: month index 3 (April, 0-based) of 2026.
export const TIMELINE_START = { year: 2026, month: 3 } as const;
export const TIMELINE_QUARTERS = 4;

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
  { id: "platform", name: "Plataforma" },
  { id: "experience", name: "Experiencia" },
];

export const ROADMAP_EPICS: RoadmapEpic[] = [
  // Infraestructura
  {
    id: "infra-auth",
    title: "Mejoras de autenticación",
    group: "infra",
    startMonth: 0,
    endMonth: 2,
    status: "done",
    detail:
      "Refuerzo del flujo de autenticación: soporte de SSO corporativo, rotación de tokens y verificación en dos pasos para las cuentas con acceso a producción.",
  },
  {
    id: "infra-scaling",
    title: "Escalado de claves LLM/API",
    group: "infra",
    startMonth: 0,
    endMonth: 3,
    status: "in-progress",
    detail:
      "Escalado horizontal de las claves de proveedores LLM/API con balanceo por cuota y límites por workspace para evitar throttling en horas pico.",
  },
  {
    id: "infra-mcp",
    title: "Soporte MCP para el núcleo",
    group: "infra",
    startMonth: 3,
    endMonth: 6,
    status: "in-progress",
    dependsOn: ["infra-auth"],
    detail:
      "Implementación del protocolo MCP en el núcleo para exponer las herramientas internas a los agentes de forma estandarizada y segura.",
  },
  {
    id: "infra-orgs",
    title: "Migración a organizaciones separadas",
    group: "infra",
    startMonth: 5,
    endMonth: 8,
    status: "planned",
    detail:
      "Separación de los usuarios actuales en organizaciones independientes, con aislamiento de datos y administración delegada por organización.",
  },
  {
    id: "infra-audit",
    title: "Trazas de auditoría de agentes",
    group: "infra",
    startMonth: 6,
    endMonth: 9,
    status: "planned",
    dependsOn: ["infra-mcp"],
    detail:
      "Trazas de auditoría completas de cada acción de los agentes: entradas, herramientas invocadas y salidas, con retención configurable.",
  },
  {
    id: "infra-validation",
    title: "Validación de salidas de agentes",
    group: "infra",
    startMonth: 9,
    endMonth: 11,
    status: "planned",
    dependsOn: ["infra-audit"],
    detail:
      "Capa de validación automática de las salidas de los agentes antes de su entrega, con reglas por tipo de contenido y revisión humana opcional.",
  },

  // Plataforma
  {
    id: "plat-mcp-custom",
    title: "Servidores MCP para usos personalizados",
    group: "platform",
    startMonth: 0,
    endMonth: 3,
    status: "in-progress",
    detail:
      "Servidores MCP desplegables por el equipo para casos de uso personalizados, con catálogo interno y permisos por servidor.",
  },
  {
    id: "plat-roles",
    title: "Roles y permisos granulares",
    group: "platform",
    startMonth: 1,
    endMonth: 3,
    status: "done",
    detail:
      "Modelo de roles y permisos granulares a nivel de recurso, reemplazando el esquema binario actual de administrador/usuario.",
  },
  {
    id: "plat-taxonomy",
    title: "Gestor de taxonomía",
    group: "platform",
    startMonth: 2,
    endMonth: 4,
    status: "in-progress",
    detail:
      "Gestor centralizado de taxonomía para etiquetar y clasificar los activos de forma consistente en toda la plataforma.",
  },
  {
    id: "plat-approval",
    title: "Flujos de aprobación avanzados",
    group: "platform",
    startMonth: 3,
    endMonth: 6,
    status: "planned",
    dependsOn: ["plat-roles"],
    detail:
      "Flujos de aprobación configurables con múltiples revisores, condiciones y notificaciones para las publicaciones sensibles.",
  },
  {
    id: "plat-reports",
    title: "Reportes de activos",
    group: "platform",
    startMonth: 5,
    endMonth: 8,
    status: "planned",
    dependsOn: ["plat-taxonomy"],
    detail:
      "Reportes de uso y estado de los activos, exportables y programables, con métricas por organización y por proyecto.",
  },
  {
    id: "plat-storefront",
    title: "Integración de escaparate",
    group: "platform",
    startMonth: 7,
    endMonth: 10,
    status: "planned",
    detail:
      "Integración con el escaparate externo para publicar y sincronizar de forma automática los activos aprobados.",
  },
  {
    id: "plat-onboarding",
    title: "Nueva experiencia de onboarding",
    group: "platform",
    startMonth: 9,
    endMonth: 11,
    status: "planned",
    detail:
      "Rediseño de la experiencia de alta de nuevos usuarios con guías contextuales y configuración asistida del workspace.",
  },

  // Experiencia
  {
    id: "xp-notif",
    title: "Sistema de notificaciones in-app",
    group: "experience",
    startMonth: 1,
    endMonth: 4,
    status: "in-progress",
    dependsOn: ["infra-mcp"],
    detail:
      "Sistema de notificaciones in-app en tiempo real para los eventos relevantes: aprobaciones, menciones y cambios de estado.",
  },
  {
    id: "xp-jira",
    title: "Integración con Jira",
    group: "experience",
    startMonth: 4,
    endMonth: 7,
    status: "planned",
    dependsOn: ["xp-notif"],
    detail:
      "Integración bidireccional con Jira para crear y sincronizar tareas desde la plataforma sin salir del flujo de trabajo.",
  },
  {
    id: "xp-campaign",
    title: "Rendimiento de campañas",
    group: "experience",
    startMonth: 6,
    endMonth: 9,
    status: "planned",
    detail:
      "Panel de rendimiento de campañas con métricas agregadas y comparativas por período para el equipo de marketing.",
  },
  {
    id: "xp-templates",
    title: "Editor de plantillas de brief",
    group: "experience",
    startMonth: 9,
    endMonth: 11,
    status: "planned",
    dependsOn: ["xp-jira"],
    detail:
      "Editor mejorado de plantillas de brief con bloques reutilizables, variables y vista previa en vivo.",
  },
];

export type TimelineMonth = { index: number; label: string };
export type TimelineQuarter = { label: string; startIndex: number; span: number };

export type Timeline = {
  months: TimelineMonth[];
  quarters: TimelineQuarter[];
  totalMonths: number;
};

// Builds the month/quarter axis metadata from the start config.
export function buildTimeline(): Timeline {
  const totalMonths = TIMELINE_QUARTERS * 3;
  const months: TimelineMonth[] = [];
  const quarters: TimelineQuarter[] = [];

  for (let i = 0; i < totalMonths; i++) {
    const monthOfYear = (TIMELINE_START.month + i) % 12;
    months.push({ index: i, label: MONTH_ABBR[monthOfYear] });
  }

  for (let q = 0; q < TIMELINE_QUARTERS; q++) {
    const absoluteMonth = TIMELINE_START.month + q * 3;
    const year = TIMELINE_START.year + Math.floor(absoluteMonth / 12);
    const quarterNumber = Math.floor((absoluteMonth % 12) / 3) + 1;
    quarters.push({
      label: `Q${quarterNumber} '${String(year % 100).padStart(2, "0")}`,
      startIndex: q * 3,
      span: 3,
    });
  }

  return { months, quarters, totalMonths };
}

// Human-readable "MMM YYYY" label for a month index relative to the start.
export function formatMonthLabel(index: number): string {
  const absolute = TIMELINE_START.month + index;
  const year = TIMELINE_START.year + Math.floor(absolute / 12);
  const monthOfYear = ((absolute % 12) + 12) % 12;
  return `${MONTH_ABBR[monthOfYear]} ${year}`;
}

// Fractional month offset of a date relative to the timeline start. Used to
// position the "today" marker. Returns null when the date is out of range.
export function monthOffsetOf(date: Date, totalMonths: number): number | null {
  const startAbsolute = TIMELINE_START.year * 12 + TIMELINE_START.month;
  const dateAbsolute = date.getFullYear() * 12 + date.getMonth();
  const daysInMonth = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
  ).getDate();
  const offset = dateAbsolute - startAbsolute + (date.getDate() - 1) / daysInMonth;

  if (offset < 0 || offset > totalMonths) {
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
export function packLanes(epics: RoadmapEpic[]): LaneLayout {
  const ordered = [...epics].sort((a, b) => a.startMonth - b.startMonth);
  const laneEnds: number[] = [];
  const laneOf = new Map<string, number>();

  for (const epic of ordered) {
    let placed = false;
    for (let lane = 0; lane < laneEnds.length; lane++) {
      if (epic.startMonth > laneEnds[lane]) {
        laneEnds[lane] = epic.endMonth;
        laneOf.set(epic.id, lane);
        placed = true;
        break;
      }
    }
    if (!placed) {
      laneEnds.push(epic.endMonth);
      laneOf.set(epic.id, laneEnds.length - 1);
    }
  }

  return { laneOf, laneCount: laneEnds.length };
}
