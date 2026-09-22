import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PasswordForm } from '@/components/settings/PasswordForm'
import { SignOutOthers } from '@/components/settings/SignOutOthers'
import { SettingsHeading, SettingsSection } from '@/components/settings/SettingsSection'
import { PROVIDER_LABEL } from '@/lib/settings/providers'

export const metadata = { title: 'Security — Glyph' }

export default async function SettingsSecurityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const providers = user.identities?.map((i) => i.provider) ?? []
  const hasPassword = providers.includes('email')

  return (
    <div className="max-w-2xl space-y-8">
      <SettingsHeading title="Security">Glyph signs you in with a password or a GitHub or Google account. Glyph does not offer two-factor authentication or a list of individual sessions.</SettingsHeading>

      <SettingsSection id="sec-pw" title="Password">
        {hasPassword ? (
          <PasswordForm email={user.email ?? ''} />
        ) : (
          <p className="max-w-prose text-small text-fg-secondary">You sign in with {providers.map((p) => PROVIDER_LABEL[p] ?? p).join(' or ') || 'a provider'}, so there is no Glyph password to change. Manage your password with that provider.</p>
        )}
      </SettingsSection>

      <SettingsSection id="sec-devices" title="Devices" description="If you signed in on a device you no longer control, end every other session. You stay signed in here.">
        <SignOutOthers />
      </SettingsSection>
    </div>
  )
}
