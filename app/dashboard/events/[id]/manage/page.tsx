import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { EventManageClient } from '@/components/events/EventManageClient'

export default async function ManageEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, displayName, email, nav } = await getSidebarIdentity()
  const supabase = await createClient()

  const { data: evt } = await supabase.from('events').select('*').eq('id', id).eq('host_id', user.id).maybeSingle()
  if (!evt) notFound()

  const { data: rsvps } = await supabase
    .from('event_rsvps')
    .select('id, status, profiles!user_id(username, display_name)')
    .eq('event_id', id)
    .order('created_at', { ascending: true })

  const { data: demoSlots } = await supabase
    .from('event_demo_slots')
    .select('id, accepted, slot_time, projects!project_id(title), profiles!demoer_id(username, display_name)')
    .eq('event_id', id)

  type Rsvp = { id: string; status: string; profiles: { username: string; display_name: string | null } | null }
  type DemoSlot = { id: string; accepted: boolean; slot_time: string | null; projects: { title: string } | null; profiles: { username: string; display_name: string | null } | null }

  return (
    <AppShell displayName={displayName} email={email} nav={nav} headerLabel="Events">
      <div className="max-w-3xl">
        <Link href={`/events/${id}`} className="inline-flex min-h-11 items-center text-small text-fg-secondary hover:text-fg">← View the event page</Link>
        <h1 className="mt-1 text-h1 font-semibold text-fg [overflow-wrap:anywhere]">{evt.title}</h1>
        <p className="mb-6 mt-1 text-small text-fg-secondary">Manage this event: publish or cancel it, see who is coming, and accept demo requests.</p>
        <EventManageClient event={evt} rsvps={(rsvps ?? []) as unknown as Rsvp[]} demoSlots={(demoSlots ?? []) as unknown as DemoSlot[]} />
      </div>
    </AppShell>
  )
}
