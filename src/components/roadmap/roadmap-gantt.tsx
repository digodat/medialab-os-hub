import {
  RoadmapBars,
  RoadmapConnectors,
  RoadmapInteractive,
  type RoadmapArrowhead,
  type RoadmapBarItem,
  type RoadmapConnector,
} from "@/components/roadmap/roadmap-bars";
import { cn } from "@/lib/utils";
import {
  BAR_H,
  buildTimeline,
  formatWeekLabel,
  weekOffsetOf,
  packLanes,
  ROADMAP_EPICS,
  ROADMAP_GROUPS,
  STATUS_STYLES,
  WEEKS_PER_MONTH,
  type RoadmapEpic,
  type RoadmapStatus,
} from "@/lib/roadmap/roadmap-data";

// Vertical layout constants in px. Horizontal positioning uses percentages so
// the chart stretches to fill its container width, while MONTH_MIN_W gives the
// timeline a minimum width so it can overflow (and be scrolled) inside the box.
// Dependency connectors are computed deterministically server-side: the path is
// drawn in a scalable SVG (viewBox month-units on X, px on Y) and the arrowhead
// is a separate CSS triangle so it never distorts under non-uniform scaling.
const HEADER_H = 56;
const ROW_H = 40;
const GROUP_PAD = 14;
const SIDEBAR_W = 212;
const WEEK_MIN_W = 136;
// Horizontal control-handle length for dependency curves, in week units.
const CURVE = 1.2;

type PositionedEpic = {
  epic: RoadmapEpic;
  leftPct: number;
  widthPct: number;
  top: number;
};

type PositionedGroup = {
  id: string;
  name: string;
  height: number;
  epics: PositionedEpic[];
};

type EpicAnchor = { startWeek: number; endWeek: number; centerY: number };

function buildLayout(totalWeeks: number) {
  const pct = (weeks: number) => (weeks / totalWeeks) * 100;
  const groups: PositionedGroup[] = [];
  const byId = new Map<string, EpicAnchor>();
  let cursorY = 0;

  for (const group of ROADMAP_GROUPS) {
    const groupEpics = ROADMAP_EPICS.filter((epic) => epic.group === group.id);
    const { laneOf, laneCount } = packLanes(groupEpics);
    const height = GROUP_PAD * 2 + Math.max(laneCount, 1) * ROW_H;

    const positioned: PositionedEpic[] = groupEpics.map((epic) => {
      const lane = laneOf.get(epic.id) ?? 0;
      const centerY = cursorY + GROUP_PAD + lane * ROW_H + ROW_H / 2;
      byId.set(epic.id, {
        startWeek: epic.startWeek,
        endWeek: epic.endWeek,
        centerY,
      });
      return {
        epic,
        leftPct: pct(epic.startWeek),
        widthPct: pct(epic.endWeek - epic.startWeek + 1),
        top: centerY - BAR_H / 2,
      };
    });

    groups.push({ id: group.id, name: group.name, height, epics: positioned });
    cursorY += height;
  }

  return { groups, byId, totalHeight: cursorY };
}

