import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody, EmptyState } from '@/components/layout/PageShell'
import { ModerationQueueClient } from '@/components/admin/ModerationQueueClient'
import { Flag } from 'lucide-react'

export default async function AdminModerationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminUser } = await supabase.from('admin_users').select('id, role').eq('user_id', user.id).maybeSingle()
  if (!adminUser) redirect('/')

  const { data: items } = await supabase
    .from('moderation_queue')
    .select('*, profiles!reported_by(username)')
    .in('status', ['pending', 'reviewing'])
    .order('created_at', { ascending: true })
    .limit(50)

  type Item = {
    id: string
    entity_type: string
    entity_id: string
    reason: string
    description: string | null
    status: string
    created_at: string
    profiles: { username: string } | null
  }

  return (
    <PageShell wide>
      <PanelHeader breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Moderation' }]} />
      <PanelBody>
        {!items || items.length === 0 ? (
          <EmptyState
            icon={<Flag className="h-8 w-8 text-gray-300" />}
            title="Queue is clear"
            description="No pending moderation reports."
          />
        ) : (
          <ModerationQueueClient items={(items as unknown as Item[])} adminId={adminUser.id} />
        )}
      </PanelBody>
    </PageShell>
  )
}
