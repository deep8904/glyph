import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AccountForm } from '@/components/settings/AccountForm'

export default async function SettingsAccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const providers = user.identities?.map((i) => i.provider) ?? []

  return (
    <div>
      <h1 className="text-xl font-medium tracking-tight text-gray-900 mb-1">Account</h1>
      <p className="text-sm text-gray-500 mb-8">Email, password, and connected providers.</p>
      <AccountForm
        currentEmail={user.email ?? ''}
        providers={providers}
        hasPassword={providers.includes('email')}
      />
    </div>
  )
}
