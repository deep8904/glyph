import { notFound } from 'next/navigation'
import { ShellFrame } from '@/components/shell/Shell'
import { DashboardView, type DashboardData } from '@/components/dashboard/DashboardView'
import { DevlogRow, type DevlogSummary } from '@/components/devlog/DevlogRow'

export const metadata = { title: 'Dashboard and feed (fixtures) — Glyph', robots: { index: false, follow: false } }

const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString()
const PROJECT = { id: 'p1', title: 'Fixture Project', slug: 'fixture-project', stage: 'alpha', short_description: 'A fixture project used to inspect the dashboard without real data.', updated_at: ago(2) }
const BASE: DashboardData = {
  userId: 'u', username: 'fixture-user', displayName: 'Fixture User', avatarUrl: null, facts: ['Programmer', 'Godot'], missingProfileFields: [],
  currentProject: PROJECT, otherProjects: [{ ...PROJECT, id: 'p2', title: 'Older fixture project', stage: 'prototype', updated_at: ago(40) }], projectsFailed: false,
  latestDevlog: { title: 'Fixture devlog title', slug: 'fixture-devlog', published_at: ago(3) },
  nextStep: { label: 'Review applications', href: '/collaborate', reason: '2 pending' },
  attention: [
    { id: 'a1', href: '#', time: ago(0.1), actor: 'Fixture Applicant', text: 'applied for Audio designer', actionLabel: 'Review application' },
    { id: 'a2', href: '#', time: ago(1), actor: 'Fixture Tester', text: 'requested to test Fixture Project', actionLabel: 'Review request' },
  ],
  attentionFailed: false, unreadNotifications: 3, latestNotification: { at: ago(0.2), actor: 'Fixture Follower' },
  feedback: [{ id: 'f1', href: '#', time: ago(1), actor: 'Fixture Commenter', devlogTitle: 'Fixture devlog title' }], feedbackFailed: false,
  followsCount: 2,
  network: [{ id: 'n1', href: '#', title: 'A devlog from someone I follow', context: 'Fixture Dev on Their Game', published_at: ago(1) }, { id: 'n2', href: '#', title: 'Another one', context: 'Other Dev on Other Game', published_at: ago(4) }],
  suggested: [],
  opportunities: [{ id: 'o1', href: '#', text: 'Seeking Sound designer — Someone Else\'s Game' }, { id: 'o2', href: '#', text: 'A Different Project needs testers (1/8)' }],
}
const NEW_USER: DashboardData = {
  ...BASE, missingProfileFields: ['Bio', 'Avatar'], currentProject: null, otherProjects: [], latestDevlog: null, nextStep: { label: 'Create your first project', href: '/dashboard/projects/new' },
  attention: [], unreadNotifications: 0, latestNotification: null, feedback: [], followsCount: 0, network: [],
  suggested: [{ id: 's1', username: 'suggested-a', display_name: 'Suggested Dev', avatar_url: null, primary_role: 'game_designer' }],
}
const FAILED: DashboardData = { ...BASE, projectsFailed: true, attentionFailed: true, feedbackFailed: true }
const FEED: DevlogSummary = { title: 'A devlog title in the feed', slug: 's', projectTitle: 'Fixture Project', projectSlug: 'fixture-project', username: 'fixture-dev', authorName: 'Fixture Dev', avatarUrl: null, publishedAt: ago(0.3), preview: '## Heading\n\nThe excerpt is plain text produced from the markdown body, clamped to two lines so the feed stays scannable.' }

/** Development-only fixtures for Dashboard (populated, brand-new user, failed loads) and a Feed row. 404 in production. */
export default function DashboardFixtures() {
  if (process.env.NODE_ENV === 'production') notFound()
  const user = { displayName: 'Fixture User', username: 'fixture-user', email: 'fixture@example.invalid', nav: { isAdmin: false, hasPublisherAccount: false, hasStudio: false, hasPublisherContacts: false, unreadNotifications: 3 } }
  return (
    <ShellFrame user={user} headerLabel="Fixtures">
      <div className="space-y-16">
        <section aria-label="Populated dashboard"><p className="mb-4 font-mono text-micro text-fg-muted">POPULATED</p><DashboardView {...BASE} /></section>
        <section aria-label="Brand-new user"><p className="mb-4 font-mono text-micro text-fg-muted">BRAND-NEW USER</p><DashboardView {...NEW_USER} /></section>
        <section aria-label="Failed loads"><p className="mb-4 font-mono text-micro text-fg-muted">FAILED LOADS</p><DashboardView {...FAILED} /></section>
        <section aria-label="Feed rows" className="max-w-2xl"><p className="mb-4 font-mono text-micro text-fg-muted">FEED ROW</p>
          <ol className="divide-y divide-line-subtle border-y border-line-subtle">
            <DevlogRow variant="feed" devlog={FEED} engagement={{ comments: 2, reactions: [{ type: 'like', count: 3 }, { type: 'helpful', count: 1 }] }} />
            <DevlogRow variant="feed" devlog={{ ...FEED, title: 'No engagement yet' }} />
          </ol>
        </section>
      </div>
    </ShellFrame>
  )
}
