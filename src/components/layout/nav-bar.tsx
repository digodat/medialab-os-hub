"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/core", label: "El Núcleo" },
  { href: "/architecture", label: "Arquitectura" },
  { href: "/roadmap", label: "Hoja de Ruta" },
  { href: "/security", label: "Seguridad" },
  { href: "/knowledge", label: "Conocimiento" },
];

// All sections append their name to the brand title in the navbar instead of
// showing it as an in-page section heading. The label is reused from NAV_LINKS.
export function NavBar() {
  const pathname = usePathname();

  const brandSuffix = NAV_LINKS.find(({ href }) =>
    pathname.startsWith(href),
  )?.label;

  return (
    <header
      className="fixed top-0 w-full z-50 border-b border-foreground/5"
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
          MEDIA<span className="italic">Lab</span> OS
          {brandSuffix ? ` - ${brandSuffix}` : ""}
        </Link>
        <nav className="hidden lg:flex items-center gap-7">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname.startsWith(href);
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
