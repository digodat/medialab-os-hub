export default function RoadmapLoading() {
  return (
    <div className="pt-6 pb-16 space-y-8">
      {/* Intro + legend skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-2/3 rounded bg-foreground/5 animate-pulse" />
        <div className="h-3 w-1/3 rounded bg-foreground/5 animate-pulse" />
      </div>

      {/* Chart skeleton */}
      <div className="h-[520px] w-full rounded-2xl border border-foreground/10 bg-white/30 animate-pulse" />
    </div>
  );
}
