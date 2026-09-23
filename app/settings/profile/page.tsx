import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditProfileForm } from '@/components/settings/EditProfileForm'
import { ProfileCompleteness } from '@/components/settings/ProfileCompleteness'
import { SettingsHeading } from '@/components/settings/SettingsSection'
import type { Profile } from '@/lib/supabase/types'

export const metadata = { title: 'Profile — Glyph' }

export default async function SettingsProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle<Profile>()
  if (!profile) redirect('/onboarding')

  return (
    <div>
      <SettingsHeading title="Profile">
        What other people see. It is public: anyone can open <Link href={`/dev/${profile.username}`} className="text-link underline-offset-2 hover:underline">your profile</Link>. Sign-in details are under Account and Security.
      </SettingsHeading>
      <ProfileCompleteness profile={profile} />
      <EditProfileForm profile={profile} />
    </div>
  )
}
