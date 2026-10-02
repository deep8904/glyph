import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { GlyphFilterChips, GlyphProjectRow, GlyphDevListRow, GlyphDevlogListRow, GlyphPager } from '@/components/glyph/explore/SectionObjects'
import { GEmptyState, GErrorState } from '@/components/glyph/ui/States'
import type { ProjectRowData, DeveloperRowData, DevlogRowData } from '@/lib/discovery/queries'
import { exploreDevelopers, exploreDevlogs, exploreProjects, followedAmong, isSection, parsePage } from '@/lib/discovery/queries'
import { buildExploreHref } from '@/lib/glyph/exploreHref'
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

  // Every filter and the page live in the URL — lists stay shareable and back/forward work.
  const href = (over: Parameters<typeof buildExploreHref>[2] = {}) => buildExploreHref(section, { stage, playtest, collab }, over)
  const filtered = !!(stage || playtest || collab)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const result =
    section === 'projects' ? await exploreProjects(supabase, { page, stage, openPlaytest: playtest })
    : section === 'developers' ? await exploreDevelopers(supabase, { page, excludeUserId: user?.id ?? null, openToCollab: collab })
    : await exploreDevlogs(supabase, { page })
  const following = section === 'developers'
    ? await followedAmong(supabase, user?.id ?? null, (result.rows as { id: string }[]).map((d) => d.id))
    : new Set<string>()

  return (
    <div>
      <Link href="/explore" className="inline-flex min-h-11 items-center gap-1.5 rounded-sm text-small font-medium text-ink-2 outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ember">
        <ArrowLeft aria-hidden strokeWidth={1.75} className="size-4" /> Explore
      </Link>
      <header className="mb-6 mt-1">
        <h1 className="text-h1 font-semibold tracking-[-0.02em] text-ink">{TITLES[section]}</h1>
        <p className="mt-1.5 text-body text-ink-2">{NOTES[section]}</p>
      </header>

      {section === 'projects' && (
        <div className="mb-6 space-y-2.5">
          <GlyphFilterChips label="Filter projects by stage" options={[{ label: 'All stages', href: href({ stage: null }), active: !stage }, ...PROJECT_STAGES.map((s) => ({ label: s.label, href: href({ stage: s.value }), active: stage === s.value }))]} />
          <GlyphFilterChips label="Filter projects by playtest" options={[{ label: 'Open playtest only', href: href({ playtest: !playtest }), active: playtest }]} />
        </div>
      )}
      {section === 'developers' && (
        <div className="mb-6">
          <GlyphFilterChips label="Filter developers" options={[{ label: 'All developers', href: href({ collab: false }), active: !collab }, { label: 'Open to collaborate', href: href({ collab: true }), active: collab }]} />
        </div>
      )}

      {result.error ? (
        <GErrorState title="This list could not be loaded" description="This may be temporary." action={<Link href={href({ page })} className="text-small font-medium text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember">Retry</Link>} />
      ) : result.rows.length === 0 ? (
        <GEmptyState
          title={page > 1 ? 'Nothing further in this list' : filtered ? 'Nothing matches these filters' : `No ${TITLES[section].toLowerCase()} yet`}
          description={
            page > 1 ? 'You have reached the end.'
            : stage ? `No public projects at the ${labelFor(PROJECT_STAGES, stage)} stage${playtest ? ' with an open playtest' : ''}.`
            : filtered ? 'Try removing a filter.'
            : 'They appear here when they are published on Glyph.'
          }
          action={(page > 1 || filtered) ? <Link href={page > 1 ? href({ page: 1 }) : `/explore/${section}`} className="text-small font-medium text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember">{page > 1 ? 'Back to the first page' : 'Clear filters'}</Link> : undefined}
        />
      ) : section === 'projects' ? (
        <ul className="max-w-4xl border-t border-hair">
          {(result.rows as unknown as ProjectRowData[]).map((p) => <GlyphProjectRow key={p.id} p={p} />)}
        </ul>
      ) : section === 'developers' ? (
        <ul className="max-w-4xl border-t border-hair">
          {(result.rows as unknown as DeveloperRowData[]).map((d) => <GlyphDevListRow key={d.id} d={d} following={following.has(d.id)} />)}
        </ul>
      ) : (
        <ul className="max-w-3xl border-t border-hair">
          {(result.rows as unknown as DevlogRowData[]).map((d) => <GlyphDevlogListRow key={d.id} d={d} />)}
        </ul>
      )}

      {/* Pager only on populated results — an out-of-range page shows the past-end empty state + its
          direct return action instead, so users can't walk backward through empty pages. Width is
          aligned to the directory it controls. */}
      {!result.error && result.rows.length > 0 && (
        <GlyphPager page={page} hasMore={result.hasMore} hrefForPage={(n) => href({ page: n })} className={section === 'devlogs' ? 'max-w-3xl' : 'max-w-4xl'} />
      )}
    </div>
  )
}
