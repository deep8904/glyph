import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, Joystick, Users, CheckCircle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody, EmptyState } from '@/components/layout/PageShell'

type MyRequest = {
  id: string
  build_type: string
  status: string
  requested_testers: number
  current_testers: number
  created_at: string
  projects: { title: string } | null
  playtest_sessions: { id: string; status: string; profiles: { username: string; display_name: string | null } | null }[]
}

type MySession = {
  id: string
  status: string
  created_at: string
  playtest_requests: {
    id: string
    build_type: string
    projects: { title: string } | null
    profiles: { username: string; display_name: string | null } | null
  } | null
  playtest_feedback: { id: string } | null
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-50 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
  full: 'bg-indigo-50 text-indigo-700',
  requested: 'bg-yellow-50 text-yellow-700',
  accepted: 'bg-indigo-50 text-indigo-700',
  completed: 'bg-green-50 text-green-700',
  skipped: 'bg-gray-100 text-gray-500',
}

export default async function DashboardPlaytestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: myRequests }, { data: mySessions }] = await Promise.all([
    supabase
      .from('playtest_requests')
      .select('id, build_type, status, requested_testers, current_testers, created_at, projects!project_id(title), playtest_sessions(id, status, profiles!tester_id(username, display_name))')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('playtest_sessions')
      .select('id, status, created_at, playtest_requests!request_id(id, build_type, projects!project_id(title), profiles!author_id(username, display_name)), playtest_feedback(id)')
      .eq('tester_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const requests = (myRequests ?? []) as unknown as MyRequest[]
  const sessions = (mySessions ?? []) as unknown as MySession[]

  return (
    <PageShell wide>
      <PanelHeader
        breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Playtests' }]}
        action={
          <Link href="/dashboard/playtests/new" className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Request testers</span>
          </Link>
        }
      />
      <PanelBody>
        <div className="space-y-10">
          {/* My Playtest Requests */}
          <section>
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-4">My Playtest Requests</h2>
            {requests.length === 0 ? (
              <div className="text-center py-10 text-sm text-gray-400">No requests yet. <Link href="/dashboard/playtests/new" className="text-indigo-600 hover:underline">Create one →</Link></div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div key={req.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base font-medium text-gray-900">{req.projects?.title ?? 'Project'}</span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${STATUS_COLORS[req.status] ?? 'bg-gray-100 text-gray-500'}`}>{req.status}</span>
                        </div>
                        <span className="text-[11px] font-mono text-gray-400">{req.current_testers}/{req.requested_testers} testers · {req.build_type}</span>
                      </div>
                      <Link href={`/playtests/${req.id}`} className="text-[11px] font-mono text-indigo-600 hover:underline shrink-0">View →</Link>
                    </div>
                    {req.playtest_sessions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-gray-300">Tester sessions</p>
                        {req.playtest_sessions.map((s) => (
                          <div key={s.id} className="flex items-center justify-between rounded-xl border border-gray-50 bg-gray-50 px-3 py-2">
                            <span className="text-sm text-gray-700">{s.profiles?.display_name ?? s.profiles?.username ?? 'Tester'}</span>
                            <span className={`text-[10px] font-mono rounded-full px-2 py-0.5 ${STATUS_COLORS[s.status] ?? 'bg-gray-100 text-gray-500'}`}>{s.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* My Testing Sessions */}
          <section>
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-4">Games I'm Testing</h2>
            {sessions.length === 0 ? (
              <div className="text-center py-10 text-sm text-gray-400">
                You haven't requested to test any games. <Link href="/playtests/browse" className="text-indigo-600 hover:underline">Browse playtests →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => {
                  const req = s.playtest_requests
                  return (
                    <div key={s.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{req?.projects?.title ?? 'Unknown project'}</div>
                        <div className="text-[11px] font-mono text-gray-400">by {req?.profiles?.display_name ?? req?.profiles?.username ?? 'unknown'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono rounded-full px-2 py-0.5 ${STATUS_COLORS[s.status] ?? 'bg-gray-100 text-gray-500'}`}>{s.status}</span>
                        {s.status === 'accepted' && !s.playtest_feedback && (
                          <Link href={`/playtests/${req?.id}/test/${s.id}`} className="text-[11px] font-mono text-indigo-600 hover:underline">
                            Submit feedback →
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </PanelBody>
    </PageShell>
  )
}
