export default function ArchitectureLoading() {
  return (
    <div className="pt-6 pb-16 space-y-8">
      {/* Header skeleton: hint + reset button */}
      <div className="flex items-center justify-between gap-6">
        <div className="h-4 w-2/3 bg-foreground/5 rounded animate-pulse" />
        <div className="h-10 w-10 shrink-0 rounded-full bg-foreground/8 animate-pulse" />
      </div>

      {/* Diagram skeleton */}
      <div className="h-[680px] w-full rounded-2xl border border-foreground/10 bg-white/30 animate-pulse" />
    </div>
  );
}
