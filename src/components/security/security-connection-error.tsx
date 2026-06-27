import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export function SecurityConnectionError({ detail }: { detail: string }) {
  return (
    <div className="space-y-4">
      <div className="bg-white/50 backdrop-blur-sm border border-red-500/20 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="h-6 w-6 shrink-0 text-red-600" />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              No pudimos conectarnos con la base de datos.
            </p>
            <p className="text-sm text-foreground/55 leading-relaxed">
              No se pudo cargar el estado de los hallazgos de seguridad.
              Intentá recargar la página.
            </p>
            <p className="rounded-lg border border-foreground/10 bg-foreground/5 px-3 py-2 font-mono text-xs text-foreground/60 break-words">
              {detail}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
