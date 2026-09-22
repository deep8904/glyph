import Link from 'next/link'
import { EVENT_TYPES } from '@/lib/supabase/types'
import { markdownExcerpt } from '@/lib/utils'

const TYPE = Object.fromEntries(EVENT_TYPES.map((t) => [t.value, t.label])) as Record<string, string>

export function formatEventWhen(start: string, end: string, long = false) {
  const s = new Date(start)
  const e = new Date(end)
  const time = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const date = (d: Date) => d.toLocaleDateString('en-US', long ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' } : { weekday: 'short', month: 'short', day: 'numeric' })
  if (s.toDateString() === e.toDateString()) return `${date(s)} · ${time(s)} – ${time(e)}`
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
}

/** One upcoming event: what → when → where → how many are going. The title links to the canonical event page. Renders an <li>. */
export function EventRow({ event }: { event: EventListRow }) {
  return (
    <li className="py-4">
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
    </li>
  )
}
