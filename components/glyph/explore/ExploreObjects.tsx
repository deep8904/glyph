import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { GAvatar } from '@/components/glyph/ui/primitives'
import { SampleTag } from '@/components/glyph/ui/SampleTag'
import { labelFor, ENGINES, PROJECT_STAGES, ROLES } from '@/lib/supabase/types'
import { isHttpsUrl, relativeTime, cn } from '@/lib/utils'
import { isSampleMedia } from '@/lib/glyph/media'
import type { ProjectRowData, DeveloperRowData, DevlogRowData } from '@/lib/discovery/queries'

/* New-surface presentation only — no legacy pastel/tint/ProjectMark helpers. */

const metaLine = (p: ProjectRowData) =>
  [p.stage ? labelFor(PROJECT_STAGES, p.stage) : null, p.engine ? labelFor(ENGINES, p.engine) : null, p.genre].filter(Boolean).join(' · ')
const monogram = (title: string) => title.replace(/[^\p{L}\p{N} ]/gu, '').split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '·'

function PlaytestChip({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-ember px-2 py-0.5 font-mono text-[11px] font-semibold text-ink-on-ember', className)}>
      <span className="size-1.5 rounded-full bg-ink-on-ember" /> Playtest
    </span>
  )
}

/* ── Feature — the single cinematic project. Only ever rendered with a real cover (the page gates
   this), so there is no procedural-media fallback here. ── */
export function GlyphFeature({ p }: { p: ProjectRowData }) {
  const href = `/p/${p.username}/${p.slug}`
  const cover = p.cover_url as string
  const owner = p.display_name || p.username
  return (
    <section aria-labelledby="feature" className="group relative isolate overflow-hidden rounded-[16px] border border-hair shadow-g3">
      <div className="relative aspect-[3/2] w-full sm:aspect-[16/9] lg:aspect-[21/9]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover} alt={`${p.title} cover art`} className="size-full object-cover" />
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(9,8,7,.9) 0%, rgba(9,8,7,.55) 44%, rgba(9,8,7,0) 76%)' }} />
        {isSampleMedia(cover) && <SampleTag />}
        <div className="absolute inset-0 flex max-w-[600px] flex-col justify-center gap-3 p-6 text-on-media sm:p-9">
          {p.has_open_playtest && (
            <p className="flex items-center gap-2 font-mono text-micro font-semibold uppercase tracking-[0.1em]" style={{ color: '#ff8a5c' }}>
              <span className="size-1.5 rounded-full bg-ember" /> In playtest now
            </p>
          )}
          <h2 id="feature" className="text-[clamp(1.6rem,1.1rem+2vw,2.75rem)] font-semibold leading-[1.04] tracking-[-0.025em] [overflow-wrap:anywhere]">
            <Link href={href} className="rounded-sm outline-none after:absolute after:inset-0 after:content-['']">{p.title}</Link>
          </h2>
          {p.short_description && <p className="max-w-prose text-body leading-relaxed text-on-media-2 [overflow-wrap:anywhere]">{p.short_description}</p>}
          <p className="mt-1 flex flex-wrap items-center gap-x-2 font-mono text-micro" style={{ color: 'rgba(255,255,255,.72)' }}>
            <span>{metaLine(p) || 'Project'}</span><span aria-hidden>·</span><span>{owner}</span>
          </p>
        </div>
      </div>
    </section>
  )
}

/* ── Project tile ── two honest shapes:
   • With real cover: media block + title below.
   • Without cover: a COMPACT identity panel (monogram chip + title + meta) — not an image-shaped
     plate pretending to be game media, and never feature-spanned. Title renders once in both. ── */
