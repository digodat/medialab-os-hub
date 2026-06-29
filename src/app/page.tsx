import Link from "next/link";
import Image from "next/image";
import {
  CpuChipIcon,
  Bars3BottomLeftIcon,
  ShieldCheckIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import { CoreAnimation } from "@/components/landing/core-animation";
import { ScrollHint } from "@/components/landing/scroll-hint";

const SECTIONS = [
  { href: "/architecture", Icon: CpuChipIcon,         label: "Arquitectura" },
  { href: "/roadmap",      Icon: Bars3BottomLeftIcon,  label: "Hoja de Ruta" },
  { href: "/security",     Icon: ShieldCheckIcon,     label: "Seguridad" },
  { href: "/knowledge",    Icon: BookOpenIcon,         label: "Conocimiento" },
];

export default function HomePage() {
  return (
    <main className="relative max-w-[1440px] mx-auto px-6 md:px-16">
      {/* Home-only extra grain layered above the global body::after grain.
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
                className="group flex flex-col items-center justify-center p-4 md:p-5 border border-foreground/10 hover:border-brand/20 transition-all duration-300 rounded-xl bg-white/20 shadow-md shadow-foreground/5 hover:shadow-lg hover:shadow-foreground/10"
              >
                <Icon className="h-5 w-5 text-foreground/40 group-hover:text-brand mb-2 transition-colors" />
                <span className="text-xs font-bold tracking-widest text-foreground/40 group-hover:text-foreground transition-colors uppercase">
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

      {/* Below-the-fold content: revealed on scroll. Newspaper-style columns. */}
      <section id="home-more" className="min-h-dvh py-16 md:py-24">
        <header className="mb-10 border-y border-foreground/15 py-6 text-center">
          <h2 className="section-title text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
            Lorem Ipsum
          </h2>
          <p className="mt-2 text-xs uppercase tracking-[0.25em] text-foreground/40">
            Edición especial · Medialab OS
          </p>
        </header>

        <div className="columns-1 gap-8 text-justify md:columns-2 lg:columns-3 [column-rule:1px_solid_var(--border)]">
          <article className="mb-6 break-inside-avoid">
            <h3 className="section-title mb-2 text-2xl font-semibold tracking-tight text-foreground">
              De finibus bonorum
            </h3>
            <p className="text-sm leading-relaxed text-foreground/70 first-letter:float-left first-letter:mr-2 first-letter:font-heading first-letter:text-5xl first-letter:leading-[0.8] first-letter:text-foreground">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore.
            </p>
          </article>

          <p className="mb-6 break-inside-avoid text-sm leading-relaxed text-foreground/70">
            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
            officia deserunt mollit anim id est laborum. Curabitur pretium
            tincidunt lacus, nulla gravida orci a odio. Nullam varius, turpis et
            commodo pharetra, est eros bibendum elit, nec luctus magna felis
            sollicitudin mauris.
          </p>

          <article className="mb-6 break-inside-avoid">
            <h3 className="section-title mb-2 text-xl font-semibold tracking-tight text-foreground">
              Quis autem velum
            </h3>
            <p className="text-sm leading-relaxed text-foreground/70">
              Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus
              vulputate vehicula. Donec lobortis risus a elit. Etiam tempor.
              Praesent eu nulla at sem molestie sodales. Mauris condimentum
              nulla luctus libero porttitor placerat.
            </p>
          </article>

          <p className="mb-6 break-inside-avoid text-sm leading-relaxed text-foreground/70">
            Sed augue ipsum, egestas nec, vestibulum et, malesuada adipiscing,
            dui. Vestibulum facilisis, purus nec pulvinar iaculis, ligula mi
            congue nunc, vitae euismod ligula urna in dolor. Nam sodales mi vitae
            dolor ullamcorper et vulputate enim accumsan.
          </p>

          <article className="mb-6 break-inside-avoid">
            <h3 className="section-title mb-2 text-xl font-semibold tracking-tight text-foreground">
              Neque porro quisquam
            </h3>
            <p className="text-sm leading-relaxed text-foreground/70">
              Morbi in sem quis dui placerat ornare. Pellentesque odio nisi,
              euismod in, pharetra a, ultricies in, diam. Sed arcu. Cras
              consequat. Praesent dapibus, neque id cursus faucibus, tortor neque
              egestas augue, eu vulputate magna eros eu erat.
            </p>
          </article>

          <p className="mb-6 break-inside-avoid text-sm leading-relaxed text-foreground/70">
            Aliquam erat volutpat. Nam dui mi, tincidunt quis, accumsan porttitor,
            facilisis luctus, metus. Phasellus ultrices nulla quis nibh. Quisque
            a lectus. Donec consectetuer ligula vulputate sem tristique cursus.
            Nam nulla quam, gravida non, commodo a, sodales sit amet, nisi.
          </p>

          <article className="mb-6 break-inside-avoid">
            <h3 className="section-title mb-2 text-xl font-semibold tracking-tight text-foreground">
              Temporibus autem
            </h3>
            <p className="text-sm leading-relaxed text-foreground/70">
              Pellentesque habitant morbi tristique senectus et netus et
              malesuada fames ac turpis egestas. Proin pharetra nonummy pede.
              Mauris et orci. Aenean nec lorem. In porttitor. Donec laoreet nonummy
              augue. Suspendisse dui purus, scelerisque at, vulputate vitae.
            </p>
          </article>

          <p className="mb-6 break-inside-avoid text-sm leading-relaxed text-foreground/70">
            Fusce aliquet pede non pede. Suspendisse dapibus lorem pellentesque
            magna. Integer nulla. Donec blandit feugiat ligula. Donec hendrerit,
            felis et imperdiet euismod, purus ipsum pretium metus, in lacinia
            nulla nisl eget sapien. Donec ut est in lectus consequat consequat.
          </p>
        </div>
      </section>
    </main>
  );
}
