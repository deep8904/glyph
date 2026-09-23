import { AppShell } from '@/components/dashboard/AppShell'
import { SettingsNav } from '@/components/settings/SettingsNav'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell headerLabel="Settings">
      <div className="flex max-w-4xl flex-col sm:flex-row">
        <SettingsNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </AppShell>
  )
}
