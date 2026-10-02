import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { GlyphShell } from '@/components/glyph/shell/GlyphShell'
import { GlyphSearchMasthead } from '@/components/glyph/search/GlyphSearchMasthead'
import { GlyphStudioResultRow } from '@/components/glyph/search/GlyphStudioResultRow'
import { GlyphOpportunityResultRow } from '@/components/glyph/search/GlyphOpportunityResultRow'
import { GlyphFilterChips, GlyphProjectRow, GlyphDevListRow, GlyphDevlogListRow, GlyphPager } from '@/components/glyph/explore/SectionObjects'
import { GEmptyState, GErrorState } from '@/components/glyph/ui/States'
import {
  LIST_PAGE_SIZE, SEARCH_ALL_PREVIEW, followedAmong, parsePage,
  searchDevelopers, searchDevlogs, searchProjects, searchStudios, searchOpportunities,
} from '@/lib/discovery/queries'
import { buildSearchHref, parseSearchType, SEARCH_TABS, type SearchType } from '@/lib/glyph/searchHref'
import { computeSearchTotal, classifySearchResults } from '@/lib/glyph/searchResultState'
import { PROJECT_STAGES, labelFor } from '@/lib/supabase/types'

export const metadata = { title: 'Search — Glyph' }

const TAB_LABEL: Record<SearchType, string> = { all: 'All', profiles: 'Developers', projects: 'Projects', studios: 'Studios', opportunities: 'Opportunities', devlogs: 'Devlogs' }

type Params = { q?: string; type?: string; page?: string; stage?: string }

