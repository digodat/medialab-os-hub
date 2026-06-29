"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

import { cn } from "@/lib/utils";
import {
  BAR_H,
  STATUS_STYLES,
  type RoadmapStatus,
} from "@/lib/roadmap/roadmap-data";

export type RoadmapBarItem = {
  id: string;
  title: string;
  status: RoadmapStatus;
  leftPct: number;
  widthPct: number;
  top: number;
  groupName: string;
  rangeLabel: string;
  detail: string[];
  dependencies: string[];
  owner?: string;
};

const RoadmapSelectContext = createContext<(bar: RoadmapBarItem) => void>(
  () => {},
);

type HoverState = {
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
};

const RoadmapHoverContext = createContext<HoverState>({
  hoveredId: null,
  setHoveredId: () => {},
});

function useRoadmapHover(): HoverState {
  return useContext(RoadmapHoverContext);
}

// Adjacency map (epic id -> ids it is connected to via dependency arrows, in
// either direction). Used to highlight tasks linked to the hovered one.
const RoadmapRelationsContext = createContext<Record<string, string[]>>({});

function useRoadmapRelations(): Record<string, string[]> {
  return useContext(RoadmapRelationsContext);
}

// Connector (dependency curve) and arrowhead data, tagged with the source/target
// epic ids so the hover layer can tell which ones belong to the hovered task.
export type RoadmapConnector = {
  id: string;
  d: string;
  from: string;
  to: string;
};

export type RoadmapArrowhead = {
  id: string;
  from: string;
  to: string;
  leftPct: number;
  top: number;
};

