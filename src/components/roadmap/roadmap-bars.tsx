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
  detail: string;
  dependencies: string[];
};

const RoadmapSelectContext = createContext<(bar: RoadmapBarItem) => void>(
  () => {},
);

// Wraps the whole chart so the dialog renders as a sibling of the box (kept
// sharp), while the box itself is blurred via CSS when a task is selected,
// matching the focus effect used in the architecture diagram.
export function RoadmapInteractive({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<RoadmapBarItem | null>(null);
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

  return (
    <RoadmapSelectContext.Provider value={setSelected}>
      <div
        ref={scopeRef}
        className="roadmap-scope flex h-full flex-col gap-4"
        data-dialog-open={selected ? "true" : undefined}
      >
        {children}
      </div>
      <RoadmapTaskDialog bar={selected} onClose={() => setSelected(null)} />
    </RoadmapSelectContext.Provider>
  );
}

export function RoadmapBars({ bars }: { bars: RoadmapBarItem[] }) {
  const select = useContext(RoadmapSelectContext);

  return (
    <>
      {bars.map((bar) => {
        const styles = STATUS_STYLES[bar.status];
        return (
          <button
            key={bar.id}
            type="button"
            onClick={() => select(bar)}
            className={cn(
              "absolute z-10 flex items-center gap-2 overflow-hidden rounded-md border px-2.5 text-left shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand",
              styles.bar,
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
          </button>
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
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
                styles.bar,
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
              {styles.label}
            </span>
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

        <p className="mt-4 border-t border-foreground/10 pt-4 text-sm leading-relaxed text-foreground/70">
          {bar.detail}
        </p>
      </div>
    </div>
  );
}