export function RoadmapGantt() {
  const timeline = buildTimeline();
  const { totalWeeks } = timeline;
  const pct = (weeks: number) => (weeks / totalWeeks) * 100;
  const { groups, byId, totalHeight } = buildLayout(totalWeeks);

  const todayOffset = weekOffsetOf(new Date(), totalWeeks);
  const minGridWidth = SIDEBAR_W + totalWeeks * WEEK_MIN_W;

  // Dependency connectors: source must finish before target starts. The path
  // uses week-units on X and px on Y; the arrowhead is positioned separately.
  const connectors: RoadmapConnector[] = [];
  const arrowheads: RoadmapArrowhead[] = [];
  for (const target of ROADMAP_EPICS) {
    if (!target.dependsOn) continue;
    const to = byId.get(target.id);
    if (!to) continue;
    for (const sourceId of target.dependsOn) {
      const from = byId.get(sourceId);
      if (!from) continue;
      const sx = from.endWeek + 1;
      const sy = from.centerY;
      const tx = to.startWeek;
      const ty = to.centerY;
      connectors.push({
        id: `${sourceId}->${target.id}`,
        d: `M ${sx} ${sy} C ${sx + CURVE} ${sy}, ${tx - CURVE} ${ty}, ${tx} ${ty}`,
        from: sourceId,
        to: target.id,
      });
      arrowheads.push({
        id: `${sourceId}->${target.id}`,
        from: sourceId,
        to: target.id,
        leftPct: pct(tx),
        top: ty,
      });
    }
  }

  // Adjacency map for hover highlighting: each epic maps to the epics it is
  // linked to via dependency arrows, in both directions.
  const relatedById: Record<string, string[]> = {};
  for (const connector of connectors) {
    (relatedById[connector.from] ??= []).push(connector.to);
    (relatedById[connector.to] ??= []).push(connector.from);
  }

  // Flatten bars with their popup detail for the interactive (client) layer.
  const epicTitleById = new Map(
    ROADMAP_EPICS.map((epic) => [epic.id, epic.title]),
  );
  const barItems: RoadmapBarItem[] = groups.flatMap((group) =>
    group.epics.map(({ epic, leftPct, widthPct, top }) => ({
      id: epic.id,
      title: epic.title,
      status: epic.status,
      leftPct,
      widthPct,
      top,
      groupName: group.name,
      rangeLabel: `${formatWeekLabel(epic.startWeek)} – ${formatWeekLabel(epic.endWeek)}`,
      detail: epic.detail,
      dependencies: (epic.dependsOn ?? []).map(
        (id) => epicTitleById.get(id) ?? id,
      ),
      owner: epic.owner,
    })),
  );

  return (
    <RoadmapInteractive relations={relatedById}>
      <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 text-xs text-foreground/60">
        <span className="text-foreground/45">Estado:</span>
        {(Object.keys(STATUS_STYLES) as RoadmapStatus[]).map((status) => (
          <span key={status} className="inline-flex items-center gap-2">
            <span
              className={cn("h-2 w-2 rounded-full", STATUS_STYLES[status].dot)}
            />
            {STATUS_STYLES[status].label}
          </span>
        ))}
        <span className="inline-flex items-center gap-2">
          <svg width="22" height="8" aria-hidden="true">
            <line
              x1="0"
              y1="4"
              x2="18"
              y2="4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              className="text-foreground/35"
            />
          </svg>
          Dependencia
        </span>
      </div>

      {/* The box is a fixed window: scrolling moves the chart inside it. The
          header row and sidebar column stay pinned via position: sticky. */}
      <div className="roadmap-box min-h-0 flex-1 overflow-hidden rounded-2xl border border-foreground/10 bg-white/45 backdrop-blur-sm">
        <div className="h-full w-full overflow-auto" data-roadmap-scroll>
          <div
            className="grid"
            style={{
              gridTemplateColumns: `${SIDEBAR_W}px minmax(0, 1fr)`,
              gridTemplateRows: `${HEADER_H}px ${totalHeight}px`,
              minWidth: minGridWidth,
            }}
          >
            {/* Corner */}
            <div className="sticky top-0 left-0 z-40 flex items-end border-r border-b border-foreground/10 bg-white/85 px-5 pb-3 text-xs font-semibold uppercase tracking-wide text-foreground/40 backdrop-blur-sm">
              Iniciativas
            </div>

            {/* Axis header: months over weeks */}
            <div className="sticky top-0 z-30 border-b border-foreground/10 bg-white/85 backdrop-blur-sm">
              <div className="flex" style={{ height: HEADER_H / 2 }}>
                {timeline.months.map((month) => (
                  <div
                    key={month.label}
                    className="flex items-center border-l border-foreground/10 px-3 text-xs font-semibold text-foreground/70 first:border-l-0"
                    style={{ width: `${pct(month.span)}%` }}
                  >
                    {month.label}
                  </div>
                ))}
              </div>
              <div className="flex" style={{ height: HEADER_H / 2 }}>
                {timeline.weeks.map((week) => (
                  <div
                    key={week.index}
                    className={cn(
                      "flex items-center justify-center text-[10px] text-foreground/40",
                      week.index % WEEKS_PER_MONTH === 0 &&
                        "border-l border-foreground/10",
                      week.index === 0 && "border-l-0",
                    )}
                    style={{ width: `${pct(1)}%` }}
                  >
                    {week.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar: swimlane names, aligned with the timeline bands */}
            <div className="sticky left-0 z-20 border-r border-foreground/10 bg-white/85 backdrop-blur-sm">
              {groups.map((group, index) => (
                <div
                  key={group.id}
                  className={cn(
                    "flex flex-col justify-center px-5",
                    index > 0 && "border-t border-foreground/10",
                  )}
                  style={{ height: group.height }}
                >
                  <span className="text-sm font-semibold text-foreground">
                    {group.name}
                  </span>
                  <span className="text-xs text-foreground/45">
                    {group.epics.length} épicas
                  </span>
                </div>
              ))}
            </div>

            {/* Body: gridlines, bands, today marker, connectors and bars */}
            <div className="relative">
              {/* Week gridlines (light) */}
              {timeline.weeks.map((week) =>
                week.index === 0 ? null : (
                  <div
                    key={`wgrid-${week.index}`}
                    className="absolute top-0 bottom-0 z-0 border-l border-foreground/[0.04]"
                    style={{ left: `${pct(week.index)}%` }}
                  />
                ),
              )}

              {/* Month gridlines (stronger) */}
              {timeline.months.map((month) =>
                month.startIndex === 0 ? null : (
                  <div
                    key={`mgrid-${month.label}`}
                    className="absolute top-0 bottom-0 z-0 border-l border-foreground/[0.09]"
                    style={{ left: `${pct(month.startIndex)}%` }}
                  />
                ),
              )}

              {/* Group band separators */}
              {groups.reduce<{ top: number; nodes: React.ReactNode[] }>(
                (acc, group, index) => {
                  if (index > 0) {
                    acc.nodes.push(
                      <div
                        key={`band-${group.id}`}
                        className="absolute right-0 left-0 z-0 border-t border-foreground/10"
                        style={{ top: acc.top }}
                      />,
                    );
                  }
                  acc.top += group.height;
                  return acc;
                },
                { top: 0, nodes: [] },
              ).nodes}

              {/* Today marker */}
              {todayOffset !== null && (
                <div
                  data-roadmap-today
                  className="absolute top-0 bottom-0 z-0 w-px bg-brand/60"
                  style={{ left: `${(todayOffset / totalWeeks) * 100}%` }}
                >
                  <span className="absolute -top-px left-1/2 -translate-x-1/2 rounded bg-brand px-1.5 py-0.5 text-[10px] font-medium text-white">
                    Hoy
                  </span>
                </div>
              )}

              {/* Dependency connectors + arrowheads (hover-aware client layer) */}
              <RoadmapConnectors
                connectors={connectors}
                arrowheads={arrowheads}
                totalWeeks={totalWeeks}
                totalHeight={totalHeight}
              />

              {/* Epic bars (interactive: click opens a detail popup) */}
              <RoadmapBars bars={barItems} />
            </div>
          </div>
        </div>
      </div>
    </RoadmapInteractive>
  );
}
