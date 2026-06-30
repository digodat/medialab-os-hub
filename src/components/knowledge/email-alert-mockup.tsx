import { ArrowRightIcon } from "@heroicons/react/24/outline";

// Static visual mockup of how an inactivity alert would look as an email.
// Not connected to any data source.
const FACTS = [
  { label: "Campaña", value: "CL_BlackFriday_Search_Conversiones" },
  { label: "Plataforma", value: "Google Ads" },
  { label: "Mercado", value: "Chile" },
  { label: "Detección", value: "Sin entregas hace 26 h" },
];

export function EmailAlertMockup() {
  return (
    <div className="overflow-hidden rounded-xl border border-foreground/10 bg-white shadow-sm">
      {/* Window chrome to read as an email client */}
      <div className="flex items-center gap-1.5 border-b border-foreground/10 bg-foreground/[0.03] px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-amber-400" />
        <span className="h-3 w-3 rounded-full bg-emerald-400" />
        <span className="ml-3 text-xs text-foreground/40">Bandeja de entrada</span>
      </div>

      <div className="p-5">
        {/* Sender row */}
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
            M
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">
              MediaLab OS
              <span className="ml-1.5 font-normal text-foreground/40">
                alertas@medialab-os.cl
              </span>
            </p>
            <p className="truncate text-xs leading-tight text-foreground/45">
              Para: equipo-medios@falabella.com
            </p>
          </div>
          <span className="ml-auto shrink-0 text-xs text-foreground/40">
            10:42
          </span>
        </div>

        {/* Subject */}
        <h4 className="mt-4 text-base font-semibold tracking-tight text-foreground">
          [Alerta · Alta] Inactividad detectada — Google Ads / Chile
        </h4>

        {/* Body */}
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground/70">
          <p>Hola equipo,</p>
          <p>
            Una campaña activa dejó de registrar entregas en las últimas horas.
            Te recomendamos revisar su estado para descartar un problema de
            configuración, agotamiento de presupuesto o pausa involuntaria.
          </p>
        </div>

        {/* Details */}
        <dl className="mt-4 overflow-hidden rounded-lg border border-foreground/10">
          {FACTS.map((fact, index) => (
            <div
              key={fact.label}
              className={`flex items-start justify-between gap-4 px-4 py-2.5 ${
                index % 2 === 0 ? "bg-foreground/[0.02]" : ""
              }`}
            >
              <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-foreground/40">
                {fact.label}
              </dt>
              <dd className="text-right text-sm font-medium text-foreground/80">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* CTA */}
        <div className="mt-5">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white">
            Revisar en el hub
            <ArrowRightIcon className="h-4 w-4" />
          </span>
        </div>

        {/* Footer */}
        <p className="mt-5 border-t border-foreground/10 pt-4 text-xs leading-relaxed text-foreground/40">
          Este es un mensaje automático de monitoreo de MediaLab OS. No
          respondas a este correo.
        </p>
      </div>
    </div>
  );
}
