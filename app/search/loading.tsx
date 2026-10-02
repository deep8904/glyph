import { GlyphShell } from '@/components/glyph/shell/GlyphShell'

/** Search has no shared chrome layout of its own (unlike Explore's `app/explore/layout.tsx`), so
 * this renders GlyphShell itself — same shape as the result rows so the page doesn't jump when
 * results arrive. */
function Bar({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-[8px] bg-sunken ${className}`} />
}

export default function SearchLoading() {
  return (
    <GlyphShell>
      <div className="mx-auto w-full max-w-4xl">
        <Bar className="h-9 w-40" />
        <Bar className="mt-4 h-11 w-full rounded-[10px]" />
        <div className="mt-8 space-y-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 border-t border-hair py-3.5">
              <Bar className="h-16 w-24 shrink-0 rounded-[10px]" />
              <div className="flex-1 space-y-2"><Bar className="h-4 w-1/2" /><Bar className="h-3 w-1/3" /></div>
            </div>
          ))}
        </div>
      </div>
    </GlyphShell>
  )
}
