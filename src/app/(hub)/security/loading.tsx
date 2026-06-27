export default function SecurityLoading() {
  return (
    <div className="py-16 space-y-16">
      {/* Header skeleton */}
      <div className="border-b border-foreground/10 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-3">
          <div className="h-11 w-80 bg-foreground/8 rounded animate-pulse" />
          <div className="h-4 w-96 bg-foreground/5 rounded animate-pulse" />
          <div className="h-4 w-72 bg-foreground/5 rounded animate-pulse" />
        </div>
        <div className="flex gap-3 shrink-0">
          <div className="h-9 w-36 bg-foreground/5 rounded-full animate-pulse" />
          <div className="h-9 w-36 bg-foreground/8 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Tasks skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-5 w-40 bg-foreground/8 rounded animate-pulse" />
            <div className="h-7 w-28 bg-foreground/5 rounded-full animate-pulse" />
          </div>
          <div className="bg-white/50 border border-foreground/10 rounded-xl overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 border-b border-foreground/5 last:border-b-0"
              >
                <div className="flex justify-between mb-2">
                  <div className="h-4 w-44 bg-foreground/8 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-foreground/5 rounded animate-pulse" />
                </div>
                <div className="h-3 w-36 bg-foreground/5 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white/50 border border-foreground/10 rounded-xl p-6 space-y-4">
          <div className="h-4 w-32 bg-foreground/8 rounded animate-pulse" />
          <div className="h-3 w-48 bg-foreground/5 rounded animate-pulse" />
          <div className="h-px bg-foreground/5 mt-2" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-3 bg-foreground/5 rounded animate-pulse" />
          ))}
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white/50 border border-foreground/10 rounded-xl p-6">
        <div className="flex justify-between mb-6">
          <div className="h-5 w-60 bg-foreground/8 rounded animate-pulse" />
          <div className="h-4 w-16 bg-foreground/5 rounded animate-pulse" />
        </div>
        <div className="space-y-0">
          <div className="flex gap-8 pb-3 border-b border-foreground/10">
            {[120, 96, 120, 72].map((w, i) => (
              <div
                key={i}
                className={`h-3 bg-foreground/5 rounded animate-pulse ${i === 3 ? "ml-auto" : ""}`}
                style={{ width: w }}
              />
            ))}
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex gap-8 py-4 border-b border-foreground/5 last:border-b-0"
            >
              {[144, 80, 120, 64].map((w, j) => (
                <div
                  key={j}
                  className={`h-4 bg-foreground/5 rounded animate-pulse ${j === 3 ? "ml-auto" : ""}`}
                  style={{ width: w }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
