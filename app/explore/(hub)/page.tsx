import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DiscoveryFrame } from '@/components/discovery/DiscoveryFrame'
import { ProjectRow } from '@/components/project/ProjectRow'
import { DeveloperRow } from '@/components/developer/DeveloperRow'
import { DevlogRow, fromDiscoveryRow } from '@/components/devlog/DevlogRow'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Section } from '@/components/ui/Section'
import { exploreDevelopers, exploreDevlogs, exploreProjects, followedAmong } from '@/lib/discovery/queries'

export const metadata = { title: 'Explore — Glyph' }

const PREVIEW = 5

const seeAll = (href: string, hasMore: boolean, label = 'See all') =>
  hasMore ? <Link href={href} className="inline-flex min-h-11 shrink-0 items-center text-small font-medium text-link underline-offset-2 hover:underline">{label} →</Link> : undefined

/**
 * Explore = what is worth discovering on Glyph right now, grouped by what you can DO with it:
 * join a playtest, follow a project, meet a collaborator, read a devlog. Each group is ordered by
 * most recent activity — there is no popularity, trending or personalisation — and every row links
 * to its canonical page. Groups are conditions on data Glyph already has (open playtest, open to
 * collaborate), not scores.
 */
export default async function ExplorePage() {
  const supabase = await createClient()

  return (
    <DiscoveryFrame label="Explore">
      {async (viewer) => {
        const [playtests, projects, collaborators, devlogs] = await Promise.all([
          exploreProjects(supabase, { size: PREVIEW, openPlaytest: true }),
          exploreProjects(supabase, { size: PREVIEW }),
          exploreDevelopers(supabase, { size: PREVIEW, excludeUserId: viewer?.id ?? null, openToCollab: true }),
          exploreDevlogs(supabase, { size: PREVIEW }),
        ])
        const following = await followedAmong(supabase, viewer?.id ?? null, collaborators.rows.map((d) => d.id))
        const failed = <ErrorState inline title="This section could not be loaded" description="This may be temporary. Reload the page to try again." />

        return (
          <div>
            <header className="mb-8">
              <h1 className="text-h1 font-semibold text-fg">Explore</h1>
              <p className="mt-1 max-w-prose text-small text-fg-secondary">
                Games being built on Glyph and the people building them, grouped by what you can do. Every list is ordered by latest activity, not popularity.
              </p>
            </header>

            <div className="space-y-10">
              <Section id="explore-playtests" title="Playtests you can join" description="Projects with an open playtest, most recently active first." action={seeAll('/explore/projects?playtest=open', playtests.hasMore)}>
                {playtests.error ? failed : playtests.rows.length === 0 ? (
                  <EmptyState kind="cleared" className="border-y-0 py-2" title="No open playtests right now" description="Projects appear here while their developer is looking for testers." />
                ) : (
                  <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                    {playtests.rows.map((p) => <ProjectRow key={p.id} variant="listing" project={p} />)}
                  </ul>
                )}
              </Section>

              <Section id="explore-projects" title="Projects" description="Public projects, most recently active first." action={seeAll('/explore/projects', projects.hasMore, 'See all, filter by stage')}>
                {projects.error ? failed : projects.rows.length === 0 ? (
                  <EmptyState kind="first-use" className="border-y-0 py-2" title="No public projects yet" description="Projects appear here when a developer makes one public." />
                ) : (
                  <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                    {projects.rows.map((p) => <ProjectRow key={p.id} variant="listing" project={p} />)}
                  </ul>
                )}
              </Section>

              <Section id="explore-developers" title="Developers open to collaborate" description="Developers with public work who are open to new collaborations, most recently active first." action={seeAll('/explore/developers?collab=open', collaborators.hasMore)}>
                {collaborators.error ? failed : collaborators.rows.length === 0 ? (
                  <EmptyState kind="cleared" className="border-y-0 py-2" title="No one is marked open to collaborate" description="You can still browse everyone with public work." action={<Link href="/explore/developers" className="inline-flex min-h-11 items-center text-small font-medium text-link underline-offset-2 hover:underline">All developers →</Link>} />
                ) : (
                  <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                    {collaborators.rows.map((d) => <DeveloperRow key={d.id} developer={d} viewerId={viewer?.id ?? null} following={following.has(d.id)} />)}
                  </ul>
                )}
              </Section>

              <Section id="explore-devlogs" title="Recent devlogs" description="Newest published devlogs from public projects." action={seeAll('/explore/devlogs', devlogs.hasMore)}>
                {devlogs.error ? failed : devlogs.rows.length === 0 ? (
                  <EmptyState kind="first-use" className="border-y-0 py-2" title="No devlogs yet" description="Devlogs appear here when they are published on a public project." />
                ) : (
                  <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                    {devlogs.rows.map((d) => <DevlogRow key={d.id} variant="listing" devlog={fromDiscoveryRow(d)} />)}
                  </ul>
                )}
              </Section>
            </div>
          </div>
        )
      }}
    </DiscoveryFrame>
  )
}
