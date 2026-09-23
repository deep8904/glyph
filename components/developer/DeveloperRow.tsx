import Link from 'next/link'
import { FollowButton } from '@/components/social/FollowButton'
import { Avatar } from '@/components/ui/Avatar'
import { relativeTime } from '@/lib/utils'
import type { DeveloperRowData } from '@/lib/discovery/queries'
import type { SuggestedDeveloper } from '@/lib/feed/queries'

const role = (r: string | null) => (r ? r.replace(/_/g, ' ') : null)

/**
 * One developer, two densities. `listing` (Explore/Search): identity, role, current project, availability,
 * activity, one-line bio, real follow state. `compact` (suggestions): avatar, name, role, follow.
 * Renders an <li>. Follow shows only for a signed-in viewer who is not this developer.
 */
export function DeveloperRow(
  props:
    | { variant?: 'listing'; developer: DeveloperRowData; viewerId: string | null; following: boolean }
    | { variant: 'compact'; developer: SuggestedDeveloper; viewerId: string | null; following?: boolean }
) {
  const dev = props.developer
  const name = dev.display_name || dev.username
  const showFollow = !!props.viewerId && props.viewerId !== dev.id

  if (props.variant === 'compact') {
    return (
      <li className="flex items-center gap-3 py-3">
        <Link href={`/dev/${dev.username}`} className="flex min-h-11 min-w-0 flex-1 items-center gap-3 hover:text-link">
          <Avatar name={name} src={dev.avatar_url} size="lg" />
          <span className="min-w-0">
            <span className="block truncate text-body font-medium text-fg">{name}</span>
            <span className="block truncate text-small text-fg-muted">@{dev.username}{role(dev.primary_role) && <> · {role(dev.primary_role)}</>}</span>
          </span>
        </Link>
        {showFollow && <FollowButton targetId={dev.id} currentUserId={props.viewerId} initialFollowing={false} />}
      </li>
    )
  }

  const d = props.developer
  return (
    <li className="flex items-center gap-3 py-4">
      <Avatar name={name} src={d.avatar_url} size="lg" className="self-start" />
      <div className="min-w-0 flex-1">
        <h3 className="text-body font-medium text-fg [overflow-wrap:anywhere]">
          <Link href={`/dev/${d.username}`} className="hover:text-link focus-visible:text-link">{name}</Link>
          <span className="font-normal text-fg-muted"> · @{d.username}</span>
        </h3>
        <p className="text-small text-fg-muted [overflow-wrap:anywhere]">
          {role(d.primary_role)}
          {d.current_project_title && d.current_project_slug && (
            <>
              {d.primary_role && ' · '}Working on{' '}
              <Link href={`/p/${d.username}/${d.current_project_slug}`} className="font-medium text-fg-secondary hover:text-link focus-visible:text-link">{d.current_project_title}</Link>
            </>
          )}
          {d.is_open_to_collab && <> · <span className="font-medium text-success">Open to collaborate</span></>}
          {d.last_activity_at && <> · active {relativeTime(d.last_activity_at)}</>}
        </p>
        {d.bio && <p className="mt-0.5 line-clamp-1 text-small text-fg-secondary">{d.bio}</p>}
      </div>
      {showFollow && <FollowButton targetId={d.id} currentUserId={props.viewerId} initialFollowing={props.following ?? false} />}
    </li>
  )
}
