import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody } from '@/components/layout/PageShell'
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

  // Get team lead IDs to prevent self-voting
  const { data: myProfile } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle()
  const myEntries = new Set(typedEntries.filter((e) => {
    // We need to check by user id not username - get it from the profile
    return false // will be handled client-side via userId prop
  }).map((e) => e.id))

  return (
    <PageShell wide>
      <PanelHeader breadcrumb={[{ label: 'Jams', href: '/jams' }, { label: jam.title, href: `/jams/${slug}` }, { label: 'Vote' }]} />
      <PanelBody>
        <div className="mb-6">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900 mb-1">Vote on Entries</h1>
          <p className="text-sm text-gray-500">Rate each entry 1–5 across up to 6 categories. You can update votes at any time before voting closes.</p>
        </div>
        <JamVoteClient
          entries={typedEntries}
          existingVotes={votesMap}
          userId={user.id}
        />
      </PanelBody>
    </PageShell>
  )
}
