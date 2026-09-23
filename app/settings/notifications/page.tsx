import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NotificationPreferencesForm } from '@/components/settings/NotificationPreferencesForm'
import { SettingsHeading, SettingsSection } from '@/components/settings/SettingsSection'
import type { NotificationPrefs } from '@/app/actions/account'

export const metadata = { title: 'Notification settings — Glyph' }

export default async function SettingsNotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase.from('notification_preferences').select('activity, collaboration, playtesting, studios, publisher').eq('user_id', user.id).maybeSingle<NotificationPrefs>()
  const prefs: NotificationPrefs = data ?? { activity: true, collaboration: true, playtesting: true, studios: true, publisher: true }

  return (
    <div className="max-w-2xl space-y-8">
      <SettingsHeading title="Notifications">
        Choose what appears in your <Link href="/notifications" className="text-link underline-offset-2 hover:underline">notification list</Link>. Everything is on until you turn it off.
      </SettingsHeading>

      {error && <p role="alert" className="text-small text-danger">Your saved preferences could not be loaded, so everything is shown as on. Reload before saving.</p>}
      <NotificationPreferencesForm initial={prefs} />

      <SettingsSection id="np-email" title="Email">
        <p className="max-w-prose text-small text-fg-secondary">Glyph does not send notification emails, so there is nothing to configure. Your sign-in provider sends account emails only, such as confirmations.</p>
      </SettingsSection>

      <SettingsSection id="np-rules" title="Always applies">
        <p className="max-w-prose text-small text-fg-secondary">You never receive notifications from people you have blocked or muted, whatever is selected above. Manage them under <Link href="/settings/privacy" className="text-link underline-offset-2 hover:underline">Privacy</Link>.</p>
      </SettingsSection>
    </div>
  )
}
