import { NavBar } from "@/components/layout/nav-bar";

export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavBar />
      {/* Section content is capped at 80% of the available width and centered */}
      <div className="pt-16">
        <div className="mx-auto w-4/5">{children}</div>
      </div>
    </>
  );
}
