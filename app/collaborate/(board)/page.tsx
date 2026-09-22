import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DiscoveryFrame } from '@/components/discovery/DiscoveryFrame'
import { CollaborationListing, type ListingPost } from '@/components/collaborate/CollaborationListing'
import { FilterLinks } from '@/components/discovery/FilterLinks'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { TabLinks } from '@/components/ui/Tabs'
import { APPLICATION_STATUS, POST_STATUS } from '@/components/workflow/StatusLabel'

export const metadata = { title: 'Collaborate — Glyph' }

const PAGE_LIMIT = 50

type MyPost = { id: string; post_type: string; role_needed: string | null; role_offered: string | null; status: string; expires_at: string; projects: { title: string } | null }
type MyApplication = {
  id: string
  status: string
  created_at: string
  collaboration_posts: { id: string; post_type: string; role_needed: string | null; role_offered: string | null; status: string; projects: { title: string } | null; profiles: { display_name: string | null; username: string } | null } | null
}

// What the applicant should understand at a glance: where it stands and what, if anything, they can do.
const APPLICATION_HINT: Record<string, string> = {
  pending: 'Waiting for review',
  accepted: 'Accepted — follow up on their profile',
  rejected: 'Not selected',
  withdrawn: 'You withdrew',
}

/**
 * Collaborate = an opportunity board: projects that need contributors and developers offering their skills.
 * (Playtests — games that need testers — is a different workflow with its own page.)
 */
