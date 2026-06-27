"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

type SuccessCheckProps = {
  className?: string;
  // Bring your own icon (size and color). Defaults to a checkmark using
  // currentColor, so set text color and font-size via className/parent.
  children?: ReactNode;
};

// Animated success indicator (fade + rotate + blur + Y-bob, plus an SVG
// stroke-draw). Driven by the .t-success-check styles in globals.css. Measures
// each path length at mount so the draw animation works for any icon, then
// flips data-state to "in" to play the appear transition once.
export function SuccessCheck({ className, children }: SuccessCheckProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [state, setState] = useState<"out" | "in">("out");

  useEffect(() => {
    const paths = ref.current?.querySelectorAll("path");

    paths?.forEach((path) => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = String(length);
      path.style.strokeDashoffset = String(length);
    });

    const frame = requestAnimationFrame(() => setState("in"));

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <span
      ref={ref}
      className={`t-success-check ${className ?? ""}`}
      data-state={state}
      aria-hidden="true"
    >
      {children ?? (
        <svg
          viewBox="0 0 52 52"
          width="1em"
          height="1em"
          fill="none"
          stroke="currentColor"
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 27l8 8 16-18" />
        </svg>
      )}
    </span>
  );
}
