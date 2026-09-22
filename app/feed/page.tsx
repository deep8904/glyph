import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { Shell } from '@/components/shell/Shell'
import { DevlogRow, fromFeedRow } from '@/components/devlog/DevlogRow'
import { DeveloperRow } from '@/components/developer/DeveloperRow'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { encodeCursor, fetchEngagement, fetchFeedPage, fetchSuggestedDevelopers, parseCursor } from '@/lib/feed/queries'
import type { Profile } from '@/lib/supabase/types'

export const metadata = { title: 'Feed — Glyph' }

/**
 * Feed: what the developers I follow have published, newest first.
 * Network content only — the viewer's own devlogs live on their Dashboard and
 * Profile. Ordering is strictly by publish time (no ranking of any kind).
 * Paging is keyset-based via ?cursor= so pages never overlap or skip.
 */
export default async function FeedPage({ searchParams }: { searchParams: Promise<{ cursor?: string }> }) {
  const { cursor: rawCursor } = await searchParams
  const { user } = await getSidebarIdentity()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, is_onboarded')
    .eq('id', user.id)
    .maybeSingle<Pick<Profile, 'id' | 'is_onboarded'>>()
  if (!profile?.is_onboarded) redirect('/onboarding')

  const cursor = parseCursor(rawCursor)
  const [{ rows, hasMore, error }, { count: followsCount }] = await Promise.all([
    fetchFeedPage(supabase, user.id, cursor),
    supabase.from('follows').select('followed_id', { count: 'exact', head: true }).eq('follower_id', user.id),
  ])
  const following = followsCount ?? 0

  const engagement = await fetchEngagement(supabase, rows.map((r) => r.id))
  const suggested = !error && rows.length === 0 && !cursor ? await fetchSuggestedDevelopers(supabase, user.id) : []
  const reloadHref = rawCursor ? `/feed?cursor=${encodeURIComponent(rawCursor)}` : '/feed'

  return (
    <Shell headerLabel="Feed">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-2">
          <h1 className="text-h1 font-semibold text-fg">Feed</h1>
          <p className="mt-1 text-small text-fg-secondary">
            Devlogs from the {following === 1 ? 'developer' : 'developers'} you follow, newest first.
            {following > 0 && <span className="text-fg-muted"> Following {following}.</span>}
          </p>
        </header>

        {error ? (
          <ErrorState className="mt-6" title="The feed could not be loaded" description="Your follows are unchanged. This may be temporary." retryHref={reloadHref} />
        ) : rows.length > 0 ? (
          <>
            <ol aria-label="Devlogs from developers you follow" className="mt-2 divide-y divide-line-subtle border-y border-line-subtle">
              {rows.map((item) => (
                <DevlogRow key={item.id} variant="feed" devlog={fromFeedRow(item)} engagement={engagement.get(item.id)} />
              ))}
            </ol>

            <nav aria-label="Feed pages" className="mt-5 flex flex-wrap items-center justify-between gap-3">
              {cursor ? <Button asChild variant="ghost"><Link href="/feed">← Back to latest</Link></Button> : <span />}
              {hasMore ? (
                <Button asChild variant="secondary">
                  <Link href={`/feed?cursor=${encodeURIComponent(encodeCursor(rows[rows.length - 1]))}`} rel="next">Older devlogs →</Link>
                </Button>
              ) : (
                <p className="text-small text-fg-muted">That is everything from the developers you follow.</p>
              )}
            </nav>
          </>
        ) : cursor ? (
          <EmptyState
            kind="no-results"
            className="mt-6"
            title="No older devlogs"
            description="You have reached the start of what the developers you follow have published."
            action={<Button asChild variant="secondary" size="sm"><Link href="/feed">Back to latest</Link></Button>}
          />
        ) : (
          <section aria-labelledby="quiet-heading" className="mt-6">
            <EmptyState
              kind={following === 0 ? 'first-use' : 'cleared'}
              title={following === 0 ? 'Your feed is empty' : 'Nothing new from the developers you follow'}
              description={
                following === 0
                  ? 'Follow developers to see the devlogs they publish here, newest first.'
                  : `You follow ${following} ${following === 1 ? 'developer' : 'developers'}, but none has a public devlog to show yet. New devlogs appear here when they publish.`
              }
            />
            {suggested.length > 0 ? (
              <div className="mt-8">
                <h2 id="quiet-heading" className="text-h3 font-semibold text-fg">Developers who published recently</h2>
                <p className="mb-2 text-small text-fg-muted">Ordered by their latest public devlog. Not personalised.</p>
                <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                  {suggested.map((dev) => <DeveloperRow key={dev.id} variant="compact" developer={dev} viewerId={user.id} />)}
                </ul>
              </div>
            ) : (
              <p id="quiet-heading" className="mt-6 text-small text-fg-secondary">No other developers have published a public devlog yet.</p>
            )}
            <Button asChild variant="ghost" className="mt-4 -ml-3"><Link href="/explore">Browse all developers and projects →</Link></Button>
          </section>
        )}
      </div>
    </Shell>
  )
}
