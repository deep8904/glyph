import Link from 'next/link'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { TabLinks } from '@/components/ui/Tabs'
import { MarkAllReadButton } from './MarkAllReadButton'
import { NotificationLink } from './NotificationLink'
import type { PresentedRow } from '@/lib/notifications/present'
import { cn, relativeTime } from '@/lib/utils'

/**
 * The notification list, as a pure view over presented rows so every state can be rendered from fixtures.
 * Each row reads actor → action → object → time. Unread is a dot, heavier text and a screen-reader word,
 * never colour alone. A row whose object is gone or hidden stays (the event happened) and says so.
 */
export function NotificationsView({
  rows,
  failed,
  filter,
  recipientId,
  limit,
  truncated,
}: {
  rows: PresentedRow[]
  failed: boolean
  filter: 'all' | 'unread'
  recipientId: string
  limit: number
  truncated: boolean
}) {
  const unreadCount = rows.filter((p) => p.unread).length
  const shown = filter === 'unread' ? rows.filter((p) => p.unread) : rows

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h1 className="text-h1 font-semibold text-fg">Notifications</h1>
          {!failed && rows.length > 0 && <p className="mt-1 text-small text-fg-secondary">{unreadCount > 0 ? `${unreadCount} unread` : 'Nothing unread'}</p>}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/settings/notifications" className="inline-flex min-h-11 items-center text-small text-link underline-offset-2 hover:underline sm:min-h-0">Settings</Link>
          {unreadCount > 0 && <MarkAllReadButton recipientId={recipientId} />}
        </div>
      </div>

      {failed ? (
        <ErrorState className="mt-6" title="We couldn't load your notifications" description="This may be temporary. Nothing was lost. Reload to try again." retryHref="/notifications" />
      ) : rows.length === 0 ? (
        <EmptyState
          className="mt-6"
          kind="first-use"
          icon={Bell}
          title="No notifications yet"
          description="Follows, comments, applications, playtest and studio activity, and publisher messages show up here."
        />
      ) : (
        <>
          <TabLinks
            className="mt-4"
            label="Filter notifications"
            activeHref={filter === 'unread' ? '/notifications?filter=unread' : '/notifications'}
            items={[{ href: '/notifications', label: 'All' }, { href: '/notifications?filter=unread', label: 'Unread', count: unreadCount }]}
          />
          {shown.length === 0 ? (
            <EmptyState className="border-t-0" kind="no-results" title="Nothing unread" description="Every notification has been read." action={<Button asChild variant="secondary" size="sm"><Link href="/notifications">Show all notifications</Link></Button>} />
          ) : (
            <ul className="divide-y divide-line-subtle border-b border-line-subtle">
              {shown.map((p) => {
                const body = (
                  <>
                    <span aria-hidden className={cn('mt-2 size-2 shrink-0 rounded-full', p.unread ? 'bg-accent' : 'bg-transparent')} />
                    <span className="min-w-0 flex-1 text-body [overflow-wrap:anywhere]">
                      {p.unread && <span className="sr-only">Unread. </span>}
                      <span className={p.unread ? 'font-semibold text-fg' : 'font-medium text-fg'}>{p.actors}</span>{' '}
                      <span className={p.unread ? 'text-fg' : 'text-fg-secondary'}>{p.action}</span>
                      {p.unavailable && <span className="mt-0.5 block text-small text-fg-muted">No longer available: it was deleted, or you can no longer see it.</span>}
                    </span>
                    <time dateTime={p.time} className="shrink-0 pt-1 text-micro text-fg-muted">{relativeTime(p.time)}</time>
                  </>
                )
                return (
                  <li key={p.key}>
                    {p.href ? (
                      <NotificationLink ids={p.ids} unread={p.unread} href={p.href}>{body}</NotificationLink>
                    ) : (
                      <div className="flex min-h-11 items-start gap-3 px-1 py-3">{body}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          {truncated && <p className="mt-3 text-micro text-fg-muted">Showing the latest {limit}.</p>}
        </>
      )}
    </div>
  )
}
