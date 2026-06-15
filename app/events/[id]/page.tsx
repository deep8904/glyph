import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, MapPin, Users, ArrowLeft, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody } from '@/components/layout/PageShell'
import { RsvpButton } from '@/components/events/RsvpButton'

function formatEventDate(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const date = s.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const startTime = s.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const endTime = e.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${date} · ${startTime} – ${endTime}`
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: evt } = await supabase
    .from('events')
    .select('*, profiles!host_id(username, display_name)')
    .eq('id', id)
    .maybeSingle()

  if (!evt || (evt.status !== 'published' && evt.status !== 'completed' && evt.profiles?.username !== user?.id)) notFound()

  type Evt = typeof evt & { profiles: { username: string; display_name: string | null } }
  const e = evt as unknown as Evt

  let rsvpStatus: string | null = null
  if (user) {
    const { data: rsvp } = await supabase.from('event_rsvps').select('status').eq('event_id', id).eq('user_id', user.id).maybeSingle()
    rsvpStatus = rsvp?.status ?? null
  }

  const { data: demoSlots } = await supabase
    .from('event_demo_slots')
    .select('id, accepted, slot_time, projects!project_id(title, slug), profiles!demoer_id(username, display_name)')
    .eq('event_id', id)

  type DemoSlot = { id: string; accepted: boolean; slot_time: string | null; projects: { title: string; slug: string | null } | null; profiles: { username: string; display_name: string | null } | null }
  const slots = (demoSlots ?? []) as unknown as DemoSlot[]
  const acceptedSlots = slots.filter((s) => s.accepted)

  const isHost = e.profiles.username === (user ? (await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle()).data?.username : null)

  return (
    <PageShell>
      <PanelHeader breadcrumb={[{ label: 'Events', href: '/events' }, { label: e.title }]} />
      <PanelBody>
        <Link href="/events" className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-colors mb-4">
          <ArrowLeft className="h-3 w-3" /> All events
        </Link>

        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{e.title}</h1>
          {e.status === 'cancelled' && (
            <span className="shrink-0 inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-mono uppercase tracking-wider text-red-600">Cancelled</span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Hosted by{' '}
          <Link href={`/dev/${e.profiles.username}`} className="text-indigo-600 hover:underline">{e.profiles.display_name ?? e.profiles.username}</Link>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-1">Date & Time</div>
                <div className="text-sm text-gray-900">{formatEventDate(e.start_at, e.end_at)}</div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-1">Location</div>
                <div className="text-sm text-gray-900">
                  {e.venue && <span className="block font-medium">{e.venue}</span>}
                  <span>{e.city}{e.state ? `, ${e.state}` : ''}, {e.country}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" />
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-1">Attendees</div>
                <div className="text-sm text-gray-900">{e.rsvp_count}{e.capacity ? ` / ${e.capacity}` : ''} going</div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 flex items-center gap-2">
            <Link href={`/events/${id}/calendar.ics`} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:underline">
              <ExternalLink className="h-3.5 w-3.5" /> Add to calendar (.ics)
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-3">About this event</h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{e.description}</p>
        </div>

        {acceptedSlots.length > 0 && (
          <div className="mb-8">
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-3">Demo Slots</h2>
            <div className="space-y-2">
              {acceptedSlots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3">
                  <span className="text-sm font-medium text-gray-900">{slot.projects?.title ?? 'Project'}</span>
                  <span className="text-[11px] font-mono text-gray-400">by {slot.profiles?.display_name ?? slot.profiles?.username}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {e.status === 'published' && !isHost && (
          <RsvpButton eventId={id} currentStatus={rsvpStatus} isSignedIn={!!user} />
        )}

        {isHost && (
          <Link href={`/dashboard/events/${id}/manage`} className="inline-flex items-center gap-2 rounded-full border border-indigo-200 px-5 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-all duration-300">
            Manage this event →
          </Link>
        )}
      </PanelBody>
    </PageShell>
  )
}
