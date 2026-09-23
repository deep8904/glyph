import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { EventRow } from '@/components/dashboard/EventRow'
import { AttentionItem } from '@/components/dashboard/AttentionItem'
import { CurrentWorkPanel } from '@/components/dashboard/CurrentWorkPanel'
import { OpportunityRow } from '@/components/dashboard/OpportunityRow'
import { ProjectRow, type ProjectRowData } from '@/components/project/ProjectRow'
import { DevlogRow } from '@/components/devlog/DevlogRow'
import { DeveloperRow } from '@/components/developer/DeveloperRow'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Section } from '@/components/ui/Section'
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
  /** Pending applications and playtest sign-ups — items waiting on a decision. */
  attention: { id: string; href: string; time: string; actor: string; text: string; actionLabel: string }[]
  attentionFailed: boolean
  unreadNotifications: number
  latestNotification: { at: string; actor: string } | null
  /** Comments on the owner's own devlogs — FYI, not waiting on a decision. */
  feedback: { id: string; href: string; time: string; actor: string; devlogTitle: string }[]
  feedbackFailed: boolean
  followsCount: number
  network: { id: string; href: string; title: string; context: string; published_at: string }[]
  suggested: SuggestedDeveloper[]
  /** Open collaboration/playtest posts elsewhere on Glyph, not personalised — a reminder, not a second listing page. */
  opportunities: { id: string; href: string; text: string }[]
}

/**
 * Dashboard = operate, decide, continue. Seven questions in order: who am I, what am I building,
 * what needs a decision, what happened on my work, who's in my network, what's open elsewhere,
 * what else am I building. Facts only: real pending items and real timestamps — no scores,
 * streaks or charts. ≥1024px the secondary five (network/opportunities/other projects) sit in a
 * side column so Current Work and Needs Attention keep the full main column's width.
 */
export function DashboardView(d: DashboardData) {
  const hasAttention = d.attention.length > 0
  const activity = d.feedback.map((c) => ({ id: c.id, href: c.href, time: c.time, node: <><span className="font-medium text-fg">{c.actor}</span> commented on {c.devlogTitle}</> }))
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

        {/* 2. What am I building — the operational sibling of Profile's Current Work */}
        <Section id="current" title="Currently building">
          {d.projectsFailed ? (
            <ErrorState inline title="We couldn't load your projects" description="This may be temporary. Reload the page to try again." />
          ) : d.currentProject ? (
            <CurrentWorkPanel project={d.currentProject} username={d.username} latestDevlog={d.latestDevlog} nextStep={d.nextStep} />
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

        {/* 3. What needs a decision — applications and playtest sign-ups waiting on you */}
        {(hasAttention || d.attentionFailed) && (
          <Section id="attention" title="Needs attention" count={hasAttention ? d.attention.length : undefined}>
            {d.attentionFailed ? (
              <ErrorState inline title="We couldn't load pending items" description="This may be temporary. Reload the page to try again." />
            ) : (
              <ul className="divide-y divide-line-subtle">
                {d.attention.map((r) => (
                  <AttentionItem key={r.id} href={r.href} time={r.time} actionLabel={r.actionLabel}>
                    <span className="font-medium text-fg">{r.actor}</span> {r.text}
                  </AttentionItem>
                ))}
              </ul>
            )}
          </Section>
        )}

        {/* 4. What happened on my work — FYI activity, not decisions */}
        <Section id="activity" title="Activity on your work" count={activity.length > 0 ? activity.length : undefined}>
          {d.feedbackFailed ? (
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
            <EmptyState kind="cleared" className="border-y-0 py-2" title="Nothing yet" description="Comments and reactions on your work appear here." />
          )}
        </Section>
      </div>

      <aside aria-label="Network, opportunities and other work" className="mt-8 min-w-0 space-y-8 lg:mt-0">
        {/* 5. Who's in my network */}
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

        {/* 6. What's open elsewhere — a reminder, not a second Collaborate/Playtests page */}
        {d.opportunities.length > 0 && (
          <Section id="opportunities" title="Open elsewhere">
            <ul className="divide-y divide-line-subtle">
              {d.opportunities.map((o) => <OpportunityRow key={o.id} href={o.href}>{o.text}</OpportunityRow>)}
            </ul>
            <Link href="/collaborate" className="mt-1 inline-flex min-h-11 items-center gap-1 text-small font-medium text-link underline-offset-2 hover:underline">
              Browse opportunities <ArrowRight aria-hidden strokeWidth={1.75} className="size-3.5" />
            </Link>
          </Section>
        )}

        {/* 7. What else am I building — Current Work already owns the dominant treatment */}
        {d.otherProjects.length > 0 && (
          <Section id="projects" title="Your other projects" count={d.otherProjects.length}>
            <ul className="divide-y divide-line-subtle">
              {d.otherProjects.map((p) => <li key={p.id}><ProjectRow project={p} username={d.username} variant="compact" /></li>)}
            </ul>
          </Section>
        )}
      </aside>
    </div>
  )
}
