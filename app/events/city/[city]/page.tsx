import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DiscoveryFrame } from '@/components/discovery/DiscoveryFrame'
import { EventRow, type EventListRow } from '@/components/events/EventRow'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'

/** Upcoming events in one city. Same rows as the main list; the city is the only filter. */
export default async function CityEventsPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: rawCity } = await params
  const city = decodeURIComponent(rawCity).slice(0, 100)
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select('id, title, description, start_at, end_at, city, country, capacity, type, rsvp_count')
    .eq('status', 'published')
    .ilike('city', `%${city}%`)
    .gte('end_at', new Date().toISOString())
    .order('start_at', { ascending: true })
    .limit(50)
  const events = (data ?? []) as EventListRow[]

  return (
    <DiscoveryFrame label="Events">
      {() => (
        <div>
          <Link href="/events" className="inline-flex min-h-11 items-center text-small text-fg-secondary hover:text-fg">← All events</Link>
          <h1 className="mt-1 text-h1 font-semibold text-fg [overflow-wrap:anywhere]">Events in {city}</h1>
          {error ? (
            <ErrorState className="mt-6" title="Events could not be loaded" description="This may be temporary." retryHref={`/events/city/${encodeURIComponent(city)}`} />
          ) : events.length === 0 ? (
            <EmptyState kind="no-results" className="mt-6" title={`No upcoming events in ${city}`} description="Check back later, or host the first one." action={<Button asChild variant="secondary" size="sm"><Link href="/events">Browse all events</Link></Button>} />
          ) : (
            <ul className="mt-2 divide-y divide-line-subtle border-y border-line-subtle">{events.map((evt) => <EventRow key={evt.id} event={evt} />)}</ul>
          )}
        </div>
      )}
    </DiscoveryFrame>
  )
}
