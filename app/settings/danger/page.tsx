import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DeleteAccountForm } from '@/components/settings/DeleteAccountForm'

export default async function SettingsDangerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <div>
      <h1 className="text-xl font-medium tracking-tight text-red-600 mb-1">Danger Zone</h1>
      <p className="text-sm text-gray-500 mb-8">These actions are permanent and cannot be undone.</p>
      <DeleteAccountForm username={profile?.username ?? ''} />
    </div>
  )
}
