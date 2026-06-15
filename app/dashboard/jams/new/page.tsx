import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody } from '@/components/layout/PageShell'
import { NewJamForm } from '@/components/jams/NewJamForm'

export default async function NewJamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <PageShell>
      <PanelHeader breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Jams', href: '/jams' }, { label: 'Host a Jam' }]} />
      <PanelBody>
        <div className="mb-6">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900 mb-1">Host a Game Jam</h1>
          <p className="text-sm text-gray-500">Game jams require admin approval before they appear publicly. We'll review your submission within 48 hours.</p>
        </div>
        <NewJamForm />
      </PanelBody>
    </PageShell>
  )
}
