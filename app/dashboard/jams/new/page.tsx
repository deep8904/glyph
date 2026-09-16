import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { NewJamForm } from '@/components/jams/NewJamForm'

export default async function NewJamPage() {
  const { displayName, email } = await getSidebarIdentity()

  return (
    <AppShell displayName={displayName} email={email} headerLabel="Host a Jam">
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-medium tracking-tight text-gray-900 mb-1">Host a Game Jam</h1>
          <p className="text-sm text-gray-500">Game jams require admin approval before they appear publicly. We&apos;ll review your submission within 48 hours.</p>
        </div>
        <NewJamForm />
      </div>
    </AppShell>
  )
}
