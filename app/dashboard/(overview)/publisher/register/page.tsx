import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { PublisherRegisterForm } from '@/components/publisher/PublisherRegisterForm'

export default async function PublisherRegisterPage() {
  const { user, displayName, email, nav } = await getSidebarIdentity()
  const supabase = await createClient()

  const { data: existing } = await supabase.from('publisher_accounts').select('id').eq('user_id', user.id).maybeSingle()
  if (existing) redirect('/dashboard/publisher')

  return (
    <AppShell displayName={displayName} email={email} nav={nav} headerLabel="Publisher">
      <div className="max-w-xl">
        <h1 className="text-h1 font-semibold text-fg">Register as a publisher</h1>
        <p className="mb-8 mt-1 text-small text-fg-secondary">Publishers can discover indie games, save private shortlists, and reach out to developers about public projects. Your account is reviewed for verification before it is listed.</p>
        <PublisherRegisterForm />
      </div>
    </AppShell>
  )
}
