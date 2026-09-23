import { labelFor, ENGINES, PROJECT_STAGES } from '@/lib/supabase/types'
import { isHttpsUrl, initialsOf } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { tintFor } from '@/lib/tint'

/**
 * A project's visual anchor — the answer to media poverty (only ~1 in 6 real projects has a
 * cover). With a cover it shows it at a fixed ratio. Without one it renders a deliberate
 * **title-plate**, not a gray box and not an avatar-style single letter: the project's own title
 * set large as a title card, on a deterministic flat tint chosen from its id, with the stage and
 * engine·genre as quiet typed metadata. A cover-less project reads as a designed cover, not a gap.
 *
 * Each tint carries one dark `ink` used for every text element on the plate, so contrast is high
 * on both the pale tint and on the near-white stage chip (all inks ≥ ~4.5:1 on their own bg).
 * The palette lives in lib/tint so the coverless hero band and avatars share it.
 */

export function ProjectMark({
  title,
  id,
  coverUrl,
  engine,
  genre,
  stage,
  ratio = 'video',
  eager = false,
  compact = false,
  className,
}: {
  title: string
  id: string
  coverUrl?: string | null
  engine?: string | null
  genre?: string | null
  stage?: string | null
  ratio?: 'video' | 'square'
  /** Eager-load above-the-fold covers (e.g. the Explore lead) so they don't delay LCP. */
  eager?: boolean
  /** Row-thumbnail scale (e.g. a 64×48 search/list thumb): initials on the tint, like Avatar,
   *  instead of the full title — at that size the title is already set as text right next to it,
   *  and the full title-plate treatment clips. Same tint palette, so it still reads as one system. */
  compact?: boolean
  className?: string
}) {
  const cover = isHttpsUrl(coverUrl) ? coverUrl : null
  const ratioClass = ratio === 'square' ? 'aspect-square' : 'aspect-video'
  const engineLabel = engine ? labelFor(ENGINES, engine) ?? engine : null
  const stageLabel = stage ? labelFor(PROJECT_STAGES, stage) : null
  const meta = [engineLabel, genre].filter(Boolean).join(' · ')

  if (cover) {
    return (
      <div className={cn('relative overflow-hidden rounded-media border border-line bg-surface-muted', ratioClass, className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          {...(eager ? { fetchPriority: 'high' as const } : {})}
          className="size-full object-cover transition-transform duration-300 ease-out motion-safe:group-hover:scale-[1.03]"
        />
        {stageLabel && (
          <span className="absolute left-2 top-2 rounded-badge bg-canvas/90 px-1.5 py-0.5 font-mono text-micro font-medium text-fg backdrop-blur-sm">{stageLabel}</span>
        )}
      </div>
    )
  }

  const tint = tintFor(id || title)

  if (compact) {
    return (
      <div
        aria-hidden
        className={cn('flex items-center justify-center overflow-hidden rounded-media border border-line font-display font-semibold', ratioClass, className)}
        style={{ backgroundColor: tint.bg, color: tint.ink }}
      >
        {initialsOf(title)}
      </div>
    )
  }

  // The title is the cover, so its size must track the plate's size: a container-relative clamp
  // scales it up in the wide Explore feature and down in a 160px dashboard thumbnail, instead of a
  // fixed size that looked lost in the big tile and clipped in the small one. Optically centred so
  // it never strands at the bottom of an empty band.
  return (
    <div
      className={cn('relative flex flex-col overflow-hidden rounded-media border border-line transition-shadow duration-200 group-hover:shadow-raised', ratioClass, className)}
      style={{ backgroundColor: tint.bg, containerType: 'size' }}
    >
      {stageLabel && (
        <span className="absolute left-3 top-3 z-10 rounded-badge bg-canvas/80 px-1.5 py-0.5 font-mono text-micro font-medium" style={{ color: tint.ink }}>{stageLabel}</span>
      )}
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <span
          aria-hidden
          className="text-center font-display font-semibold leading-[1.03] tracking-tight [overflow-wrap:anywhere] line-clamp-3"
          style={{ color: tint.ink, fontSize: 'clamp(0.95rem, 15cqmin, 2.75rem)' }}
        >
          {title}
        </span>
      </div>
      {meta && <span className="absolute inset-x-4 bottom-3 truncate text-center font-mono text-micro" style={{ color: tint.ink, opacity: 0.85 }}>{meta}</span>}
    </div>
  )
}
