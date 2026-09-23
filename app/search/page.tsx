import Link from 'next/link'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DiscoveryFrame } from '@/components/discovery/DiscoveryFrame'
import { ProjectRow } from '@/components/project/ProjectRow'
import { DeveloperRow } from '@/components/developer/DeveloperRow'
import { DevlogRow, fromDiscoveryRow } from '@/components/devlog/DevlogRow'
import { FilterLinks } from '@/components/discovery/FilterLinks'
import { Pager } from '@/components/discovery/Pager'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/controls'
import type { DevlogRowData } from '@/lib/discovery/queries'
import {
  LIST_PAGE_SIZE, SEARCH_ALL_PREVIEW, followedAmong, parsePage,
  searchDevelopers, searchDevlogs, searchProjects,
} from '@/lib/discovery/queries'
import { PROJECT_STAGES, labelFor } from '@/lib/supabase/types'

export const metadata = { title: 'Search — Glyph' }

// URL values kept from the previous route ("profiles") so existing links keep working.
type SearchType = 'all' | 'profiles' | 'projects' | 'devlogs'
const TYPES: SearchType[] = ['all', 'profiles', 'projects', 'devlogs']
const TAB_LABEL: Record<SearchType, string> = { all: 'All', profiles: 'Developers', projects: 'Projects', devlogs: 'Devlogs' }

type Params = { q?: string; type?: string; page?: string; stage?: string }

