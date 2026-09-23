import Link from 'next/link'
import { CONTRACT_TYPES } from '@/lib/supabase/types'
import { markdownExcerpt, relativeTime } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { StatusText } from '@/components/workflow/StatusLabel'

const CONTRACT = Object.fromEntries(CONTRACT_TYPES.map((c) => [c.value, c.label])) as Record<string, string>

export type ListingPost = {
  id: string
  post_type: string
  role_needed: string | null
  role_offered: string | null
  contract_type?: string
  remote_allowed?: boolean
  location?: string | null
  description?: string
  created_at?: string
  project_title: string | null
  project_slug?: string | null
  username?: string
  display_name?: string | null
}

export const roleOf = (p: { post_type: string; role_needed: string | null; role_offered: string | null }) =>
  (p.post_type === 'seeking_collaborator' ? p.role_needed : p.role_offered) ?? (p.post_type === 'seeking_collaborator' ? 'Collaborator' : 'Any role')

/**
 * One collaboration opportunity as a scannable row: what kind (Looking for / Offering) → the role → the project →
 * what they want (excerpt) → arrangement (contract · remote/location) → who and when. Board posts are open by
 * definition, so no status is shown there; "mine" rows (Your posts / Your applications) carry a state and a next step.
 * Renders an <li>. The whole title is the link to the canonical post page.
 */
export function CollaborationListing({
  post,
  variant = 'board',
  status,
  hint,
}: {
  post: ListingPost
  variant?: 'board' | 'mine'
  /** mine: state in words, with tone */
  status?: { label: string; tone: 'neutral' | 'positive' | 'attention' | 'negative' }
  /** mine: the next step in one line (e.g. "2 to review", "Waiting for review") */
  hint?: string
}) {
  const seeking = post.post_type === 'seeking_collaborator'
  const arrangement = [post.contract_type ? CONTRACT[post.contract_type] ?? post.contract_type : null, post.remote_allowed ? 'Remote OK' : null, post.location].filter(Boolean).join(' · ')
  const projectHref = post.project_slug && post.username ? `/p/${post.username}/${post.project_slug}` : null

  if (variant === 'mine') {
    return (
      <li>
        <Link href={`/collaborate/${post.id}`} className="group flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
          <span className="min-w-0 [overflow-wrap:anywhere]">
            <span className="block text-body font-medium text-fg group-hover:text-link">{roleOf(post)}</span>
            <span className="block text-small text-fg-muted">
              {post.project_title ?? 'No project'}{post.display_name || post.username ? ` · ${post.display_name ?? post.username}` : ''}
            </span>
          </span>
          <span className="flex flex-col items-end gap-0.5 text-right">
            {status && <StatusText label={status.label} tone={status.tone} />}
            {hint && <span className="text-small text-fg-muted">{hint}</span>}
          </span>
        </Link>
      </li>
    )
  }

  return (
    <li className="py-4">
      <h3 className="flex flex-wrap items-center gap-2 text-h3 font-semibold text-fg [overflow-wrap:anywhere]">
        <Link href={`/collaborate/${post.id}`} className="inline-flex min-h-11 items-center hover:text-link focus-visible:text-link sm:min-h-0">{roleOf(post)}</Link>
        <Badge tone={seeking ? 'accent' : 'neutral'}>{seeking ? 'Looking for' : 'Offering'}</Badge>
        {post.project_title && (
          projectHref ? <Link href={projectHref} className="text-body font-normal text-fg-secondary hover:text-link">{post.project_title}</Link> : <span className="text-body font-normal text-fg-secondary">{post.project_title}</span>
        )}
      </h3>
      {post.description && <p className="mt-1 line-clamp-2 max-w-prose text-body text-fg-secondary">{markdownExcerpt(post.description, 220)}</p>}
      <p className="mt-2 text-small text-fg-muted [overflow-wrap:anywhere]">
        {arrangement && <span className="font-medium text-fg-secondary">{arrangement}</span>}
        {arrangement && ' · '}
        {post.username && <Link href={`/dev/${post.username}`} className="hover:text-link">{post.display_name ?? post.username}</Link>}
        {post.created_at && <> · posted {relativeTime(post.created_at)}</>}
      </p>
    </li>
  )
}
