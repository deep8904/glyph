import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DiscoveryFrame } from '@/components/discovery/DiscoveryFrame'
import { TesterPanel } from '@/components/playtests/TesterPanel'
import { PlaytestStatusControl } from '@/components/playtests/PlaytestStatusControl'
import { PLAYTEST_STATUS, StatusLabel } from '@/components/workflow/StatusLabel'
import { MetadataBar } from '@/components/ui/MetadataBar'
import { BUILD_TYPES } from '@/lib/supabase/types'
import { relativeTime } from '@/lib/utils'

type RequestRow = {
  id: string
  project_id: string
  author_id: string
  build_type: 'browser' | 'download' | 'steam_key'
  platforms: string[]
  description: string
  focus_areas: string[]
  requested_testers: number
  current_testers: number
  status: 'open' | 'full' | 'closed'
  created_at: string
  projects: { title: string; slug: string | null; short_description: string | null } | null
  profiles: { username: string; display_name: string | null }
}

const BUILD_LABELS = Object.fromEntries(BUILD_TYPES.map((b) => [b.value, b.label]))

export default async function PlaytestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Explicit columns only: build_url is not selectable (migration 032). RLS lets
  // strangers see open/full playtests on non-private projects, and lets the
  // developer and any tester with a sign-up see it in every state.
  const { data: req } = await supabase
    .from('playtest_requests')
    .select('id, project_id, author_id, build_type, platforms, description, focus_areas, requested_testers, current_testers, status, created_at, projects!project_id(title, slug, short_description), profiles!author_id(username, display_name)')
    .eq('id', id)
    .maybeSingle<RequestRow>()
  if (!req) notFound()

  const isAuthor = user?.id === req.author_id
  const authorName = req.profiles.display_name || req.profiles.username
  const title = req.projects?.title ?? 'Playtest'

  const { data: session } = user && !isAuthor
    ? await supabase.from('playtest_sessions').select('id, status').eq('request_id', id).eq('tester_id', user.id).maybeSingle()
    : { data: null }

  const showBuild = isAuthor || session?.status === 'accepted' || session?.status === 'completed'
  const { data: buildRows } = showBuild ? await supabase.rpc('get_playtest_build', { p_request: id }) : { data: null }
  const build = (buildRows as { build_url: string; build_type: string }[] | null)?.[0] ?? null

  let waiting = 0
  if (isAuthor) {
    const { count } = await supabase.from('playtest_sessions').select('id', { count: 'exact', head: true }).eq('request_id', id).eq('status', 'requested')
    waiting = count ?? 0
  }

  const st = PLAYTEST_STATUS[req.status]
  const projectHref = req.projects?.slug ? `/p/${req.profiles.username}/${req.projects.slug}` : null
  const left = Math.max(req.requested_testers - req.current_testers, 0)

  return (
    <DiscoveryFrame label="Playtests">
      {() => (
        <article className="max-w-2xl">
          <Link href={isAuthor ? '/dashboard/playtests' : '/playtests/browse'} className="inline-flex min-h-11 items-center text-small text-fg-secondary hover:text-fg">{isAuthor ? '← Your playtests' : '← Playtests'}</Link>

          <header className="mt-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="text-display font-semibold text-fg [overflow-wrap:anywhere]">{title}</h1>
              <StatusLabel label={st.label} tone={st.tone} />
            </div>
            <p className="mt-2 text-body text-fg-secondary">
              {projectHref && <><Link href={projectHref} className="font-medium text-link underline-offset-2 hover:underline">View project</Link> · </>}
              by <Link href={`/dev/${req.profiles.username}`} className="font-medium text-link underline-offset-2 hover:underline">{authorName}</Link> · {relativeTime(req.created_at)}
            </p>
          </header>

          <MetadataBar
            className="mt-5 border-y border-line-subtle py-4"
            items={[
              { label: 'Build', value: BUILD_LABELS[req.build_type] ?? req.build_type },
              { label: 'Platforms', value: req.platforms.length ? req.platforms.join(', ') : 'Any' },
              { label: 'Places', value: `${req.current_testers} of ${req.requested_testers} taken${req.status === 'open' ? ` · ${left} left` : ''}` },
              ...(isAuthor && waiting > 0 ? [{ label: 'Waiting', value: `${waiting} for your decision` }] : []),
            ]}
          />

          <section aria-labelledby="test-about" className="mt-6">
            <h2 id="test-about" className="text-h3 font-semibold text-fg">What to test</h2>
            <p className="mt-2 max-w-prose whitespace-pre-wrap text-body text-fg-secondary [overflow-wrap:anywhere]">{req.description}</p>
            {req.focus_areas.length > 0 && <p className="mt-3 text-body text-fg-secondary"><span className="font-medium text-fg">Focus on:</span> {req.focus_areas.join(', ')}</p>}
          </section>

          <div className="mt-8">
            {isAuthor ? (
              <section aria-labelledby="owner-heading" className="border-t border-line pt-6">
                <h2 id="owner-heading" className="text-h3 font-semibold text-fg">You run this playtest</h2>
                <p className="mb-3 mt-1 max-w-prose text-body text-fg-secondary">
                  {waiting > 0 ? `${waiting} ${waiting === 1 ? 'tester is' : 'testers are'} waiting for your decision. ` : 'Testers request a place on this page; you accept or skip them, and read their feedback, in '}
                  <Link href="/dashboard/playtests" className="font-medium text-link underline-offset-2 hover:underline">your playtests</Link>.
                </p>
                {build && (
                  <p className="mb-4 text-body text-fg-secondary">
                    Testers you accept receive: <span className="break-all font-mono text-small text-fg">{build.build_url}</span>
                  </p>
                )}
                <PlaytestStatusControl requestId={id} status={req.status} />
              </section>
            ) : (
              <TesterPanel requestId={id} signedIn={!!user} requestStatus={req.status} authorName={authorName} session={session ?? null} build={build} />
            )}
          </div>
        </article>
      )}
    </DiscoveryFrame>
  )
}
