import Link from 'next/link'
import { MessageSquare, Pencil } from 'lucide-react'
import { markdownExcerpt, relativeTime } from '@/lib/utils'
import { REACTION_TYPES } from '@/lib/supabase/types'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import type { DevlogRowData } from '@/lib/discovery/queries'
import type { FeedEngagement, FeedRow } from '@/lib/feed/queries'

/** Normalised devlog for the feed/listing variants (Feed rows and discovery rows have different column names). */
export type DevlogSummary = {
  title: string
  slug: string
  projectTitle: string
  projectSlug: string
  username: string
  authorName: string
  avatarUrl: string | null
  publishedAt: string
  preview: string
}

export const fromFeedRow = (r: FeedRow): DevlogSummary => ({
  title: r.devlog_title, slug: r.devlog_slug, projectTitle: r.project_title, projectSlug: r.project_slug,
  username: r.username, authorName: r.display_name || r.username, avatarUrl: r.avatar_url, publishedAt: r.published_at, preview: r.content_preview,
})
export const fromDiscoveryRow = (r: DevlogRowData): DevlogSummary => ({
  title: r.title, slug: r.slug, projectTitle: r.project_title, projectSlug: r.project_slug,
  username: r.username, authorName: r.display_name || r.username, avatarUrl: r.avatar_url, publishedAt: r.published_at, preview: r.content_preview,
})

type ListProps = {
  variant?: 'list'
  devlog: { title: string; href: string; projectTitle: string; published_at: string }
  /** Owner-only control (e.g. the Featured toggle). */
  action?: React.ReactNode
}
type TimelineProps = {
  variant: 'timeline'
  entry: { id: string; slug: string; title: string; content: string; published_at: string | null; isDraft: boolean }
  projectHref: string
  editHref?: string
}
type FeedProps = { variant: 'feed'; devlog: DevlogSummary; engagement?: FeedEngagement }
type ListingProps = { variant: 'listing'; devlog: DevlogSummary }

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const REACTION = Object.fromEntries(REACTION_TYPES.map((r) => [r.type, r])) as Record<string, (typeof REACTION_TYPES)[number]>
const fullTime = (iso: string) => new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
const link = 'hover:text-link focus-visible:text-link'

/**
 * One devlog, one component, four contexts. Every variant returns an <li> (render inside <ul>/<ol>).
 *  list      profile / dashboard: title, "Project · when", optional owner action.
 *  timeline  project page: dated record with excerpt; drafts (owner only) are labelled.
 *  feed      Feed: ACTOR published a devlog on PROJECT · time → title → excerpt → reactions/comments.
 *  listing   Explore / Search: title first, then project · author · time and an excerpt.
 * Everything links to the canonical page (devlog, project, author). Reactions are read-only totals here;
 * reacting and commenting happen on the devlog.
 */
