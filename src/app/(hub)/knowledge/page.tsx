import {
  BellAlertIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  EnvelopeIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

import { EmailAlertMockup } from "@/components/knowledge/email-alert-mockup";
import { TeamsAlertMockup } from "@/components/knowledge/teams-alert-mockup";

export const metadata = {
  title: "Conocimiento — Medialab OS Hub",
};

type Person = { name: string; email: string; role: string; org: string };

const TEAM: Person[] = [
  {
    name: "Erik From Vergara",
    email: "edfrom@falabella.com",
    role: "Responsable",
    org: "Falabella",
  },
  {
    name: "Alejo Calvi",
    email: "alejo.calvi@monks.com",
    role: "Desarrollador",
    org: "Monks",
  },
  {
    name: "Martín Bergler",
    email: "martin.bergler@monks.com",
    role: "Desarrollador",
    org: "Monks",
  },
  {
    name: "Lourdes Ciotti",
    email: "lourdes.ciotti@monks.com",
    role: "Desarrolladora",
    org: "Monks",
  },
  {
    name: "Gastón Baeza",
    email: "gaston.baeza@monks.com",
    role: "Responsable",
    org: "Monks",
  },
  {
    name: "Mathias Unger",
    email: "mathias.unger@monks.com",
    role: "Responsable",
    org: "Monks",
  },
];

export default function KnowledgePage() {
  return (
    <div className="py-16 space-y-16">
      {/* Monitoring and alerts */}
      <details className="group">
        <summary className="flex w-fit cursor-pointer list-none items-center gap-2.5 [&::-webkit-details-marker]:hidden">
          <BellAlertIcon className="h-5 w-5 text-brand" />
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Monitoreo y alertas
          </h2>
          <ChevronDownIcon className="h-5 w-5 text-foreground/40 transition-transform duration-200 group-open:rotate-180" />
        </summary>

        <div className="space-y-6 pt-6">
          <p className="max-w-2xl text-base leading-relaxed text-foreground/65">
            MediaLab OS centraliza resultados y alerta cuando detecta desvíos:
            inactividad, subejecución de presupuesto o diferencias contra el
            plan. El aviso llega por Teams y por correo. Abajo, un ejemplo de
            alerta de inactividad en cada canal.
          </p>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                Teams
              </div>
              <TeamsAlertMockup />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                <EnvelopeIcon className="h-4 w-4" />
                Correo
              </div>
              <EmailAlertMockup />
            </div>
          </div>

          <p className="text-sm leading-relaxed text-foreground/45">
            Datos de ejemplo. El contenido varía según el canal y el tipo de
            alerta.
          </p>
        </div>
      </details>

      {/* Responsables y desarrolladores */}
      <details className="group">
        <summary className="flex w-fit cursor-pointer list-none items-center gap-2.5 [&::-webkit-details-marker]:hidden">
          <UserGroupIcon className="h-5 w-5 text-brand" />
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Responsables y desarrolladores
          </h2>
          <ChevronDownIcon className="h-5 w-5 text-foreground/40 transition-transform duration-200 group-open:rotate-180" />
        </summary>

        <ul className="mt-6 divide-y divide-foreground/10 overflow-hidden rounded-2xl border border-foreground/10 bg-white/50 backdrop-blur-sm">
          {TEAM.map((person) => (
            <li
              key={person.email}
              className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-4"
            >
              <div className="leading-tight">
                <p className="text-sm font-semibold text-foreground">
                  {person.name}
                </p>
                <p className="text-xs text-foreground/45">
                  {person.role} · {person.org}
                </p>
              </div>
              <a
                href={`mailto:${person.email}`}
                className="text-sm text-brand transition-opacity hover:opacity-80"
              >
                {person.email}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
