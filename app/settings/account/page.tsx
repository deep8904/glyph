import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AccountEmailForm } from '@/components/settings/AccountEmailForm'
import { PROVIDER_LABEL } from '@/lib/settings/providers'
import { SettingsHeading, SettingsSection } from '@/components/settings/SettingsSection'

export const metadata = { title: 'Account — Glyph' }

export default async function SettingsAccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const providers = user.identities?.map((i) => i.provider) ?? []

  return (
    <div className="space-y-8 max-w-2xl">
      <SettingsHeading title="Account">Private. Only you see this. What other people see is under Profile.</SettingsHeading>

      <SettingsSection id="acc-signin" title="How you sign in">
        {providers.length > 0 ? (
          <ul className="space-y-1 text-body text-fg">{providers.map((p) => <li key={p}>{PROVIDER_LABEL[p] ?? p}</li>)}</ul>
        ) : (
          <p className="text-small text-fg-secondary">No sign-in method was found for this account.</p>
        )}
        <p className="mt-2 text-small text-fg-secondary">Password and other devices are under <Link href="/settings/security" className="text-link underline-offset-2 hover:underline">Security</Link>.</p>
      </SettingsSection>

      <SettingsSection id="acc-email" title="Email address" description="Used to sign in and for messages from the sign-in provider. It is never shown on your profile. Glyph sends no notification emails.">
        <p className="mb-4 text-body text-fg [overflow-wrap:anywhere]">{user.email}</p>
        <AccountEmailForm currentEmail={user.email ?? ''} />
      </SettingsSection>

      <p className="border-t border-line pt-6 text-small text-fg-secondary">
        To leave Glyph, see <Link href="/settings/danger" className="text-link underline-offset-2 hover:underline">Delete account</Link>.
      </p>
    </div>
  )
}
