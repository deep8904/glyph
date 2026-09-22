import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DiscoveryFrame } from '@/components/discovery/DiscoveryFrame'
import { RsvpButton } from '@/components/events/RsvpButton'
import { DemoSlotRequest } from '@/components/events/DemoSlotRequest'
import { formatEventWhen } from '@/components/events/EventRow'
import { ObjectHeader } from '@/components/object/ObjectHeader'
import { Button } from '@/components/ui/Button'
import { MetadataBar } from '@/components/ui/MetadataBar'
import { Section } from '@/components/ui/Section'
import { StatusText } from '@/components/workflow/StatusLabel'
import { EVENT_TYPES } from '@/lib/supabase/types'

const TYPE_LABELS = Object.fromEntries(EVENT_TYPES.map((t) => [t.value, t.label])) as Record<string, string>

type DemoSlot = { id: string; accepted: boolean; demoer_id: string; projects: { title: string; slug: string | null } | null; profiles: { username: string; display_name: string | null } | null }

/**
 * An event: what it is and when/where → who is going → what is being shown. What is shown are demo slots for
 * projects that already exist in Glyph (each links to its project page). The host manages it from the dashboard.
 */
export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: evt } = await supabase.from('events').select('*, profiles!host_id(username, display_name)').eq('id', id).maybeSingle()
  // events_read (RLS) already limits reads to published/completed events and the host's own draft/cancelled ones.
  if (!evt) notFound()
  const e = evt as unknown as typeof evt & { profiles: { username: string; display_name: string | null } | null }
  const isHost = !!user && e.host_id === user.id
  if (e.status !== 'published' && e.status !== 'completed' && !isHost) notFound()

  const [{ data: rsvp }, { data: demoSlots }, { data: myProjects }] = await Promise.all([
    user ? supabase.from('event_rsvps').select('status').eq('event_id', id).eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from('event_demo_slots').select('id, accepted, demoer_id, projects!project_id(title, slug), profiles!demoer_id(username, display_name)').eq('event_id', id),
    user && !isHost && e.status === 'published' && new Date(e.end_at).getTime() > new Date().getTime() ? supabase.from('projects').select('id, title').eq('owner_id', user.id).order('title') : Promise.resolve({ data: null }),
  ])
  const rsvpStatus = rsvp?.status ?? null
  const slots = (demoSlots ?? []) as unknown as DemoSlot[]
  const acceptedSlots = slots.filter((s) => s.accepted)
  // Accepted slots are public (migration 039); a pending/rejected slot is still visible only to its
  // demoer and the host. Match on demoer_id rather than assuming "any slot returned is mine" — once
  // accepted slots are public, a non-host viewer's query can return other people's accepted slots too.
  const mySlot = user && !isHost ? slots.find((s) => s.demoer_id === user.id) ?? null : null
  const goingCount = e.rsvp_count ?? 0
  // A published event whose end time has passed is over, even though nobody flipped its status.
  const ended = e.status === 'published' && new Date(e.end_at).getTime() < new Date().getTime()
  const state = ended ? { label: 'Ended', tone: 'negative' as const } : e.status === 'cancelled' ? { label: 'Cancelled', tone: 'negative' as const } : e.status === 'completed' ? { label: 'Finished', tone: 'negative' as const } : e.status === 'draft' ? { label: 'Draft — only you can see it', tone: 'attention' as const } : null

  return (
    <DiscoveryFrame label="Events">
      {() => (
        <article className="max-w-3xl">
          <Link href="/events" className="inline-flex min-h-11 items-center text-small text-fg-secondary hover:text-fg">← Events</Link>

          <ObjectHeader eyebrow={TYPE_LABELS[e.type] ?? 'Event'} title={e.title} state={state ? <StatusText label={state.label} tone={state.tone} /> : undefined}>
            {e.profiles && <p>Hosted by <Link href={`/dev/${e.profiles.username}`} className="font-medium text-link underline-offset-2 hover:underline">{e.profiles.display_name ?? e.profiles.username}</Link></p>}
          </ObjectHeader>

          <MetadataBar
            className="mt-5 border-y border-line-subtle py-4"
            layout="stacked"
            items={[
              { label: 'When', value: formatEventWhen(e.start_at, e.end_at, true) },
              { label: 'Where', value: [e.venue, `${e.city}${e.state ? `, ${e.state}` : ''}, ${e.country}`].filter(Boolean).join(' — ') },
              { label: 'Going', value: `${goingCount}${e.capacity ? ` of ${e.capacity}` : ''}` },
              { label: 'Calendar', value: <Link href={`/events/${id}/calendar.ics`} className="text-link underline-offset-2 hover:underline">Add to calendar (.ics)</Link> },
            ]}
          />

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {e.status === 'published' && !ended && !isHost && <RsvpButton eventId={id} currentStatus={rsvpStatus} isSignedIn={!!user} />}
            {isHost && <Button asChild variant="secondary"><Link href={`/dashboard/events/${id}/manage`}>Manage this event</Link></Button>}
          </div>

          <div className="mt-8 space-y-8">
            <Section id="event-about" title="About"><p className="max-w-prose whitespace-pre-wrap text-body text-fg-secondary [overflow-wrap:anywhere]">{e.description}</p></Section>

            {acceptedSlots.length > 0 && (
              <Section id="event-demos" title="Being shown" description="Projects with an accepted demo slot. Each opens its project page.">
                <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                  {acceptedSlots.map((slot) => {
                    const owner = slot.profiles?.username
                    const href = owner && slot.projects?.slug ? `/p/${owner}/${slot.projects.slug}` : null
                    return (
                      <li key={slot.id} className="py-3">
                        <p className="text-body font-medium text-fg">{href ? <Link href={href} className="inline-flex min-h-11 items-center hover:text-link sm:min-h-0">{slot.projects?.title}</Link> : slot.projects?.title ?? 'Project'}</p>
                        <p className="text-small text-fg-muted">by {slot.profiles?.display_name ?? owner}</p>
                      </li>
                    )
                  })}
                </ul>
              </Section>
            )}

            {user && !isHost && e.status === 'published' && !ended && myProjects && (
              <Section id="event-demo-request" title="Demo a project" description="Offer one of your projects for this event. The host decides.">
                <DemoSlotRequest eventId={id} projects={myProjects as { id: string; title: string }[]} existing={mySlot ? { accepted: mySlot.accepted, title: mySlot.projects?.title ?? 'Your project' } : null} />
              </Section>
            )}
          </div>
        </article>
      )}
    </DiscoveryFrame>
  )
}
