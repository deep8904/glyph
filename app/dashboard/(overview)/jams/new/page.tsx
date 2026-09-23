import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { NewJamForm } from '@/components/jams/NewJamForm'

export default async function NewJamPage() {
  const { displayName, email, nav } = await getSidebarIdentity()

  return (
    <AppShell displayName={displayName} email={email} nav={nav} headerLabel="Jams">
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-h1 font-semibold text-fg">Host a game jam</h1>
          <p className="mt-1 text-small text-fg-secondary">A jam is a time-boxed event. People enter existing Glyph projects; you set the dates, rules and theme. The Glyph team reviews it before it appears publicly.</p>
        </div>
        <NewJamForm />
      </div>
    </AppShell>
  )
}
