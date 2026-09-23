import Link from 'next/link'
import { BUILD_TYPES } from '@/lib/supabase/types'
import { markdownExcerpt, relativeTime } from '@/lib/utils'
import { StatusText } from '@/components/workflow/StatusLabel'

const BUILD = Object.fromEntries(BUILD_TYPES.map((b) => [b.value, b.label])) as Record<string, string>

export type ListingPlaytest = {
  id: string
  project_title: string
  project_slug?: string | null
  build_type?: string
  platforms?: string[]
  description?: string
  focus_areas?: string[]
  requested_testers?: number
  current_testers?: number
  created_at?: string
  username?: string
  display_name?: string | null
}

/**
 * One playtest as a tester sees it: the game → who is asking and when → what they want tested → what you would
 * be playing (build, platforms) → how many places are left. No scores or ratings anywhere.
 * `mine` rows are the tester's own sign-ups: the game, the state in words, and the one next step.
 * Renders an <li>; the game title links to the playtest page.
 */
export function PlaytestListing({
  playtest,
  variant = 'board',
  status,
  hint,
}: {
  playtest: ListingPlaytest
  variant?: 'board' | 'mine'
  status?: { label: string; tone: 'neutral' | 'positive' | 'attention' | 'negative' }
  hint?: string
}) {
  if (variant === 'mine') {
    return (
      <li>
        <Link href={`/playtests/${playtest.id}`} className="group flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
          <span className="min-w-0 [overflow-wrap:anywhere]">
            <span className="block text-body font-medium text-fg group-hover:text-link">{playtest.project_title}</span>
            {(playtest.display_name || playtest.username) && <span className="block text-small text-fg-muted">by {playtest.display_name ?? playtest.username}</span>}
          </span>
          <span className="flex flex-col items-end gap-0.5 text-right">
            {status && <StatusText label={status.label} tone={status.tone} />}
            {hint && <span className="text-small text-fg-muted">{hint}</span>}
          </span>
        </Link>
      </li>
    )
  }

  const left = playtest.requested_testers != null && playtest.current_testers != null ? Math.max(playtest.requested_testers - playtest.current_testers, 0) : null
  const build = [playtest.build_type ? BUILD[playtest.build_type] ?? playtest.build_type : null, playtest.platforms?.length ? playtest.platforms.join(', ') : null].filter(Boolean).join(' · ')
  const projectHref = playtest.project_slug && playtest.username ? `/p/${playtest.username}/${playtest.project_slug}` : null
  return (
    <li className="py-4">
      <h3 className="text-h3 font-semibold text-fg [overflow-wrap:anywhere]">
        <Link href={`/playtests/${playtest.id}`} className="inline-flex min-h-11 items-center hover:text-link focus-visible:text-link sm:min-h-0">{playtest.project_title}</Link>
      </h3>
      <p className="text-small text-fg-muted">
        {playtest.username && <>by <Link href={`/dev/${playtest.username}`} className="hover:text-link">{playtest.display_name ?? playtest.username}</Link></>}
        {playtest.created_at && <> · {relativeTime(playtest.created_at)}</>}
        {projectHref && <> · <Link href={projectHref} className="hover:text-link">Project page</Link></>}
      </p>
      {playtest.description && (
        <p className="mt-1 line-clamp-2 max-w-prose text-body text-fg-secondary">
          <span className="font-medium text-fg">To test: </span>{markdownExcerpt(playtest.description, 200)}
        </p>
      )}
      <p className="mt-2 text-small text-fg-muted [overflow-wrap:anywhere]">
        {build && <span className="font-medium text-fg-secondary">{build}</span>}
        {left != null && <>{build && ' · '}{left === 0 ? 'No places left' : `${left} ${left === 1 ? 'place' : 'places'} left`}</>}
        {playtest.focus_areas && playtest.focus_areas.length > 0 && <> · Focus: {playtest.focus_areas.join(', ')}</>}
      </p>
    </li>
  )
}
