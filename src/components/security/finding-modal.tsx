"use client";

import { useEffect, useId, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

import { SuccessCheck } from "@/components/ui/success-check";
import {
  type CategoryKey,
  SECURITY_CATEGORIES,
  SEVERITY_VALUES,
} from "@/lib/security/security-catalog";
import type { Severity } from "@/lib/security/security-status";

export type FindingFormValues = {
  code: string;
  severity: Severity;
  category: CategoryKey;
  title: string;
  detail: string;
};

type FindingModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: FindingFormValues;
  isSubmitting: boolean;
  showSuccess: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (values: FindingFormValues) => void;
};

const EMPTY_VALUES: FindingFormValues = {
  code: "",
  severity: "MEDIO",
  category: "platform",
  title: "",
  detail: "",
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

export function FindingModal({
  open,
  mode,
  initialValues,
  isSubmitting,
  showSuccess,
  errorMessage,
  onClose,
  onSubmit,
}: FindingModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [values, setValues] = useState<FindingFormValues>(EMPTY_VALUES);

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(initialValues ?? EMPTY_VALUES);
  }, [initialValues, open]);

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

      firstFieldRef.current?.focus();
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

  const fieldClass =
    "w-full rounded-xl border border-foreground/10 bg-white px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/35 outline-none transition-colors focus:border-brand disabled:opacity-60";
  const labelClass =
    "mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/45";

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
              {mode === "create" ? "Hallazgo creado" : "Hallazgo actualizado"}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-start justify-between gap-4">
              <h2
                id={titleId}
                className="text-lg font-semibold tracking-tight text-foreground"
              >
                {mode === "create" ? "Nuevo hallazgo" : "Editar hallazgo"}
              </h2>
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
              <div className="flex gap-3">
                <label className="block w-28 shrink-0">
                  <span className={labelClass}>Código</span>
                  <input
                    ref={firstFieldRef}
                    type="text"
                    value={values.code}
                    disabled={isSubmitting}
                    placeholder="C1"
                    onChange={(event) =>
                      setValues((prev) => ({ ...prev, code: event.target.value }))
                    }
                    className={fieldClass}
                  />
                </label>
                <label className="block flex-1">
                  <span className={labelClass}>Severidad</span>
                  <select
                    value={values.severity}
                    disabled={isSubmitting}
                    onChange={(event) =>
                      setValues((prev) => ({
                        ...prev,
                        severity: event.target.value as Severity,
                      }))
                    }
                    className={fieldClass}
                  >
                    {SEVERITY_VALUES.map((severity) => (
                      <option key={severity} value={severity}>
                        {severity}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className={labelClass}>Categoría</span>
                <select
                  value={values.category}
                  disabled={isSubmitting}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      category: event.target.value as CategoryKey,
                    }))
                  }
                  className={fieldClass}
                >
                  {SECURITY_CATEGORIES.map((category) => (
                    <option key={category.key} value={category.key}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className={labelClass}>Título</span>
                <input
                  type="text"
                  value={values.title}
                  disabled={isSubmitting}
                  placeholder="Resumen breve del hallazgo"
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, title: event.target.value }))
                  }
                  className={fieldClass}
                />
              </label>

              <label className="block">
                <span className={labelClass}>Detalle</span>
                <textarea
                  value={values.detail}
                  disabled={isSubmitting}
                  rows={4}
                  placeholder="Descripción del hallazgo y la remediación sugerida..."
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, detail: event.target.value }))
                  }
                  className={`${fieldClass} resize-y`}
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
                onClick={() => onSubmit(values)}
                className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting
                  ? "Guardando..."
                  : mode === "create"
                    ? "Crear hallazgo"
                    : "Guardar cambios"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
