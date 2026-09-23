import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DiscoveryFrame } from '@/components/discovery/DiscoveryFrame'
import { EventRow, type EventListRow } from '@/components/events/EventRow'
import { FilterLinks } from '@/components/discovery/FilterLinks'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EVENT_TYPES } from '@/lib/supabase/types'

export const metadata = { title: 'Events — Glyph' }

/** Today / this week / later — a date-anchored agenda reads faster than a flat list for occurrences. */
function groupByWhen(events: EventListRow[]) {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(startOfToday.getTime() + 86400000)
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 86400000)
  const today: EventListRow[] = []
  const thisWeek: EventListRow[] = []
  const later: EventListRow[] = []
  for (const e of events) {
    const start = new Date(e.start_at)
    if (start < endOfToday) today.push(e)
    else if (start < endOfWeek) thisWeek.push(e)
    else later.push(e)
  }
  return [
    ['Today', today],
    ['This week', thisWeek],
    ['Later', later],
  ] as const
}

/**
 * Events: occurrences people attend — meetups, showcases, talks, workshops. Upcoming first; filter by kind and by city
 * (both live in the URL). An event links to people and projects that already exist in Glyph; it has no content of its own.
 */
export default async function EventsPage({ searchParams }: { searchParams: Promise<{ type?: string; city?: string }> }) {
  const { type: rawType, city: rawCity } = await searchParams
  const type = EVENT_TYPES.some((t) => t.value === rawType) ? rawType! : null
  const city = (rawCity ?? '').trim().slice(0, 100) || null
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('events')
    .select('id, title, description, city, country, start_at, end_at, capacity, type, rsvp_count')
    .eq('status', 'published')
    .gte('end_at', new Date().toISOString())
    .order('start_at', { ascending: true })
    .limit(50)
  if (type) query = query.eq('type', type)
  if (city) query = query.ilike('city', `%${city}%`)
  const { data, error } = await query
  const events = (data ?? []) as EventListRow[]

  const href = (o: { type?: string | null }) => {
    const qs = new URLSearchParams()
    const t = o.type === undefined ? type : o.type
    if (t) qs.set('type', t)
    if (city) qs.set('city', city)
    const s = qs.toString()
    return `/events${s ? `?${s}` : ''}`
  }
  const filtered = !!(type || city)

  return (
    <DiscoveryFrame label="Events">
      {() => (
        <div>
          <header className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-h1 font-semibold text-fg">Events</h1>
              <p className="mt-1 max-w-prose text-small text-fg-secondary">Meetups, showcases, talks and workshops for game developers. Upcoming first.{city && <> Showing events in <span className="font-medium text-fg">{city}</span>. <Link href={href({}).replace(/([?&])city=[^&]*&?/, '$1').replace(/[?&]$/, '')} className="font-medium text-link underline-offset-2 hover:underline">Clear city</Link></>}</p>
            </div>
            {user && <Button asChild variant="secondary" className="shrink-0"><Link href="/dashboard/events/new">Host an event</Link></Button>}
          </header>

          <div className="mt-4">
            <FilterLinks label="Filter events by kind" options={[{ label: 'All kinds', href: href({ type: null }), active: !type }, ...EVENT_TYPES.map((t) => ({ label: t.label, href: href({ type: t.value }), active: type === t.value }))]} />
          </div>

          {error ? (
            <ErrorState className="mt-6" title="Events could not be loaded" description="This may be temporary." retryHref={href({})} />
          ) : events.length === 0 ? (
            <EmptyState
              kind={filtered ? 'no-results' : 'first-use'}
              className="mt-6"
              title={filtered ? 'No upcoming events match' : 'No upcoming events'}
              description={filtered ? 'Try another kind, or clear the city.' : 'Be the first to host a meetup in your city.'}
              action={filtered ? <Link href="/events" className="inline-flex min-h-11 items-center text-small font-medium text-link underline-offset-2 hover:underline">Show all events</Link> : user ? <Button asChild variant="primary" size="sm"><Link href="/dashboard/events/new">Host an event</Link></Button> : <Button asChild variant="primary" size="sm"><Link href="/signup">Join Glyph</Link></Button>}
            />
          ) : (
            <div className="mt-6 space-y-8">
              {groupByWhen(events).map(([label, group]) =>
                group.length === 0 ? null : (
                  <div key={label}>
                    <h2 className="text-h3 font-semibold text-fg">{label}</h2>
                    <ul className="mt-2 divide-y divide-line-subtle border-y border-line-subtle">
                      {group.map((evt) => <EventRow key={evt.id} event={evt} />)}
                    </ul>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}
    </DiscoveryFrame>
  )
}
