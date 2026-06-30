"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const MARKETS = [
  { id: "cl", name: "Chile", flag: "/flags/chile.svg" },
  { id: "co", name: "Colombia", flag: "/flags/colombia.svg" },
  { id: "pe", name: "Perú", flag: "/flags/peru.svg" },
] as const;

const PLATFORMS = [
  {
    id: "gads",
    name: "Google Ads",
    logo: "/logos/google-ads.svg",
    types: [
      "Performance Max",
      "Shopping",
      "Search",
      "Demand Gen",
      "Display",
    ],
  },
  {
    id: "meta",
    name: "Meta",
    logo: "/logos/meta.svg",
    types: ["Alcance", "Tráfico", "RNF", "Conversión"],
  },
  {
    id: "tiktok",
    name: "TikTok",
    logo: "/logos/tiktok.svg",
    types: ["Alcance", "Tráfico", "Conversión"],
  },
  {
    id: "dv360",
    name: "DV 360",
    logo: "/logos/dv360.svg",
    types: [],
    badge: "Próximamente",
  },
] as const;

type Point = { x: number; y: number };

type CubicSegment = {
  from: Point;
  c1: Point;
  c2: Point;
  to: Point;
};

type Connector = {
  id: string;
  path: string;
  opacity: number;
  arrow?: { tip: Point; angle: number };
};

const ARROW_LENGTH = 7;
const ARROW_HALF_WIDTH = 3.25;

function buildCurvedSegment(from: Point, to: Point): CubicSegment {
  const controlOffset = Math.max(28, (to.y - from.y) * 0.45);
  return {
    from,
    c1: { x: from.x, y: from.y + controlOffset },
    c2: { x: to.x, y: to.y - controlOffset },
    to,
  };
}

function segmentPath(segment: CubicSegment): string {
  const { from, c1, c2, to } = segment;
  return `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`;
}

function cubicTangent(segment: CubicSegment, t: number): Point {
  const u = 1 - t;
  return {
    x:
      3 * u * u * (segment.c1.x - segment.from.x) +
      6 * u * t * (segment.c2.x - segment.c1.x) +
      3 * t * t * (segment.to.x - segment.c2.x),
    y:
      3 * u * u * (segment.c1.y - segment.from.y) +
      6 * u * t * (segment.c2.y - segment.c1.y) +
      3 * t * t * (segment.to.y - segment.c2.y),
  };
}

function normalize(vector: Point): Point {
  const length = Math.hypot(vector.x, vector.y) || 1;
  return { x: vector.x / length, y: vector.y / length };
}

function buildConnector(
  id: string,
  from: Point,
  to: Point,
  opacity: number,
  withArrow: boolean,
): Connector {
  const segment = buildCurvedSegment(from, to);

  if (!withArrow) {
    return { id, path: segmentPath(segment), opacity };
  }

  const tangent = normalize(cubicTangent(segment, 1));
  const shortenedTo = {
    x: segment.to.x - tangent.x * ARROW_LENGTH,
    y: segment.to.y - tangent.y * ARROW_LENGTH,
  };

  return {
    id,
    path: segmentPath({ ...segment, to: shortenedTo }),
    opacity,
    arrow: {
      tip: segment.to,
      angle: Math.atan2(tangent.y, tangent.x),
    },
  };
}

function arrowHeadPath(tip: Point, angle: number): string {
  const backX = tip.x - Math.cos(angle) * ARROW_LENGTH;
  const backY = tip.y - Math.sin(angle) * ARROW_LENGTH;
  const leftX = backX + Math.sin(angle) * ARROW_HALF_WIDTH;
  const leftY = backY - Math.cos(angle) * ARROW_HALF_WIDTH;
  const rightX = backX - Math.sin(angle) * ARROW_HALF_WIDTH;
  const rightY = backY + Math.cos(angle) * ARROW_HALF_WIDTH;

  return `M ${tip.x} ${tip.y} L ${leftX} ${leftY} L ${rightX} ${rightY} Z`;
}

function centerPoint(element: HTMLElement, container: DOMRect): Point {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 - container.left,
    y: rect.top + rect.height / 2 - container.top,
  };
}

