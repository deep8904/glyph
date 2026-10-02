/**
 * The Dashboard overview's one real decision: what should this developer do next. Extracted as a
 * pure state machine (same branching order and destinations as the existing overview) so the
 * priority logic is unit-testable without a database, and so the page component stays a thin
 * wiring layer around it.
 */

const STALE_DAYS = 14

export type NextAction =
  | { kind: 'create_project' }
  | { kind: 'write_first_devlog'; projectId: string }
  | { kind: 'review_applications'; count: number }
  | { kind: 'review_playtesters'; count: number }
  | { kind: 'share_playtest'; requestId: string }
  | { kind: 'post_update'; projectId: string }
  | { kind: 'continue_building'; projectId: string; projectSlug: string | null }

export type NextActionInput = {
  currentProject: { id: string; slug: string | null } | null
  /** True when the `projects` query itself failed — distinct from a genuine "no project" fact. */
  projectsFailed: boolean
  latestDevlogPublishedAt: string | null
  /** True when the latest-devlog query failed — distinct from a genuine "no devlog yet" fact. */
  latestDevlogFailed: boolean
  pendingApplicationsCount: number
  applicationsFailed: boolean
  pendingSessionsCount: number
  sessionsFailed: boolean
  openPlaytest: { id: string; currentTesters: number } | null
  openPlaytestFailed: boolean
  /** Injected rather than computed with `new Date()` inside, so the stale-devlog branch is
   * deterministic and testable. */
  daysSinceLatestDevlog: (publishedAt: string) => number
}

export type NextActionResult =
  | { status: 'ready'; action: NextAction }
  /** Required evidence could not be established — never guessed, never fallen through to a
   * lower-priority action, never treated a failed query as "empty." */
  | { status: 'unavailable' }

/**
 * Same priority order as the legacy overview: no project → no devlog → pending applications →
 * pending playtest sessions → an unshared open playtest → a stale devlog → otherwise, continue.
 *
 * Every one of those branches depends on knowing the *true* value of a fact upstream of it in the
 * order (e.g. correctly recommending "continue building" requires knowing applications, sessions,
 * and the open playtest were all genuinely absent, not merely that their queries failed and came
 * back looking empty). So a failure in *any* of the five dependencies makes the whole ordering
 * untrustworthy — the result is `unavailable`, not a best-effort guess.
 */
export function computeNextAction(input: NextActionInput): NextActionResult {
  if (input.projectsFailed || input.latestDevlogFailed || input.applicationsFailed || input.sessionsFailed || input.openPlaytestFailed) {
    return { status: 'unavailable' }
  }

  const { currentProject, latestDevlogPublishedAt, pendingApplicationsCount, pendingSessionsCount, openPlaytest, daysSinceLatestDevlog } = input

  if (!currentProject) return { status: 'ready', action: { kind: 'create_project' } }
  if (!latestDevlogPublishedAt) return { status: 'ready', action: { kind: 'write_first_devlog', projectId: currentProject.id } }
  if (pendingApplicationsCount > 0) return { status: 'ready', action: { kind: 'review_applications', count: pendingApplicationsCount } }
  if (pendingSessionsCount > 0) return { status: 'ready', action: { kind: 'review_playtesters', count: pendingSessionsCount } }
  if (openPlaytest && openPlaytest.currentTesters === 0) return { status: 'ready', action: { kind: 'share_playtest', requestId: openPlaytest.id } }

  return {
    status: 'ready',
    action: daysSinceLatestDevlog(latestDevlogPublishedAt) > STALE_DAYS
      ? { kind: 'post_update', projectId: currentProject.id }
      : { kind: 'continue_building', projectId: currentProject.id, projectSlug: currentProject.slug },
  }
}

export type NextStep = { label: string; href: string; reason?: string }

/** Same destinations and copy as the legacy overview's `describeAction`. */
export function describeNextAction(action: NextAction): NextStep {
  switch (action.kind) {
    case 'create_project':
      return { label: 'Create your first project', href: '/dashboard/projects/new' }
    case 'write_first_devlog':
      return { label: 'Write your first devlog', href: `/dashboard/projects/${action.projectId}/devlogs/new`, reason: 'A devlog starts the public record of this project.' }
    case 'review_applications':
      return { label: 'Review applications', href: '/collaborate', reason: `${action.count} pending` }
    case 'review_playtesters':
      return { label: 'Review playtest signups', href: '/dashboard/playtests', reason: `${action.count} waiting` }
    case 'share_playtest':
      return { label: 'Share your playtest request', href: `/playtests/${action.requestId}`, reason: 'No testers yet.' }
    case 'post_update':
      return { label: 'Post an update', href: `/dashboard/projects/${action.projectId}/devlogs/new`, reason: 'Your last devlog is more than two weeks old.' }
    case 'continue_building':
      return { label: 'Write a devlog', href: `/dashboard/projects/${action.projectId}/devlogs/new` }
  }
}
