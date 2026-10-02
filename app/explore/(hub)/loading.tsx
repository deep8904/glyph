/** Explore loading — inner skeleton; the (hub) layout keeps the top bar in place. */
function Bar({ className }: { className?: string }) {
  return <div className={`rounded-[8px] bg-sunken ${className}`} />
}

export default function ExploreLoading() {
  return (
    <div>
      <Bar className="h-9 w-40" />
      <Bar className="mt-3 h-4 w-80 max-w-full" />
      <div className="mt-14 grid gap-6 lg:grid-cols-[1.65fr_1fr]">
        <Bar className="aspect-[3/2] w-full rounded-[16px] sm:aspect-[16/9] lg:aspect-[21/9]" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3"><Bar className="size-8 rounded-full" /><div className="flex-1 space-y-2"><Bar className="h-3 w-24" /><Bar className="h-4 w-full" /></div></div>
          ))}
        </div>
      </div>
      <Bar className="mt-16 h-7 w-40" />
      {/* Uniform grid — no featured span, since a coverless-first dataset would not produce one. */}
      <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <Bar className="aspect-[3/2] w-full rounded-[13px]" />
            <Bar className="mt-3 h-4 w-3/4" />
            <Bar className="mt-2 h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}
