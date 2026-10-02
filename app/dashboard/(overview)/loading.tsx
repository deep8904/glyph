import { GlyphShell } from '@/components/glyph/shell/GlyphShell'

/** Shared loading UI for routes inside the `(overview)` route group only — i.e. `/dashboard` and
 * its `(overview)`-nested siblings (billing, playtests, projects, publisher, studios, and their
 * /new subpages). It does NOT cover routes outside that group: `/dashboard/projects/[id]/edit`,
 * `/dashboard/projects/[id]/devlogs/new`, `/dashboard/projects/[id]/devlogs/[devlogId]/edit`,
 * `/dashboard/events/[id]/manage`, `/dashboard/studios/[slug]`, `/dashboard/publisher/contact/[id]`
 * each fall outside `(overview)` and have no loading.tsx of their own yet. `dashboard/layout.tsx`
 * has no chrome of its own (unlike Explore's (hub) layout), so this renders GlyphShell itself.
 * Convergence-audit fix: this previously rendered the legacy `Shell` + `Skeleton` — a flash of
 * pre-rebuild presentation on the newly-approved Dashboard overview during every load. Matches
 * Explore's loading-skeleton pattern (plain bg-sunken pulse bars, no card chrome). */
function Bar({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-[8px] bg-sunken ${className}`} />
}

export default function DashboardLoading() {
  return (
    <GlyphShell>
      <div className="mx-auto w-full max-w-[720px] space-y-10">
        <div className="flex items-center justify-between gap-3">
          <Bar className="h-4 w-40" />
        </div>
        <Bar className="h-[168px] w-full rounded-[20px]" />
        <div className="space-y-3">
          <Bar className="h-5 w-32" />
          <Bar className="h-16 w-full rounded-[16px]" />
        </div>
      </div>
    </GlyphShell>
  )
}