export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim().slice(0, 100)
  const type: SearchType = TYPES.includes(sp.type as SearchType) ? (sp.type as SearchType) : 'all'
  const page = type === 'all' ? 1 : parsePage(sp.page)
  const stage = type === 'projects' && PROJECT_STAGES.some((s) => s.value === sp.stage) ? (sp.stage as string) : null

  const href = (over: Partial<{ type: SearchType; page: number; stage: string | null }> = {}) => {
    const t = over.type ?? type
    const qs = new URLSearchParams()
    if (q) qs.set('q', q)
    if (t !== 'all') qs.set('type', t)
    const st = over.stage === undefined ? (t === 'projects' ? stage : null) : over.stage
    if (t === 'projects' && st) qs.set('stage', st)
    const pg = over.page ?? 1
    if (pg > 1) qs.set('page', String(pg))
    const s = qs.toString()
    return `/search${s ? `?${s}` : ''}`
  }

  const supabase = await createClient()

  return (
    <DiscoveryFrame label="Search" hideSearch>
      {async (viewer) => {
        // Run only what this view needs. Tab counts always come from the same
        // rules as the lists (one row with total_count is enough).
        const previewSize = type === 'all' ? SEARCH_ALL_PREVIEW : 1
        const offset = (page - 1) * LIST_PAGE_SIZE
        const results = q
          ? await Promise.all([
              searchDevelopers(supabase, q, type === 'profiles' ? LIST_PAGE_SIZE : previewSize, type === 'profiles' ? offset : 0),
              searchProjects(supabase, q, stage, type === 'projects' ? LIST_PAGE_SIZE : previewSize, type === 'projects' ? offset : 0),
              searchDevlogs(supabase, q, type === 'devlogs' ? LIST_PAGE_SIZE : previewSize, type === 'devlogs' ? offset : 0),
              // Tab count for Projects must ignore the stage filter.
              stage ? searchProjects(supabase, q, null, 1, 0) : Promise.resolve(null),
            ])
          : null
        const projectsUnfiltered = results ? results[3] : null
        let devs = results ? results[0] : null
        let projects = results ? results[1] : null
        let devlogs = results ? results[2] : null
        // Past the last page a list comes back empty with total 0; ask for the
        // first row again so tab counts and the "no further results" message
        // stay truthful.
        if (q && type !== 'all' && page > 1) {
          if (type === 'profiles' && devs && devs.rows.length === 0) devs = await searchDevelopers(supabase, q, 1, 0)
          if (type === 'projects' && projects && projects.rows.length === 0) projects = await searchProjects(supabase, q, stage, 1, 0)
          if (type === 'devlogs' && devlogs && devlogs.rows.length === 0) devlogs = await searchDevlogs(supabase, q, 1, 0)
        }
        const counts = { profiles: devs?.total ?? 0, projects: (projectsUnfiltered ?? projects)?.total ?? 0, devlogs: devlogs?.total ?? 0 }
        const anyError = !!(devs?.error || projects?.error || devlogs?.error)
        const following = devs && viewer ? await followedAmong(supabase, viewer.id, devs.rows.map((d) => d.id)) : new Set<string>()

        const totalHere = type === 'all' ? counts.profiles + counts.projects + counts.devlogs
          : type === 'profiles' ? counts.profiles : type === 'projects' ? (projects?.total ?? 0) : counts.devlogs

        return (
          <div>
            <h1 className="mb-4 text-h1 font-semibold text-fg">Search</h1>

            <form action="/search" method="get" role="search" className="flex gap-2">
              <div className="relative flex-1">
                <Search aria-hidden strokeWidth={1.75} className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
                <Input
                  type="search"
                  name="q"
                  defaultValue={q}
                  aria-label="Search developers, projects and devlogs"
                  placeholder="Search developers, projects, devlogs"
                  maxLength={100}
                  autoFocus={!q}
                  className="pl-9"
                />
              </div>
              {type !== 'all' && <input type="hidden" name="type" value={type} />}
              {stage && <input type="hidden" name="stage" value={stage} />}
              <Button type="submit" variant="primary">Search</Button>
            </form>

            {!q ? (
              <section className="mt-8" aria-labelledby="search-help">
                <h2 id="search-help" className="text-h3 font-semibold text-fg">What you can search</h2>
                <dl className="mt-3 space-y-2 text-small text-fg-secondary">
                  <div><dt className="inline font-medium text-fg">Developers</dt> <dd className="inline">— by name or username.</dd></div>
                  <div><dt className="inline font-medium text-fg">Projects</dt> <dd className="inline">— by title, pitch, genre and tags.</dd></div>
                  <div><dt className="inline font-medium text-fg">Devlogs</dt> <dd className="inline">— by title and text.</dd></div>
                </dl>
                <p className="mt-4 text-small text-fg-secondary">
                  Not looking for anything in particular? <Link href="/explore" className="font-medium text-link underline-offset-2 hover:underline">Explore</Link> groups what is on Glyph by what you can do with it.
                </p>
              </section>
            ) : (
              <>
                <nav aria-label="Result types" className="mt-4 flex gap-1 overflow-x-auto border-b border-line [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)]">
                  {TYPES.map((t) => {
                    const active = t === type
                    const n = t === 'all' ? null : counts[t]
                    return (
                      <Link
                        key={t}
                        href={href({ type: t, stage: null })}
                        aria-current={active ? 'page' : undefined}
                        className={`-mb-px inline-flex h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-small font-medium transition-colors duration-150 ${
                          active ? 'border-accent text-fg' : 'border-transparent text-fg-secondary hover:text-fg'
                        }`}
                      >
                        {TAB_LABEL[t]}
                        {n !== null && <span className="font-mono text-micro text-fg-muted">{n}</span>}
                      </Link>
                    )
                  })}
                </nav>
                <p className="mt-3 text-small text-fg-muted">Best match first (exact name, then starts with, then contains), then most recent activity.</p>

                {anyError ? (
                  <ErrorState className="mt-4" title="Search could not be completed" description="This may be temporary." retryHref={href({ page })} />
                ) : type === 'projects' && (
                  <div className="mt-3">
                    <FilterLinks
                      label="Filter projects by stage"
                      options={[{ label: 'All stages', href: href({ stage: null }), active: !stage }, ...PROJECT_STAGES.map((s) => ({ label: s.label, href: href({ stage: s.value }), active: stage === s.value }))]}
                    />
                  </div>
                )}

                {!anyError && page > 1 && totalHere > 0 && offset >= totalHere && (
                  <EmptyState
                    kind="no-results"
                    className="mt-6"
                    title="No further results"
                    description={`You have reached the end of the results for “${q}”.`}
                    action={<Link href={href({ page: 1 })} className="inline-flex min-h-11 items-center text-small font-medium text-link underline-offset-2 hover:underline">Back to the first page</Link>}
                  />
                )}

                {!anyError && totalHere === 0 && (
                  <EmptyState
                    kind="no-results"
                    className="mt-6"
                    title={`No ${type === 'all' ? 'results' : TAB_LABEL[type].toLowerCase()}${stage ? ` at the ${labelFor(PROJECT_STAGES, stage)} stage` : ''} for “${q}”`}
                    description="Words match from the start (“ember” finds “Emberfall”) and names and titles match anywhere in the text. Fewer or shorter words usually help."
                    action={
                      <ul className="flex flex-wrap gap-x-4">
                        {type !== 'all' && <li><Link href={href({ type: 'all', stage: null })} className="inline-flex min-h-11 items-center text-small font-medium text-link underline-offset-2 hover:underline">Search everything</Link></li>}
                        {stage && <li><Link href={href({ stage: null })} className="inline-flex min-h-11 items-center text-small font-medium text-link underline-offset-2 hover:underline">Show all stages</Link></li>}
                        <li><Link href="/explore" className="inline-flex min-h-11 items-center text-small font-medium text-link underline-offset-2 hover:underline">Browse Explore</Link></li>
                      </ul>
                    }
                  />
                )}

                {!anyError && totalHere > 0 && offset < totalHere && (
                  <div className="mt-4 space-y-8">
                    {(type === 'all' || type === 'profiles') && devs && devs.rows.length > 0 && (
                      <section aria-labelledby="res-dev">
                        <h2 id="res-dev" className={type === 'all' ? 'text-h3 font-semibold text-fg' : 'sr-only'}>Developers <span className="font-mono text-micro font-normal text-fg-muted">{counts.profiles}</span></h2>
                        <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                          {devs.rows.map((d) => <DeveloperRow key={d.id} developer={d} viewerId={viewer?.id ?? null} following={following.has(d.id)} />)}
                        </ul>
                        {type === 'all' && counts.profiles > SEARCH_ALL_PREVIEW && (
                          <Link href={href({ type: 'profiles' })} className="inline-flex min-h-11 items-center text-small font-medium text-link underline-offset-2 hover:underline">See all {counts.profiles} developers</Link>
                        )}
                      </section>
                    )}
                    {(type === 'all' || type === 'projects') && projects && projects.rows.length > 0 && (
                      <section aria-labelledby="res-proj">
                        <h2 id="res-proj" className={type === 'all' ? 'text-h3 font-semibold text-fg' : 'sr-only'}>Projects <span className="font-mono text-micro font-normal text-fg-muted">{counts.projects}</span></h2>
                        <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                          {projects.rows.map((p) => <ProjectRow key={p.id} variant="listing" project={p} />)}
                        </ul>
                        {type === 'all' && counts.projects > SEARCH_ALL_PREVIEW && (
                          <Link href={href({ type: 'projects' })} className="inline-flex min-h-11 items-center text-small font-medium text-link underline-offset-2 hover:underline">See all {counts.projects} projects</Link>
                        )}
                      </section>
                    )}
                    {(type === 'all' || type === 'devlogs') && devlogs && devlogs.rows.length > 0 && (
                      <section aria-labelledby="res-log">
                        <h2 id="res-log" className={type === 'all' ? 'text-h3 font-semibold text-fg' : 'sr-only'}>Devlogs <span className="font-mono text-micro font-normal text-fg-muted">{counts.devlogs}</span></h2>
                        <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                          {devlogs.rows.map((d) => <DevlogRow key={d.id} variant="listing" devlog={fromDiscoveryRow(d as DevlogRowData)} />)}
                        </ul>
                        {type === 'all' && counts.devlogs > SEARCH_ALL_PREVIEW && (
                          <Link href={href({ type: 'devlogs' })} className="inline-flex min-h-11 items-center text-small font-medium text-link underline-offset-2 hover:underline">See all {counts.devlogs} devlogs</Link>
                        )}
                      </section>
                    )}
                    {type !== 'all' && <Pager page={page} hasMore={offset + LIST_PAGE_SIZE < totalHere} hrefForPage={(n) => href({ page: n })} />}
                  </div>
                )}
              </>
            )}
          </div>
        )
      }}
    </DiscoveryFrame>
  )
}
