import Link from 'next/link'
import { EventRow } from '@/components/dashboard/EventRow'
import { ProjectRow, type ProjectRowData } from '@/components/project/ProjectRow'
import { DevlogRow } from '@/components/devlog/DevlogRow'
import { DeveloperRow } from '@/components/developer/DeveloperRow'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Section } from '@/components/ui/Section'
import { relativeTime } from '@/lib/utils'
import type { SuggestedDeveloper } from '@/lib/feed/queries'

export type DashboardData = {
  userId: string
  username: string
  displayName: string
  avatarUrl: string | null
  /** Already-labelled role / engine / experience. */
  facts: string[]
  missingProfileFields: string[]
  currentProject: ProjectRowData | null
  otherProjects: ProjectRowData[]
  projectsFailed: boolean
  latestDevlog: { title: string; slug: string; published_at: string } | null
  nextStep: { label: string; href: string; reason?: string }
  /** Pending applications and playtest sign-ups, newest first. */
  attention: { id: string; href: string; time: string; actor: string; text: string }[]
  attentionFailed: boolean
  unreadNotifications: number
  latestNotification: { at: string; actor: string } | null
  /** Comments on the owner's own devlogs. */
  feedback: { id: string; href: string; time: string; actor: string; devlogTitle: string }[]
  feedbackFailed: boolean
  followsCount: number
  network: { id: string; href: string; title: string; context: string; published_at: string }[]
  suggested: SuggestedDeveloper[]
}

/**
 * Dashboard = what I need to do. Four questions in order: who am I, what am I building, what
 * happened on my work, what is happening in my network. Facts only: real pending items and real
 * timestamps — no scores, streaks or charts. Where to find collaborators/testers/events already
 * lives in the rail and the Explore tabs; this page does not repeat that list.
 * ≥1024px the last one sits in a side column.
 */
