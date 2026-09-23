import Link from 'next/link'
import { labelFor, ENGINES, PROJECT_STAGES } from '@/lib/supabase/types'
import { relativeTime, isHttpsUrl } from '@/lib/utils'
import { ProjectMark } from './ProjectMark'
import type { ProjectRowData } from '@/lib/discovery/queries'

/**
 * A project in the discovery grid — the "Showcase" treatment (approved art direction):
 * when the project has a cover, the media is large and the identity is laid over it on a scrim
 * (games as visual objects); when it has none, the characterful title-plate carries it. A single
 * caption row (developer · genre, then opportunity/activity) sits below both so the grid keeps one
 * rhythm regardless of media. Whole tile links to the project; the developer link stays independent.
 */
export function ProjectTile({ project }: { project: ProjectRowData }) {
  const href = `/p/${project.username}/${project.slug}`
  const devName = project.display_name || project.username
  const engine = project.engine ? labelFor(ENGINES, project.engine) ?? project.engine : null
  const stage = project.stage ? labelFor(PROJECT_STAGES, project.stage) : null
  const hasCover = isHttpsUrl(project.cover_url)
  const meta = [engine, project.genre].filter(Boolean).join(' · ')

  return (
    <article className="group relative flex flex-col">
      <div className="relative overflow-hidden rounded-panel">
        <ProjectMark title={project.title} id={project.id} coverUrl={project.cover_url} engine={project.engine} genre={project.genre} stage={hasCover ? null : project.stage} />
        {hasCover && (
          <>
            <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(12,12,14,.82) 0%, rgba(12,12,14,.28) 48%, transparent 78%)' }} />
            {project.has_open_playtest && (
              <span className="absolute left-2.5 top-2.5 rounded-full bg-accent px-2 py-0.5 font-mono text-micro font-semibold text-white">Playtest open</span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
              <h3 className="min-w-0 text-h3 font-semibold tracking-tight text-white [overflow-wrap:anywhere]">
                <Link href={href} className="after:absolute after:inset-0 after:content-['']">{project.title}</Link>
              </h3>
              {stage && <span className="shrink-0 rounded-badge bg-white/18 px-1.5 py-0.5 font-mono text-micro font-medium text-white backdrop-blur-sm">{stage}</span>}
            </div>
          </>
        )}
        {!hasCover && (
          <Link href={href} aria-label={project.title} className="absolute inset-0" />
        )}
      </div>
      <div className="mt-2.5 flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/dev/${project.username}`} className="relative z-10 block w-fit text-small font-medium text-fg hover:text-link">{devName}</Link>
          {meta && <p className="mt-0.5 font-mono text-micro text-fg-secondary">{meta}</p>}
        </div>
        <span className="shrink-0 whitespace-nowrap pt-0.5 text-micro text-fg-muted">
          {!hasCover && project.has_open_playtest && <span className="mr-1.5 font-medium text-link">Playtest</span>}
          {relativeTime(project.last_activity_at)}
        </span>
      </div>
    </article>
  )
}
