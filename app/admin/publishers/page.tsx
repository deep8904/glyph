import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody, EmptyState } from '@/components/layout/PageShell'
import { AdminPublisherVerifyClient } from '@/components/admin/AdminPublisherVerifyClient'
import { Building2 } from 'lucide-react'

type Row = { id: string; company_name: string; description: string | null; website: string | null; created_at: string; profiles: { username: string } | null }

export default async function AdminPublishersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: adminUser } = await supabase.from('admin_users').select('id').eq('user_id', user.id).maybeSingle()
  if (!adminUser) redirect('/')

  // The admin read policy on publisher_accounts (migration 034) is what lets unverified accounts appear here.
  const { data } = await supabase
    .from('publisher_accounts')
    .select('id, company_name, description, website, created_at, profiles!user_id(username)')
    .eq('verified', false)
    .order('created_at', { ascending: true })
    .limit(50)
    .returns<Row[]>()
  const rows = (data ?? []).map((r) => ({ id: r.id, company_name: r.company_name, description: r.description, website: r.website, created_at: r.created_at, username: r.profiles?.username ?? null }))

  return (
    <PageShell wide>
      <PanelHeader breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Publishers' }]} />
      <PanelBody>
        {rows.length === 0 ? (
          <EmptyState icon={<Building2 className="h-8 w-8 text-gray-300" />} title="No pending publishers" description="No publisher accounts are awaiting verification." />
        ) : (
          <AdminPublisherVerifyClient publishers={rows} />
        )}
      </PanelBody>
    </PageShell>
  )
}
