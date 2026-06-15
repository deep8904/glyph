import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody, EmptyState } from '@/components/layout/PageShell'
import { BookOpen } from 'lucide-react'

export default async function AdminAuditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminUser } = await supabase.from('admin_users').select('role').eq('user_id', user.id).maybeSingle()
  if (!adminUser || adminUser.role !== 'admin') redirect('/admin')

  const { data: entries } = await supabase
    .from('audit_log')
    .select('id, action, target_type, target_id, metadata, created_at, admin_users!admin_id(profiles!user_id(username))')
    .order('created_at', { ascending: false })
    .limit(100)

  type Entry = { id: string; action: string; target_type: string | null; target_id: string | null; metadata: Record<string, unknown>; created_at: string; admin_users: { profiles: { username: string } | null } | null }
  const typedEntries = (entries ?? []) as unknown as Entry[]

  return (
    <PageShell wide>
      <PanelHeader breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Audit Log' }]} />
      <PanelBody>
        {typedEntries.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-8 w-8 text-gray-300" />}
            title="No audit entries"
            description="Admin actions will appear here."
          />
        ) : (
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-900 mb-6">Audit Log</h1>
            <div className="rounded-2xl border border-gray-100 overflow-hidden">
              <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Action</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Target</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Admin</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">When</span>
              </div>
              {typedEntries.map((e) => (
                <div key={e.id} className="grid grid-cols-4 gap-4 px-4 py-3 border-b border-gray-50 items-center">
                  <span className="text-xs font-mono text-gray-700">{e.action}</span>
                  <span className="text-xs text-gray-500 truncate">{e.target_type ?? '—'}</span>
                  <span className="text-xs font-mono text-indigo-500">@{e.admin_users?.profiles?.username ?? '?'}</span>
                  <span className="text-xs text-gray-400 font-mono">
                    {new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </PanelBody>
    </PageShell>
  )
}