export default async function CollaboratePage({ searchParams }: { searchParams: Promise<{ type?: string; remote?: string }> }) {
  const sp = await searchParams
  const type = sp.type === 'seeking_collaborator' || sp.type === 'available_to_collaborate' ? sp.type : null
  const remote = sp.remote === 'true'
  const supabase = await createClient()

  const href = (o: { type?: string | null; remote?: boolean }) => {
    const qs = new URLSearchParams()
    const t = o.type === undefined ? type : o.type
    const r = o.remote === undefined ? remote : o.remote
    if (t) qs.set('type', t)
    if (r) qs.set('remote', 'true')
    const s = qs.toString()
    return `/collaborate${s ? `?${s}` : ''}`
  }

  let query = supabase
    .from('discoverable_collab_posts')
    .select('id, post_type, role_needed, role_offered, contract_type, remote_allowed, location, description, created_at, project_title, username, display_name')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(PAGE_LIMIT)
  if (type) query = query.eq('post_type', type)
  if (remote) query = query.eq('remote_allowed', true)
  const { data, error } = await query.returns<ListingPost[]>()
  const posts = data ?? []

  return (
    <DiscoveryFrame label="Collaborate">
      {async (viewer) => {
        const [mine, applied] = viewer
          ? await Promise.all([
              supabase
                .from('collaboration_posts')
                .select('id, post_type, role_needed, role_offered, status, expires_at, projects!project_id(title)')
                .eq('author_id', viewer.id)
                .order('created_at', { ascending: false })
                .limit(10)
                .returns<MyPost[]>(),
              supabase
                .from('collaboration_applications')
                .select('id, status, created_at, collaboration_posts!inner(id, post_type, role_needed, role_offered, status, projects!project_id(title), profiles!author_id(display_name, username))')
                .eq('applicant_id', viewer.id)
                .order('created_at', { ascending: false })
                .limit(10)
                .returns<MyApplication[]>(),
            ])
          : [{ data: null }, { data: null }]
        const myPosts = mine.data ?? []
        const myApps = (applied.data ?? []).filter((a) => a.collaboration_posts)

        // Pending applications per post, for the author's own posts (RLS lets the author read them).
        const pendingByPost = new Map<string, number>()
        if (myPosts.length > 0) {
          const { data: pend } = await supabase.from('collaboration_applications').select('post_id').eq('status', 'pending').in('post_id', myPosts.map((p) => p.id))
          for (const r of (pend ?? []) as { post_id: string }[]) pendingByPost.set(r.post_id, (pendingByPost.get(r.post_id) ?? 0) + 1)
        }
        const hasActivity = myApps.length > 0 || myPosts.length > 0

        return (
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-x-10">
            <header className="lg:col-span-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-h1 font-semibold text-fg">Collaborate</h1>
                  <p className="mt-1 max-w-prose text-small text-fg-secondary">
                    Projects that need contributors, and developers offering their skills. Looking for testers instead? See <Link href="/playtests/browse" className="font-medium text-link underline-offset-2 hover:underline">Playtests</Link>.
                  </p>
                </div>
                {viewer && <Button asChild variant="primary" className="shrink-0"><Link href="/collaborate/new">Post an opportunity</Link></Button>}
              </div>
            </header>

            {/* Your side of it: applications you sent and posts you made — with their state and next step */}
            {hasActivity && (
              <aside aria-label="Your collaboration activity" className="mt-6 space-y-6 lg:order-2 lg:mt-8">
                {myApps.length > 0 && (
                  <section aria-labelledby="my-apps">
                    <SectionHeader id="my-apps" title="Your applications" count={myApps.length} className="mb-1" />
                    <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                      {myApps.map((a) => {
                        const p = a.collaboration_posts!
                        const st = APPLICATION_STATUS[a.status] ?? { label: a.status, tone: 'neutral' as const }
                        const closedWhilePending = a.status === 'pending' && p.status !== 'open'
                        return (
                          <CollaborationListing
                            key={a.id}
                            variant="mine"
                            post={{ id: p.id, post_type: p.post_type, role_needed: p.role_needed, role_offered: p.role_offered, project_title: p.projects?.title ?? null, display_name: p.profiles?.display_name, username: p.profiles?.username }}
                            status={st}
                            hint={closedWhilePending ? `Post ${POST_STATUS[p.status]?.label.toLowerCase()} before a decision` : APPLICATION_HINT[a.status]}
                          />
                        )
                      })}
                    </ul>
                  </section>
                )}
                {myPosts.length > 0 && (
                  <section aria-labelledby="my-posts">
                    <SectionHeader id="my-posts" title="Your posts" count={myPosts.length} className="mb-1" />
                    <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                      {myPosts.map((p) => {
                        const pending = pendingByPost.get(p.id) ?? 0
                        const expired = p.status === 'open' && new Date(p.expires_at) <= new Date()
                        const st = expired ? { label: 'Expired', tone: 'negative' as const } : POST_STATUS[p.status]
                        return (
                          <CollaborationListing
                            key={p.id}
                            variant="mine"
                            post={{ id: p.id, post_type: p.post_type, role_needed: p.role_needed, role_offered: p.role_offered, project_title: p.projects?.title ?? null }}
                            status={st}
                            hint={pending > 0 ? `${pending} to review` : p.status === 'open' && !expired ? 'No applications waiting' : undefined}
                          />
                        )
                      })}
                    </ul>
                  </section>
                )}
              </aside>
            )}

            <section aria-labelledby="open-posts" className={hasActivity ? 'mt-8 lg:order-1' : 'mt-6 lg:col-span-2'}>
              <h2 id="open-posts" className="sr-only">Open opportunities</h2>
              <TabLinks
                label="Kind of opportunity"
                activeHref={href({ type })}
                items={[
                  { href: href({ type: null }), label: 'All' },
                  { href: href({ type: 'seeking_collaborator' }), label: 'Looking for help' },
                  { href: href({ type: 'available_to_collaborate' }), label: 'Offering help' },
                ]}
              />
              <div className="mt-3">
                <FilterLinks label="Filter opportunities" options={[{ label: 'Remote OK', href: href({ remote: !remote }), active: remote }]} />
              </div>

              {error ? (
                <ErrorState className="mt-4" title="The board could not be loaded" description="This may be temporary." retryHref={href({})} />
              ) : posts.length === 0 ? (
                <EmptyState
                  kind={type || remote ? 'no-results' : 'first-use'}
                  className="mt-4"
                  title={type || remote ? 'No open opportunities match these filters' : 'No open opportunities right now'}
                  description={type || remote ? 'Try removing a filter.' : viewer ? 'Post what you need help with, or what you can offer.' : 'Sign in to post what you need help with, or what you can offer.'}
                  action={type || remote ? <Link href="/collaborate" className="inline-flex min-h-11 items-center text-small font-medium text-link underline-offset-2 hover:underline">Clear filters</Link> : viewer ? <Button asChild variant="primary" size="sm"><Link href="/collaborate/new">Post an opportunity</Link></Button> : <Button asChild variant="primary" size="sm"><Link href="/login">Sign in</Link></Button>}
                />
              ) : (
                <>
                  <ul className="mt-2 divide-y divide-line-subtle border-y border-line-subtle">
                    {posts.map((post) => <CollaborationListing key={post.id} post={post} />)}
                  </ul>
                  {posts.length === PAGE_LIMIT && <p className="mt-3 text-small text-fg-muted">Showing the {PAGE_LIMIT} most recent. Use the filters to narrow the list.</p>}
                </>
              )}
            </section>
          </div>
        )
      }}
    </DiscoveryFrame>
  )
}
