import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { NewEventForm } from '@/components/events/NewEventForm'

export default async function NewEventPage() {
  const { displayName, email, nav } = await getSidebarIdentity()

  return (
    <AppShell displayName={displayName} email={email} nav={nav} headerLabel="Events">
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-h1 font-semibold text-fg">Host an event</h1>
          <p className="mt-1 text-small text-fg-secondary">Meetups, showcases, talks and workshops. Developers RSVP, and can offer their projects for demos.</p>
        </div>
        <NewEventForm />
      </div>
    </AppShell>
  )
}
