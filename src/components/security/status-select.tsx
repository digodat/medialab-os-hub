"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

import type { TaskStatus } from "@/lib/security/security-status";

// Status colors are intentionally different from the severity badge palette
// (which uses red/orange/amber/emerald).
export const STATUS_OPTIONS: {
  value: TaskStatus;
  text: string;
  bg: string;
  dot: string;
}[] = [
  {
    value: "Finalizada",
    text: "text-teal-700",
    bg: "bg-teal-500/10",
    dot: "bg-teal-500",
  },
  {
    value: "En proceso",
    text: "text-blue-600",
    bg: "bg-blue-500/10",
    dot: "bg-blue-500",
  },
  {
    value: "Despriorizada",
    text: "text-pink-600",
    bg: "bg-pink-500/10",
    dot: "bg-pink-500",
  },
  {
    value: "No Aplica",
    text: "text-slate-500",
    bg: "bg-slate-500/10",
    dot: "bg-slate-400",
  },
  {
    value: "No comenzada",
    text: "text-zinc-500",
    bg: "bg-zinc-400/10",
    dot: "bg-zinc-400",
  },
];

export function StatusSelect({
  value,
  disabled = false,
  onChangeRequest,
}: {
  value: TaskStatus;
  disabled?: boolean;
  onChangeRequest: (next: TaskStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const current =
    STATUS_OPTIONS.find((option) => option.value === value) ?? STATUS_OPTIONS[4];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors disabled:opacity-50 ${current.bg} ${current.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dot}`} />
        {current.value}
        <ChevronDownIcon
          className={`h-3 w-3 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-foreground/10 bg-white p-1 shadow-lg shadow-foreground/10">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setOpen(false);
                if (option.value !== value) {
                  onChangeRequest(option.value);
                }
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12px] font-semibold transition-colors hover:bg-foreground/5 ${
                option.value === value ? option.text : "text-foreground/70"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${option.dot}`} />
              {option.value}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
