import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RelationshipList, type Relationship } from '@/components/settings/RelationshipList'
import { BLOCK_COPY, MUTE_COPY, PrivacyRules } from '@/components/settings/PrivacyRules'
import { SettingsHeading, SettingsSection } from '@/components/settings/SettingsSection'
import { ErrorState } from '@/components/ui/ErrorState'

export const metadata = { title: 'Privacy — Glyph' }

type Row = { created_at: string; profiles: { id: string; username: string; display_name: string | null } | null }

export default async function SettingsPrivacyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Only rows where YOU are the blocker/muter are shown; being blocked is never revealed here.
  const [b, m] = await Promise.all([
    supabase.from('user_blocks').select('created_at, profiles!blocked_id(id, username, display_name)').eq('blocker_id', user.id).order('created_at', { ascending: false }).returns<Row[]>(),
    supabase.from('user_mutes').select('created_at, profiles!muted_id(id, username, display_name)').eq('muter_id', user.id).order('created_at', { ascending: false }).returns<Row[]>(),
  ])
  const toPeople = (rows: Row[] | null): Relationship[] =>
    (rows ?? []).filter((r) => r.profiles).map((r) => ({ userId: r.profiles!.id, username: r.profiles!.username, displayName: r.profiles!.display_name, since: r.created_at }))

  return (
    <div className="max-w-2xl space-y-8">
      <SettingsHeading title="Privacy">Who can see what on Glyph, and the people you have blocked or muted.</SettingsHeading>
      <PrivacyRules />

      <SettingsSection id="priv-block" title="Blocked" description={BLOCK_COPY}>
        {b.error ? <ErrorState inline title="We couldn't load your blocked list" description="Reload to try again." retryHref="/settings/privacy" /> : <RelationshipList kind="block" people={toPeople(b.data)} />}
      </SettingsSection>

      <SettingsSection id="priv-mute" title="Muted" description={MUTE_COPY}>
        {m.error ? <ErrorState inline title="We couldn't load your muted list" description="Reload to try again." retryHref="/settings/privacy" /> : <RelationshipList kind="mute" people={toPeople(m.data)} />}
      </SettingsSection>
    </div>
  )
}
