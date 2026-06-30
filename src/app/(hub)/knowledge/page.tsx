import {
  BellAlertIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

import { EmailAlertMockup } from "@/components/knowledge/email-alert-mockup";
import { TeamsAlertMockup } from "@/components/knowledge/teams-alert-mockup";

export const metadata = {
  title: "Conocimiento — Medialab OS Hub",
};

export default function KnowledgePage() {
  return (
    <div className="py-16 space-y-16">
      {/* Monitoring and alerts */}
      <details open className="group">
        <summary className="flex w-fit cursor-pointer list-none items-center gap-2.5 [&::-webkit-details-marker]:hidden">
          <BellAlertIcon className="h-5 w-5 text-brand" />
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Monitoreo y alertas
          </h2>
          <ChevronDownIcon className="h-5 w-5 text-foreground/40 transition-transform duration-200 group-open:rotate-180" />
        </summary>

        <div className="space-y-6 pt-6">
          <p className="max-w-2xl text-base leading-relaxed text-foreground/65">
            Cuando una campaña se desvía de lo esperado —inactividad, agotamiento
            de presupuesto o pausas involuntarias— la plataforma avisa al equipo
            por dos canales. Así se ven esas notificaciones.
          </p>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                Notificación por Teams
              </div>
              <TeamsAlertMockup />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                <EnvelopeIcon className="h-4 w-4" />
                Notificación por correo
              </div>
              <EmailAlertMockup />
            </div>
          </div>

          <p className="text-sm leading-relaxed text-foreground/45">
            Los datos mostrados son de ejemplo. El diseño final de cada alerta
            puede ajustarse según el canal y el tipo de evento.
          </p>
        </div>
      </details>
    </div>
  );
}
