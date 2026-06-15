import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Clock, Users, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody } from '@/components/layout/PageShell'
import { MarkdownRenderer } from '@/components/devlog/MarkdownRenderer'

const STATUS_COLORS: Record<string, string> = {
  upcoming: 'bg-blue-50 text-blue-700',
  running: 'bg-green-50 text-green-700',
  voting: 'bg-yellow-50 text-yellow-700',
  completed: 'bg-gray-100 text-gray-500',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default async function JamDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: jam } = await supabase
    .from('game_jams')
    .select('*, profiles!host_id(username, display_name)')
    .eq('slug', slug)
    .maybeSingle()

  if (!jam || (!jam.admin_approved && jam.profiles?.username !== (user ? (await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle()).data?.username : null))) notFound()

  type Jam = typeof jam & { profiles: { username: string; display_name: string | null } }
  const j = jam as unknown as Jam

  const { data: entries } = await supabase
    .from('jam_entries')
    .select('id, votes_count, projects!project_id(title, slug), profiles!team_lead_id(username, display_name)')
    .eq('jam_id', jam.id)
    .order('votes_count', { ascending: false })
    .limit(20)

  type Entry = { id: string; votes_count: number; projects: { title: string; slug: string | null } | null; profiles: { username: string; display_name: string | null } | null }
  const typedEntries = (entries ?? []) as unknown as Entry[]

  const canSubmit = j.status === 'running' && !!user
  const canVote = j.status === 'voting' && !!user
  const hasResults = j.status === 'completed' || j.status === 'voting'

  return (
    <PageShell wide>
      <PanelHeader breadcrumb={[{ label: 'Jams', href: '/jams' }, { label: j.title }]} />
      <PanelBody>
        <Link href="/jams" className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-colors mb-6">
          <ArrowLeft className="h-3 w-3" /> All jams
        </Link>

        <div className="flex flex-wrap items-start gap-3 mb-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${STATUS_COLORS[j.status] ?? 'bg-gray-100 text-gray-500'}`}>
            {j.status}
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{j.title}</h1>
        </div>
        <p className="text-sm text-gray-500 mb-2">
          Hosted by <Link href={`/dev/${j.profiles.username}`} className="text-indigo-600 hover:underline">{j.profiles.display_name ?? j.profiles.username}</Link>
        </p>
        {j.theme && <p className="text-sm font-medium text-indigo-600 mb-6">Theme: {j.theme}</p>}

        {/* Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {[
            { label: 'Jam Starts', value: j.start_at },
            { label: 'Jam Ends', value: j.end_at },
            { label: 'Voting Opens', value: j.voting_start_at },
            { label: 'Voting Closes', value: j.voting_end_at },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-1">{label}</div>
              <div className="text-sm text-gray-900">{formatDate(value)}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="mb-8">
          <h2 className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-3">About</h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{j.description}</p>
        </div>

        {/* Rules */}
        {j.rules && (
          <div className="mb-8">
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-3">Rules</h2>
            <div className="prose prose-sm max-w-none">
              <MarkdownRenderer content={j.rules} />
            </div>
          </div>
        )}

        {/* Prizes */}
        {j.prizes && Object.keys(j.prizes).length > 0 && (
          <div className="mb-8">
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-3">Prizes</h2>
            <div className="space-y-2">
              {Object.entries(j.prizes as Record<string, string>).map(([place, prize]) => (
                <div key={place} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3">
                  <span className="text-sm font-mono font-semibold text-gray-500 w-16">{place}</span>
                  <span className="text-sm text-gray-900">{prize}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Entries */}
        {typedEntries.length > 0 && (
          <div className="mb-8">
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-3">
              Entries ({typedEntries.length})
            </h2>
            <div className="space-y-2">
              {typedEntries.map((entry, i) => (
                <div key={entry.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3">
                  <div className="flex items-center gap-3">
                    {hasResults && <span className="text-sm font-mono font-semibold text-gray-400 w-6">{i + 1}.</span>}
                    <div>
                      <span className="text-sm font-medium text-gray-900">{entry.projects?.title ?? 'Untitled'}</span>
                      <span className="ml-2 text-[11px] font-mono text-gray-400">by {entry.profiles?.display_name ?? entry.profiles?.username}</span>
                    </div>
                  </div>
                  {hasResults && (
                    <span className="text-[11px] font-mono text-indigo-500">{entry.votes_count} vote{entry.votes_count !== 1 ? 's' : ''}</span>
                  )}
                  {canVote && (
                    <Link href={`/jams/${slug}/vote#entry-${entry.id}`} className="text-xs font-mono text-indigo-600 hover:underline">Vote →</Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-wrap gap-3">
          {canSubmit && (
            <Link href={`/jams/${slug}/submit`} className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5">
              Submit Entry
            </Link>
          )}
          {canVote && (
            <Link href={`/jams/${slug}/vote`} className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20">
              Vote on Entries
            </Link>
          )}
          {j.status === 'completed' && (
            <Link href={`/jams/${slug}/results`} className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20">
              View Results
            </Link>
          )}
        </div>
      </PanelBody>
    </PageShell>
  )
}
