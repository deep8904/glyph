import Link from 'next/link'
import { GButton } from '@/components/glyph/ui/primitives'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

/**
 * Owner-only visibility notice. Draft (never published) and scheduled (a future publish date) are
 * distinct states with different truths — a draft has no publish date to report, a scheduled post
 * does — so the copy says which one this is instead of a single generic "draft" label.
 */
export function GlyphDraftNotice({ publishedAt, editHref }: { publishedAt: string | null; editHref: string }) {
  const isScheduled = !!publishedAt && new Date(publishedAt) > new Date()
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-ember-line bg-ember-quiet px-4 py-3">
      <span className="text-small font-medium text-ember-ink">
        {isScheduled ? `Scheduled for ${formatDate(publishedAt as string)} — only you can see this until then.` : 'Draft — not yet published, only you can see this.'}
      </span>
      <GButton asChild variant="ember" size="sm">
        <Link href={editHref}>Continue editing</Link>
      </GButton>
    </div>
  )
}
