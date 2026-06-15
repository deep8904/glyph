import Link from 'next/link'
import { Calendar, MapPin, Users, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody, EmptyState } from '@/components/layout/PageShell'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

type EventRow = {
  id: string; title: string; start_at: string; end_at: string; city: string; country: string; rsvp_count: number; type: string
}

export default async function CityEventsPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: rawCity } = await params
  const city = decodeURIComponent(rawCity)
  const supabase = await createClient()

  const { data } = await supabase
    .from('events')
    .select('id, title, start_at, end_at, city, country, rsvp_count, type')
    .eq('status', 'published')
    .ilike('city', `%${city}%`)
    .gte('end_at', new Date().toISOString())
    .order('start_at', { ascending: true })
    .limit(50)

  const events = (data ?? []) as EventRow[]

  return (
    <PageShell wide>
      <PanelHeader breadcrumb={[{ label: 'Events', href: '/events' }, { label: city }]} />
      <PanelBody>
        <Link href="/events" className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-colors mb-6">
          <ArrowLeft className="h-3 w-3" /> All events
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 mb-6">Events in {city}</h1>
        {events.length === 0 ? (
          <EmptyState
            icon={<Calendar className="h-8 w-8 text-gray-300" />}
            title={`No events in ${city}`}
            description="Check back later or host the first event in this city."
            action={<Link href="/events" className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20">Browse all events</Link>}
          />
        ) : (
          <div className="space-y-4">
            {events.map((evt) => (
              <Link key={evt.id} href={`/events/${evt.id}`} className="block group rounded-3xl border border-gray-100 bg-white p-5 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all duration-300">
                <div className="text-base font-medium tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors mb-1">{evt.title}</div>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <span className="flex items-center gap-1 text-[11px] font-mono text-gray-400"><Calendar className="h-3 w-3" />{formatDate(evt.start_at)}</span>
                  <span className="flex items-center gap-1 text-[11px] font-mono text-gray-400"><Users className="h-3 w-3" />{evt.rsvp_count} going</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </PanelBody>
    </PageShell>
  )
}
