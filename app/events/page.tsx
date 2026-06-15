import Link from 'next/link'
import { Calendar, MapPin, Users, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody, EmptyState } from '@/components/layout/PageShell'
import { EVENT_TYPES } from '@/lib/supabase/types'

function formatEventDate(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
  if (s.toDateString() === e.toDateString()) {
    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${s.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} – ${e.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
  }
  return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', opts)}`
}

type EventRow = {
  id: string
  title: string
  description: string
  city: string
  country: string
  start_at: string
  end_at: string
  rsvp_count: number
  capacity: number | null
  type: string
  profiles: { username: string; display_name: string | null } | null
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; city?: string }>
}) {
  const { type, city } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('events')
    .select('id, title, description, city, country, start_at, end_at, rsvp_count, capacity, type, profiles!host_id(username, display_name)')
    .eq('status', 'published')
    .gte('end_at', new Date().toISOString())
    .order('start_at', { ascending: true })
    .limit(50)

  if (type) query = query.eq('type', type)
  if (city) query = query.ilike('city', `%${city}%`)

  const { data } = await query
  const events = (data ?? []) as unknown as EventRow[]

  const TYPE_LABELS = Object.fromEntries(EVENT_TYPES.map((t) => [t.value, t.label]))

  return (
    <PageShell wide>
      <PanelHeader
        breadcrumb={[{ label: 'Events' }]}
        action={
          user ? (
            <Link href="/dashboard/events/new" className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Host Event</span>
            </Link>
          ) : null
        }
      />
      <PanelBody>
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Link href="/events" className={`rounded-full px-3 py-1.5 text-xs font-mono transition-all duration-200 ${!type ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</Link>
          {EVENT_TYPES.map((t) => (
            <Link key={t.value} href={`/events?type=${t.value}${city ? `&city=${city}` : ''}`} className={`rounded-full px-3 py-1.5 text-xs font-mono transition-all duration-200 ${type === t.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {t.label}
            </Link>
          ))}
        </div>

        {events.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No upcoming events"
            description="Be the first to host a meetup in your city."
            action={
              user ? (
                <Link href="/dashboard/events/new" className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20">
                  Host an event
                </Link>
              ) : (
                <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20">
                  Join Glyph
                </Link>
              )
            }
          />
        ) : (
          <div className="space-y-4">
            {events.map((evt) => (
              <Link key={evt.id} href={`/events/${evt.id}`} className="block group rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all duration-300">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-base font-medium tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors">{evt.title}</span>
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-indigo-600">
                        {TYPE_LABELS[evt.type] ?? evt.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{evt.description}</p>
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="flex items-center gap-1 text-[11px] font-mono text-gray-400">
                        <Calendar className="h-3 w-3" />
                        {formatEventDate(evt.start_at, evt.end_at)}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-mono text-gray-400">
                        <MapPin className="h-3 w-3" />
                        {evt.city}, {evt.country}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-mono text-gray-400">
                        <Users className="h-3 w-3" />
                        {evt.rsvp_count}{evt.capacity ? `/${evt.capacity}` : ''} going
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </PanelBody>
    </PageShell>
  )
}
