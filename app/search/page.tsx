import Link from 'next/link'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DiscoveryFrame } from '@/components/discovery/DiscoveryFrame'
import { ProjectRow } from '@/components/project/ProjectRow'
import { DeveloperRow } from '@/components/developer/DeveloperRow'
import { DevlogRow, fromDiscoveryRow } from '@/components/devlog/DevlogRow'
import { StudioResultRow } from '@/components/search/StudioResultRow'
import { CollaborationListing } from '@/components/collaborate/CollaborationListing'
import { ScopeSwitcher, type ScopeOption } from '@/components/search/ScopeSwitcher'
import { ResultsKeyNav } from '@/components/search/ResultsKeyNav'
import { FilterLinks } from '@/components/discovery/FilterLinks'
import { Pager } from '@/components/discovery/Pager'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/controls'
import type { DevlogRowData } from '@/lib/discovery/queries'
import {
  LIST_PAGE_SIZE, SEARCH_ALL_PREVIEW, followedAmong, parsePage,
  searchDevelopers, searchDevlogs, searchProjects, searchStudios, searchOpportunities,
} from '@/lib/discovery/queries'
import { PROJECT_STAGES, labelFor } from '@/lib/supabase/types'

export const metadata = { title: 'Search — Glyph' }

// URL values kept from the previous route ("profiles") so existing links keep working. 'devlogs'
// stays parseable for old links but is not a switcher tab — devlogs surface inline under "All"
// instead of owning a primary category (their own reading home is the project's Development
// history and Feed; Search's job is finding Developers/Projects/Studios/Opportunities fast).
type SearchType = 'all' | 'profiles' | 'projects' | 'studios' | 'opportunities' | 'devlogs'
const TABS: SearchType[] = ['all', 'projects', 'profiles', 'studios', 'opportunities']
const TAB_LABEL: Record<SearchType, string> = { all: 'All', profiles: 'Developers', projects: 'Projects', studios: 'Studios', opportunities: 'Opportunities', devlogs: 'Devlogs' }
const VALID: SearchType[] = [...TABS, 'devlogs']

type Params = { q?: string; type?: string; page?: string; stage?: string }

