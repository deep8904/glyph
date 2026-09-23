import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DiscoveryFrame } from '@/components/discovery/DiscoveryFrame'
import { ProjectTile } from '@/components/project/ProjectTile'
import { ProjectMark } from '@/components/project/ProjectMark'
import { DeveloperRow } from '@/components/developer/DeveloperRow'
import { DevlogRow, fromDiscoveryRow } from '@/components/devlog/DevlogRow'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { labelFor, ENGINES, PROJECT_STAGES } from '@/lib/supabase/types'
import { isHttpsUrl } from '@/lib/utils'
import { exploreDevelopers, exploreDevlogs, exploreProjects, followedAmong } from '@/lib/discovery/queries'

export const metadata = { title: 'Explore — Glyph' }

const GRID = 8
const STRIP = 6

/** A block heading that shares the page's rhythm but is not a bordered Section. `id` names the section. */
function BlockHead({ id, title, sub, href, cta }: { id: string; title: string; sub?: string; href?: string; cta?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 id={id} className="text-h2 font-semibold text-fg">{title}</h2>
        {sub && <p className="mt-0.5 text-small text-fg-secondary">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="inline-flex min-h-11 shrink-0 items-center gap-1 text-small font-medium text-link underline-offset-2 hover:underline">
          {cta ?? 'See all'} <ArrowRight aria-hidden strokeWidth={1.75} className="size-3.5" />
        </Link>
      )}
    </div>
  )
}

/** Stage facets — a small, structured set of choices (Hick's law), linking to the existing filtered list. */
const STAGE_FILTERS = [
  { label: 'All', href: '/explore/projects' },
  ...PROJECT_STAGES.map((s) => ({ label: s.label, href: `/explore/projects?stage=${s.value}` })),
]

function StageChips() {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {STAGE_FILTERS.map((f) => (
        <Link
          key={f.href}
          href={f.href}
          className="inline-flex min-h-8 items-center rounded-pill border border-line px-3 text-small font-medium text-fg-secondary transition-colors hover:border-line-strong hover:text-fg"
        >
          {f.label}
        </Link>
      ))}
    </div>
  )
}

/**
 * Explore = browse what people are building, right now. Full-width discovery, not a stack of
 * hairline rows: a currently-in-playtest lead (Von Restorff), a project tile grid (the browse
 * core), then developers as identity rows and recent devlogs as editorial rows — each object
 * type gets its own composition. Activity-ordered, no popularity, no fabricated signal.
 */
