import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { EventManageClient } from '@/components/events/EventManageClient'

export default async function ManageEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, displayName, email } = await getSidebarIdentity()
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
    <AppShell displayName={displayName} email={email} headerLabel="Manage Event">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-medium tracking-tight text-gray-900">{evt.title}</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">{new Date(evt.start_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <Link href={`/events/${id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View public page →</Link>
      </div>
      <EventManageClient
        event={evt}
        rsvps={(rsvps ?? []) as unknown as Rsvp[]}
        demoSlots={(demoSlots ?? []) as unknown as DemoSlot[]}
      />
    </AppShell>
  )
}
