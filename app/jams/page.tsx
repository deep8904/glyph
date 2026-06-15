import Link from 'next/link'
import { Trophy, Clock, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody, EmptyState } from '@/components/layout/PageShell'
import { Badge } from '@/components/ui/Badge'

const STATUS_COLORS: Record<string, string> = {
  upcoming: 'bg-blue-50 text-blue-700',
  running: 'bg-green-50 text-green-700',
  voting: 'bg-yellow-50 text-yellow-700',
  completed: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-50 text-red-500',
}

function formatRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(s)} – ${fmt(e)}, ${e.getFullYear()}`
}

type JamRow = {
  id: string; slug: string; title: string; description: string
  theme: string | null; start_at: string; end_at: string; status: string
  profiles: { username: string; display_name: string | null } | null
}

export default async function JamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: active }, { data: past }] = await Promise.all([
    supabase.from('game_jams')
      .select('id, slug, title, description, theme, start_at, end_at, status, profiles!host_id(username, display_name)')
      .eq('admin_approved', true)
      .in('status', ['upcoming', 'running', 'voting'])
      .order('start_at', { ascending: true })
      .limit(20),
    supabase.from('game_jams')
      .select('id, slug, title, description, theme, start_at, end_at, status, profiles!host_id(username, display_name)')
      .eq('admin_approved', true)
      .in('status', ['completed'])
      .order('end_at', { ascending: false })
      .limit(10),
  ])

  const renderJam = (jam: JamRow) => (
    <Link key={jam.id} href={`/jams/${jam.slug}`} className="block group rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all duration-300">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${STATUS_COLORS[jam.status] ?? 'bg-gray-100 text-gray-500'}`}>
          {jam.status}
        </span>
        <h3 className="text-base font-medium tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors">{jam.title}</h3>
      </div>
      {jam.theme && <p className="text-xs font-mono text-indigo-500 mb-1">Theme: {jam.theme}</p>}
      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{jam.description}</p>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-[11px] font-mono text-gray-400">
          <Clock className="h-3 w-3" />{formatRange(jam.start_at, jam.end_at)}
        </span>
        <span className="text-[11px] font-mono text-gray-400">by {jam.profiles?.display_name ?? jam.profiles?.username}</span>
      </div>
    </Link>
  )

  const activeJams = (active ?? []) as unknown as JamRow[]
  const pastJams = (past ?? []) as unknown as JamRow[]

  return (
    <PageShell wide>
      <PanelHeader
        breadcrumb={[{ label: 'Game Jams' }]}
        action={
          user ? (
            <Link href="/dashboard/jams/new" className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Host a Jam</span>
            </Link>
          ) : null
        }
      />
      <PanelBody>
        {activeJams.length === 0 && pastJams.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No game jams yet"
            description="Game jams will appear here once hosted and approved."
            action={
              user ? (
                <Link href="/dashboard/jams/new" className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20">
                  Host a jam
                </Link>
              ) : null
            }
          />
        ) : (
          <div className="space-y-10">
            {activeJams.length > 0 && (
              <section>
                <h2 className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-4">Active & Upcoming</h2>
                <div className="space-y-4">{activeJams.map(renderJam)}</div>
              </section>
            )}
            {pastJams.length > 0 && (
              <section>
                <h2 className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-4">Past Jams</h2>
                <div className="space-y-4">{pastJams.map(renderJam)}</div>
              </section>
            )}
          </div>
        )}
      </PanelBody>
    </PageShell>
  )
}
