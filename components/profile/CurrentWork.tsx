import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { labelFor, PROJECT_STAGES } from '@/lib/supabase/types'
import { relativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProjectMark } from '@/components/project/ProjectMark'

export type CurrentWorkProject = {
  id: string
  title: string
  slug: string | null
  stage: string | null
  short_description?: string | null
  cover_url?: string | null
  cover_image_url?: string | null
  updated_at?: string
}

export type CurrentWorkDevlog = { title: string; href: string; published_at: string }

/**
 * The one visually dominant object on a profile: "this person is actively building THIS."
 * Deliberately not the same anatomy as ProjectRow's other variants — a project on a profile
 * only ever has one Current Work, so it earns a distinct, larger composition instead of being
 * a bigger version of the compact row below it.
 */
export function CurrentWork({ project, username, latestDevlog }: { project: CurrentWorkProject; username: string; latestDevlog?: CurrentWorkDevlog | null }) {
  const href = project.slug ? `/p/${username}/${project.slug}` : null
  const stage = project.stage ? labelFor(PROJECT_STAGES, project.stage) : null

  return (
    <div className="group flex flex-col gap-5 sm:flex-row">
      <div className="sm:w-2/5 sm:shrink-0">
        {href ? (
          <Link href={href} aria-label={project.title} className="block">
            <ProjectMark title={project.title} id={project.id} coverUrl={project.cover_url ?? project.cover_image_url} genre={null} stage={project.stage} />
          </Link>
        ) : (
          <ProjectMark title={project.title} id={project.id} coverUrl={project.cover_url ?? project.cover_image_url} genre={null} stage={project.stage} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {stage && <Badge tone="accent">{stage}</Badge>}
        </div>
        <h3 className="mt-2 text-h1 font-semibold text-fg [overflow-wrap:anywhere]">
          {href ? <Link href={href} className="hover:text-link">{project.title}</Link> : project.title}
        </h3>
        {project.short_description && <p className="mt-1 max-w-prose text-body text-fg-secondary">{project.short_description}</p>}

        {latestDevlog && (
          <p className="mt-3 text-small text-fg-secondary">
            Latest:{' '}
            <Link href={latestDevlog.href} className="font-medium text-link underline-offset-2 hover:underline">{latestDevlog.title}</Link>
            <span className="text-fg-muted"> · {relativeTime(latestDevlog.published_at)}</span>
          </p>
        )}
        {!latestDevlog && project.updated_at && (
          <p className="mt-3 text-small text-fg-muted">Updated {relativeTime(project.updated_at)}</p>
        )}

        {href && (
          <Button asChild variant="secondary" size="sm" className="mt-4">
            <Link href={href}>View project <ArrowRight aria-hidden strokeWidth={1.75} className="size-3.5" /></Link>
          </Button>
        )}
      </div>
    </div>
  )
}
