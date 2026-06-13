import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import type { Profile } from '@/lib/supabase/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // The dashboard layout already guards auth, but keep this defensive.
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<Profile>()

  // First-time / incomplete onboarding → wizard.
  if (!profile || !profile.is_onboarded) redirect('/onboarding')

  // Surface which optional fields are still empty so the user can complete them.
  const missing: string[] = []
  if (!profile.bio) missing.push('Bio')
  if (!profile.location) missing.push('Location')
  if (!profile.primary_role) missing.push('Role')
  if (!profile.primary_engine) missing.push('Engine')
  if (!profile.experience_level) missing.push('Experience')
  if (!profile.avatar_url) missing.push('Avatar')

  return (
    <DashboardClient
      displayName={profile.display_name || profile.username}
      email={user.email ?? ''}
      username={profile.username}
      missing={missing}
    />
  )
}
