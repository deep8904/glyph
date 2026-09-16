import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { NewEventForm } from '@/components/events/NewEventForm'

export default async function NewEventPage() {
  const { displayName, email } = await getSidebarIdentity()

  return (
    <AppShell displayName={displayName} email={email} headerLabel="Host an Event">
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-medium tracking-tight text-gray-900 mb-1">Host an Event</h1>
          <p className="text-sm text-gray-500">Meetups, showcases, workshops — bring the local gamedev community together.</p>
        </div>
        <NewEventForm />
      </div>
    </AppShell>
  )
}
