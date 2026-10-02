import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeNextAction, describeNextAction } from './dashboardNextAction.ts'

const base = {
  currentProject: { id: 'proj-1', slug: 'my-game' },
  projectsFailed: false,
  latestDevlogPublishedAt: '2026-09-01T00:00:00Z',
  latestDevlogFailed: false,
  pendingApplicationsCount: 0,
  applicationsFailed: false,
  pendingSessionsCount: 0,
  sessionsFailed: false,
  openPlaytest: null,
  openPlaytestFailed: false,
  daysSinceLatestDevlog: () => 3,
}

// ── Ready branches (all queries succeeded) ─────────────────────────────────

test('no project at all → create_project, beats every other condition', () => {
  const result = computeNextAction({ ...base, currentProject: null, pendingApplicationsCount: 5, pendingSessionsCount: 5 })
  assert.deepEqual(result, { status: 'ready', action: { kind: 'create_project' } })
})

test('project but never published a devlog → write_first_devlog, beats pending applications', () => {
  const result = computeNextAction({ ...base, latestDevlogPublishedAt: null, pendingApplicationsCount: 3 })
  assert.deepEqual(result, { status: 'ready', action: { kind: 'write_first_devlog', projectId: 'proj-1' } })
})

test('pending applications → review_applications, beats pending sessions and open playtest', () => {
  const result = computeNextAction({ ...base, pendingApplicationsCount: 2, pendingSessionsCount: 1, openPlaytest: { id: 'pt-1', currentTesters: 0 } })
  assert.deepEqual(result, { status: 'ready', action: { kind: 'review_applications', count: 2 } })
})

test('pending playtest sessions (no applications) → review_playtesters, beats open playtest', () => {
  const result = computeNextAction({ ...base, pendingSessionsCount: 4, openPlaytest: { id: 'pt-1', currentTesters: 0 } })
  assert.deepEqual(result, { status: 'ready', action: { kind: 'review_playtesters', count: 4 } })
})

test('open playtest with zero testers (nothing else pending) → share_playtest', () => {
  const result = computeNextAction({ ...base, openPlaytest: { id: 'pt-1', currentTesters: 0 } })
  assert.deepEqual(result, { status: 'ready', action: { kind: 'share_playtest', requestId: 'pt-1' } })
})

test('open playtest already has testers → does not trigger share_playtest', () => {
  const result = computeNextAction({ ...base, openPlaytest: { id: 'pt-1', currentTesters: 3 } })
  assert.deepEqual(result, { status: 'ready', action: { kind: 'continue_building', projectId: 'proj-1', projectSlug: 'my-game' } })
})

test('latest devlog older than 14 days (nothing else pending) → post_update', () => {
  const result = computeNextAction({ ...base, daysSinceLatestDevlog: () => 15 })
  assert.deepEqual(result, { status: 'ready', action: { kind: 'post_update', projectId: 'proj-1' } })
})

test('latest devlog exactly 14 days old is not yet stale', () => {
  const result = computeNextAction({ ...base, daysSinceLatestDevlog: () => 14 })
  assert.deepEqual(result, { status: 'ready', action: { kind: 'continue_building', projectId: 'proj-1', projectSlug: 'my-game' } })
})

test('nothing pending, recent devlog → continue_building, carries the project slug through', () => {
  const result = computeNextAction(base)
  assert.deepEqual(result, { status: 'ready', action: { kind: 'continue_building', projectId: 'proj-1', projectSlug: 'my-game' } })
})

// ── Unavailable branches: every individual dependency failure ──────────────

test('projects query failed → unavailable, never "create your first project"', () => {
  const result = computeNextAction({ ...base, projectsFailed: true, currentProject: null })
  assert.deepEqual(result, { status: 'unavailable' })
})

test('latest-devlog query failed → unavailable, never "write your first devlog"', () => {
  const result = computeNextAction({ ...base, latestDevlogFailed: true, latestDevlogPublishedAt: null })
  assert.deepEqual(result, { status: 'unavailable' })
})

test('pending-applications query failed → unavailable, even though nothing else is pending', () => {
  const result = computeNextAction({ ...base, applicationsFailed: true })
  assert.deepEqual(result, { status: 'unavailable' })
})

test('pending-sessions query failed → unavailable', () => {
  const result = computeNextAction({ ...base, sessionsFailed: true })
  assert.deepEqual(result, { status: 'unavailable' })
})

test('open-playtest query failed → unavailable, never falls through to post_update/continue_building', () => {
  const result = computeNextAction({ ...base, openPlaytestFailed: true })
  assert.deepEqual(result, { status: 'unavailable' })
})

// ── Unavailable branches: meaningful combined failures ──────────────────────

test('projects failed AND applications failed → still just unavailable (not double-reported)', () => {
  const result = computeNextAction({ ...base, projectsFailed: true, currentProject: null, applicationsFailed: true })
  assert.deepEqual(result, { status: 'unavailable' })
})

test('every dependency failed at once → unavailable', () => {
  const result = computeNextAction({
    ...base,
    projectsFailed: true,
    currentProject: null,
    latestDevlogFailed: true,
    latestDevlogPublishedAt: null,
    applicationsFailed: true,
    sessionsFailed: true,
    openPlaytestFailed: true,
  })
  assert.deepEqual(result, { status: 'unavailable' })
})

test('a failure alongside otherwise-normal-looking data never yields a ready action', () => {
  // Applications query failed, but count still reads back as 0 (a failed query with a coincidental
  // empty result) — must not be mistaken for "genuinely no pending applications."
  const result = computeNextAction({ ...base, applicationsFailed: true, pendingApplicationsCount: 0 })
  assert.notEqual(result.status, 'ready')
  assert.deepEqual(result, { status: 'unavailable' })
})

test('describeNextAction: every kind resolves to its documented destination', () => {
  assert.equal(describeNextAction({ kind: 'create_project' }).href, '/dashboard/projects/new')
  assert.equal(describeNextAction({ kind: 'write_first_devlog', projectId: 'p1' }).href, '/dashboard/projects/p1/devlogs/new')
  assert.equal(describeNextAction({ kind: 'review_applications', count: 3 }).href, '/collaborate')
  assert.equal(describeNextAction({ kind: 'review_applications', count: 3 }).reason, '3 pending')
  assert.equal(describeNextAction({ kind: 'review_playtesters', count: 2 }).href, '/dashboard/playtests')
  assert.equal(describeNextAction({ kind: 'share_playtest', requestId: 'r1' }).href, '/playtests/r1')
  assert.equal(describeNextAction({ kind: 'post_update', projectId: 'p1' }).href, '/dashboard/projects/p1/devlogs/new')
  assert.equal(describeNextAction({ kind: 'continue_building', projectId: 'p1', projectSlug: 's' }).href, '/dashboard/projects/p1/devlogs/new')
})