function anchorPoint(
  element: HTMLElement,
  container: DOMRect,
  side: "top" | "bottom",
): Point {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 - container.left,
    y:
      side === "bottom"
        ? rect.bottom - container.top
        : rect.top - container.top,
  };
}

export function CoverageDiagram() {
  const containerRef = useRef<HTMLDivElement>(null);
  const marketRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const marketsHubRef = useRef<HTMLDivElement>(null);
  const platformRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });

  const updateConnectors = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const bounds = container.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) return;

    setSvgSize({ width: bounds.width, height: bounds.height });

    const next: Connector[] = [];
    const hubEl = marketsHubRef.current;

    if (hubEl) {
      const hub = centerPoint(hubEl, bounds);

      for (const market of MARKETS) {
        const marketEl = marketRefs.current[market.id];
        if (!marketEl) continue;

        const from = anchorPoint(marketEl, bounds, "bottom");
        next.push(buildConnector(`market-${market.id}-hub`, from, hub, 0.42, false));
      }

      for (const platform of PLATFORMS) {
        const platformEl = platformRefs.current[platform.id];
        if (!platformEl) continue;

        const to = anchorPoint(platformEl, bounds, "top");
        next.push(buildConnector(`hub-${platform.id}`, hub, to, 0.42, true));
      }
    }

    setConnectors(next);
  }, []);

  useEffect(() => {
    updateConnectors();

    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(updateConnectors);
    observer.observe(container);

    window.addEventListener("resize", updateConnectors);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateConnectors);
    };
  }, [updateConnectors]);

  return (
    <div
      ref={containerRef}
      className="relative px-3 py-6 md:px-4 md:py-8"
    >
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 text-brand"
        width={svgSize.width}
        height={svgSize.height}
        viewBox={`0 0 ${svgSize.width || 1} ${svgSize.height || 1}`}
      >
        {connectors.map((connector) => (
          <g key={connector.id}>
            <path
              d={connector.path}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeOpacity={connector.opacity}
            />
            {connector.arrow ? (
              <path
                d={arrowHeadPath(connector.arrow.tip, connector.arrow.angle)}
                fill="currentColor"
                fillOpacity={connector.opacity}
              />
            ) : null}
          </g>
        ))}
      </svg>

      <div className="relative z-10 flex flex-col gap-8 md:gap-10">
        <div>
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {MARKETS.map((market) => (
              <div
                key={market.id}
                ref={(node) => {
                  marketRefs.current[market.id] = node;
                }}
                className="flex justify-center"
              >
                <div className="flex h-9 w-[3.15rem] items-center justify-center overflow-hidden rounded-md border border-foreground/10 bg-white/80 shadow-sm md:h-[2.475rem] md:w-[3.6rem]">
                  <Image
                    src={market.flag}
                    alt={market.name}
                    width={58}
                    height={40}
                    className="h-full w-full object-cover"
                    onLoad={updateConnectors}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            ref={marketsHubRef}
            aria-hidden="true"
            className="mx-auto mt-6 flex h-3 w-3 items-center justify-center md:mt-8"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-brand shadow-[0_0_0_3px_rgb(255_255_255/0.55)]" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5 md:gap-2">
          {PLATFORMS.map((platform) => (
            <div
              key={platform.id}
              ref={(node) => {
                platformRefs.current[platform.id] = node;
              }}
              className="flex flex-col items-center gap-3 md:gap-4"
            >
              <div className="flex h-12 w-12 items-center justify-center p-2 md:h-14 md:w-14">
                <Image
                  src={platform.logo}
                  alt={platform.name}
                  width={40}
                  height={40}
                  className="h-full w-full object-contain"
                  onLoad={updateConnectors}
                />
              </div>
              {"badge" in platform && platform.badge ? (
                <span className="rounded-full border border-foreground/10 bg-brand-subtle px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand md:text-[10px]">
                  {platform.badge}
                </span>
              ) : platform.types.length > 0 ? (
                <ul className="w-full space-y-2">
                  {platform.types.map((type) => (
                    <li
                      key={type}
                      className="flex items-center gap-2 text-xs text-foreground/70 md:gap-2.5 md:text-sm"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                      {type}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