export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim().slice(0, 100)
  const type: SearchType = VALID.includes(sp.type as SearchType) ? (sp.type as SearchType) : 'all'
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
        const previewSize = type === 'all' ? SEARCH_ALL_PREVIEW : 1
        const offset = (page - 1) * LIST_PAGE_SIZE
        const results = q
          ? await Promise.all([
              searchDevelopers(supabase, q, type === 'profiles' ? LIST_PAGE_SIZE : previewSize, type === 'profiles' ? offset : 0),
              searchProjects(supabase, q, stage, type === 'projects' ? LIST_PAGE_SIZE : previewSize, type === 'projects' ? offset : 0),
              searchDevlogs(supabase, q, type === 'devlogs' ? LIST_PAGE_SIZE : previewSize, type === 'devlogs' ? offset : 0),
              searchStudios(supabase, q, type === 'studios' ? LIST_PAGE_SIZE : previewSize, type === 'studios' ? offset : 0),
              searchOpportunities(supabase, q, type === 'opportunities' ? LIST_PAGE_SIZE : previewSize, type === 'opportunities' ? offset : 0),
              // Tab count for Projects must ignore the stage filter.
              stage ? searchProjects(supabase, q, null, 1, 0) : Promise.resolve(null),
            ])
          : null
        const projectsUnfiltered = results ? results[5] : null
        let devs = results ? results[0] : null
        let projects = results ? results[1] : null
        let devlogs = results ? results[2] : null
        let studios = results ? results[3] : null
        let opportunities = results ? results[4] : null
        // Past the last page a list comes back empty with total 0; ask for the first row again so
        // tab counts and the "no further results" message stay truthful.
        if (q && type !== 'all' && page > 1) {
          if (type === 'profiles' && devs && devs.rows.length === 0) devs = await searchDevelopers(supabase, q, 1, 0)
          if (type === 'projects' && projects && projects.rows.length === 0) projects = await searchProjects(supabase, q, stage, 1, 0)
          if (type === 'devlogs' && devlogs && devlogs.rows.length === 0) devlogs = await searchDevlogs(supabase, q, 1, 0)
          if (type === 'studios' && studios && studios.rows.length === 0) studios = await searchStudios(supabase, q, 1, 0)
          if (type === 'opportunities' && opportunities && opportunities.rows.length === 0) opportunities = await searchOpportunities(supabase, q, 1, 0)
        }
        const counts = {
          profiles: devs?.total ?? 0,
          projects: (projectsUnfiltered ?? projects)?.total ?? 0,
          devlogs: devlogs?.total ?? 0,
          studios: studios?.total ?? 0,
          opportunities: opportunities?.total ?? 0,
        }
        const anyError = !!(devs?.error || projects?.error || devlogs?.error || studios?.error || opportunities?.error)
        const following = devs && viewer ? await followedAmong(supabase, viewer.id, devs.rows.map((d) => d.id)) : new Set<string>()

        const totalHere =
          type === 'all' ? counts.profiles + counts.projects + counts.studios + counts.opportunities
          : type === 'profiles' ? counts.profiles
          : type === 'projects' ? (projects?.total ?? 0)
          : type === 'studios' ? counts.studios
          : type === 'opportunities' ? counts.opportunities
          : counts.devlogs

        const scopeOptions: ScopeOption[] = TABS.map((t) => ({
          value: t, label: TAB_LABEL[t], href: href({ type: t, stage: null }), active: t === type,
          count: t === 'all' ? null : counts[t as Exclude<SearchType, 'all' | 'devlogs'>],
        }))

        return (
          <div>
            <h1 className="mb-4 text-h1 font-semibold text-fg">Search</h1>

            {/* A dense retrieval bar, not a marketing search box: icon + input + inline submit. */}
            <form action="/search" method="get" role="search" className="flex gap-2">
              <div className="relative flex-1">
                <Search aria-hidden strokeWidth={1.75} className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
                <Input
                  type="search"
                  name="q"
                  defaultValue={q}
                  aria-label="Search developers, projects, studios and opportunities"
                  placeholder="Search developers, projects, studios, opportunities"
                  maxLength={100}
                  autoFocus={!q}
                  className="h-10 pl-9"
                />
              </div>
              {type !== 'all' && <input type="hidden" name="type" value={type} />}
              {stage && <input type="hidden" name="stage" value={stage} />}
              <Button type="submit" variant="primary" className="h-10">Search</Button>
            </form>

            {!q ? (
              <section className="mt-8" aria-labelledby="search-help">
                <h2 id="search-help" className="text-h3 font-semibold text-fg">What you can search</h2>
                <dl className="mt-3 grid gap-x-8 gap-y-2 text-small text-fg-secondary sm:grid-cols-2">
                  <div><dt className="inline font-medium text-fg">Developers</dt> <dd className="inline">— by name or username.</dd></div>
                  <div><dt className="inline font-medium text-fg">Projects</dt> <dd className="inline">— by title, pitch, genre and tags.</dd></div>
                  <div><dt className="inline font-medium text-fg">Studios</dt> <dd className="inline">— by name and description.</dd></div>
                  <div><dt className="inline font-medium text-fg">Opportunities</dt> <dd className="inline">— by role and project.</dd></div>
                </dl>
                <p className="mt-4 text-small text-fg-secondary">
                  Not looking for anything in particular? <Link href="/explore" className="font-medium text-link underline-offset-2 hover:underline">Explore</Link> groups what is on Glyph by what you can do with it.
                </p>
              </section>
            ) : (
              <>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <ScopeSwitcher label="Result type" options={scopeOptions} />
                  {!anyError && type === 'projects' && (
                    <FilterLinks
                      label="Filter projects by stage"
                      options={[{ label: 'All stages', href: href({ stage: null }), active: !stage }, ...PROJECT_STAGES.map((s) => ({ label: s.label, href: href({ stage: s.value }), active: stage === s.value }))]}
                    />
                  )}
                </div>
                <p className="mt-3 text-small text-fg-muted">Best match first (exact name, then starts with, then contains), then most recent activity.</p>

                {anyError && (
                  <ErrorState className="mt-4" title="Search could not be completed" description="This may be temporary." retryHref={href({ page })} />
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
                  <ResultsKeyNav>
                    <div className="mt-4 space-y-8">
                      {(type === 'all' || type === 'projects') && projects && projects.rows.length > 0 && (
                        <section aria-labelledby="res-proj">
                          <h2 id="res-proj" className={type === 'all' ? 'mb-1 font-mono text-micro font-medium uppercase tracking-wide text-fg-muted' : 'sr-only'}>Projects <span>{counts.projects}</span></h2>
                          <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                            {projects.rows.map((p) => <ProjectRow key={p.id} variant="listing" project={p} dense />)}
                          </ul>
                          {type === 'all' && counts.projects > SEARCH_ALL_PREVIEW && (
                            <Link href={href({ type: 'projects' })} className="inline-flex min-h-11 items-center text-small font-medium text-link underline-offset-2 hover:underline">See all {counts.projects} projects</Link>
                          )}
                        </section>
                      )}
                      {(type === 'all' || type === 'profiles') && devs && devs.rows.length > 0 && (
                        <section aria-labelledby="res-dev">
                          <h2 id="res-dev" className={type === 'all' ? 'mb-1 font-mono text-micro font-medium uppercase tracking-wide text-fg-muted' : 'sr-only'}>Developers <span>{counts.profiles}</span></h2>
                          <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                            {devs.rows.map((d) => <DeveloperRow key={d.id} developer={d} viewerId={viewer?.id ?? null} following={following.has(d.id)} dense />)}
                          </ul>
                          {type === 'all' && counts.profiles > SEARCH_ALL_PREVIEW && (
                            <Link href={href({ type: 'profiles' })} className="inline-flex min-h-11 items-center text-small font-medium text-link underline-offset-2 hover:underline">See all {counts.profiles} developers</Link>
                          )}
                        </section>
                      )}
                      {(type === 'all' || type === 'studios') && studios && studios.rows.length > 0 && (
                        <section aria-labelledby="res-studio">
                          <h2 id="res-studio" className={type === 'all' ? 'mb-1 font-mono text-micro font-medium uppercase tracking-wide text-fg-muted' : 'sr-only'}>Studios <span>{counts.studios}</span></h2>
                          <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                            {studios.rows.map((s) => <StudioResultRow key={s.id} studio={s} dense />)}
                          </ul>
                          {type === 'all' && counts.studios > SEARCH_ALL_PREVIEW && (
                            <Link href={href({ type: 'studios' })} className="inline-flex min-h-11 items-center text-small font-medium text-link underline-offset-2 hover:underline">See all {counts.studios} studios</Link>
                          )}
                        </section>
                      )}
                      {(type === 'all' || type === 'opportunities') && opportunities && opportunities.rows.length > 0 && (
                        <section aria-labelledby="res-opp">
                          <h2 id="res-opp" className={type === 'all' ? 'mb-1 font-mono text-micro font-medium uppercase tracking-wide text-fg-muted' : 'sr-only'}>Opportunities <span>{counts.opportunities}</span></h2>
                          <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                            {opportunities.rows.map((o) => <CollaborationListing key={o.id} post={o} dense />)}
                          </ul>
                          {type === 'all' && counts.opportunities > SEARCH_ALL_PREVIEW && (
                            <Link href={href({ type: 'opportunities' })} className="inline-flex min-h-11 items-center text-small font-medium text-link underline-offset-2 hover:underline">See all {counts.opportunities} opportunities</Link>
                          )}
                        </section>
                      )}
                      {/* Devlogs: a lightweight, secondary list — surfaced, not a primary category. */}
                      {type === 'all' && devlogs && devlogs.rows.length > 0 && (
                        <section aria-labelledby="res-log">
                          <h2 id="res-log" className="mb-1 font-mono text-micro font-medium uppercase tracking-wide text-fg-muted">Also in devlogs <span>{counts.devlogs}</span></h2>
                          <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                            {devlogs.rows.map((d) => <DevlogRow key={d.id} variant="listing" devlog={fromDiscoveryRow(d as DevlogRowData)} />)}
                          </ul>
                        </section>
                      )}
                      {type === 'devlogs' && devlogs && devlogs.rows.length > 0 && (
                        <section aria-labelledby="res-log">
                          <h2 id="res-log" className="sr-only">Devlogs <span>{counts.devlogs}</span></h2>
                          <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                            {devlogs.rows.map((d) => <DevlogRow key={d.id} variant="listing" devlog={fromDiscoveryRow(d as DevlogRowData)} />)}
                          </ul>
                        </section>
                      )}
                      {type !== 'all' && <Pager page={page} hasMore={offset + LIST_PAGE_SIZE < totalHere} hrefForPage={(n) => href({ page: n })} />}
                    </div>
                  </ResultsKeyNav>
                )}
              </>
            )}
          </div>
        )
      }}
    </DiscoveryFrame>
  )
}
