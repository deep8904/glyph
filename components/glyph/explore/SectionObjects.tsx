import Link from 'next/link'
import { ArrowUpRight, ArrowLeft, ArrowRight } from 'lucide-react'
import { GAvatar } from '@/components/glyph/ui/primitives'
import { labelFor, ENGINES, PROJECT_STAGES, ROLES } from '@/lib/supabase/types'
import { relativeTime, isHttpsUrl, cn } from '@/lib/utils'
import { toPlainText } from '@/lib/glyph/text'
import { isSampleMedia } from '@/lib/glyph/media'
import type { ProjectRowData, DeveloperRowData, DevlogRowData } from '@/lib/discovery/queries'

/* Section-list presentation for /explore/[section] — Graphite/Bone/Ember only. */

const projectMeta = (p: ProjectRowData) => [p.stage ? labelFor(PROJECT_STAGES, p.stage) : null, p.engine ? labelFor(ENGINES, p.engine) : null, p.genre].filter(Boolean).join(' · ')
const monogram = (t: string) => t.replace(/[^\p{L}\p{N} ]/gu, '').split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '·'

/* ── Project directory row — uniform height whether or not a cover exists. A real cover shows as a
   fixed thumbnail (honestly labelled); a coverless project shows a monogram plate of the same size,
   so mixed shapes never leave row-height dead zones. Source = DOM = keyboard order (no reordering). ── */
export function GlyphProjectRow({ p }: { p: ProjectRowData }) {
  const href = `/p/${p.username}/${p.slug}`
  const cover = isHttpsUrl(p.cover_url) ? (p.cover_url as string) : null
  const owner = p.display_name || p.username
  return (
    <li className="border-b border-hair">
      <Link href={href} className="group flex items-center gap-4 rounded-sm py-3.5 outline-none focus-visible:ring-2 focus-visible:ring-ember">
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-[10px] border border-hair bg-sunken">
          {cover ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover} alt="" loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
              {isSampleMedia(cover) && <span className="pointer-events-none absolute bottom-0.5 right-0.5 rounded bg-[#0b0b0b] px-1 font-mono text-[9px] font-medium text-white">sample</span>}
            </>
          ) : (
            <div className="flex size-full items-center justify-center font-mono text-body font-semibold text-ink-2">{monogram(p.title)}</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold tracking-[-0.01em] text-ink group-hover:text-ember-ink">{p.title}</h3>
            {p.has_open_playtest && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ember px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink-on-ember"><span className="size-1 rounded-full bg-ink-on-ember" />Playtest</span>}
          </div>
          <p className="mt-0.5 truncate font-mono text-micro text-ink-3">{projectMeta(p) || 'Project'}</p>
          <p className="mt-0.5 truncate text-small text-ink-2">{owner}{p.last_activity_at ? <span className="text-ink-3"> · {relativeTime(p.last_activity_at)}</span> : null}</p>
        </div>
        <ArrowUpRight aria-hidden strokeWidth={1.75} className="size-4 shrink-0 text-ink-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
      </Link>
    </li>
  )
}

/* ── Filter chips — URL links; active carries an Ember-quiet fill + Ember ink. ── */
export function GlyphFilterChips({ label, options }: { label: string; options: { label: string; href: string; active: boolean }[] }) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Link
          key={o.href}
          href={o.href}
          aria-current={o.active ? 'true' : undefined}
          className={cn(
            'inline-flex min-h-11 items-center rounded-full border px-3.5 text-small font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ember sm:min-h-9',
            o.active ? 'border-ember-line bg-ember-quiet text-ember-ink' : 'border-hair text-ink-2 hover:border-hair-strong hover:text-ink'
          )}
        >
          {o.label}
        </Link>
      ))}
    </nav>
  )
}

