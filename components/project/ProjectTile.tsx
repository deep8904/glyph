import Link from 'next/link'
import { labelFor, ENGINES } from '@/lib/supabase/types'
import { relativeTime, isHttpsUrl } from '@/lib/utils'
import { ProjectMark } from './ProjectMark'
import type { ProjectRowData } from '@/lib/discovery/queries'

/**
 * A project in a discovery grid — media-or-title-plate on top, then title, developer, and its
 * opportunity signal. Whole surface links to the project (stretched primary link), developer name
 * stays independently clickable (relative z-10). Engine·genre is shown in the caption only when a
 * cover is present — the cover-less title-plate already carries that metadata, so it isn't repeated.
 */
export function ProjectTile({ project }: { project: ProjectRowData }) {
  const href = `/p/${project.username}/${project.slug}`
  const devName = project.display_name || project.username
  const engine = project.engine ? labelFor(ENGINES, project.engine) ?? project.engine : null
  const hasCover = isHttpsUrl(project.cover_url)
  const meta = [engine, project.genre].filter(Boolean).join(' · ')

  return (
    <article className="group relative flex flex-col">
      <ProjectMark
        title={project.title}
        id={project.id}
        coverUrl={project.cover_url}
        engine={project.engine}
        genre={project.genre}
        stage={project.stage}
      />
      <div className="mt-3 flex min-w-0 flex-col">
        <h3 className="text-h3 font-semibold text-fg [overflow-wrap:anywhere]">
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] group-hover:text-link">{project.title}</Link>
        </h3>
        {/* Developer sits above the stretched link so it stays independently clickable and tappable. */}
        <Link href={`/dev/${project.username}`} className="relative z-10 -my-1 mt-0 w-fit py-1 text-small text-fg-secondary hover:text-link">
          {devName}
        </Link>
        {hasCover && meta && <p className="mt-1 font-mono text-micro text-fg-secondary">{meta}</p>}
        <p className="mt-1.5 flex items-center gap-2 text-micro">
          {project.has_open_playtest && <span className="font-medium text-link">Open playtest</span>}
          {project.has_open_playtest && <span aria-hidden className="text-line-strong">·</span>}
          <span className="text-fg-secondary">{relativeTime(project.last_activity_at)}</span>
        </p>
      </div>
    </article>
  )
}
