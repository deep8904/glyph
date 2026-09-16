import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { PublisherRegisterForm } from '@/components/publisher/PublisherRegisterForm'

export default async function PublisherRegisterPage() {
  const { user, displayName, email } = await getSidebarIdentity()
  const supabase = await createClient()

  const { data: existing } = await supabase.from('publisher_accounts').select('id').eq('user_id', user.id).maybeSingle()
  if (existing) redirect('/dashboard/publisher')

  return (
    <AppShell displayName={displayName} email={email} headerLabel="Register as Publisher">
      <div className="max-w-xl">
        <h1 className="text-2xl font-display font-medium tracking-tight text-gray-900 mb-1">Register as a Publisher</h1>
        <p className="text-sm text-gray-500 mb-8">
          Publishers can discover indie games, save shortlists, and reach out to developers.
          Your account will be reviewed for verification.
        </p>
        <PublisherRegisterForm />
      </div>
    </AppShell>
  )
}
