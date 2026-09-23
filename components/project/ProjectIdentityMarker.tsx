import Link from 'next/link'
import { labelFor, PROJECT_STAGES } from '@/lib/supabase/types'
import { isHttpsUrl } from '@/lib/utils'

export type ProjectIdentity = {
  title: string
  slug: string | null
  stage: string | null
  cover_url?: string | null
  cover_image_url?: string | null
  username: string
}

/**
 * The one reusable unit that carries a project's identity into everywhere else it's referenced:
 * a devlog's masthead, a collaboration or playtest listing, a jam entry, a notification. Same
 * crop, same name, same stage chip, same link target, every time — so "this belongs to that
 * project" is visible in the composition, not just in a breadcrumb string.
 */
export function ProjectIdentityMarker({ project, size = 'md' }: { project: ProjectIdentity; size?: 'sm' | 'md' }) {
  const href = project.slug ? `/p/${project.username}/${project.slug}` : null
  const cover = [project.cover_url, project.cover_image_url].find(isHttpsUrl) ?? null
  const stage = project.stage ? labelFor(PROJECT_STAGES, project.stage) : null
  const dims = size === 'sm' ? 'h-9 w-14' : 'h-11 w-[4.5rem]'

  const body = (
    <>
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" loading="lazy" className={`${dims} shrink-0 rounded-media border border-line bg-surface-muted object-cover`} />
      ) : (
        <span aria-hidden className={`flex ${dims} shrink-0 items-center justify-center rounded-media border border-line bg-surface-muted text-small font-medium text-fg-muted`}>
          {project.title.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-small font-medium text-fg">{project.title}</span>
        {stage && <span className="block text-micro text-fg-muted">{stage}</span>}
      </span>
    </>
  )

  return href ? (
    <Link href={href} className="group inline-flex min-h-11 items-center gap-2.5 hover:text-link sm:min-h-0">{body}</Link>
  ) : (
    <span className="inline-flex items-center gap-2.5">{body}</span>
  )
}
