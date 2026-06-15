import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody } from '@/components/layout/PageShell'
import { FeatureFlagsClient } from '@/components/admin/FeatureFlagsClient'

export default async function AdminFlagsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminUser } = await supabase.from('admin_users').select('role').eq('user_id', user.id).maybeSingle()
  if (!adminUser || adminUser.role !== 'admin') redirect('/admin')

  const { data: flags } = await supabase
    .from('feature_flags')
    .select('id, key, enabled, description, updated_at')
    .order('key')

  return (
    <PageShell wide>
      <PanelHeader breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Feature Flags' }]} />
      <PanelBody>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 mb-6">Feature Flags</h1>
        <FeatureFlagsClient flags={flags ?? []} />
      </PanelBody>
    </PageShell>
  )
}
