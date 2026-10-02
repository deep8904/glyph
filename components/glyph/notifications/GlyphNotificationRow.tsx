import { GAvatar } from '@/components/glyph/ui/primitives'
import { GlyphNotificationLink } from '@/components/glyph/notifications/GlyphNotificationLink'
import { relativeTime } from '@/lib/utils'
import type { PresentedRow } from '@/lib/notifications/present'

/**
 * One notification (or merged group), read as actor → action → object → time. Hierarchy is real
 * typographic weight and a small Ember dot for unread — never color alone (the row also carries a
 * screen-reader-only "Unread." word). A row whose destination is unavailable (object genuinely
 * gone/hidden) or unresolved (its lookup failed) is informational only: no link, and a caption line
 * that states which of those two true things happened — never the same wording for both. Ember is
 * reserved for the unread marker; nothing else in this row uses it.
 */
export function GlyphNotificationRow({ row }: { row: PresentedRow }) {
  const body = (
    <>
      <span className="relative mt-0.5 shrink-0">
        <GAvatar name={row.actorPrimaryName} src={row.actorAvatar} size={40} />
        {row.unread && <span aria-hidden className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-ember ring-2 ring-panel" />}
      </span>
      <span className="min-w-0 flex-1 text-body [overflow-wrap:anywhere]">
        {row.unread && <span className="sr-only">Unread. </span>}
        <span className={row.unread ? 'font-semibold text-ink' : 'font-medium text-ink'}>{row.actors}</span>{' '}
        <span className={row.unread ? 'text-ink' : 'text-ink-2'}>{row.action}</span>
        {row.unavailable && <span className="mt-0.5 block text-small text-ink-3">No longer available: it was deleted, or you can no longer see it.</span>}
        {row.resolutionUnknown && <span className="mt-0.5 block text-small text-ink-3">We couldn&apos;t check this right now.</span>}
      </span>
      <time dateTime={row.time} className="shrink-0 pt-1 text-micro text-ink-3">{relativeTime(row.time)}</time>
    </>
  )

  return (
    <li className="border-b border-hair">
      {row.href ? (
        <GlyphNotificationLink ids={row.ids} unread={row.unread} href={row.href} className="flex min-h-11 items-start gap-3 rounded-sm px-1 py-3 outline-none transition-colors hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-inset">
          {body}
        </GlyphNotificationLink>
      ) : (
        <div className="flex min-h-11 items-start gap-3 px-1 py-3">{body}</div>
      )}
    </li>
  )
}
