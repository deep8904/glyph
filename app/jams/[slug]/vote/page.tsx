import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { DiscoveryFrame } from '@/components/discovery/DiscoveryFrame'
import { EmptyState } from '@/components/ui/EmptyState'
import { JamVoteClient } from '@/components/jams/JamVoteClient'

export default async function JamVotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/jams/${slug}/vote`)

  const { data: jam } = await supabase.from('game_jams').select('id, title, status, admin_approved').eq('slug', slug).maybeSingle()
  if (!jam || !jam.admin_approved) notFound()
  if (jam.status !== 'voting') redirect(`/jams/${slug}`)

  const { data: entries } = await supabase
    .from('jam_entries')
    .select('id, submission_url, submission_notes, projects!project_id(title, slug, short_description), profiles!team_lead_id(username, display_name)')
    .eq('jam_id', jam.id)

  type Entry = {
    id: string
    submission_url: string | null
    submission_notes: string | null
    projects: { title: string; slug: string | null; short_description: string | null } | null
    profiles: { username: string; display_name: string | null } | null
  }
  const typedEntries = (entries ?? []) as unknown as Entry[]

  // Get user's existing votes
  const { data: myVotes } = await supabase
    .from('jam_votes')
    .select('entry_id, category, score')
    .eq('voter_id', user.id)
    .in('entry_id', typedEntries.map((e) => e.id))

  type MyVote = { entry_id: string; category: string; score: number }
  const votesMap: Record<string, Record<string, number>> = {}
  for (const v of (myVotes ?? []) as MyVote[]) {
    if (!votesMap[v.entry_id]) votesMap[v.entry_id] = {}
    votesMap[v.entry_id][v.category] = v.score
  }

  return (
    <DiscoveryFrame label="Jams">
      {() => (
        <div className="max-w-3xl">
          <Link href={`/jams/${slug}`} className="inline-flex min-h-11 items-center text-small text-fg-secondary hover:text-fg">← {jam.title}</Link>
          <h1 className="mt-1 text-h1 font-semibold text-fg">Vote on entries</h1>
          <p className="mb-6 mt-1 text-small text-fg-secondary">Rate each entry 1–5 in each category. A score saves when you choose it, and you can change it until voting closes. You cannot vote for your own entry.</p>
          {typedEntries.length === 0 ? (
            <EmptyState kind="first-use" title="No entries to vote on" description="Nobody entered this jam." />
          ) : (
            <JamVoteClient entries={typedEntries} existingVotes={votesMap} />
          )}
        </div>
      )}
    </DiscoveryFrame>
  )
}
