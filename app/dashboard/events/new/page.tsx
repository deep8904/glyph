import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody } from '@/components/layout/PageShell'
import { NewEventForm } from '@/components/events/NewEventForm'

export default async function NewEventPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <PageShell>
      <PanelHeader breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Events', href: '/events' }, { label: 'Host Event' }]} />
      <PanelBody>
        <div className="mb-6">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900 mb-1">Host an Event</h1>
          <p className="text-sm text-gray-500">Meetups, showcases, workshops — bring the local gamedev community together.</p>
        </div>
        <NewEventForm />
      </PanelBody>
    </PageShell>
  )
}