/* ── Developer directory row — scannable people list (distinct from the hub's fixed cards). ── */
export function GlyphDevListRow({ d, following }: { d: DeveloperRowData; following: boolean }) {
  const name = d.display_name || d.username
  const role = d.primary_role ? labelFor(ROLES, d.primary_role) : 'Developer'
  return (
    <li className="border-b border-hair">
      <Link href={`/dev/${d.username}`} className="group flex items-center gap-4 rounded-sm py-4 outline-none focus-visible:ring-2 focus-visible:ring-ember">
        <GAvatar name={name} src={d.avatar_url} size={48} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate font-semibold text-ink group-hover:text-ember-ink">{name}</span>
            <span className="font-mono text-micro text-ink-3">@{d.username}</span>
            {d.is_open_to_collab && <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-gsuccess"><span className="size-1.5 rounded-full bg-gsuccess" />open</span>}
            {following && <span className="rounded-full bg-sunken px-2 py-0.5 font-mono text-[10px] font-medium text-ink-2">Following</span>}
          </span>
          <span className="mt-0.5 block truncate text-small text-ink-2">
            {role}
            {d.current_project_title && <> · building <span className="text-ink">{d.current_project_title}</span></>}
            {d.last_activity_at && <span className="text-ink-3"> · {relativeTime(d.last_activity_at)}</span>}
          </span>
        </span>
        <ArrowUpRight aria-hidden strokeWidth={1.75} className="size-4 shrink-0 text-ink-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
      </Link>
    </li>
  )
}

/* ── Devlog reading row — full-width update with Project provenance + preview. `headingLevel`
   defaults to 'h2' (Explore's own /explore/[section] usage: a bare h1 page title sits directly
   above these rows). Search's mixed "All" page nests this row under its own h2 section heading, so
   it passes 'h3' there to avoid a sibling-h2/skipped-level heading tree. ── */
export function GlyphDevlogListRow({ d, headingLevel = 'h2' }: { d: DevlogRowData; headingLevel?: 'h2' | 'h3' }) {
  const href = `/p/${d.username}/${d.project_slug}/${d.slug}`
  const author = d.display_name || d.username
  const Heading = headingLevel
  return (
    <li className="border-b border-hair">
      <Link href={href} className="group block rounded-sm py-5 outline-none focus-visible:ring-2 focus-visible:ring-ember">
        <p className="flex items-center gap-2 font-mono text-micro text-ink-3">
          <span className="text-ink-2">{d.project_title}</span><span aria-hidden>·</span><span>{author}</span><span aria-hidden>·</span><span>{relativeTime(d.published_at)}</span>
        </p>
        <Heading className="mt-1.5 text-h3 font-semibold tracking-[-0.01em] text-ink group-hover:text-ember-ink [overflow-wrap:anywhere]">{d.title}</Heading>
        {d.content_preview && <p className="mt-1.5 max-w-[68ch] text-small leading-relaxed text-ink-2 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">{toPlainText(d.content_preview)}</p>}
      </Link>
    </li>
  )
}

/* ── Pager — URL-driven prev/next, preserves filter state via hrefForPage. ── */
export function GlyphPager({ page, hasMore, hrefForPage, className }: { page: number; hasMore: boolean; hrefForPage: (n: number) => string; className?: string }) {
  if (page <= 1 && !hasMore) return null
  const base = 'inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-hair px-4 text-small font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ember'
  const on = 'text-ink hover:border-hair-strong hover:bg-sunken'
  const off = 'pointer-events-none opacity-40 text-ink-3'
  return (
    <nav aria-label="Pagination" className={cn('mt-10 flex items-center justify-between gap-3 border-t border-hair pt-6', className)}>
      {page > 1
        ? <Link href={hrefForPage(page - 1)} className={cn(base, on)} rel="prev"><ArrowLeft aria-hidden strokeWidth={1.75} className="size-4" /> Previous</Link>
        : <span aria-hidden className={cn(base, off)}><ArrowLeft strokeWidth={1.75} className="size-4" /> Previous</span>}
      <span className="font-mono text-micro tabular-nums text-ink-3">Page {page}</span>
      {hasMore
        ? <Link href={hrefForPage(page + 1)} className={cn(base, on)} rel="next">Next <ArrowRight aria-hidden strokeWidth={1.75} className="size-4" /></Link>
        : <span aria-hidden className={cn(base, off)}>Next <ArrowRight strokeWidth={1.75} className="size-4" /></span>}
    </nav>
  )
}