export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim().slice(0, 100)
  const type = parseSearchType(sp.type)
  const page = type === 'all' ? 1 : parsePage(sp.page)
  const stage = type === 'projects' && PROJECT_STAGES.some((s) => s.value === sp.stage) ? (sp.stage as string) : null

  const href = (over: Parameters<typeof buildSearchHref>[1] = {}) => buildSearchHref({ q, type, stage }, over)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
  // Past the last page a list comes back empty with total 0; ask for the first row again so tab
  // counts and the "no further results" message stay truthful.
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
  const following = devs && user ? await followedAmong(supabase, user.id, devs.rows.map((d) => d.id)) : new Set<string>()

  const totalHere = computeSearchTotal(type, counts, projects?.total ?? 0)

  const scopeOptions = SEARCH_TABS.map((t) => ({
    label: t === 'all' ? TAB_LABEL[t] : `${TAB_LABEL[t]} · ${counts[t as Exclude<SearchType, 'all' | 'devlogs'>]}`,
    href: href({ type: t, stage: null }),
    active: t === type,
  }))

  const resultState = classifySearchResults({ anyError, page, offset, total: totalHere })
  const pastEnd = resultState === 'past-end'
  const noResults = resultState === 'no-results'

  return (
    <GlyphShell>
    <div className="mx-auto w-full max-w-4xl">
      <GlyphSearchMasthead q={q} type={type} stage={stage} />

      {!q ? (
        <section className="mt-8" aria-labelledby="search-help">
          <h2 id="search-help" className="text-h3 font-semibold text-ink">What you can search</h2>
          <dl className="mt-3 grid gap-x-8 gap-y-2 text-small text-ink-2 sm:grid-cols-2">
            <div><dt className="inline font-medium text-ink">Developers</dt> <dd className="inline">— by name or username.</dd></div>
            <div><dt className="inline font-medium text-ink">Projects</dt> <dd className="inline">— by title, pitch, genre and tags.</dd></div>
            <div><dt className="inline font-medium text-ink">Studios</dt> <dd className="inline">— by name and description.</dd></div>
            <div><dt className="inline font-medium text-ink">Opportunities</dt> <dd className="inline">— by role and project.</dd></div>
          </dl>
          <p className="mt-4 text-small text-ink-2">
            Not looking for anything in particular?{' '}
            <Link href="/explore" className="font-medium text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember">Explore</Link>{' '}
            groups what is on Glyph by what you can do with it.
          </p>
        </section>
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <GlyphFilterChips label="Result type" options={scopeOptions} />
            {!anyError && type === 'projects' && (
              <GlyphFilterChips
                label="Filter projects by stage"
                options={[{ label: 'All stages', href: href({ stage: null }), active: !stage }, ...PROJECT_STAGES.map((s) => ({ label: s.label, href: href({ stage: s.value }), active: stage === s.value }))]}
              />
            )}
          </div>
          <p className="mt-3 text-small text-ink-3">Best match first (exact name, then starts with, then contains), then most recent activity.</p>

          {anyError && (
            <div className="mt-6">
              <GErrorState title="Search could not be completed" description="This may be temporary." action={<Link href={href({ page })} className="text-small font-medium text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember">Retry</Link>} />
            </div>
          )}

          {pastEnd && (
            <div className="mt-6">
              <GEmptyState
                title="No further results"
                description={`You have reached the end of the results for "${q}".`}
                action={<Link href={href({ page: 1 })} className="text-small font-medium text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember">Back to the first page</Link>}
              />
            </div>
          )}

          {noResults && (
            <div className="mt-6">
              <GEmptyState
                title={`No ${type === 'all' ? 'results' : TAB_LABEL[type].toLowerCase()}${stage ? ` at the ${labelFor(PROJECT_STAGES, stage)} stage` : ''} for "${q}"`}
                description='Words match from the start ("ember" finds "Emberfall") and names and titles match anywhere in the text. Fewer or shorter words usually help.'
                action={
                  <span className="flex flex-wrap gap-x-4 gap-y-1">
                    {type !== 'all' && <Link href={href({ type: 'all', stage: null })} className="text-small font-medium text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember">Search everything</Link>}
                    {stage && <Link href={href({ stage: null })} className="text-small font-medium text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember">Show all stages</Link>}
                    <Link href="/explore" className="text-small font-medium text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember">Browse Explore</Link>
                  </span>
                }
              />
            </div>
          )}

          {resultState === 'results' && (
            <div className="mt-6 space-y-9">
              {(type === 'all' || type === 'projects') && projects && projects.rows.length > 0 && (
                <section aria-labelledby="res-proj">
                  <h2 id="res-proj" className={type === 'all' ? 'mb-1 font-mono text-micro font-medium uppercase tracking-wide text-ink-3' : 'sr-only'}>Projects <span>{counts.projects}</span></h2>
                  <ul className="border-t border-hair">{projects.rows.map((p) => <GlyphProjectRow key={p.id} p={p} />)}</ul>
                  {type === 'all' && counts.projects > SEARCH_ALL_PREVIEW && (
                    <Link href={href({ type: 'projects' })} className="mt-2 inline-flex min-h-11 items-center text-small font-medium text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">See all {counts.projects} projects</Link>
                  )}
                </section>
              )}
              {(type === 'all' || type === 'profiles') && devs && devs.rows.length > 0 && (
                <section aria-labelledby="res-dev">
                  <h2 id="res-dev" className={type === 'all' ? 'mb-1 font-mono text-micro font-medium uppercase tracking-wide text-ink-3' : 'sr-only'}>Developers <span>{counts.profiles}</span></h2>
                  <ul className="border-t border-hair">{devs.rows.map((d) => <GlyphDevListRow key={d.id} d={d} following={following.has(d.id)} />)}</ul>
                  {type === 'all' && counts.profiles > SEARCH_ALL_PREVIEW && (
                    <Link href={href({ type: 'profiles' })} className="mt-2 inline-flex min-h-11 items-center text-small font-medium text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">See all {counts.profiles} developers</Link>
                  )}
                </section>
              )}
              {(type === 'all' || type === 'studios') && studios && studios.rows.length > 0 && (
                <section aria-labelledby="res-studio">
                  <h2 id="res-studio" className={type === 'all' ? 'mb-1 font-mono text-micro font-medium uppercase tracking-wide text-ink-3' : 'sr-only'}>Studios <span>{counts.studios}</span></h2>
                  <ul className="border-t border-hair">{studios.rows.map((s) => <GlyphStudioResultRow key={s.id} studio={s} />)}</ul>
                  {type === 'all' && counts.studios > SEARCH_ALL_PREVIEW && (
                    <Link href={href({ type: 'studios' })} className="mt-2 inline-flex min-h-11 items-center text-small font-medium text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">See all {counts.studios} studios</Link>
                  )}
                </section>
              )}
              {(type === 'all' || type === 'opportunities') && opportunities && opportunities.rows.length > 0 && (
                <section aria-labelledby="res-opp">
                  <h2 id="res-opp" className={type === 'all' ? 'mb-1 font-mono text-micro font-medium uppercase tracking-wide text-ink-3' : 'sr-only'}>Opportunities <span>{counts.opportunities}</span></h2>
                  <ul className="border-t border-hair">{opportunities.rows.map((o) => <GlyphOpportunityResultRow key={o.id} post={o} />)}</ul>
                  {type === 'all' && counts.opportunities > SEARCH_ALL_PREVIEW && (
                    <Link href={href({ type: 'opportunities' })} className="mt-2 inline-flex min-h-11 items-center text-small font-medium text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">See all {counts.opportunities} opportunities</Link>
                  )}
                </section>
              )}
              {/* Devlogs: a lightweight, secondary list under "All" — surfaced, not a primary category
                  (their own reading home is a project's own page and Explore). */}
              {type === 'all' && devlogs && devlogs.rows.length > 0 && (
                <section aria-labelledby="res-log">
                  <h2 id="res-log" className="mb-1 font-mono text-micro font-medium uppercase tracking-wide text-ink-3">Also in devlogs <span>{counts.devlogs}</span></h2>
                  <ul className="border-t border-hair">{devlogs.rows.map((d) => <GlyphDevlogListRow key={d.id} d={d} headingLevel="h3" />)}</ul>
                </section>
              )}
              {type === 'devlogs' && devlogs && devlogs.rows.length > 0 && (
                <section aria-labelledby="res-log">
                  <h2 id="res-log" className="sr-only">Devlogs <span>{counts.devlogs}</span></h2>
                  <ul className="border-t border-hair">{devlogs.rows.map((d) => <GlyphDevlogListRow key={d.id} d={d} headingLevel="h3" />)}</ul>
                </section>
              )}
              {type !== 'all' && <GlyphPager page={page} hasMore={offset + LIST_PAGE_SIZE < totalHere} hrefForPage={(n) => href({ page: n })} />}
            </div>
          )}
        </>
      )}
    </div>
    </GlyphShell>
  )
}
