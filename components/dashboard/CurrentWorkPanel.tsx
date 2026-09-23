import Link from 'next/link'
import { labelFor, PROJECT_STAGES } from '@/lib/supabase/types'
import { isHttpsUrl, relativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { ProjectRowData } from '@/components/project/ProjectRow'

/**
 * Dashboard's Current Work: the Operate-mode sibling of Profile's CurrentWork. Same subject,
 * different question — not "look at my portfolio" but "what do I continue doing." Denser: a
 * compact thumbnail instead of a hero crop, mono metadata, and the next action built in rather
 * than left to a separate paragraph below.
 */
export function CurrentWorkPanel({
  project,
  username,
  latestDevlog,
  nextStep,
}: {
  project: ProjectRowData
  username: string
  latestDevlog: { title: string; slug: string; published_at: string } | null
  nextStep: { label: string; href: string; reason?: string }
}) {
  const href = project.slug ? `/p/${username}/${project.slug}` : null
  const stage = project.stage ? labelFor(PROJECT_STAGES, project.stage) : null
  const cover = [project.cover_url, project.cover_image_url].find(isHttpsUrl) ?? null

  return (
    <div className="flex flex-col gap-4 border border-line-subtle p-4 sm:flex-row sm:items-start">
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" loading="lazy" className="h-24 w-36 shrink-0 rounded-media border border-line object-cover" />
      ) : (
        <div aria-hidden className="flex h-24 w-36 shrink-0 items-center justify-center rounded-media border border-line bg-surface-muted text-h2 font-semibold text-fg-muted">
          {project.title.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-h3 font-semibold text-fg [overflow-wrap:anywhere]">
            {href ? <Link href={href} className="hover:text-link">{project.title}</Link> : project.title}
          </h3>
          {stage && <Badge tone="accent" mono>{stage}</Badge>}
        </div>
        <p className="mt-1 font-mono text-micro text-fg-muted">
          {latestDevlog ? <>Last devlog {relativeTime(latestDevlog.published_at)}</> : 'No devlogs yet'}
        </p>
        {latestDevlog && (
          <p className="mt-1 text-small text-fg-secondary [overflow-wrap:anywhere]">
            {project.slug ? (
              <Link href={`/p/${username}/${project.slug}/${latestDevlog.slug}`} className="font-medium text-link underline-offset-2 hover:underline">{latestDevlog.title}</Link>
            ) : latestDevlog.title}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button asChild variant="primary" size="sm"><Link href={nextStep.href}>{nextStep.label}</Link></Button>
          {nextStep.reason && <span className="text-small text-fg-muted">{nextStep.reason}</span>}
        </div>
      </div>
    </div>
  )
}
