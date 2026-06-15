import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody } from '@/components/layout/PageShell'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminUser } = await supabase.from('admin_users').select('role').eq('user_id', user.id).maybeSingle()
  if (!adminUser) redirect('/')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, primary_role, is_onboarded, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <PageShell wide>
      <PanelHeader breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Users' }]} />
      <PanelBody>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 mb-6">Users ({profiles?.length ?? 0})</h1>
        <div className="rounded-2xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100">
            <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Username</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Role</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Onboarded</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Joined</span>
          </div>
          {(profiles ?? []).map((p) => (
            <div key={p.id} className="grid grid-cols-4 gap-4 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors items-center">
              <Link href={`/dev/${p.username}`} className="text-sm text-indigo-600 hover:underline font-mono">
                @{p.username}
              </Link>
              <span className="text-xs text-gray-600 capitalize">{p.primary_role ?? '—'}</span>
              <span className={`text-xs font-mono ${p.is_onboarded ? 'text-green-600' : 'text-gray-400'}`}>
                {p.is_onboarded ? 'Yes' : 'No'}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </PanelBody>
    </PageShell>
  )
}
