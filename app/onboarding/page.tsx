import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from './_components/OnboardingWizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_done, username, display_name')
    .eq('id', user.id)
    .single()

  if (profile?.onboarding_done && profile?.username) redirect('/feed')

  return (
    <OnboardingWizard
      userId={user.id}
      initialDisplayName={profile?.display_name ?? ''}
    />
  )
}
