import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { SettingsNav } from '@/components/settings/SettingsNav'

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { displayName, email } = await getSidebarIdentity()

  return (
    <AppShell displayName={displayName} email={email} headerLabel="Settings">
      <div className="flex flex-col sm:flex-row">
        <SettingsNav />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </AppShell>
  )
}