export function DashboardView(d: DashboardData) {
  // One "Activity" list instead of two near-identical modules (things that need a decision and
  // things that are just FYI both read as "someone did something on my work" at a glance —
  // the row text itself already says which is which; a second section added nothing but chrome).
  const activity = [
    ...d.attention.map((r) => ({ id: r.id, href: r.href, time: r.time, node: <><span className="font-medium text-fg">{r.actor}</span> {r.text}</> })),
    ...d.feedback.map((c) => ({ id: c.id, href: c.href, time: c.time, node: <><span className="font-medium text-fg">{c.actor}</span> commented on {c.devlogTitle}</> })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  const hasActivity = activity.length > 0 || d.unreadNotifications > 0
  const activityFailed = d.attentionFailed || d.feedbackFailed
  return (
    <div className="mx-auto w-full max-w-5xl lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-12">
      <div className="min-w-0 space-y-8">
        {/* 1. Who am I */}
        <header className="flex items-start gap-4">
          <Avatar name={d.displayName} src={d.avatarUrl} size="lg" className="size-14 text-h3" />
          <div className="min-w-0">
            <h1 className="text-h1 font-semibold text-fg [overflow-wrap:anywhere]">{d.displayName}</h1>
            <p className="text-small text-fg-muted">
              <span className="font-mono">@{d.username}</span>
              {d.facts.length > 0 && <> · {d.facts.join(' · ')}</>}
            </p>
            {d.missingProfileFields.length > 0 && (
              <p className="mt-2 text-small text-fg-secondary">
                Your public profile is missing: {d.missingProfileFields.join(', ')}.{' '}
                <Link href="/settings/profile" className="font-medium text-link underline-offset-2 hover:underline">Complete it</Link>
              </p>
            )}
          </div>
        </header>

        {/* 2. What am I building */}
        <Section id="current" title="Currently building">
          {d.projectsFailed ? (
            <ErrorState inline title="We couldn't load your projects" description="This may be temporary. Reload the page to try again." />
          ) : d.currentProject ? (
            <div>
              <ProjectRow project={d.currentProject} username={d.username} variant="feature" />
              <p className="mt-3 text-small text-fg-secondary">
                {d.latestDevlog ? (
                  <>
                    Latest devlog:{' '}
                    {d.currentProject.slug ? (
                      <Link href={`/p/${d.username}/${d.currentProject.slug}/${d.latestDevlog.slug}`} className="font-medium text-link underline-offset-2 hover:underline">{d.latestDevlog.title}</Link>
                    ) : d.latestDevlog.title}
                    <span className="text-fg-muted"> · {relativeTime(d.latestDevlog.published_at)}</span>
                  </>
                ) : 'No devlogs posted yet.'}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button asChild variant="primary"><Link href={d.nextStep.href}>{d.nextStep.label}</Link></Button>
                {d.nextStep.reason && <span className="text-small text-fg-muted">{d.nextStep.reason}</span>}
              </div>
            </div>
          ) : (
            <EmptyState
              kind="first-use"
              className="border-y-0 py-2"
              title="Start with what you're building"
              description="Every devlog, playtest and collaboration starts from a project."
              action={<Button asChild variant="primary"><Link href="/dashboard/projects/new">Create a project</Link></Button>}
            />
          )}
        </Section>

        {/* 3. What happened on my work — applications, playtest requests, comments, notifications, together */}
        <Section id="activity" title="Activity" count={activity.length > 0 ? activity.length : undefined}>
          {activityFailed ? (
            <ErrorState inline title="We couldn't load your activity" description="This may be temporary. Reload the page to try again." />
          ) : hasActivity ? (
            <ul className="divide-y divide-line-subtle border-y border-line-subtle">
              {activity.map((r) => <EventRow key={r.id} href={r.href} time={r.time}>{r.node}</EventRow>)}
              {d.unreadNotifications > 0 && (
                <EventRow href="/notifications" time={d.latestNotification?.at ?? new Date().toISOString()}>
                  {d.unreadNotifications} unread {d.unreadNotifications === 1 ? 'notification' : 'notifications'}
                  {d.latestNotification && <span className="text-fg-muted"> · latest from {d.latestNotification.actor}</span>}
                </EventRow>
              )}
            </ul>
          ) : (
            <EmptyState kind="cleared" className="border-y-0 py-2" title="Nothing yet" description="Applications, playtest requests, comments and notifications on your work appear here." />
          )}
        </Section>

        {d.otherProjects.length > 0 && (
          <Section id="projects" title="Your other projects" count={d.otherProjects.length}>
            <ul className="divide-y divide-line-subtle">
              {d.otherProjects.map((p) => <li key={p.id}><ProjectRow project={p} username={d.username} variant="compact" /></li>)}
            </ul>
          </Section>
        )}
      </div>

      <aside aria-label="Network and opportunities" className="mt-8 min-w-0 space-y-8 lg:mt-0">
        {/* 5. What is happening in my network */}
        <Section id="network" title="From people you follow" description="Newest devlogs, in the order they were published.">
          {d.followsCount === 0 ? (
            <>
              <EmptyState kind="first-use" className="border-y-0 py-2" title="You are not following anyone yet" description="Follow developers to see their devlogs here and in your Feed." />
              {d.suggested.length > 0 && (
                <ul className="mt-2 divide-y divide-line-subtle border-y border-line-subtle">
                  {d.suggested.map((s) => <DeveloperRow key={s.id} variant="compact" developer={s} viewerId={d.userId} />)}
                </ul>
              )}
            </>
          ) : d.network.length === 0 ? (
            <EmptyState kind="cleared" className="border-y-0 py-2" title="Nothing new yet" description="New devlogs from developers you follow appear here." />
          ) : (
            <>
              <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                {d.network.map((n) => (
                  <DevlogRow key={n.id} devlog={{ title: n.title, href: n.href, projectTitle: n.context, published_at: n.published_at }} />
                ))}
              </ul>
              <Link href="/feed" className="mt-1 inline-flex min-h-11 items-center text-small font-medium text-link underline-offset-2 hover:underline">Open your Feed →</Link>
            </>
          )}
        </Section>
      </aside>
    </div>
  )
}
