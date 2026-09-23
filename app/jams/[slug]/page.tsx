import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DiscoveryFrame } from '@/components/discovery/DiscoveryFrame'
import { MarkdownRenderer } from '@/components/devlog/MarkdownRenderer'
import { ObjectHeader } from '@/components/object/ObjectHeader'
import { JAM_PHASE } from '@/components/jams/JamRow'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { MetadataBar } from '@/components/ui/MetadataBar'
import { Section } from '@/components/ui/Section'
import { StatusText } from '@/components/workflow/StatusLabel'
import { StatusSteps, type Step } from '@/components/workflow/StatusSteps'

const dt = (iso: string) => new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

type Entry = { id: string; votes_count: number; projects: { title: string; slug: string | null } | null; profiles: { username: string; display_name: string | null } | null }

/**
 * A jam: who runs it → when (its phases, with where it stands now) → what it is → participation.
 * Participation is entries, and an entry is an existing project — the row links to its canonical page. The jam
 * has no posts or devlogs of its own. Results (votes) are shown only once voting has opened.
 */
export default async function JamDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: jam } = await supabase
    .from('game_jams')
    .select('*, profiles!host_id(username, display_name)')
    .eq('slug', slug)
    .maybeSingle()

  // RLS already limits reads to approved jams and the host's own; this keeps the same 404 for anything else.
  const isHost = !!user && jam?.host_id === user.id
  if (!jam || (!jam.admin_approved && !isHost)) notFound()
  const j = jam as unknown as typeof jam & { profiles: { username: string; display_name: string | null } | null }

  const { data: entries, error: entriesError } = await supabase
    .from('jam_entries')
    .select('id, votes_count, projects!project_id(title, slug), profiles!team_lead_id(username, display_name)')
    .eq('jam_id', jam.id)
    .order('votes_count', { ascending: false })
    .limit(20)
  const typedEntries = (entries ?? []) as unknown as Entry[]

  const status: string = j.status
  const phase = JAM_PHASE[status] ?? { label: status, tone: 'neutral' as const }
  const showResults = status === 'completed' || status === 'voting'
  const steps: Step[] =
    status === 'cancelled'
      ? [{ label: 'This jam was cancelled', state: 'ended' }]
      : [
          { label: 'The jam runs', state: status === 'upcoming' || status === 'running' ? 'current' : 'done', note: `${dt(j.start_at)} → ${dt(j.end_at)}` },
          { label: 'Voting', state: status === 'voting' ? 'current' : status === 'completed' ? 'done' : 'todo', note: `${dt(j.voting_start_at)} → ${dt(j.voting_end_at)}` },
          { label: 'Results', state: status === 'completed' ? 'current' : 'todo', note: status === 'completed' ? 'Final.' : 'Published when voting closes.' },
        ]

  return (
    <DiscoveryFrame label="Jams">
      {() => (
        <article className="max-w-3xl">
          <Link href="/jams" className="inline-flex min-h-11 items-center text-small text-fg-secondary hover:text-fg">← Game jams</Link>

          <ObjectHeader title={j.title} state={<StatusText label={phase.label} tone={phase.tone} />}>
            {j.profiles && <p>Hosted by <Link href={`/dev/${j.profiles.username}`} className="font-medium text-link underline-offset-2 hover:underline">{j.profiles.display_name ?? j.profiles.username}</Link></p>}
            {j.theme && <p><span className="font-medium text-fg">Theme:</span> {j.theme}</p>}
          </ObjectHeader>

          {!j.admin_approved && isHost && (
            <p role="status" className="mt-6 rounded-media border border-warning-line bg-warning-subtle px-4 py-3 text-small text-warning">Awaiting review by the Glyph team. Only you can see this page until it is approved.</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {status === 'running' && (user ? <Button asChild variant="primary"><Link href={`/jams/${slug}/submit`}>Submit a project</Link></Button> : <Button asChild variant="primary"><Link href="/login">Sign in to enter</Link></Button>)}
            {status === 'voting' && (user ? <Button asChild variant="primary"><Link href={`/jams/${slug}/vote`}>Vote on entries</Link></Button> : <Button asChild variant="primary"><Link href="/login">Sign in to vote</Link></Button>)}
            {showResults && <Button asChild variant={status === 'completed' ? 'primary' : 'secondary'}><Link href={`/jams/${slug}/results`}>{status === 'completed' ? 'View results' : 'Standings so far'}</Link></Button>}
          </div>

          <div className="mt-8 space-y-8">
            <Section id="jam-when" title="When"><StatusSteps label="Jam phases" steps={steps} /></Section>

            <Section id="jam-about" title="About">
              <p className="max-w-prose whitespace-pre-wrap text-body text-fg-secondary [overflow-wrap:anywhere]">{j.description}</p>
              <MetadataBar className="mt-4" items={[{ label: 'Team size', value: `up to ${j.max_team_size}` }, { label: 'Pre-made assets', value: j.allow_existing_assets ? 'Allowed' : 'Not allowed' }]} />
            </Section>

            {j.rules && <Section id="jam-rules" title="Rules"><MarkdownRenderer content={j.rules} className="max-w-2xl" /></Section>}

            {j.prizes && Object.keys(j.prizes).length > 0 && (
              <Section id="jam-prizes" title="Prizes">
                <dl className="divide-y divide-line-subtle border-y border-line-subtle">
                  {Object.entries(j.prizes as Record<string, string>).map(([place, prize]) => (
                    <div key={place} className="flex gap-4 py-2"><dt className="w-20 shrink-0 text-small font-medium text-fg-muted">{place}</dt><dd className="text-body text-fg">{prize}</dd></div>
                  ))}
                </dl>
              </Section>
            )}

            <Section id="jam-entries" title="Entries" count={typedEntries.length || undefined} description="Projects entered in this jam. Each opens its own project page.">
              {entriesError ? (
                <EmptyState kind="restricted" className="border-y-0 py-2" title="Entries could not be loaded" description="Reload the page to try again." />
              ) : typedEntries.length === 0 ? (
                <EmptyState kind="first-use" className="border-y-0 py-2" title="No entries yet" description={status === 'upcoming' ? 'Entries open when the jam starts.' : status === 'running' ? 'Be the first to enter a project.' : 'Nobody entered this jam.'} />
              ) : (
                <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                  {typedEntries.map((entry, i) => {
                    const lead = entry.profiles?.username
                    const href = lead && entry.projects?.slug ? `/p/${lead}/${entry.projects.slug}` : null
                    return (
                      <li key={entry.id} className="flex items-center gap-3 py-3">
                        {showResults && <span className="w-6 shrink-0 font-mono text-small text-fg-muted">{i + 1}</span>}
                        <div className="min-w-0 flex-1">
                          <p className="text-body font-medium text-fg [overflow-wrap:anywhere]">
                            {href ? <Link href={href} className="inline-flex min-h-11 items-center hover:text-link sm:min-h-0">{entry.projects?.title ?? 'Untitled'}</Link> : entry.projects?.title ?? 'Untitled'}
                          </p>
                          <p className="text-small text-fg-muted">by {entry.profiles?.display_name ?? lead}</p>
                        </div>
                        {showResults && <span className="shrink-0 font-mono text-small text-fg-secondary">{entry.votes_count} {entry.votes_count === 1 ? 'vote' : 'votes'}</span>}
                      </li>
                    )
                  })}
                </ul>
              )}
            </Section>
          </div>
        </article>
      )}
    </DiscoveryFrame>
  )
}
