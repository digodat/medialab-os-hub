import Link from "next/link";
import {
  CircleStackIcon,
  CpuChipIcon,
  ChartBarSquareIcon,
  ShieldCheckIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import { CoreAnimation } from "@/components/landing/core-animation";
import { ScrollLock } from "@/components/landing/scroll-lock";

const SECTIONS = [
  { href: "/core",         Icon: CircleStackIcon,    label: "THE CORE" },
  { href: "/architecture", Icon: CpuChipIcon,         label: "ARCHITECTURE" },
  { href: "/roadmap",      Icon: ChartBarSquareIcon,  label: "ROADMAP" },
  { href: "/security",     Icon: ShieldCheckIcon,     label: "SECURITY" },
  { href: "/knowledge",    Icon: BookOpenIcon,         label: "KNOWLEDGE" },
];

export default function HomePage() {
  return (
    <main className="h-dvh overflow-hidden flex flex-col justify-center gap-8 md:gap-10 max-w-[1440px] mx-auto px-6 md:px-16 py-8">
      <ScrollLock />
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="h-full w-full opacity-90">
          <CoreAnimation />
        </div>
      </div>

      <div className="shrink-0 mx-auto w-3/4 max-w-[75vw] mb-[8vh]">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          {SECTIONS.map(({ href, Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col items-center justify-center p-4 md:p-5 border border-foreground/10 hover:border-brand transition-all duration-300 rounded-xl bg-white/20 shadow-md shadow-foreground/5 hover:shadow-lg hover:shadow-foreground/10"
            >
              <Icon className="h-5 w-5 text-foreground/40 group-hover:text-brand mb-2 transition-colors" />
              <span className="text-[10px] font-bold tracking-widest text-foreground/40 group-hover:text-foreground transition-colors uppercase">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
