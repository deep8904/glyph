import Link from 'next/link'
import { EVENT_TYPES } from '@/lib/supabase/types'
import { isHttpsUrl, markdownExcerpt } from '@/lib/utils'

const TYPE = Object.fromEntries(EVENT_TYPES.map((t) => [t.value, t.label])) as Record<string, string>

// Events carry no stored timezone (an in-person meetup's own local time isn't in the schema), and
// this renders on the server, so an unlabelled time is ambiguous — it looks like "your time" but
// is actually whatever timezone the server process runs in. Force UTC explicitly and always print
// the zone, so the one thing shown is honest rather than silently wrong for most viewers.
export function formatEventWhen(start: string, end: string, long = false) {
  const s = new Date(start)
  const e = new Date(end)
  const time = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' })
  const date = (d: Date) => d.toLocaleDateString('en-US', { ...(long ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' } : { weekday: 'short', month: 'short', day: 'numeric' }), timeZone: 'UTC' })
  const sameDay = s.toLocaleDateString('en-US', { timeZone: 'UTC' }) === e.toLocaleDateString('en-US', { timeZone: 'UTC' })
  if (sameDay) {
    // Print the zone once, at the end, rather than after both times.
    const startTime = time(s).replace(/\s*UTC$/, '')
    return `${date(s)} · ${startTime} – ${time(e)}`
  }
  return `${date(s)} ${time(s)} – ${date(e)} ${time(e)}`
}

export type EventListRow = {
  id: string
  title: string
  description?: string
  city: string
  country?: string
  start_at: string
  end_at: string
  rsvp_count: number
  capacity?: number | null
  type: string
  cover_image_url?: string | null
}

/** One upcoming event: cover when the host added one → what → when → where → how many are going.
 *  The title links to the canonical event page. Renders an <li>. */
export function EventRow({ event }: { event: EventListRow }) {
  const cover = isHttpsUrl(event.cover_image_url) ? event.cover_image_url : null
  return (
    <li className="flex gap-3 py-4">
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" loading="lazy" className="hidden h-14 w-24 shrink-0 rounded-media border border-line bg-surface-muted object-cover sm:block" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-small text-fg-muted">{TYPE[event.type] ?? event.type}</p>
        <h3 className="text-h3 font-semibold text-fg [overflow-wrap:anywhere]">
          <Link href={`/events/${event.id}`} className="inline-flex min-h-11 items-center hover:text-link focus-visible:text-link sm:min-h-0">{event.title}</Link>
        </h3>
        {event.description && <p className="mt-1 line-clamp-2 max-w-prose text-body text-fg-secondary">{markdownExcerpt(event.description, 200)}</p>}
        <p className="mt-2 text-small text-fg-muted">
          <span className="font-medium text-fg-secondary">{formatEventWhen(event.start_at, event.end_at)}</span>
          {' · '}{event.city}{event.country ? `, ${event.country}` : ''}
          {' · '}{event.rsvp_count}{event.capacity ? ` of ${event.capacity}` : ''} going
        </p>
      </div>
    </li>
  )
}
