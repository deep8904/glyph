import { GlyphShell } from '@/components/glyph/shell/GlyphShell'

/** /notifications has no shared chrome layout, so this renders GlyphShell itself. Same shape as
 * GlyphNotificationRow (avatar, one line, time) so the list doesn't jump when data arrives. The
 * skeleton bars are purely decorative (aria-hidden); the single `role="status"` region is what
 * actually gets announced, once, not once per row. Their pulse is suppressed under reduced motion
 * by the global `* { animation-duration: 0.01ms !important; ... }` rule in
 * app/globals.css (@media (prefers-reduced-motion: reduce)). */
function Bar({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-[8px] bg-sunken ${className}`} />
}

export default function NotificationsLoading() {
  return (
    <GlyphShell>
      <div role="status" aria-live="polite" aria-label="Loading notifications" className="mx-auto w-full max-w-2xl">
        <div aria-hidden="true">
          <Bar className="h-9 w-48" />
          <div className="mt-6 space-y-4 border-t border-hair pt-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Bar className="size-10 shrink-0 rounded-full" />
                <Bar className="h-4 flex-1" />
                <Bar className="h-3 w-10 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </GlyphShell>
  )
}
