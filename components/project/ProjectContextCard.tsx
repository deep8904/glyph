import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ProjectMark } from '@/components/project/ProjectMark'
import { labelFor, ENGINES, PROJECT_STAGES } from '@/lib/supabase/types'

/**
 * The work an opportunity or playtest is attached to, given real weight: a proper media card
 * (cover or tinted plate at a size that actually carries identity, not a small chip), the pitch,
 * and a way through to the project's own record — so an applicant or tester evaluates the game
 * before the role, not a job posting floating in the abstract.
 */
export function ProjectContextCard({
  kicker,
  title,
  id,
  username,
  slug,
  coverUrl,
  shortDescription,
  stage,
  engine,
  genre,
  hideTitle = false,
}: {
  /** e.g. "Role on", "Playtesting" — names what this card is in service of. */
  kicker: string
  title: string
  id: string
  username?: string | null
  slug?: string | null
  coverUrl?: string | null
  shortDescription?: string | null
  stage?: string | null
  engine?: string | null
  genre?: string | null
  /** When the page's own <h1> already is the project title (e.g. a playtest page), don't repeat
   *  it a third time (plate text, then here) — show the kicker, facts, pitch and link only. */
  hideTitle?: boolean
}) {
  const href = username && slug ? `/p/${username}/${slug}` : null
  const facts = [stage ? labelFor(PROJECT_STAGES, stage) : null, engine ? labelFor(ENGINES, engine) ?? engine : null, genre].filter(Boolean).join(' · ')

  const inner = (
    <>
      <div className="w-full shrink-0 sm:w-44">
        <ProjectMark title={title} id={id} coverUrl={coverUrl} engine={engine} genre={genre} stage={stage} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-micro font-medium uppercase tracking-wide text-fg-muted">{kicker}</p>
        {!hideTitle && <h2 className="mt-0.5 text-h3 font-semibold text-fg [overflow-wrap:anywhere] group-hover:text-link">{title}</h2>}
        {facts && <p className={`font-mono text-micro text-fg-muted ${hideTitle ? 'mt-1' : 'mt-0.5'}`}>{facts}</p>}
        {shortDescription && <p className="mt-1.5 line-clamp-2 text-small text-fg-secondary">{shortDescription}</p>}
        {href && (
          <span className="mt-2 inline-flex items-center gap-1 text-small font-medium text-link">
            View project &amp; devlogs <ArrowRight aria-hidden strokeWidth={1.75} className="size-3.5" />
          </span>
        )}
      </div>
    </>
  )

  return href ? (
    <Link href={href} className="group flex flex-col gap-3 rounded-panel border border-line p-3 transition-colors hover:border-line-strong sm:flex-row sm:gap-4 sm:p-4">
      {inner}
    </Link>
  ) : (
    <div className="flex flex-col gap-3 rounded-panel border border-line p-3 sm:flex-row sm:gap-4 sm:p-4">{inner}</div>
  )
}
