import Link from 'next/link'
import { GAvatar } from '@/components/glyph/ui/primitives'
import { toPlainText } from '@/lib/glyph/text'
import { relativeTime } from '@/lib/utils'
import { REACTION_TYPES } from '@/lib/supabase/types'
import type { FeedRow, FeedEngagement } from '@/lib/feed/queries'

/**
 * One followed developer's published devlog, as it belongs in a feed: who published it leads (a
 * feed is fundamentally about people you chose to follow), then the update itself, then real
 * engagement facts. Deliberately not the standalone Devlog page's log-line+entry-title anatomy
 * (this is a scannable list of many updates, not one page reading one record) and not Explore's
 * directory reading-row (Explore is impersonal discovery; this is "people I follow," so identity
 * comes first). Engagement is stated as plain facts, never a fabricated number — a failed
 * engagement query is signalled by the caller omitting `engagement` entirely, not by rendering "0".
 */
export function GlyphFeedEntry({ item, engagement }: { item: FeedRow; engagement: FeedEngagement | undefined }) {
  const author = item.display_name || item.username
  const href = `/p/${item.username}/${item.project_slug}/${item.devlog_slug}`
  const excerpt = toPlainText(item.content_preview, 180)

  return (
    <li className="border-b border-hair py-5 first:pt-0">
      <div className="flex items-start gap-3">
        <Link href={`/dev/${item.username}`} className="-m-1 shrink-0 rounded-full p-1 outline-none focus-visible:ring-2 focus-visible:ring-ember">
          <GAvatar name={author} src={item.avatar_url} size={40} />
        </Link>
        <div className="min-w-0 flex-1">
          {/* Author's own name isn't a separate link — the avatar just above already goes to the
              same /dev/username destination, so a second tiny text link would be a redundant,
              sub-44px tap target next to a real one. */}
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-small text-ink-2">
            <span className="font-semibold text-ink">{author}</span>
            <span>published in</span>
            <Link
              href={`/p/${item.username}/${item.project_slug}`}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-hair px-2.5 font-medium text-ink-2 underline-offset-4 outline-none hover:border-hair-strong hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0 sm:min-w-0 sm:border-0 sm:px-0"
            >
              {item.project_title}
            </Link>
            <span className="text-ink-3">· {relativeTime(item.published_at)}</span>
          </p>
          <h2 className="mt-1.5 text-h3 font-semibold tracking-[-0.01em] text-ink [overflow-wrap:anywhere]">
            <Link href={href} className="-my-3 block py-3 outline-none hover:text-ember-ink focus-visible:ring-2 focus-visible:ring-ember">{item.devlog_title}</Link>
          </h2>
          {excerpt && <p className="mt-1 max-w-prose text-small text-ink-2 [overflow-wrap:anywhere]">{excerpt}</p>}

          {engagement && (
            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-small text-ink-3">
              {engagement.reactions.filter((r) => r.count > 0).map((r) => {
                const meta = REACTION_TYPES.find((t) => t.type === r.type)
                return meta ? <span key={r.type} className="inline-flex items-center gap-1"><span aria-hidden>{meta.emoji}</span><span className="font-mono tabular-nums">{r.count}</span></span> : null
              })}
              {engagement.comments > 0 && <span>{engagement.comments} {engagement.comments === 1 ? 'comment' : 'comments'}</span>}
            </div>
          )}
        </div>
      </div>
    </li>
  )
}
