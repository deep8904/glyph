import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { relativeTime } from '@/lib/utils'
import { toPlainText } from '@/lib/glyph/text'

export type ProjectDevlogEntry = { id: string; slug: string; title: string; content: string; published_at: string | null; isDraft: boolean }

/**
 * A row in the project's development record — evidence of progress, not a generic blog/feed card.
 * Owner sees draft/scheduled truth and an edit destination; visitors only ever receive published
 * entries (enforced by the page's query, not this component).
 */
export function GlyphProjectDevlogRow({ entry, projectHref, editHref }: { entry: ProjectDevlogEntry; projectHref: string; editHref?: string }) {
  const href = `${projectHref}/${entry.slug}`
  const preview = toPlainText(entry.content, 160)
  return (
    <li className="border-t border-hair py-4 first:border-t-0">
      <div className="flex items-start justify-between gap-3">
        <Link href={href} className="group min-w-0 flex-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ember">
          <p className="flex items-center gap-2 font-mono text-micro text-ink-3">
            {entry.isDraft ? <span className="rounded-full bg-sunken px-1.5 py-0.5 font-medium text-ink-2">{entry.published_at ? 'Scheduled' : 'Draft'}</span> : <span>{relativeTime(entry.published_at as string)}</span>}
          </p>
          <h3 className="mt-1 font-semibold tracking-[-0.01em] text-ink group-hover:text-ember-ink [overflow-wrap:anywhere]">{entry.title}</h3>
          {preview && <p className="mt-1 line-clamp-2 max-w-[68ch] text-small leading-relaxed text-ink-2">{preview}</p>}
        </Link>
        {editHref && (
          <Link href={editHref} aria-label={`Edit ${entry.title}`} className="mt-0.5 inline-flex size-11 shrink-0 items-center justify-center rounded-[9px] text-ink-3 outline-none transition-colors hover:bg-sunken hover:text-ink focus-visible:ring-2 focus-visible:ring-ember sm:size-9">
            <Pencil aria-hidden strokeWidth={1.75} className="size-4" />
          </Link>
        )}
      </div>
    </li>
  )
}