export function GlyphProjectTile({ p, featured = false }: { p: ProjectRowData; featured?: boolean }) {
  const href = `/p/${p.username}/${p.slug}`
  const cover = isHttpsUrl(p.cover_url) ? (p.cover_url as string) : null
  const owner = p.display_name || p.username
  const meta = metaLine(p) || 'Project'
  const sub = <p className="mt-1 truncate text-small text-ink-2">{owner}{p.last_activity_at ? <span className="text-ink-3"> · {relativeTime(p.last_activity_at)}</span> : null}</p>

  if (!cover) {
    return (
      <article className="group">
        <Link href={href} className="block rounded-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-paper">
          <div className="rounded-[13px] border border-hair bg-panel p-4 shadow-g1 transition-[transform,box-shadow] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-g2">
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-sunken font-mono text-small font-semibold text-ink-2">{monogram(p.title)}</span>
              {p.has_open_playtest ? <PlaytestChip /> : <span className="truncate font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3">{p.engine ? labelFor(ENGINES, p.engine) : 'Project'}</span>}
            </div>
            <h3 className="mt-3 font-semibold tracking-[-0.01em] text-ink group-hover:text-ember-ink [overflow-wrap:anywhere]">{p.title}</h3>
            <p className="mt-0.5 truncate font-mono text-micro text-ink-3">{meta}</p>
            {sub}
          </div>
        </Link>
      </article>
    )
  }

  return (
    <article className={cn('group', featured && 'sm:col-span-2')}>
      <Link href={href} className="block rounded-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-paper">
        <div className={cn('relative overflow-hidden rounded-[13px] border border-hair shadow-g1 transition-[transform,box-shadow] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-g2', featured ? 'aspect-[16/9]' : 'aspect-[3/2]')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt="" loading="lazy" className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]" />
          {isSampleMedia(cover) && <SampleTag />}
          {p.has_open_playtest && <PlaytestChip className="absolute left-3 top-3 shadow-g1" />}
        </div>
      </Link>
      <div className="mt-3">
        <h3 className={cn('font-semibold tracking-[-0.01em] text-ink [overflow-wrap:anywhere]', featured ? 'text-h3' : 'text-body')}>
          <Link href={href} className="rounded-sm outline-none hover:text-ember-ink focus-visible:ring-2 focus-visible:ring-ember">{p.title}</Link>
        </h3>
        <p className="mt-0.5 truncate font-mono text-micro text-ink-3">{meta}</p>
        {sub}
      </div>
    </article>
  )
}

/* ── Developer card — horizontal-strip identity unit; viewer-relative "Following". ── */
export function GlyphDevCard({ d, following }: { d: DeveloperRowData; following: boolean }) {
  const name = d.display_name || d.username
  const role = d.primary_role ? labelFor(ROLES, d.primary_role) : 'Developer'
  return (
    <Link href={`/dev/${d.username}`} className="group flex w-[248px] shrink-0 flex-col gap-3 rounded-[13px] border border-hair bg-panel p-4 shadow-g1 outline-none transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-g2 focus-visible:ring-2 focus-visible:ring-ember">
      <div className="flex items-center gap-3">
        <GAvatar name={name} src={d.avatar_url} size={44} />
        <span className="min-w-0">
          <span className="block truncate font-semibold text-ink group-hover:text-ember-ink">{name}</span>
          <span className="block truncate text-small text-ink-2">{role}</span>
        </span>
      </div>
      <p className="min-h-[2.5rem] text-small text-ink-2">{d.current_project_title ? <>Building <span className="text-ink">{d.current_project_title}</span></> : 'Public work on Glyph'}</p>
      <div className="flex items-center justify-between">
        {d.is_open_to_collab
          ? <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium text-gsuccess"><span className="size-1.5 rounded-full bg-gsuccess" /> open to collaborate</span>
          : <span className="font-mono text-[11px] text-ink-3">{d.last_activity_at ? relativeTime(d.last_activity_at) : ''}</span>}
        {following && <span className="rounded-full bg-sunken px-2 py-0.5 font-mono text-[10px] font-medium text-ink-2">Following</span>}
      </div>
    </Link>
  )
}

/* ── Devlog moment — compact update with project provenance attached. ── */
export function GlyphDevlogMoment({ d }: { d: DevlogRowData }) {
  const href = `/p/${d.username}/${d.project_slug}/${d.slug}`
  return (
    <li className="border-t border-hair first:border-t-0">
      <Link href={href} className="group flex items-start gap-3 rounded-sm py-3.5 outline-none focus-visible:ring-2 focus-visible:ring-ember">
        <GAvatar name={d.display_name || d.username} src={d.avatar_url} size={32} className="mt-0.5" />
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-[11px] text-ink-3"><span className="text-ink-2">{d.project_title}</span> · {relativeTime(d.published_at)}</span>
          <span className="mt-0.5 block font-medium leading-snug text-ink group-hover:text-ember-ink [overflow-wrap:anywhere]">{d.title}</span>
        </span>
        <ArrowUpRight aria-hidden strokeWidth={1.75} className="mt-1 size-4 shrink-0 text-ink-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
      </Link>
    </li>
  )
}
