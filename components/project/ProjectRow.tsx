import Link from 'next/link'
import { ENGINES, labelFor, PROJECT_STAGES } from '@/lib/supabase/types'
import { isHttpsUrl, markdownExcerpt, relativeTime } from '@/lib/utils'
import { MetadataBar } from '@/components/ui/MetadataBar'
import { ProjectMark } from '@/components/project/ProjectMark'

export type ProjectRowData = {
  id: string
  title: string
  slug: string | null
  stage: string | null
  short_description?: string | null
  cover_url?: string | null
  cover_image_url?: string | null
  /** Owner-side rows carry updated_at; discovery rows carry last_activity_at. */
  updated_at?: string
  // Discovery rows (listing variant) also carry the owner and activity facts:
  username?: string
  display_name?: string | null
  engine?: string | null
  genre?: string | null
  last_activity_at?: string
  has_open_playtest?: boolean
}

/**
 * One project, three contexts. `feature` leads a profile or the dashboard (cover, title, pitch, facts);
 * `compact` is a list line; `listing` is a discovery/search result (thumbnail, title, pitch, one meta line).
 * Same object, same link target (the canonical project page). Renders inside a <ul> for compact/listing via <li>.
 */
export function ProjectRow({ project, username, variant = 'compact', dense = false }: { project: ProjectRowData; username?: string; variant?: 'compact' | 'feature' | 'listing'; /** Search's fast-scan density: identity + one meta line, no pitch. Explore/Studios keep the richer default. */ dense?: boolean }) {
  const owner = project.username ?? username ?? ''
  const href = project.slug ? `/p/${owner}/${project.slug}` : null
  const stage = project.stage ? labelFor(PROJECT_STAGES, project.stage) : null
  const activity = project.last_activity_at ?? project.updated_at ?? ''

  if (variant === 'listing') {
    const engine = project.engine ? labelFor(ENGINES, project.engine) ?? project.engine : null
    const maker = project.display_name || project.username || owner
    const pitch = !dense && project.short_description ? markdownExcerpt(project.short_description, 160) : ''
    return (
      <li className={`flex gap-3 ${dense ? 'py-2.5' : 'py-4'}`}>
        <div className="w-16 shrink-0">
          <ProjectMark title={project.title} id={project.id} coverUrl={project.cover_url ?? project.cover_image_url} ratio="square" compact className={dense ? '!aspect-auto h-10' : '!aspect-auto h-12'} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-body font-medium text-fg [overflow-wrap:anywhere]">
            {href ? <Link href={href} data-result-link className="inline-flex min-h-11 items-center hover:text-link focus-visible:text-link sm:min-h-0">{project.title}</Link> : project.title}
          </h3>
          {pitch && <p className="line-clamp-2 text-small text-fg-secondary">{pitch}</p>}
          <p className={`${dense ? '' : 'mt-1'} text-small text-fg-muted [overflow-wrap:anywhere]`}>
            {owner && <Link href={`/dev/${owner}`} className="hover:text-link focus-visible:text-link">{maker}</Link>}
            {stage && <> · {stage}</>}
            {engine && <> · {engine}</>}
            {project.genre && <> · {project.genre}</>}
            {project.has_open_playtest && <> · <span className="font-medium text-link">Open playtest</span></>}
            <> · last activity {relativeTime(activity)}</>
          </p>
        </div>
      </li>
    )
  }

  if (variant === 'compact') {
    const inner = (
      <>
        <span className="min-w-0 flex-1 truncate text-body font-medium text-fg group-hover:text-link">{project.title}</span>
        {stage && <span className="shrink-0 text-small text-fg-secondary">{stage}</span>}
        <span className="hidden shrink-0 text-small text-fg-muted sm:inline">Updated {activity && relativeTime(activity)}</span>
      </>
    )
    return href ? (
      <Link href={href} className="group flex min-h-11 items-center gap-3 py-2">{inner}</Link>
    ) : (
      <div className="flex min-h-11 items-center gap-3 py-2">{inner}</div>
    )
  }

  const image = [project.cover_url, project.cover_image_url].find(isHttpsUrl) ?? null
  return (
    <article className="flex flex-col gap-4 sm:flex-row">
      {image && (
        <div className="shrink-0 sm:w-56">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="aspect-video w-full rounded-media border border-line object-cover" loading="lazy" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="text-h2 font-semibold text-fg [overflow-wrap:anywhere]">
          {href ? <Link href={href} className="inline-flex min-h-11 items-center hover:text-link sm:min-h-0">{project.title}</Link> : project.title}
        </h3>
        {project.short_description && <p className="mt-1 text-body text-fg-secondary">{project.short_description}</p>}
        <MetadataBar className="mt-3" items={[{ label: 'Stage', value: stage }, { label: 'Updated', value: activity ? relativeTime(activity) : null }]} />
      </div>
    </article>
  )
}
