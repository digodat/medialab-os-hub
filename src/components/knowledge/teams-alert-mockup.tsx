import { ExclamationCircleIcon } from "@heroicons/react/24/solid";

// Static visual mockup of how an inactivity alert would look as a Teams
// "important" chat message. Not connected to any data source.
const FACTS = [
  { label: "Campaña", value: "CL_BlackFriday_Search_Conversiones" },
  { label: "Plataforma", value: "Google Ads" },
  { label: "Mercado", value: "Chile" },
  { label: "Detección", value: "Sin entregas hace 26 h" },
];

export function TeamsAlertMockup() {
  return (
    <div className="rounded-xl border border-foreground/10 bg-white p-5 shadow-sm">
      {/* Chat message row */}
      <div className="flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6264A7] text-sm font-semibold text-white">
          M
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p className="text-sm font-semibold text-foreground">MediaLab OS</p>
            <span className="text-xs text-foreground/40">10:42</span>
          </div>

          {/* Important message bubble (Teams style) */}
          <div className="mt-1.5 rounded-sm border border-[#efd9de] border-l-[3px] border-l-[#c4314b] bg-[#fbf5f6] p-3.5">
            <div className="flex items-center gap-1.5 text-[#c4314b]">
              <ExclamationCircleIcon className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Importante
              </span>
            </div>

            <h4 className="mt-2 text-base font-semibold tracking-tight text-foreground">
              Inactividad detectada
            </h4>

            <p className="mt-1.5 text-sm leading-relaxed text-foreground/70">
              Una campaña activa dejó de registrar entregas. Revisá su estado en
              la plataforma para descartar un problema de configuración o
              presupuesto.
            </p>

            {/* Facts */}
            <dl className="mt-3 divide-y divide-foreground/5 rounded-md border border-foreground/10 bg-white px-3.5">
              {FACTS.map((fact) => (
                <div
                  key={fact.label}
                  className="flex items-start justify-between gap-4 py-2"
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

            {/* Actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-md bg-[#6264A7] px-3.5 py-1.5 text-sm font-semibold text-white">
                Ver en MediaLab OS
              </span>
              <span className="rounded-md border border-foreground/15 bg-white px-3.5 py-1.5 text-sm font-semibold text-foreground/70">
                Abrir en Google Ads
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
