import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody } from '@/components/layout/PageShell'
import { Shield, Users, Flag, Building2, Gamepad2, Star, BookOpen, ToggleLeft } from 'lucide-react'

const ADMIN_SECTIONS = [
  { label: 'Users', href: '/admin/users', icon: Users, description: 'View accounts, suspend users' },
  { label: 'Moderation', href: '/admin/moderation', icon: Flag, description: 'Review flagged content' },
  { label: 'Studios', href: '/admin/studios', icon: Building2, description: 'Verify studio pages' },
  { label: 'Game Jams', href: '/admin/jams', icon: Gamepad2, description: 'Approve pending jams' },
  { label: 'Featured', href: '/admin/featured', icon: Star, description: 'Manage featured listings' },
  { label: 'Audit Log', href: '/admin/audit', icon: BookOpen, description: 'View admin action history' },
  { label: 'Feature Flags', href: '/admin/flags', icon: ToggleLeft, description: 'Toggle product features' },
]

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminUser } = await supabase.from('admin_users').select('role').eq('user_id', user.id).maybeSingle()
  if (!adminUser) redirect('/')

  const [
    { count: pendingMod },
    { count: pendingJams },
    { count: totalUsers },
  ] = await Promise.all([
    supabase.from('moderation_queue').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('game_jams').select('*', { count: 'exact', head: true }).eq('admin_approved', false),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ])

  return (
    <PageShell wide>
      <PanelHeader breadcrumb={[{ label: 'Admin' }]} action={<span className="text-[10px] font-mono text-red-500 uppercase tracking-wider">{adminUser.role}</span>} />
      <PanelBody>
        <div className="flex items-center gap-2 mb-8">
          <Shield className="h-5 w-5 text-red-500" />
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">Admin Dashboard</h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-2xl font-bold text-gray-900">{totalUsers ?? 0}</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mt-1">Total Users</p>
          </div>
          <div className={`rounded-2xl border p-4 ${(pendingMod ?? 0) > 0 ? 'border-red-100 bg-red-50' : 'border-gray-100 bg-gray-50'}`}>
            <p className={`text-2xl font-bold ${(pendingMod ?? 0) > 0 ? 'text-red-600' : 'text-gray-900'}`}>{pendingMod ?? 0}</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mt-1">Pending Reports</p>
          </div>
          <div className={`rounded-2xl border p-4 ${(pendingJams ?? 0) > 0 ? 'border-amber-100 bg-amber-50' : 'border-gray-100 bg-gray-50'}`}>
            <p className={`text-2xl font-bold ${(pendingJams ?? 0) > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{pendingJams ?? 0}</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mt-1">Pending Jams</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-2xl font-bold text-green-600">●</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mt-1">System OK</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ADMIN_SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-100 transition-all p-5"
            >
              <s.icon className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-700 transition-colors">{s.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </PanelBody>
    </PageShell>
  )
}
