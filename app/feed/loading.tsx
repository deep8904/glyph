import { GlyphShell } from '@/components/glyph/shell/GlyphShell'

/** /feed has no shared chrome layout, so this renders GlyphShell itself. Same shape as
 * GlyphFeedEntry (avatar, byline, title, excerpt) so the page doesn't jump when data arrives. The
 * skeleton bars are purely decorative (aria-hidden); the single `role="status"` region is what
 * actually gets announced, once, not once per bar. Their pulse is suppressed under reduced motion
 * by the global `* { animation-duration: 0.01ms !important; ... }` rule in
 * app/globals.css (@media (prefers-reduced-motion: reduce)). */
function Bar({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-[8px] bg-sunken ${className}`} />
}

export default function FeedLoading() {
  return (
    <GlyphShell>
      <div role="status" aria-live="polite" aria-label="Loading feed" className="mx-auto w-full max-w-2xl">
        <div aria-hidden="true">
          <Bar className="h-9 w-24" />
          <Bar className="mt-3 h-4 w-72 max-w-full" />
          <div className="mt-6 space-y-5 border-t border-hair pt-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Bar className="size-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Bar className="h-3 w-2/5" />
                  <Bar className="h-5 w-4/5" />
                  <Bar className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GlyphShell>
  )
}
