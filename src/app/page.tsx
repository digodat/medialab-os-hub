import Link from "next/link";
import Image from "next/image";
import {
  CpuChipIcon,
  Bars3BottomLeftIcon,
  ShieldCheckIcon,
  BookOpenIcon,
  BoltIcon,
  GlobeAltIcon,
  CheckBadgeIcon,
  BellAlertIcon,
  ClipboardDocumentCheckIcon,
  CircleStackIcon,
  PaperAirplaneIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { CoreAnimation } from "@/components/landing/core-animation";
import { CoverageDiagram } from "@/components/landing/coverage-diagram";
import { OssTerm } from "@/components/landing/oss-term";
import { ScrollHint } from "@/components/landing/scroll-hint";

const SECTIONS = [
  { href: "/architecture", Icon: CpuChipIcon,         label: "Arquitectura" },
  { href: "/roadmap",      Icon: Bars3BottomLeftIcon,  label: "Hoja de Ruta" },
  { href: "/security",     Icon: ShieldCheckIcon,     label: "Seguridad" },
  { href: "/knowledge",    Icon: BookOpenIcon,         label: "Conocimiento" },
];

const MEDIA_PLATFORMS = "Google Ads, Meta, TikTok y DV 360";

const STEPS = [
  {
    Icon: ClipboardDocumentCheckIcon,
    title: "Planificación",
    body: (
      <>
        Las estrategias de medios se definen y aprueban en <OssTerm />, el
        sistema de planificación de Falabella.
      </>
    ),
  },
  {
    Icon: CircleStackIcon,
    title: "Ingesta de datos",
    body: "Procesos automáticos extraen y consolidan las campañas y su performance en una base de datos central.",
  },
  {
    Icon: PaperAirplaneIcon,
    title: "Despliegue",
    body: `El operador completa un formulario y la app crea las campañas en ${MEDIA_PLATFORMS}, paso a paso y de forma auditable.`,
  },
  {
    Icon: BellAlertIcon,
    title: "Monitoreo",
    body: "La performance se consolida en un solo lugar y las alertas avisan por Teams y Gmail ante desvíos o inactividad.",
  },
];

const CAPABILITIES = [
  {
    Icon: BoltIcon,
    title: "Velocidad operativa",
    body: `Lo que antes implicaba configurar campaña por campaña en ${MEDIA_PLATFORMS} ahora se dispara desde un único flujo guiado.`,
  },
  {
    Icon: GlobeAltIcon,
    title: "Escala regional",
    body: "Una misma operación cubre los tres mercados, respetando las cuentas y la nomenclatura de cada país.",
  },
  {
    Icon: CheckBadgeIcon,
    title: "Consistencia",
    body: "La configuración y la nomenclatura estandarizadas reducen los errores manuales y el retrabajo.",
  },
  {
    Icon: ShieldCheckIcon,
    title: "Gobernanza",
    body: "Cada acción queda registrada y toda campaña nace en pausa, bajo control humano antes de invertir.",
  },
];

const SECURITY_POINTS = [
  "Secretos y credenciales centralizados: ningún token vive en el código ni llega al navegador.",
  "Mínimo privilegio por diseño: cada componente opera con identidades dedicadas y permisos acotados.",
  "Validación previa a la ejecución: las operaciones sensibles se verifican antes de impactar las plataformas.",
  "Acceso corporativo unificado: identidad centralizada vía SSO, alineada con el resto de las aplicaciones de Falabella.",
];

const ROADMAP_POINTS = [
  "Automatización end-to-end del flujo operativo, con validaciones agenticas que reducen la intervención manual en cada paso.",
  "Modelos de machine learning que detectan desvíos de performance de forma temprana, antes de que impacten resultados.",
  "Operación autónoma con despliegues automatizados y optimización agentica: agentes que deciden y ejecutan bajo reglas de negocio y controles de gobernanza.",
  "Integración profunda con el way of work de Falabella: procesos, roles y herramientas del equipo en un ecosistema unificado.",
];

export default function HomePage() {
  return (
    <>
      {/* Home-only extra grain layered above the global body::after grain.
          Rendered at body level (not inside the max-width main) so it spans
          the full width and never shows a vertical seam at the content edges.
          Intentional exception to the single-grain convention, scoped to home. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[99998] opacity-20"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
          mixBlendMode: "multiply",
        }}
      />
      <main className="relative max-w-[1440px] mx-auto px-6 md:px-16">
      <section className="relative h-dvh overflow-hidden flex flex-col justify-center gap-8 md:gap-10 py-8">
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 font-heading text-3xl tracking-tighter text-foreground leading-none">
          <span className="opacity-80 blur-[0.5px]">
            MEDIA<span className="italic">Lab</span> OS
          </span>
          <span className="text-[80%] opacity-65 blur-[0.5px]">HUB</span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center -translate-y-[8vh]">
          <div className="h-full w-full opacity-90">
            <CoreAnimation />
          </div>
          <div className="-mt-[18vh] grid w-full shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-3 opacity-85">
            <Image
              src="/logos/Falabella.svg.png"
              alt="Falabella"
              width={1280}
              height={500}
              className="h-10 w-auto justify-self-end mr-5 md:h-12"
            />
            <span className="text-sm text-foreground/50">×</span>
            <Image
              src="/logos/Monks_Logo.png"
              alt="Monks"
              width={820}
              height={249}
              className="h-10 w-auto justify-self-start md:h-12"
            />
          </div>
        </div>

        <div className="shrink-0 mx-auto w-3/4 max-w-[75vw] mb-[16vh]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {SECTIONS.map(({ href, Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="group flex flex-col items-center justify-center p-4 md:p-5 border-2 border-foreground/10 hover:border-brand/50 transition-all duration-300 rounded-xl bg-white/60 backdrop-blur-sm shadow-md shadow-foreground/5 hover:shadow-lg hover:shadow-foreground/10"
              >
                <Icon className="h-5 w-5 text-foreground/70 group-hover:text-brand mb-2 transition-colors" />
                <span className="text-xs font-bold tracking-widest text-foreground/70 group-hover:text-foreground transition-colors uppercase">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <ScrollHint targetId="home-more" />
        </div>
      </section>

      {/* Below-the-fold content: executive overview revealed on scroll. */}
      <section id="home-more" className="py-16 md:py-24">
        <header className="mb-12 border-y border-foreground/15 py-8 text-center">
          <h2 className="font-heading text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
            Una sola plataforma para operar los medios
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-foreground/65">
            MediaLab OS centraliza y automatiza el despliegue de campañas
            publicitarias de Falabella en {MEDIA_PLATFORMS}.
          </p>
        </header>

        {/* Lead + coverage diagram side by side */}
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_35vw] lg:items-center lg:gap-12 xl:gap-16">
          <div className="min-w-0 space-y-5">
            <p className="text-base leading-relaxed text-foreground/75 first-letter:float-left first-letter:mr-2 first-letter:font-heading first-letter:text-6xl first-letter:leading-[0.8] first-letter:text-brand">
              MediaLab OS es la herramienta interna que automatiza el despliegue de
              campañas publicitarias de Falabella en {MEDIA_PLATFORMS}.
              Toma las estrategias ya planificadas en <OssTerm /> y le permite al equipo de
              medios lanzarlas en las cuatro plataformas —y en los tres mercados de
              la región— desde un único flujo guiado, sin saltar entre cuentas ni
              configurar cada campaña a mano.
            </p>
            <p className="text-base leading-relaxed text-foreground/65">
              El objetivo es simple: convertir un proceso manual, repetitivo y
              propenso a errores en una operación rápida, consistente y trazable.
              Cada envío queda registrado y, por diseño, las campañas siempre se
              crean en pausa: ninguna inversión se activa sin una validación humana
              de por medio.
            </p>
          </div>

          <div className="mx-auto w-full max-w-[35vw] lg:mx-0 lg:justify-self-end">
            <CoverageDiagram />
          </div>
        </div>

        {/* How it works */}
        <div className="mt-20">
          <h3 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            De la estrategia a la campaña en vivo
          </h3>
          <ol className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative p-5">
                <div className="flex items-center justify-between">
                  <step.Icon className="h-6 w-6 text-brand" />
                  <span className="font-heading text-sm font-semibold text-foreground/25">
                    0{index + 1}
                  </span>
                </div>
                <p className="mt-4 text-base font-semibold tracking-tight text-foreground">
                  {step.title}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground/60">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>

        {/* Business value */}
        <div className="mt-20">
          <h3 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Más velocidad, menos riesgo
          </h3>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {CAPABILITIES.map((capability) => (
              <div key={capability.title} className="flex gap-4 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-subtle">
                  <capability.Icon className="h-5 w-5 text-brand" />
                </span>
                <div>
                  <p className="text-base font-semibold tracking-tight text-foreground">
                    {capability.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/60">
                    {capability.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <figure className="mt-12 overflow-hidden rounded-xl border-2 border-brand/70 bg-white shadow-sm shadow-foreground/5">
            <Image
              src="/landing/screen4.png"
              alt="Captura de pantalla de MediaLab OS con la vista de campañas OSS"
              width={2994}
              height={1624}
              className="h-auto w-full"
              sizes="(max-width: 1440px) 100vw, 1440px"
            />
          </figure>
        </div>

        {/* Security + Roadmap */}
        <div className="mt-20 grid gap-6 lg:grid-cols-2">
          <div className="flex h-full flex-col rounded-2xl border border-foreground/10 bg-white/40 p-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <ShieldCheckIcon className="h-5 w-5 text-brand" />
              <h3 className="font-heading text-xl font-semibold tracking-tight text-foreground">
                Seguridad por diseño
              </h3>
            </div>
            <ul className="mt-5 flex-1 space-y-3">
              {SECURITY_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex gap-2.5 text-sm leading-relaxed text-foreground/65"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {point}
                </li>
              ))}
            </ul>
            <Link
              href="/security"
              className="group mt-6 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-brand"
            >
              Ver el estado de seguridad
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="flex h-full flex-col rounded-2xl border border-foreground/10 bg-white/40 p-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <Bars3BottomLeftIcon className="h-5 w-5 text-brand" />
              <h3 className="font-heading text-xl font-semibold tracking-tight text-foreground">
                Hacia dónde va
              </h3>
            </div>
            <ul className="mt-5 flex-1 space-y-3">
              {ROADMAP_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex gap-2.5 text-sm leading-relaxed text-foreground/65"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {point}
                </li>
              ))}
            </ul>
            <Link
              href="/roadmap"
              className="group mt-6 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-brand"
            >
              Ver la hoja de ruta
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

      </section>
      </main>
    </>
  );
}
