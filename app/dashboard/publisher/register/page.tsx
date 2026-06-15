import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody } from '@/components/layout/PageShell'
import { PublisherRegisterForm } from '@/components/publisher/PublisherRegisterForm'

export default async function PublisherRegisterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: existing } = await supabase.from('publisher_accounts').select('id').eq('user_id', user.id).maybeSingle()
  if (existing) redirect('/dashboard/publisher')

  return (
    <PageShell>
      <PanelHeader breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Publisher', href: '/dashboard/publisher' }, { label: 'Register' }]} />
      <PanelBody>
        <div className="max-w-xl mx-auto">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 mb-1">Register as a Publisher</h1>
          <p className="text-sm text-gray-500 mb-8">
            Publishers can discover indie games, save shortlists, and reach out to developers.
            Your account will be reviewed for verification.
          </p>
          <PublisherRegisterForm />
        </div>
      </PanelBody>
    </PageShell>
  )
}
