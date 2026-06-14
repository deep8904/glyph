import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditProfileForm } from '@/components/settings/EditProfileForm'
import type { Profile } from '@/lib/supabase/types'

export default async function SettingsProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<Profile>()

  if (!profile) redirect('/onboarding')

  return (
    <div>
      <h1 className="text-xl font-medium tracking-tight text-gray-900 mb-1">Edit Profile</h1>
      <p className="text-sm text-gray-500 mb-8">Your public developer identity on Glyph.</p>
      <EditProfileForm profile={profile} />
    </div>
  )
}
