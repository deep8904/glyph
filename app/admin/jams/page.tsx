import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody, EmptyState } from '@/components/layout/PageShell'
import { AdminJamApprovalClient } from '@/components/admin/AdminJamApprovalClient'
import { Gamepad2 } from 'lucide-react'

export default async function AdminJamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminUser } = await supabase.from('admin_users').select('id, role').eq('user_id', user.id).maybeSingle()
  if (!adminUser) redirect('/')

  const { data: pendingJams } = await supabase
    .from('game_jams')
    .select('id, title, slug, description, start_at, end_at, created_at, profiles!host_id(username, display_name)')
    .eq('admin_approved', false)
    .order('created_at', { ascending: true })

  type PendingJam = { id: string; title: string; slug: string; description: string; start_at: string; end_at: string; created_at: string; profiles: { username: string; display_name: string | null } | null }

  return (
    <PageShell wide>
      <PanelHeader breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Game Jams' }]} />
      <PanelBody>
        {!pendingJams || pendingJams.length === 0 ? (
          <EmptyState
            icon={<Gamepad2 className="h-8 w-8 text-gray-300" />}
            title="No pending jams"
            description="All submitted game jams have been reviewed."
          />
        ) : (
          <AdminJamApprovalClient jams={(pendingJams as unknown as PendingJam[])} />
        )}
      </PanelBody>
    </PageShell>
  )
}
