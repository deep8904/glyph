import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody, EmptyState } from '@/components/layout/PageShell'
import { AdminStudioVerifyClient } from '@/components/admin/AdminStudioVerifyClient'
import { Building2 } from 'lucide-react'

export default async function AdminStudiosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminUser } = await supabase.from('admin_users').select('id, role').eq('user_id', user.id).maybeSingle()
  if (!adminUser) redirect('/')

  const { data: studios } = await supabase
    .from('studios')
    .select('id, slug, name, verified, location, size, created_at')
    .eq('status', 'active')
    .eq('verified', false)
    .order('created_at', { ascending: true })
    .limit(50)

  return (
    <PageShell wide>
      <PanelHeader breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Studios' }]} />
      <PanelBody>
        {!studios || studios.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-8 w-8 text-gray-300" />}
            title="No pending studios"
            description="No studios are awaiting verification."
          />
        ) : (
          <AdminStudioVerifyClient studios={studios} />
        )}
      </PanelBody>
    </PageShell>
  )
}
