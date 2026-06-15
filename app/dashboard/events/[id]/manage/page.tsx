import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody } from '@/components/layout/PageShell'
import { EventManageClient } from '@/components/events/EventManageClient'

export default async function ManageEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
    <PageShell wide>
      <PanelHeader breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Events', href: '/events' }, { label: evt.title }, { label: 'Manage' }]} />
      <PanelBody>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-gray-900">{evt.title}</h1>
            <p className="text-[11px] font-mono text-gray-400 mt-0.5">{new Date(evt.start_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <Link href={`/events/${id}`} className="text-[11px] font-mono text-indigo-600 hover:underline">View public page →</Link>
        </div>
        <EventManageClient
          event={evt}
          rsvps={(rsvps ?? []) as unknown as Rsvp[]}
          demoSlots={(demoSlots ?? []) as unknown as DemoSlot[]}
        />
      </PanelBody>
    </PageShell>
  )
}