export function DevlogRow(props: ListProps | TimelineProps | FeedProps | ListingProps) {
  if (props.variant === 'timeline') {
    const { entry, projectHref, editHref } = props
    return (
      <li className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 py-4 sm:grid-cols-[6.5rem_1fr_auto]">
        <time dateTime={entry.published_at ?? undefined} className="col-span-2 pt-0.5 font-mono text-micro text-fg-muted sm:col-span-1">
          {entry.published_at ? shortDate(entry.published_at) : 'Draft'}
        </time>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {entry.isDraft ? (
              <span className="text-body font-medium text-fg-secondary">{entry.title}</span>
            ) : (
              <Link href={`${projectHref}/${entry.slug}`} className="text-body font-medium text-fg underline-offset-2 hover:text-link hover:underline">{entry.title}</Link>
            )}
            {entry.isDraft && <Badge tone="warning">Draft · only you</Badge>}
          </div>
          <p className="mt-1 line-clamp-2 text-small text-fg-secondary">{markdownExcerpt(entry.content, 160)}</p>
        </div>
        {editHref && (
          <Link href={editHref} aria-label={`Edit devlog: ${entry.title}`} title="Edit devlog" className="-my-1 inline-flex size-11 items-center justify-center self-start rounded-control text-fg-muted hover:bg-surface-muted hover:text-fg">
            <Pencil aria-hidden strokeWidth={1.75} className="size-4" />
          </Link>
        )}
      </li>
    )
  }

  if (props.variant === 'feed' || props.variant === 'listing') {
    const d = props.devlog
    const devlogHref = `/p/${d.username}/${d.projectSlug}/${d.slug}`
    const projectHref = `/p/${d.username}/${d.projectSlug}`
    const preview = markdownExcerpt(d.preview, props.variant === 'feed' ? 220 : 200)

    if (props.variant === 'listing') {
      return (
        <li className="py-4">
          <h3 className="text-body font-medium text-fg [overflow-wrap:anywhere]">
            <Link href={devlogHref} className={`inline-flex min-h-11 items-center sm:min-h-0 ${link}`}>{d.title}</Link>
          </h3>
          <p className="text-small text-fg-muted [overflow-wrap:anywhere]">
            <Link href={projectHref} className={`font-medium text-fg-secondary ${link}`}>{d.projectTitle}</Link>
            {' · '}
            <Link href={`/dev/${d.username}`} className={link}>{d.authorName}</Link>
            {' · '}
            <time dateTime={d.publishedAt}>{relativeTime(d.publishedAt)}</time>
          </p>
          {preview && <p className="mt-1 line-clamp-2 text-small text-fg-secondary">{preview}</p>}
        </li>
      )
    }

    const engagement = props.engagement
    const comments = engagement?.comments ?? 0
    const reactions = engagement?.reactions ?? []
    const reactionSummary = reactions.map((r) => `${r.count} ${REACTION[r.type]?.label.toLowerCase() ?? r.type}`).join(', ')
    return (
      <li>
        <article className="flex gap-3 py-5">
          <Avatar name={d.authorName} src={d.avatarUrl} size="lg" className="mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-small text-fg-secondary [overflow-wrap:anywhere]">
              <Link href={`/dev/${d.username}`} className={`font-semibold text-fg ${link}`}>{d.authorName}</Link>{' '}
              published a devlog on{' '}
              <Link href={projectHref} className={`font-medium ${link}`}>{d.projectTitle}</Link>
              <span aria-hidden> · </span>
              <time dateTime={d.publishedAt} title={fullTime(d.publishedAt)} className="whitespace-nowrap text-fg-muted">{relativeTime(d.publishedAt)}</time>
            </p>
            <h2 className="mt-1 text-h3 font-semibold text-fg [overflow-wrap:anywhere]">
              <Link href={devlogHref} className={`-my-1.5 block min-h-11 py-1.5 ${link}`}>{d.title}</Link>
            </h2>
            {preview && <p className="line-clamp-2 text-body text-fg-secondary">{preview}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-fg-muted">
              {reactions.length > 0 && (
                <span aria-label={`Reactions: ${reactionSummary}`} className="inline-flex items-center gap-2 font-mono">
                  {reactions.map((r) => <span key={r.type} aria-hidden>{REACTION[r.type]?.emoji} {r.count}</span>)}
                </span>
              )}
              <Link href={`${devlogHref}#comments`} className={`inline-flex min-h-11 items-center gap-1.5 ${link}`}>
                <MessageSquare aria-hidden strokeWidth={1.75} className="size-3.5" />
                {comments === 0 ? 'Discuss' : `${comments} ${comments === 1 ? 'comment' : 'comments'}`}
                <span className="sr-only"> on {d.title}</span>
              </Link>
            </div>
          </div>
        </article>
      </li>
    )
  }

  const { devlog, action } = props
  return (
    <li className="flex items-center gap-3">
      <Link href={devlog.href} className="group flex min-h-11 min-w-0 flex-1 flex-col justify-center py-2">
        <span className="truncate text-body font-medium text-fg group-hover:text-link">{devlog.title}</span>
        <span className="truncate text-small text-fg-muted">{devlog.projectTitle} · {relativeTime(devlog.published_at)}</span>
      </Link>
      {action}
    </li>
  )
}
