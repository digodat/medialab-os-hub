"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";

// Inline, clickable "OSS" term that opens a popup explaining what OSS is.
// Drop it anywhere OSS is mentioned in the landing copy.
export function OssTerm() {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="align-baseline font-bold text-brand underline underline-offset-2 transition-opacity hover:opacity-80"
      >
        OSS
      </button>

      {open
        ? createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Cerrar"
            className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="relative z-10 w-full max-w-lg rounded-2xl border border-foreground/10 bg-white p-6 text-left shadow-xl shadow-foreground/10"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2
                id={titleId}
                className="font-heading text-xl font-semibold tracking-tight text-foreground"
              >
                ¿Qué es OSS?
              </h2>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-foreground/40 transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div
              id={descriptionId}
              className="space-y-3 text-sm leading-relaxed text-foreground/70"
            >
              <p>
                OSS es el sistema de planificación de medios de Falabella. Es
                donde se definen y aprueban las estrategias de cada campaña
                —presupuestos, objetivos, segmentación y calendario— antes de
                que se ejecuten.
              </p>
              <p>
                MediaLab OS toma esas estrategias ya aprobadas en OSS y se
                encarga de desplegarlas en Google Ads, Meta, TikTok y DV 360, en
                los tres mercados, sin reconfigurar cada campaña a mano.
              </p>
            </div>
          </div>
        </div>,
            document.body,
          )
        : null}
    </>
  );
}
