import { labelFor, ENGINES, PROJECT_STAGES } from '@/lib/supabase/types'
import { isHttpsUrl } from '@/lib/utils'
import { cn } from '@/lib/utils'

/**
 * A project's visual anchor — the answer to media poverty (only ~1 in 6 real projects has a
 * cover). With a cover it shows it at a fixed ratio. Without one it renders a deliberate
 * **title-plate**, not a gray box and not an avatar-style single letter: the project's own title
 * set large as a title card, on a deterministic flat tint chosen from its id, with the stage and
 * engine·genre as quiet typed metadata. A cover-less project reads as a designed cover, not a gap.
 *
 * Each tint carries one dark `ink` used for every text element on the plate, so contrast is high
 * on both the pale tint and on the near-white stage chip (all inks ≥ ~4.5:1 on their own bg).
 */

const TINTS = [
  { bg: '#edf0f5', ink: '#3b4557' }, // slate
  { bg: '#f4ece5', ink: '#6b4a2e' }, // clay
  { bg: '#e7f0ea', ink: '#285c3f' }, // moss
  { bg: '#efecf7', ink: '#45397a' }, // iris
  { bg: '#f1ece2', ink: '#5f4f30' }, // sand
  { bg: '#e8eef3', ink: '#2f4a63' }, // steel
]

function tintFor(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return TINTS[h % TINTS.length]
}

export function ProjectMark({
  title,
  id,
  coverUrl,
  engine,
  genre,
  stage,
  ratio = 'video',
  eager = false,
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
  return (
    <div
      className={cn('relative flex flex-col justify-between overflow-hidden rounded-media border border-line p-4 transition-shadow duration-200 group-hover:shadow-raised', ratioClass, className)}
      style={{ backgroundColor: tint.bg }}
    >
      {stageLabel ? (
        <span className="self-start rounded-badge bg-canvas/80 px-1.5 py-0.5 font-mono text-micro font-medium" style={{ color: tint.ink }}>{stageLabel}</span>
      ) : <span />}
      <span
        aria-hidden
        className="font-display font-semibold leading-[1.05] tracking-tight [overflow-wrap:anywhere] line-clamp-3"
        style={{ color: tint.ink, fontSize: ratio === 'square' ? '1.125rem' : '1.5rem' }}
      >
        {title}
      </span>
      {meta && <span className="mt-2 truncate font-mono text-micro" style={{ color: tint.ink }}>{meta}</span>}
    </div>
  )
}
