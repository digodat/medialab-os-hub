import { connection } from "next/server";

import { ScrollLock } from "@/components/landing/scroll-lock";
import { RoadmapGantt } from "@/components/roadmap/roadmap-gantt";

export const metadata = {
  title: "Hoja de Ruta — Medialab OS Hub",
};

export default async function RoadmapPage() {
  // The roadmap reads the current time (today marker) in a Server Component,
  // which requires opting into dynamic rendering first.
  await connection();

  return (
    // The page fills the viewport below the navbar (4rem) and never scrolls;
    // scrolling happens inside the chart box instead.
    <div className="h-[calc(100dvh-4rem)] pt-2 pb-6">
      <ScrollLock />
      <RoadmapGantt />
    </div>
  );
}