export default async function ExplorePage() {
  const supabase = await createClient()

  return (
    <DiscoveryFrame label="Explore" width="wide">
      {async (viewer) => {
        const [playtests, projectsRaw, collaborators, devlogs] = await Promise.all([
          exploreProjects(supabase, { size: STRIP, openPlaytest: true }),
          exploreProjects(supabase, { size: GRID + 1 }),
          exploreDevelopers(supabase, { size: STRIP, excludeUserId: viewer?.id ?? null, openToCollab: true }),
          exploreDevlogs(supabase, { size: STRIP }),
        ])

        // Prefer a lead with a cover — it makes a stronger hero and is an honest signal the
        // developer has invested in presentation — falling back to the most recently active.
        const lead = playtests.rows.find((p) => isHttpsUrl(p.cover_url)) ?? playtests.rows[0] ?? null
        const shown = new Set([lead?.id].filter(Boolean) as string[])
        const gridProjects = projectsRaw.rows.filter((p) => !shown.has(p.id)).slice(0, GRID)
        const following = await followedAmong(supabase, viewer?.id ?? null, collaborators.rows.map((d) => d.id))
        const failed = <ErrorState inline title="This section could not be loaded" description="This may be temporary. Reload the page to try again." />

        const leadEngine = lead?.engine ? labelFor(ENGINES, lead.engine) ?? lead.engine : null
        const leadStage = lead?.stage ? labelFor(PROJECT_STAGES, lead.stage) : null

        const leadHasCover = isHttpsUrl(lead?.cover_url)
        return (
          <div className="space-y-14">
            <header>
              <h1 className="text-display font-semibold tracking-[-0.02em] text-fg">Explore</h1>
              <p className="mt-1.5 text-body text-fg-secondary">What indie developers are building on Glyph — most recently active first.</p>
            </header>

            {/* Lead: a cinematic feature hero for one project currently looking for testers. When it
                has a cover the identity is laid over the media on a scrim (games as visual objects);
                without one, the title-plate carries it. The CTA is an explicit link. */}
            {lead && (
              <section aria-labelledby="lead" className="group relative overflow-hidden rounded-panel" style={{ boxShadow: '0 1px 2px rgb(24 25 37 / 0.06), 0 30px 60px -30px rgb(24 25 37 / 0.30)' }}>
                <ProjectMark title={lead.title} id={lead.id} coverUrl={lead.cover_url} engine={lead.engine} genre={lead.genre} stage={leadHasCover ? null : lead.stage} eager className={leadHasCover ? '!aspect-[21/9] [&>span]:!hidden' : '!aspect-[21/9]'} />
                {leadHasCover && <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(10,10,12,.86) 0%, rgba(10,10,12,.55) 44%, rgba(10,10,12,0) 74%)' }} />}
                <div className={`absolute inset-0 flex max-w-[620px] flex-col justify-center gap-3 p-6 sm:p-9 ${leadHasCover ? 'text-white' : ''}`}>
                  <p className="flex items-center gap-2 font-mono text-micro font-medium uppercase tracking-wide" style={leadHasCover ? { color: '#f4b48a' } : undefined}>
                    <span className="size-1.5 rounded-full" style={{ background: leadHasCover ? '#f4b48a' : 'var(--accent)' }} />
                    <span className={leadHasCover ? '' : 'text-link'}>In playtest now</span>
                  </p>
                  <h2 id="lead" className={`text-h1 font-semibold tracking-[-0.02em] sm:text-[2.5rem] sm:leading-[1.05] [overflow-wrap:anywhere] ${leadHasCover ? '' : 'text-fg'}`}>
                    <Link href={`/p/${lead.username}/${lead.slug}`} className="after:absolute after:inset-0 after:content-['']">{lead.title}</Link>
                  </h2>
                  {lead.short_description && <p className={`max-w-prose text-body leading-relaxed [overflow-wrap:anywhere] ${leadHasCover ? 'text-white/80' : 'text-fg-secondary'}`}>{lead.short_description}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <Button asChild variant={leadHasCover ? 'secondary' : 'primary'} size="sm" className={`relative z-10 ${leadHasCover ? 'border-transparent bg-white text-fg hover:bg-white/90' : ''}`}><Link href={`/p/${lead.username}/${lead.slug}`}>View project</Link></Button>
                    <Link href={`/dev/${lead.username}`} className={`relative z-10 font-mono text-micro ${leadHasCover ? 'text-white/70' : 'text-fg-secondary'} hover:underline`}>{[leadStage, leadEngine, lead.genre].filter(Boolean).join(' · ')} · {lead.display_name || lead.username}</Link>
                  </div>
                </div>
              </section>
            )}

            {/* Browse core: project tile grid, with stage facets. */}
            <section aria-labelledby="projects">
              <BlockHead id="projects" title="Building now" sub="Public projects, most recently active first." href="/explore/projects" cta="All projects" />
              <StageChips />
              {projectsRaw.error ? failed : gridProjects.length === 0 ? (
                <EmptyState kind="first-use" className="border-y-0 py-2" title="No public projects yet" description="Projects appear here when a developer makes one public." />
              ) : (
                <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3">
                  {gridProjects.map((p) => <ProjectTile key={p.id} project={p} />)}
                </div>
              )}
            </section>

            {/* Developers as identity rows — a different job, a different shape. */}
            <section aria-labelledby="developers">
              <BlockHead id="developers" title="Open to collaborate" sub="Developers with public work looking for people to build with." href="/explore/developers?collab=open" cta="All developers" />
              {collaborators.error ? failed : collaborators.rows.length === 0 ? (
                <EmptyState kind="cleared" className="border-y-0 py-2" title="No one is marked open to collaborate" description="You can still browse everyone with public work." action={<Link href="/explore/developers" className="inline-flex min-h-11 items-center text-small font-medium text-link underline-offset-2 hover:underline">All developers →</Link>} />
              ) : (
                <ul className="grid gap-x-10 border-t border-line-subtle sm:grid-cols-2">
                  {collaborators.rows.map((d) => <DeveloperRow key={d.id} developer={d} viewerId={viewer?.id ?? null} following={following.has(d.id)} />)}
                </ul>
              )}
            </section>

            {/* Recent devlogs — editorial rows, two columns of reading. */}
            <section aria-labelledby="devlogs">
              <BlockHead id="devlogs" title="Recent devlogs" sub="Newest published devlogs from public projects." href="/explore/devlogs" cta="All devlogs" />
              {devlogs.error ? failed : devlogs.rows.length === 0 ? (
                <EmptyState kind="first-use" className="border-y-0 py-2" title="No devlogs yet" description="Devlogs appear here when they are published on a public project." />
              ) : (
                <ul className="grid gap-x-10 border-t border-line-subtle sm:grid-cols-2">
                  {devlogs.rows.map((d) => <DevlogRow key={d.id} variant="listing" devlog={fromDiscoveryRow(d)} />)}
                </ul>
              )}
            </section>
          </div>
        )
      }}
    </DiscoveryFrame>
  )
}
