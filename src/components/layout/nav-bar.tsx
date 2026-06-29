"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/architecture", label: "Arquitectura" },
  { href: "/roadmap", label: "Hoja de Ruta" },
  { href: "/security", label: "Seguridad" },
  { href: "/knowledge", label: "Conocimiento" },
];

// The home link matches exactly; section links match any nested path.
const matchesHref = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href);

// All sections append their name to the brand title in the navbar instead of
// showing it as an in-page section heading. The label is reused from NAV_LINKS.
export function NavBar() {
  const pathname = usePathname();

  const brandSuffix = NAV_LINKS.find(
    ({ href }) => href !== "/" && matchesHref(pathname, href),
  )?.label;

  return (
    <header
      className="fixed top-0 isolate w-full z-50 border-b border-foreground/5 transform-gpu"
      style={{ backgroundColor: "color-mix(in srgb, var(--app-background) 85%, transparent)" }}
    >
      <div
        className="absolute inset-0 backdrop-blur-md"
        aria-hidden="true"
        style={{ WebkitBackdropFilter: "blur(12px)" }}
      />
      <div className="relative max-w-[1440px] mx-auto px-8 md:px-16 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-heading text-xl tracking-tighter text-foreground leading-none"
        >
          <span className="opacity-85">
            MEDIA<span className="italic">Lab</span> OS
          </span>
          {brandSuffix ? <span className="opacity-[0.73]"> - {brandSuffix}</span> : null}
        </Link>
        <nav className="hidden lg:flex items-center gap-7">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = matchesHref(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`grid text-sm tracking-tight transition-colors duration-200 ${
                  isActive
                    ? "text-brand"
                    : "text-foreground/45 hover:text-foreground"
                }`}
              >
                {/* Invisible bold copy reserves the bold width so toggling
                    weight on active never shifts sibling links */}
                <span aria-hidden="true" className="col-start-1 row-start-1 invisible font-bold">
                  {label}
                </span>
                <span
                  className={`col-start-1 row-start-1 ${isActive ? "font-bold" : "font-semibold"}`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
