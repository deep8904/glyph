import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DiscoveryFrame } from '@/components/discovery/DiscoveryFrame'
import { PlaytestListing, type ListingPlaytest } from '@/components/playtests/PlaytestListing'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { SESSION_STATUS } from '@/components/workflow/StatusLabel'

export const metadata = { title: 'Playtests — Glyph' }

const PAGE_LIMIT = 50

type MySession = { id: string; status: string; playtest_requests: { id: string; projects: { title: string } | null; profiles: { username: string; display_name: string | null } | null } | null }

// What the tester should do next, by state — the one line under each of their sign-ups.
const NEXT: Record<string, string> = {
  requested: 'Waiting for the developer',
  accepted: 'Get the build and send feedback',
}

/**
 * Playtests, from the tester's side: games that need testers. Request a place, wait for the developer, get the
 * build, play, send feedback. (Collaborate — people and projects that need contributors — is a different page.)
 * Viewer-relative: private projects, closed/full playtests and anyone the viewer has a block/mute with are
 * excluded by the view, not here.
 */
export default async function PlaytestsBrowsePage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('discoverable_playtests')
    .select('id, build_type, platforms, description, focus_areas, requested_testers, current_testers, created_at, project_title, username, display_name')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(PAGE_LIMIT)
    .returns<ListingPlaytest[]>()
  const rows = data ?? []

  return (
    <DiscoveryFrame label="Playtests">
      {async (viewer) => {
        const { data: mine } = viewer
          ? await supabase
              .from('playtest_sessions')
              .select('id, status, playtest_requests!request_id(id, projects!project_id(title), profiles!author_id(username, display_name))')
              .eq('tester_id', viewer.id)
              .in('status', ['requested', 'accepted'])
              .order('created_at', { ascending: false })
              .limit(5)
              .returns<MySession[]>()
          : { data: null }
        const active = (mine ?? []).filter((s) => s.playtest_requests)

        return (
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-x-10">
            <header className="lg:col-span-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-h1 font-semibold text-fg">Playtests</h1>
                  <p className="mt-1 max-w-prose text-small text-fg-secondary">
                    Games that need testers. Request a place, play the build once the developer accepts you, and send them feedback. Looking for people to build with? See <Link href="/collaborate" className="font-medium text-link underline-offset-2 hover:underline">Collaborate</Link>.
                  </p>
                </div>
                {viewer && <Button asChild variant="secondary" className="shrink-0"><Link href="/dashboard/playtests">Manage your playtests</Link></Button>}
              </div>
            </header>

            {active.length > 0 && (
              <aside aria-label="Your sign-ups" className="mt-6 lg:order-2 lg:mt-8">
                <SectionHeader id="mine" title="You are testing" count={active.length} className="mb-1" />
                <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                  {active.map((s) => (
                    <PlaytestListing
                      key={s.id}
                      variant="mine"
                      playtest={{ id: s.playtest_requests!.id, project_title: s.playtest_requests!.projects?.title ?? 'Playtest', username: s.playtest_requests!.profiles?.username, display_name: s.playtest_requests!.profiles?.display_name }}
                      status={SESSION_STATUS[s.status]}
                      hint={NEXT[s.status]}
                    />
                  ))}
                </ul>
              </aside>
            )}

            <section aria-labelledby="open-playtests" className={active.length > 0 ? 'mt-8 lg:order-1' : 'mt-6 lg:col-span-2'}>
              <SectionHeader id="open-playtests" title="Open playtests" description="Newest first. Only games with places left are listed." className="mb-1" />
              {error ? (
                <ErrorState className="mt-3" title="Playtests could not be loaded" description="This may be temporary." retryHref="/playtests/browse" />
              ) : rows.length === 0 ? (
                <EmptyState
                  kind="cleared"
                  className="mt-3"
                  title="No playtests are open right now"
                  description={viewer ? 'Games appear here while they have places left. Have a build of your own to test?' : 'Games appear here while they have places left. Sign in to request testers for your own game.'}
                  action={viewer ? <Button asChild variant="primary" size="sm"><Link href="/dashboard/playtests/new">Request testers</Link></Button> : <Button asChild variant="primary" size="sm"><Link href="/login">Sign in</Link></Button>}
                />
              ) : (
                <>
                  <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                    {rows.map((r) => <PlaytestListing key={r.id} playtest={r} />)}
                  </ul>
                  {rows.length === PAGE_LIMIT && <p className="mt-3 text-small text-fg-muted">Showing the {PAGE_LIMIT} most recent playtests.</p>}
                </>
              )}
            </section>
          </div>
        )
      }}
    </DiscoveryFrame>
  )
}
