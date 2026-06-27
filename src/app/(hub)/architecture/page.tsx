import { ArchitectureDiagram } from "@/components/architecture/architecture-diagram";

export const metadata = {
  title: "Arquitectura — Medialab OS Hub",
};

export default function ArchitecturePage() {
  return (
    <div className="pt-6 pb-16">
      <ArchitectureDiagram />
    </div>
  );
}
