import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DiscoveryFrame } from '@/components/discovery/DiscoveryFrame'
import { ProjectTile } from '@/components/project/ProjectTile'
import { DeveloperRow } from '@/components/developer/DeveloperRow'
import { DevlogRow, fromDiscoveryRow } from '@/components/devlog/DevlogRow'
import type { ProjectRowData } from '@/lib/discovery/queries'
import { FilterLinks } from '@/components/discovery/FilterLinks'
import { Pager } from '@/components/discovery/Pager'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import type { DeveloperRowData, DevlogRowData } from '@/lib/discovery/queries'
import { exploreDevelopers, exploreDevlogs, exploreProjects, followedAmong, isSection, parsePage } from '@/lib/discovery/queries'
import { PROJECT_STAGES, labelFor } from '@/lib/supabase/types'

const TITLES = { projects: 'Projects', developers: 'Developers', devlogs: 'Devlogs' } as const
const NOTES = {
  projects: 'Public projects, most recently active first.',
  developers: 'Developers with public work, most recently active first.',
  devlogs: 'Published devlogs from public projects, newest first.',
} as const

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  return { title: isSection(section) ? `${TITLES[section]} — Explore — Glyph` : 'Explore — Glyph' }
}

export default async function ExploreSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>
  searchParams: Promise<{ page?: string; stage?: string; playtest?: string; collab?: string }>
}) {
  const { section } = await params
  if (!isSection(section)) notFound()
  const sp = await searchParams
  const page = parsePage(sp.page)
  const stage = section === 'projects' && PROJECT_STAGES.some((s) => s.value === sp.stage) ? (sp.stage as string) : null
  const playtest = section === 'projects' && sp.playtest === 'open'
  const collab = section === 'developers' && sp.collab === 'open'

  // Every filter and the page live in the URL, so lists are shareable and back/forward work.
  const href = (over: { stage?: string | null; playtest?: boolean; collab?: boolean; page?: number } = {}) => {
    const st = over.stage === undefined ? stage : over.stage
    const pt = over.playtest === undefined ? playtest : over.playtest
    const co = over.collab === undefined ? collab : over.collab
    const qs = new URLSearchParams()
    if (st) qs.set('stage', st)
    if (pt) qs.set('playtest', 'open')
    if (co) qs.set('collab', 'open')
    if ((over.page ?? 1) > 1) qs.set('page', String(over.page))
    const s = qs.toString()
    return `/explore/${section}${s ? `?${s}` : ''}`
  }
  const filtered = !!(stage || playtest || collab)

  const supabase = await createClient()

  return (
    <DiscoveryFrame label="Explore" width={section === 'projects' ? 'wide' : 'reading'}>
      {async (viewer) => {
        const result =
          section === 'projects' ? await exploreProjects(supabase, { page, stage, openPlaytest: playtest })
          : section === 'developers' ? await exploreDevelopers(supabase, { page, excludeUserId: viewer?.id ?? null, openToCollab: collab })
          : await exploreDevlogs(supabase, { page })
        const following = section === 'developers'
          ? await followedAmong(supabase, viewer?.id ?? null, (result.rows as { id: string }[]).map((d) => d.id))
          : new Set<string>()

        return (
          <div>
            <Link href="/explore" className="inline-flex min-h-11 items-center text-small text-fg-secondary hover:text-fg">← Explore</Link>
            <header className="mb-4">
              <h1 className="text-h1 font-semibold text-fg">{TITLES[section]}</h1>
              <p className="mt-1 text-small text-fg-secondary">{NOTES[section]}</p>
            </header>

            {section === 'projects' && (
              <div className="mb-4 space-y-2">
                <FilterLinks
                  label="Filter projects by stage"
                  options={[{ label: 'All stages', href: href({ stage: null }), active: !stage }, ...PROJECT_STAGES.map((s) => ({ label: s.label, href: href({ stage: s.value }), active: stage === s.value }))]}
                />
                <FilterLinks label="Filter projects by playtest" options={[{ label: 'Open playtest only', href: href({ playtest: !playtest }), active: playtest }]} />
              </div>
            )}
            {section === 'developers' && (
              <div className="mb-4">
                <FilterLinks
                  label="Filter developers"
                  options={[{ label: 'All developers', href: href({ collab: false }), active: !collab }, { label: 'Open to collaborate', href: href({ collab: true }), active: collab }]}
                />
              </div>
            )}

            {result.error ? (
              <ErrorState title="This list could not be loaded" description="This may be temporary." retryHref={href({ page })} />
            ) : result.rows.length === 0 ? (
              <EmptyState
                kind={page > 1 || filtered ? 'no-results' : 'first-use'}
                title={page > 1 ? 'Nothing further in this list' : filtered ? 'Nothing matches these filters' : `No ${TITLES[section].toLowerCase()} yet`}
                description={
                  page > 1 ? 'You have reached the end.'
                  : stage ? `No public projects at the ${labelFor(PROJECT_STAGES, stage)} stage${playtest ? ' with an open playtest' : ''}.`
                  : filtered ? 'Try removing a filter.'
                  : 'They appear here when they are published on Glyph.'
                }
                action={(page > 1 || filtered) ? <Link href={page > 1 ? href({ page: 1 }) : `/explore/${section}`} className="inline-flex min-h-11 items-center text-small font-medium text-link underline-offset-2 hover:underline">{page > 1 ? 'Back to the first page' : 'Clear filters'}</Link> : undefined}
              />
            ) : section === 'projects' ? (
              <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
                {(result.rows as unknown as ProjectRowData[]).map((p) => <ProjectTile key={p.id} project={p} />)}
              </div>
            ) : section === 'developers' ? (
              <ul className="grid gap-x-10 border-t border-line-subtle sm:grid-cols-2">
                {(result.rows as unknown as DeveloperRowData[]).map((d) => (
                  <DeveloperRow key={d.id} developer={d} viewerId={viewer?.id ?? null} following={following.has(d.id)} />
                ))}
              </ul>
            ) : (
              <ul className="grid gap-x-10 border-t border-line-subtle sm:grid-cols-2">
                {(result.rows as unknown as DevlogRowData[]).map((d) => <DevlogRow key={d.id} variant="listing" devlog={fromDiscoveryRow(d)} />)}
              </ul>
            )}

            <Pager page={page} hasMore={result.hasMore} hrefForPage={(n) => href({ page: n })} />
          </div>
        )
      }}
    </DiscoveryFrame>
  )
}
