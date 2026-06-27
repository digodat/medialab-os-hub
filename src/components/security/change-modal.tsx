"use client";

import { useEffect, useId, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

import { SuccessCheck } from "@/components/ui/success-check";
import type { TaskStatus } from "@/lib/security/security-status";
import { getTodayDateInputValue } from "@/lib/security/security-status";

type ChangeModalProps = {
  open: boolean;
  title: string;
  description: string;
  statusLabel: TaskStatus;
  initialDate?: string;
  isSubmitting: boolean;
  showSuccess: boolean;
  successMessage?: string;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (payload: { date: string; reason: string }) => void;
};

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(
    (element) =>
      element.offsetParent !== null || element.getClientRects().length > 0,
  );
}

export function ChangeModal({
  open,
  title,
  description,
  statusLabel,
  initialDate,
  isSubmitting,
  showSuccess,
  successMessage = "Cambio guardado",
  errorMessage,
  onClose,
  onSubmit,
}: ChangeModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [date, setDate] = useState(getTodayDateInputValue());
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setDate(initialDate ?? getTodayDateInputValue());
    setReason("");
  }, [initialDate, open]);

  useEffect(() => {
    if (!open) {
      const previous = previousFocusRef.current;
      if (
        previous &&
        typeof previous.focus === "function" &&
        document.contains(previous)
      ) {
        previous.focus();
      }
      previousFocusRef.current = null;
      return;
    }

    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const frame = requestAnimationFrame(() => {
      if (showSuccess) {
        successRef.current?.focus();
        return;
      }

      dateInputRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [open, showSuccess]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }

      const focusable = getFocusableElements(dialog);
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last || !dialog.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isSubmitting, onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Cerrar"
        className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]"
        onClick={() => {
          if (!isSubmitting) {
            onClose();
          }
        }}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 w-full max-w-lg rounded-2xl border border-foreground/10 bg-white p-6 shadow-xl shadow-foreground/10"
      >
        {showSuccess ? (
          <div
            ref={successRef}
            tabIndex={-1}
            className="flex flex-col items-center justify-center gap-4 py-8 text-center outline-none"
          >
            <SuccessCheck className="text-[64px] text-emerald-600" />
            <p className="text-base font-semibold text-foreground">
              {successMessage}
            </p>
          </div>
        ) : (
          <>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2
              id={titleId}
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              {title}
            </h2>
            <p
              id={descriptionId}
              className="mt-1 text-sm text-foreground/55 leading-relaxed"
            >
              {description}
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            disabled={isSubmitting}
            onClick={onClose}
            className="rounded-full p-1.5 text-foreground/40 transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-50"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/45">
              Estado
            </p>
            <p className="inline-flex rounded-full bg-foreground/5 px-3 py-1 text-sm font-semibold text-foreground">
              {statusLabel}
            </p>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/45">
              Fecha
            </span>
            <input
              ref={dateInputRef}
              type="date"
              value={date}
              disabled={isSubmitting}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-xl border border-foreground/10 bg-white px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-brand disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/45">
              Motivo del cambio
            </span>
            <textarea
              value={reason}
              disabled={isSubmitting}
              rows={4}
              placeholder="Describí por qué se actualiza este estado..."
              onChange={(event) => setReason(event.target.value)}
              className="w-full resize-y rounded-xl border border-foreground/10 bg-white px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/35 outline-none transition-colors focus:border-brand disabled:opacity-60"
            />
          </label>

          {errorMessage ? (
            <p className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-600">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="rounded-full border border-foreground/10 px-4 py-2 text-sm font-semibold text-foreground/70 transition-colors hover:bg-foreground/5 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onSubmit({ date, reason })}
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? "Guardando..." : "Guardar cambio"}
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
