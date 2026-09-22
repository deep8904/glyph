import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DeleteAccountFlow } from '@/components/settings/DeleteAccountFlow'
import { SettingsHeading } from '@/components/settings/SettingsSection'
import { ErrorState } from '@/components/ui/ErrorState'
import type { DeletionSummary } from '@/app/actions/account'

export const metadata = { title: 'Delete account — Glyph' }

export default async function SettingsDangerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: summary, error }] = await Promise.all([
    supabase.from('profiles').select('username').eq('id', user.id).maybeSingle(),
    supabase.rpc('account_deletion_summary'),
  ])
  const hasPassword = (user.identities ?? []).some((i) => i.provider === 'email')

  return (
    <div className="max-w-2xl">
      <SettingsHeading title="Delete account">Permanently remove your Glyph account and everything you created.</SettingsHeading>
      {error || !summary || !profile ? (
        <ErrorState title="Deletion is unavailable" description="Your account details could not be loaded. Nothing was changed. Reload to try again." retryHref="/settings/danger" />
      ) : (
        <DeleteAccountFlow username={profile.username} hasPassword={hasPassword} summary={summary as DeletionSummary} />
      )}
    </div>
  )
}
