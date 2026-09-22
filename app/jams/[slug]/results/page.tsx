import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DiscoveryFrame } from '@/components/discovery/DiscoveryFrame'
import { EmptyState } from '@/components/ui/EmptyState'
import { JAM_VOTE_CATEGORIES } from '@/lib/supabase/types'

type Vote = { entry_id: string; category: string; score: number }
type Entry = { id: string; ranking: number | null; votes_count: number; projects: { title: string; slug: string | null } | null; profiles: { username: string; display_name: string | null } | null }

/** Standings for a jam in voting or completed: entries ranked by votes, with per-category averages as plain text. Each entry links to its canonical project page. */
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
  const typedEntries = (entries ?? []) as unknown as Entry[]

  const { data: allVotes } = await supabase.from('jam_votes').select('entry_id, category, score').in('entry_id', typedEntries.map((e) => e.id))
  const votes = (allVotes ?? []) as Vote[]
  const averages = (entryId: string) =>
    JAM_VOTE_CATEGORIES.map((cat) => {
      const v = votes.filter((x) => x.entry_id === entryId && x.category === cat.value)
      return { label: cat.label, avg: v.length ? v.reduce((s, x) => s + x.score, 0) / v.length : null }
    }).filter((c) => c.avg !== null) as { label: string; avg: number }[]

  return (
    <DiscoveryFrame label="Jams">
      {() => (
        <div className="max-w-3xl">
          <Link href={`/jams/${slug}`} className="inline-flex min-h-11 items-center text-small text-fg-secondary hover:text-fg">← {jam.title}</Link>
          <h1 className="mt-1 text-h1 font-semibold text-fg [overflow-wrap:anywhere]">{jam.status === 'completed' ? 'Results' : 'Standings so far'}</h1>
          <p className="mt-1 text-small text-fg-secondary">Ranked by total votes. Averages are per voting category, out of 5.</p>

          {typedEntries.length === 0 ? (
            <EmptyState kind="first-use" className="mt-6" title="No entries were submitted" description="There is nothing to rank for this jam." />
          ) : (
            <ol className="mt-6 divide-y divide-line-subtle border-y border-line-subtle">
              {typedEntries.map((entry, i) => {
                const lead = entry.profiles?.username
                const href = lead && entry.projects?.slug ? `/p/${lead}/${entry.projects.slug}` : null
                const avgs = averages(entry.id)
                return (
                  <li key={entry.id} className="flex gap-4 py-4">
                    <span className="w-8 shrink-0 font-mono text-h3 font-semibold text-fg-muted">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-h3 font-semibold text-fg [overflow-wrap:anywhere]">
                        {href ? <Link href={href} className="inline-flex min-h-11 items-center hover:text-link sm:min-h-0">{entry.projects?.title ?? 'Untitled'}</Link> : entry.projects?.title ?? 'Untitled'}
                      </h2>
                      <p className="text-small text-fg-muted">by {entry.profiles?.display_name ?? lead} · <span className="font-mono">{entry.votes_count}</span> {entry.votes_count === 1 ? 'vote' : 'votes'}</p>
                      {avgs.length > 0 && (
                        <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                          {avgs.map((c) => (
                            <div key={c.label} className="flex items-baseline gap-1.5"><dt className="text-small text-fg-muted">{c.label}</dt><dd className="font-mono text-small font-medium text-fg">{c.avg.toFixed(1)}</dd></div>
                          ))}
                        </dl>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      )}
    </DiscoveryFrame>
  )
}
