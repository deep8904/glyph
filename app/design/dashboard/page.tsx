import { notFound } from 'next/navigation'
import { ShellFrame } from '@/components/shell/Shell'
import { DashboardMain, DashboardRail, type DashboardData } from '@/components/dashboard/DashboardView'
import { DevlogRow, type DevlogSummary } from '@/components/devlog/DevlogRow'

export const metadata = { title: 'Dashboard and feed (fixtures) — Glyph', robots: { index: false, follow: false } }

const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString()
const PROJECT = { id: 'p1', title: 'Tidewatch', slug: 'tidewatch', stage: 'alpha', short_description: 'A tide-driven survival roguelike where the map floods on a fixed clock.', updated_at: ago(2) }
const BASE: DashboardData = {
  userId: 'u', username: 'maraquill', displayName: 'Mara Quill', avatarUrl: null, facts: ['Programmer', 'Godot'], missingProfileFields: [],
  currentProject: PROJECT, otherProjects: [{ ...PROJECT, id: 'p2', title: 'Pocket Armada', slug: 'pocket-armada', stage: 'prototype', updated_at: ago(40) }], projectsFailed: false,
  latestDevlog: { title: 'The save system finally survives a mid-run crash', slug: 'save-system', published_at: ago(3) },
  nextStep: { label: 'Review applications', href: '/collaborate', reason: '2 pending' },
  attention: [
    { id: 'a1', href: '#', time: ago(0.1), actor: 'Priya Desai', text: 'applied for Audio designer on Tidewatch', actionLabel: 'Review application' },
    { id: 'a2', href: '#', time: ago(1), actor: 'Sam Okafor', text: 'requested to test Tidewatch', actionLabel: 'Review request' },
  ],
  attentionFailed: false, unreadNotifications: 3, latestNotification: { at: ago(0.2), actor: 'Nova Calder' },
  feedback: [{ id: 'f1', href: '#', time: ago(1), actor: 'Theo Park', devlogTitle: 'The save system finally survives a mid-run crash' }], feedbackFailed: false,
  followsCount: 2,
  network: [{ id: 'n1', href: '#', title: 'The fog volume finally reads as depth', context: 'Lena Voss on Emberreach', published_at: ago(1) }, { id: 'n2', href: '#', title: 'Rewrote the pathfinder in a weekend', context: 'Sam Iqbal on Rift Squad', published_at: ago(4) }],
  suggested: [],
  opportunities: [{ id: 'o1', href: '#', text: 'Seeking Sound designer — Static Bloom' }, { id: 'o2', href: '#', text: 'Harbor Tides needs testers (3/8)' }],
}
const NEW_USER: DashboardData = {
  ...BASE, username: 'newcomer', displayName: 'Alex Rivera', missingProfileFields: ['Bio', 'Avatar'], currentProject: null, otherProjects: [], latestDevlog: null, nextStep: { label: 'Create your first project', href: '/dashboard/projects/new' },
  attention: [], unreadNotifications: 0, latestNotification: null, feedback: [], followsCount: 0, network: [],
  suggested: [{ id: 's1', username: 'lena-voss', display_name: 'Lena Voss', avatar_url: null, primary_role: 'game_designer' }],
}
const FAILED: DashboardData = { ...BASE, projectsFailed: true, attentionFailed: true, feedbackFailed: true }
const FEED: DevlogSummary = { title: 'Floor 3 rework: the coastline finally feels alive', slug: 'floor-3', projectTitle: 'Emberreach', projectSlug: 'emberreach', username: 'lena-voss', authorName: 'Lena Voss', avatarUrl: null, publishedAt: ago(0.3), preview: 'Replaced the placeholder torch lighting with a proper dynamic light pass tied to tide height, and the whole level finally reads as one place instead of a set of rooms.' }

/**
 * Development-only fixtures for Dashboard. 404 in production.
 * Default: the populated dashboard exactly as the real /dashboard renders it (main + context rail
 * inside the shell) — a clean, production-faithful capture for design review. Append `?full=1` for
 * the QA gallery (brand-new user, failed loads, feed rows) stacked below.
 */
export default async function DashboardFixtures({ searchParams }: { searchParams: Promise<{ full?: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound()
  const { full } = await searchParams
  const showAll = full === '1' || full === 'true'
  const user = { displayName: 'Mara Quill', username: 'maraquill', email: 'mara@example.invalid', nav: { isAdmin: false, hasPublisherAccount: false, hasStudio: false, hasPublisherContacts: false, unreadNotifications: 3 } }
  return (
    <ShellFrame user={user} headerLabel="Dashboard">
      <div className="flex gap-8">
        <div className="min-w-0 flex-1"><DashboardMain {...BASE} /></div>
        <aside className="hidden w-[320px] shrink-0 border-l border-line pl-6 xl:block"><DashboardRail {...BASE} /></aside>
      </div>
      {showAll && (
        <div className="mt-20 space-y-16 border-t-2 border-dashed border-line pt-10">
          <p className="font-mono text-micro text-fg-muted">— QA STATES (append ?full=1) —</p>
          <section aria-label="Brand-new user"><p className="mb-4 font-mono text-micro text-fg-muted">BRAND-NEW USER</p><DashboardMain {...NEW_USER} /></section>
          <section aria-label="Failed loads"><p className="mb-4 font-mono text-micro text-fg-muted">FAILED LOADS</p><DashboardMain {...FAILED} /></section>
          <section aria-label="Feed rows" className="max-w-2xl"><p className="mb-4 font-mono text-micro text-fg-muted">FEED ROW</p>
            <ol className="divide-y divide-line-subtle border-y border-line-subtle">
              <DevlogRow variant="feed" devlog={FEED} engagement={{ comments: 2, reactions: [{ type: 'like', count: 3 }, { type: 'helpful', count: 1 }] }} />
              <DevlogRow variant="feed" devlog={{ ...FEED, title: 'No engagement yet' }} />
            </ol>
          </section>
        </div>
      )}
    </ShellFrame>
  )
}
