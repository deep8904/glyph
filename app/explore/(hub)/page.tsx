import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { GlyphFeature, GlyphDevCard, GlyphDevlogMoment } from '@/components/glyph/explore/ExploreObjects'
import { GlyphProjectRow } from '@/components/glyph/explore/SectionObjects'
import { GEmptyState, GErrorState } from '@/components/glyph/ui/States'
import { PROJECT_STAGES } from '@/lib/supabase/types'
import { isHttpsUrl } from '@/lib/utils'
import { exploreProjects, exploreDevelopers, exploreDevlogs, followedAmong } from '@/lib/discovery/queries'

export const metadata = { title: 'Explore — Glyph' }

const GRID = 8
const STRIP = 6

const STAGE_FACETS = [{ label: 'All', href: '/explore/projects' }, ...PROJECT_STAGES.map((s) => ({ label: s.label, href: `/explore/projects?stage=${s.value}` }))]

export default async function ExplorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [playtests, projectsRaw, developers, devlogs] = await Promise.all([
    exploreProjects(supabase, { size: STRIP, openPlaytest: true }),
    exploreProjects(supabase, { size: GRID + 1 }),
    exploreDevelopers(supabase, { size: STRIP, excludeUserId: user?.id ?? null, openToCollab: true }),
    exploreDevlogs(supabase, { size: STRIP }),
  ])

  // The cinematic feature only exists when a project has real cover art — a coverless project must
  // never become a large pastel band. Without one, the top row is just the workshop devlog column.
  const lead = playtests.rows.find((p) => isHttpsUrl(p.cover_url)) ?? null
  const gridProjects = projectsRaw.rows.filter((p) => p.id !== lead?.id).slice(0, GRID)
  const following = await followedAmong(supabase, user?.id ?? null, developers.rows.map((d) => d.id))
  const failed = <GErrorState title="This section could not be loaded" description="This may be temporary. Reload to try again." />

  return (
    <div className="space-y-16">
      <header className="max-w-2xl">
        <h1 className="text-display font-semibold tracking-[-0.025em] text-ink">Explore</h1>
        <p className="mt-2 text-body text-ink-2">Indie games in the middle of being built. Newest activity first — press <kbd className="rounded border border-hair px-1 font-mono text-[11px] text-ink-2">⌘K</kbd> to search or jump anywhere.</p>
      </header>

      {(lead || devlogs.rows.length > 0) && (
        <section aria-label="In the workshop now" className={lead ? 'grid gap-6 lg:grid-cols-[1.65fr_1fr] lg:items-start' : ''}>
          {lead && <GlyphFeature p={lead} />}
          <div className="min-w-0">
            <h2 className="mb-1 text-h3 font-semibold tracking-[-0.01em] text-ink">Latest from the workshop</h2>
            <p className="mb-3 text-small text-ink-2">Fresh devlogs across public projects.</p>
            {devlogs.error ? failed : devlogs.rows.length === 0 ? (
              <GEmptyState title="No devlogs yet" description="They appear here when published on a public project." />
            ) : (
              <ul className={!lead ? 'grid gap-x-10 sm:grid-cols-2' : ''}>{devlogs.rows.slice(0, lead ? 5 : 6).map((d) => <GlyphDevlogMoment key={d.id} d={d} />)}</ul>
            )}
          </div>
        </section>
      )}

      <section aria-labelledby="building">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <h2 id="building" className="text-h2 font-semibold tracking-[-0.01em] text-ink">Building now</h2>
          <Link href="/explore/projects" className="text-small font-medium text-ink-2 underline-offset-4 outline-none hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-ember">All projects</Link>
        </div>
        <div className="mb-6 flex flex-wrap gap-2">
          {STAGE_FACETS.map((f) => (
            <Link key={f.href} href={f.href} className="inline-flex min-h-9 items-center rounded-full border border-hair px-3.5 text-small font-medium text-ink-2 outline-none transition-colors hover:border-hair-strong hover:text-ink focus-visible:ring-2 focus-visible:ring-ember">{f.label}</Link>
          ))}
        </div>
        {projectsRaw.error ? failed : gridProjects.length === 0 ? (
          <GEmptyState title="No public projects yet" description="Projects appear here when a developer makes one public." />
        ) : (
          <ul className="max-w-4xl border-t border-hair">
            {gridProjects.map((p) => <GlyphProjectRow key={p.id} p={p} />)}
          </ul>
        )}
      </section>

      <section aria-labelledby="devs">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="devs" className="text-h2 font-semibold tracking-[-0.01em] text-ink">Open to collaborate</h2>
            <p className="mt-1 text-small text-ink-2">Developers with public work, looking for people to build with.</p>
          </div>
          <Link href="/explore/developers?collab=open" className="text-small font-medium text-ink-2 underline-offset-4 outline-none hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-ember">All developers</Link>
        </div>
        {developers.error ? failed : developers.rows.length === 0 ? (
          <GEmptyState title="No one is marked open right now" description="You can still browse everyone with public work." />
        ) : (
          <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
            {developers.rows.map((d) => <div key={d.id} className="snap-start"><GlyphDevCard d={d} following={following.has(d.id)} /></div>)}
          </div>
        )}
      </section>
    </div>
  )
}
