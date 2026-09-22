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
  opportunities: { label: string; hint: string; href: string }[]
}

/**
 * Dashboard = what I need to do. Six questions in order: who am I, what am I building, what needs my
 * attention, what happened on my work, what is happening in my network, where can I find help or
 * collaborators. Facts only: real pending items and real timestamps — no scores, streaks or charts.
 * ≥1024px the last two sit in a side column.
 */
export function DashboardView(d: DashboardData) {
  const hasAttention = d.attention.length > 0 || d.unreadNotifications > 0
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

        {/* 3. What needs my attention */}
        <Section id="attention" title="Needs your attention" count={d.attention.length > 0 ? d.attention.length : undefined}>
          {d.attentionFailed ? (
            <ErrorState inline title="We couldn't load pending items" description="This may be temporary. Reload the page to try again." />
          ) : hasAttention ? (
            <ul className="divide-y divide-line-subtle border-y border-line-subtle">
              {d.attention.map((r) => (
                <EventRow key={r.id} href={r.href} time={r.time}><span className="font-medium text-fg">{r.actor}</span> {r.text}</EventRow>
              ))}
              {d.unreadNotifications > 0 && (
                <EventRow href="/notifications" time={d.latestNotification?.at ?? new Date().toISOString()}>
                  {d.unreadNotifications} unread {d.unreadNotifications === 1 ? 'notification' : 'notifications'}
                  {d.latestNotification && <span className="text-fg-muted"> · latest from {d.latestNotification.actor}</span>}
                </EventRow>
              )}
            </ul>
          ) : (
            <EmptyState kind="cleared" className="border-y-0 py-2" title="Nothing needs your attention" description="Applications, playtest requests and notifications appear here when they arrive." />
          )}
        </Section>

        {/* 4. What happened on my work */}
        <Section id="feedback" title="Feedback on your devlogs">
          {d.feedbackFailed ? (
            <ErrorState inline title="We couldn't load recent feedback" description="This may be temporary. Reload the page to try again." />
          ) : d.feedback.length > 0 ? (
            <ul className="divide-y divide-line-subtle border-y border-line-subtle">
              {d.feedback.map((c) => (
                <EventRow key={c.id} href={c.href} time={c.time}><span className="font-medium text-fg">{c.actor}</span> commented on {c.devlogTitle}</EventRow>
              ))}
            </ul>
          ) : (
            <EmptyState kind="first-use" className="border-y-0 py-2" title="No feedback yet" description="Comments on your devlogs appear here." />
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

        {/* 6. Where can I find collaborators, testers and events */}
        <Section id="opportunities" title="Opportunities" description="Places to find collaborators, testers and events.">
          <ul className="divide-y divide-line-subtle border-y border-line-subtle">
            {d.opportunities.map((o) => (
              <li key={o.href}>
                <Link href={o.href} className="group block min-h-11 py-2.5">
                  <span className="block text-body font-medium text-fg group-hover:text-link">{o.label}</span>
                  <span className="block text-small text-fg-muted">{o.hint}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </aside>
    </div>
  )
}
