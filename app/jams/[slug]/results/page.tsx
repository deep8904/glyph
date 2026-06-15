import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Trophy, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody } from '@/components/layout/PageShell'
import { JAM_VOTE_CATEGORIES } from '@/lib/supabase/types'

const MEDALS = ['🥇', '🥈', '🥉']

export default async function JamResultsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: jam } = await supabase.from('game_jams').select('id, title, status, admin_approved').eq('slug', slug).maybeSingle()
  if (!jam || !jam.admin_approved || (jam.status !== 'completed' && jam.status !== 'voting')) notFound()

  const { data: entries } = await supabase
    .from('jam_entries')
    .select('id, ranking, votes_count, projects!project_id(title, slug), profiles!team_lead_id(username, display_name)')
    .eq('jam_id', jam.id)
    .order('votes_count', { ascending: false })

  const { data: allVotes } = await supabase
    .from('jam_votes')
    .select('entry_id, category, score')
    .in('entry_id', (entries ?? []).map((e: { id: string }) => e.id))

  type Vote = { entry_id: string; category: string; score: number }
  type Entry = { id: string; ranking: number | null; votes_count: number; projects: { title: string; slug: string | null } | null; profiles: { username: string; display_name: string | null } | null }

  const typedEntries = (entries ?? []) as unknown as Entry[]
  const typedVotes = (allVotes ?? []) as Vote[]

  // Compute per-category averages
  const categoryAvgs = (entryId: string) => {
    return JAM_VOTE_CATEGORIES.map((cat) => {
      const catVotes = typedVotes.filter((v) => v.entry_id === entryId && v.category === cat.value)
      const avg = catVotes.length > 0 ? catVotes.reduce((s, v) => s + v.score, 0) / catVotes.length : null
      return { ...cat, avg }
    })
  }

  return (
    <PageShell wide>
      <PanelHeader breadcrumb={[{ label: 'Jams', href: '/jams' }, { label: jam.title, href: `/jams/${slug}` }, { label: 'Results' }]} />
      <PanelBody>
        <Link href={`/jams/${slug}`} className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-colors mb-6">
          <ArrowLeft className="h-3 w-3" /> Back to jam
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Trophy className="h-6 w-6 text-indigo-500" />
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">{jam.title} — Results</h1>
        </div>

        {typedEntries.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-12">No entries were submitted for this jam.</p>
        ) : (
          <div className="space-y-6">
            {typedEntries.map((entry, i) => {
              const avgs = categoryAvgs(entry.id)
              const totalVoters = allVotes ? new Set(typedVotes.filter((v) => v.entry_id === entry.id).map((v) => v.entry_id)).size : 0
              return (
                <div key={entry.id} className={`rounded-3xl border p-5 sm:p-6 shadow-sm ${i === 0 ? 'border-yellow-200 bg-yellow-50/30' : i === 1 ? 'border-gray-200 bg-gray-50/30' : i === 2 ? 'border-orange-100 bg-orange-50/20' : 'border-gray-100 bg-white'}`}>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {i < 3 && <span className="text-xl">{MEDALS[i]}</span>}
                        {i >= 3 && <span className="text-lg font-mono font-bold text-gray-300">#{i + 1}</span>}
                        <h3 className="text-base font-semibold tracking-tight text-gray-900">{entry.projects?.title ?? 'Untitled'}</h3>
                      </div>
                      <p className="text-[11px] font-mono text-gray-400">by {entry.profiles?.display_name ?? entry.profiles?.username}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-indigo-600">{entry.votes_count}</div>
                      <div className="text-[10px] font-mono text-gray-400">total votes</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {avgs.map((cat) => cat.avg !== null && (
                      <div key={cat.value} className="rounded-xl bg-white border border-gray-100 px-3 py-2">
                        <div className="text-[10px] font-mono text-gray-400 mb-0.5">{cat.label}</div>
                        <div className="text-sm font-semibold text-gray-900">{cat.avg.toFixed(1)}<span className="text-xs font-normal text-gray-400">/5</span></div>
                      </div>
                    ))}
                  </div>
                  {entry.projects?.slug && (
                    <Link href={`/p/${entry.profiles?.username}/${entry.projects.slug}`} className="mt-3 inline-flex items-center text-xs font-mono text-indigo-600 hover:underline">
                      View project →
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </PanelBody>
    </PageShell>
  )
}