// Wraps the whole chart so the dialog renders as a sibling of the box (kept
// sharp), while the box itself is blurred via CSS when a task is selected,
// matching the focus effect used in the architecture diagram.
export function RoadmapInteractive({
  children,
  relations = {},
}: {
  children: ReactNode;
  relations?: Record<string, string[]>;
}) {
  const [selected, setSelected] = useState<RoadmapBarItem | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const scopeRef = useRef<HTMLDivElement>(null);

  // Forward horizontal wheel gestures made anywhere on the page to the gantt's
  // scroll container, so the chart pans even when the pointer is outside its box.
  useEffect(() => {
    function onWheel(event: WheelEvent) {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) {
        return;
      }
      const scroller = scopeRef.current?.querySelector<HTMLElement>(
        "[data-roadmap-scroll]",
      );
      if (!scroller) {
        return;
      }
      // Let the box handle the gesture natively when the pointer is over it.
      if (event.target instanceof Node && scroller.contains(event.target)) {
        return;
      }
      scroller.scrollLeft += event.deltaX;
      event.preventDefault();
    }

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  // On mount, scroll the chart so the "today" marker sits in the middle of the
  // visible area instead of starting pinned to the left edge.
  useEffect(() => {
    const scroller = scopeRef.current?.querySelector<HTMLElement>(
      "[data-roadmap-scroll]",
    );
    const today = scroller?.querySelector<HTMLElement>("[data-roadmap-today]");
    if (!scroller || !today) {
      return;
    }
    const scrollerRect = scroller.getBoundingClientRect();
    const todayRect = today.getBoundingClientRect();
    const todayCenter =
      todayRect.left - scrollerRect.left + scroller.scrollLeft + todayRect.width / 2;
    scroller.scrollLeft = todayCenter - scroller.clientWidth / 2;
  }, []);

  return (
    <RoadmapSelectContext.Provider value={setSelected}>
      <RoadmapRelationsContext.Provider value={relations}>
        <RoadmapHoverContext.Provider value={{ hoveredId, setHoveredId }}>
          <div
            ref={scopeRef}
            className="roadmap-scope flex h-full flex-col gap-4"
            data-dialog-open={selected ? "true" : undefined}
          >
            {children}
          </div>
        </RoadmapHoverContext.Provider>
      </RoadmapRelationsContext.Provider>
      <RoadmapTaskDialog bar={selected} onClose={() => setSelected(null)} />
    </RoadmapSelectContext.Provider>
  );
}

export function RoadmapBars({ bars }: { bars: RoadmapBarItem[] }) {
  const select = useContext(RoadmapSelectContext);
  const { hoveredId, setHoveredId } = useRoadmapHover();
  const relations = useRoadmapRelations();

  // Tasks linked to the hovered one (via dependency arrows) stay highlighted
  // alongside it; everything else dims.
  const relatedIds =
    hoveredId !== null
      ? new Set([hoveredId, ...(relations[hoveredId] ?? [])])
      : null;

  return (
    <>
      {bars.map((bar) => {
        const styles = STATUS_STYLES[bar.status];
        const isHovered = hoveredId === bar.id;
        const isLinked = relatedIds !== null && relatedIds.has(bar.id) && !isHovered;
        const isDimmed = relatedIds !== null && !relatedIds.has(bar.id);
        return (
          <button
            key={bar.id}
            type="button"
            onClick={() => select(bar)}
            onMouseEnter={() => setHoveredId(bar.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={cn(
              "absolute z-10 flex items-center gap-2 overflow-hidden rounded-md border px-2.5 text-left shadow-sm transition-all duration-150 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand",
              styles.bar,
              isHovered && "z-30 shadow-md ring-2 ring-brand/45",
              isLinked && "z-20 shadow-md ring-2 ring-brand/30",
              isDimmed && "opacity-40",
            )}
            style={{
              left: `calc(${bar.leftPct}% + 3px)`,
              top: bar.top,
              width: `calc(${bar.widthPct}% - 6px)`,
              height: BAR_H,
            }}
            title={`${bar.title} · ${styles.label}`}
          >
            <span
              className={cn("h-2 w-2 shrink-0 rounded-full", styles.dot)}
            />
            <span className="truncate text-xs font-medium">{bar.title}</span>
            {bar.owner ? (
              <span
                className="ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white"
                title={`Owner: ${bar.owner}`}
              >
                {bar.owner.charAt(0).toUpperCase()}
              </span>
            ) : null}
          </button>
        );
      })}
    </>
  );
}

// Dependency layer (curves + arrowheads). Lives in the client so it can react
// to the shared hover state: connectors touching the hovered task are
// emphasized (brand color, thicker) while the rest are dimmed.
export function RoadmapConnectors({
  connectors,
  arrowheads,
  totalWeeks,
  totalHeight,
}: {
  connectors: RoadmapConnector[];
  arrowheads: RoadmapArrowhead[];
  totalWeeks: number;
  totalHeight: number;
}) {
  const { hoveredId } = useRoadmapHover();
  const isActive = (from: string, to: string) =>
    hoveredId === from || hoveredId === to;

  return (
    <>
      <svg
        className="pointer-events-none absolute inset-0 z-0 text-foreground/35"
        width="100%"
        height={totalHeight}
        viewBox={`0 0 ${totalWeeks} ${totalHeight}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {connectors.map((connector) => {
          const active = isActive(connector.from, connector.to);
          const dimmed = hoveredId !== null && !active;
          return (
            <path
              key={connector.id}
              d={connector.d}
              fill="none"
              stroke="currentColor"
              strokeWidth={active ? 2.5 : 1.5}
              strokeDasharray="4 3"
              vectorEffect="non-scaling-stroke"
              className={cn(
                "transition-[stroke-width] duration-150",
                active && "text-brand",
                dimmed && "opacity-20",
              )}
            />
          );
        })}
      </svg>

      {arrowheads.map((head) => {
        const active = isActive(head.from, head.to);
        const dimmed = hoveredId !== null && !active;
        return (
          <div
            key={head.id}
            className={cn(
              "absolute z-0 transition-opacity duration-150",
              dimmed && "opacity-20",
            )}
            style={{
              left: `${head.leftPct}%`,
              top: head.top,
              transform: "translate(-100%, -50%)",
            }}
          >
            <div
              className={cn(
                "h-0 w-0 border-y-[4px] border-l-[6px] border-y-transparent",
                active ? "border-l-brand" : "border-l-foreground/35",
              )}
            />
          </div>
        );
      })}
    </>
  );
}

function RoadmapTaskDialog({
  bar,
  onClose,
}: {
  bar: RoadmapBarItem | null;
  onClose: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bar) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const frame = requestAnimationFrame(() => dialogRef.current?.focus());

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      cancelAnimationFrame(frame);
    };
  }, [bar, onClose]);

  if (!bar) {
    return null;
  }

  const styles = STATUS_STYLES[bar.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Cerrar"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative z-10 w-full max-w-lg rounded-2xl border border-foreground/10 bg-white p-6 shadow-xl shadow-foreground/10 outline-none"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h2
              id={titleId}
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              {bar.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
                  styles.bar,
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
                {styles.label}
              </span>
              {bar.owner ? (
                <span className="inline-flex items-center rounded-full border border-foreground/15 bg-foreground/5 px-2 py-0.5 text-xs font-medium text-foreground/70">
                  Owner: {bar.owner}
                </span>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="rounded-full p-1.5 text-foreground/40 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <dl className="space-y-3 text-sm">
          <div className="flex gap-3">
            <dt className="w-24 shrink-0 text-foreground/45">Área</dt>
            <dd className="text-foreground">{bar.groupName}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-24 shrink-0 text-foreground/45">Período</dt>
            <dd className="text-foreground">{bar.rangeLabel}</dd>
          </div>
          {bar.dependencies.length > 0 ? (
            <div className="flex gap-3">
              <dt className="w-24 shrink-0 text-foreground/45">Depende de</dt>
              <dd className="text-foreground">
                {bar.dependencies.join(", ")}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-4 border-t border-foreground/10 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/45">
            Subtareas
          </p>
          <ul className="space-y-2 text-sm leading-relaxed text-foreground/70">
            {bar.detail.map((item, index) => (
              <li key={index} className="flex gap-2.5">
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
