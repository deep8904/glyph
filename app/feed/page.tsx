import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { GlyphShell } from '@/components/glyph/shell/GlyphShell'
import { GButton } from '@/components/glyph/ui/primitives'
import { GEmptyState, GErrorState } from '@/components/glyph/ui/States'
import { GlyphFeedEntry } from '@/components/glyph/feed/GlyphFeedEntry'
import { GlyphSuggestedDeveloperRow } from '@/components/glyph/feed/GlyphSuggestedDeveloperRow'
import { classifyCount, classifyCursorParam, classifyFeedPage } from '@/lib/glyph/feedState'
import { classifyProfileGate } from '@/lib/glyph/profileGate'
import { encodeCursor, fetchEngagement, fetchFeedPage, fetchSuggestedDevelopers, parseCursor, type FeedCursor } from '@/lib/feed/queries'
import type { Profile } from '@/lib/supabase/types'

export const metadata = { title: 'Feed — Glyph' }

/**
 * Feed: what the developers I deliberately follow have published since I last looked, newest
 * first. Network content only — the viewer's own devlogs live on Dashboard/Profile, not here.
 * Unranked, keyset-paginated (?cursor=), and honest about every query that can fail along the way.
 */
export default async function FeedPage({ searchParams }: { searchParams: Promise<{ cursor?: string }> }) {
  const { cursor: rawCursor } = await searchParams
  const { user } = await getSidebarIdentity()
  const supabase = await createClient()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, is_onboarded')
    .eq('id', user.id)
    .maybeSingle<Pick<Profile, 'id' | 'is_onboarded'>>()
  const profileGate = classifyProfileGate(profile, profileError, (p) => !!p.is_onboarded)
  if (profileGate.kind === 'redirect') redirect('/onboarding')
  if (profileGate.kind === 'error') {
    return (
      <GlyphShell>
        <div className="mx-auto w-full max-w-2xl">
          <header><h1 className="text-h1 font-semibold tracking-[-0.02em] text-ink">Feed</h1></header>
          <div className="mt-6">
            <GErrorState
              title="We couldn't load your feed"
              description="This may be temporary. Reload to try again."
              action={
                <Link href="/feed" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm px-2 text-small font-medium text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0 sm:min-w-0 sm:px-0">
                  Reload
                </Link>
              }
            />
          </div>
        </div>
      </GlyphShell>
    )
  }

  const cursorState = classifyCursorParam(rawCursor, parseCursor)
  const cursor: FeedCursor | null = cursorState.kind === 'valid' ? cursorState.cursor : null

  const [{ rows, hasMore, error: feedError }, { count: followsCount, error: followsCountError }] = await Promise.all([
    fetchFeedPage(supabase, user.id, cursor),
    supabase.from('follows').select('followed_id', { count: 'exact', head: true }).eq('follower_id', user.id),
  ])
  const following = classifyCount(followsCount, followsCountError)

  const { engagement, error: engagementError } = await fetchEngagement(supabase, rows.map((r) => r.id))
  const pageState = classifyFeedPage({ feedError, rowsCount: rows.length, hasCursor: !!cursor, following })

  const { suggestions, error: suggestionsError } =
    pageState.kind === 'empty-no-follows' || pageState.kind === 'empty-has-follows'
      ? await fetchSuggestedDevelopers(supabase, user.id)
      : { suggestions: [], error: false }

  const reloadHref = rawCursor ? `/feed?cursor=${encodeURIComponent(rawCursor)}` : '/feed'
  const emptyTitle =
    pageState.kind === 'empty-no-follows' ? 'Your feed is empty'
    : pageState.kind === 'empty-unknown-follows' ? 'Nothing to show right now'
    : 'Nothing new from the developers you follow'
  const followingLine =
    following.kind === 'ok'
      ? following.count > 0
        ? `Devlogs from the ${following.count === 1 ? 'developer' : 'developers'} you follow, newest first. Following ${following.count}.`
        : 'Devlogs from the developers you follow, newest first.'
      : 'Devlogs from the developers you follow, newest first.'

  return (
    <GlyphShell>
      <div className="mx-auto w-full max-w-2xl">
        <header>
          <h1 className="text-h1 font-semibold tracking-[-0.02em] text-ink">Feed</h1>
          <p className="mt-1.5 text-body text-ink-2">{followingLine}</p>
          {following.kind === 'error' && <p className="mt-1 text-small text-ink-3">We couldn&apos;t confirm how many developers you follow right now.</p>}
        </header>

        {cursorState.kind === 'malformed' && (
          <p role="status" className="mt-4 text-small text-ink-3">That link looks broken — showing your latest feed instead.</p>
        )}

        {pageState.kind === 'error' && (
          <div className="mt-6">
            <GErrorState title="The feed could not be loaded" description="Your follows are unchanged. This may be temporary." action={<Link href={reloadHref} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm px-2 text-small font-medium text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0 sm:min-w-0 sm:px-0">Retry</Link>} />
          </div>
        )}

        {pageState.kind === 'results' && (
          <>
            {engagementError && <p role="status" className="mt-4 text-small text-ink-3">Reaction and comment counts couldn&apos;t be loaded for this page.</p>}
            <ol aria-label="Devlogs from developers you follow" className="mt-4 border-t border-hair">
              {rows.map((item) => <GlyphFeedEntry key={item.id} item={item} engagement={engagementError ? undefined : engagement.get(item.id)} />)}
            </ol>

            <nav aria-label="Feed pages" className="mt-6 flex flex-wrap items-center justify-between gap-3">
              {cursor ? (
                <GButton asChild variant="ghost" size="touchSm">
                  <Link href="/feed"><ArrowLeft aria-hidden strokeWidth={1.75} className="size-4" /> Back to latest</Link>
                </GButton>
              ) : <span />}
              {hasMore ? (
                <GButton asChild variant="outline" size="touchSm">
                  <Link href={`/feed?cursor=${encodeURIComponent(encodeCursor(rows[rows.length - 1]))}`} rel="next">Older devlogs <ArrowRight aria-hidden strokeWidth={1.75} className="size-4" /></Link>
                </GButton>
              ) : (
                <p className="text-small text-ink-3">That is everything from the developers you follow.</p>
              )}
            </nav>
          </>
        )}

        {pageState.kind === 'past-end' && (
          <div className="mt-6">
            <GEmptyState
              title="No older devlogs"
              description="You have reached the start of what the developers you follow have published."
              action={<Link href="/feed" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm px-2 text-small font-medium text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0 sm:min-w-0 sm:px-0">Back to latest</Link>}
            />
          </div>
        )}

        {(pageState.kind === 'empty-no-follows' || pageState.kind === 'empty-has-follows' || pageState.kind === 'empty-unknown-follows') && (
          <section aria-label={emptyTitle} className="mt-6">
            <GEmptyState
              title={emptyTitle}
              description={
                pageState.kind === 'empty-no-follows' ? 'Follow developers to see the devlogs they publish here, newest first.'
                : pageState.kind === 'empty-unknown-follows' ? 'We couldn’t confirm your follows just now — reload to try again.'
                : `You follow ${pageState.following} ${pageState.following === 1 ? 'developer' : 'developers'}, but none has a public devlog to show yet. New devlogs appear here when they publish.`
              }
            />
            {pageState.kind !== 'empty-unknown-follows' && (
              <div className="mt-8">
                <h2 className="text-h3 font-semibold text-ink">Developers who published recently</h2>
                {suggestionsError ? (
                  <p className="mt-2 text-small text-ink-3">We couldn&apos;t check for developers to suggest right now.</p>
                ) : suggestions.length > 0 ? (
                  <>
                    <p className="mb-2 mt-1 text-small text-ink-3">Ordered by their latest public devlog. Not personalised.</p>
                    <ul className="border-t border-hair">{suggestions.map((dev) => <GlyphSuggestedDeveloperRow key={dev.id} dev={dev} />)}</ul>
                  </>
                ) : (
                  <p className="mt-2 text-small text-ink-2">No other developers have published a public devlog yet.</p>
                )}
              </div>
            )}
            <Link href="/explore" className="mt-6 inline-flex min-h-11 items-center gap-1 text-small font-medium text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">
              Browse all developers and projects <ArrowRight aria-hidden strokeWidth={1.75} className="size-3.5" />
            </Link>
          </section>
        )}
      </div>
    </GlyphShell>
  )
}
