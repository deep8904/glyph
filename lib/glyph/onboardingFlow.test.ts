import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyOnboardingGate, runOnboardingSubmit, retryProjectOnly, retryFinalizeOnly } from './onboardingFlow.ts'

const okProfile = { username: 'nova', display_name: null, bio: null, location: null, primary_role: null, primary_engine: null, experience_level: null, github_url: null, itchio_url: null, twitter_url: null, website_url: null }

// A successful finalize is `.select('id')` returning the affected row.
const finalizeOk = async () => ({ error: null, data: [{ id: 'p1' }] })
const finalizeZeroRows = async () => ({ error: null, data: [] })
const finalizeErr = async () => ({ error: { message: 'x' }, data: null })

// ── Init gate ──

test('no user → no-user, regardless of profile data', () => {
  assert.deepEqual(classifyOnboardingGate(null, { ...okProfile, is_onboarded: true }, null), { kind: 'no-user' })
})

test('profile lookup errors → error, never read as "no profile yet"', () => {
  assert.deepEqual(classifyOnboardingGate({ id: '1' }, null, { message: 'timeout' }), { kind: 'error' })
})

test('error wins over an already-onboarded-shaped profile (untrustworthy read)', () => {
  assert.deepEqual(classifyOnboardingGate({ id: '1' }, { ...okProfile, is_onboarded: true }, { message: 'x' }), { kind: 'error' })
})

test('user + already onboarded → already-onboarded', () => {
  assert.deepEqual(classifyOnboardingGate({ id: '1' }, { ...okProfile, is_onboarded: true }, null), { kind: 'already-onboarded' })
})

test('user + no profile row yet → ready', () => {
  assert.deepEqual(classifyOnboardingGate({ id: '1' }, null, null), { kind: 'ready' })
})

test('user + profile row exists but not onboarded → resume, carrying the hydratable fields', () => {
  const profile = { ...okProfile, is_onboarded: false }
  assert.deepEqual(classifyOnboardingGate({ id: '1' }, profile, null), { kind: 'resume', profile })
})

// ── Fresh submission (profileExists = false) ──

test('profile insert fails (generic) → profile-error, project/finalize never attempted', async () => {
  let projectCalls = 0, finalizeCalls = 0
  const r = await runOnboardingSubmit(
    false, async () => ({ error: { code: '23502' } }), true,
    async () => { projectCalls++; return { error: null } },
    async () => { finalizeCalls++; return finalizeOk() }
  )
  assert.deepEqual(r, { kind: 'profile-error' })
  assert.equal(projectCalls, 0)
  assert.equal(finalizeCalls, 0)
})

test('profile insert fails (thrown) → profile-error', async () => {
  const r = await runOnboardingSubmit(false, () => Promise.reject(new Error('network')), true, async () => ({ error: null }), finalizeOk)
  assert.deepEqual(r, { kind: 'profile-error' })
})

test('profile insert returns 23505 (unique violation) → username-taken', async () => {
  const r = await runOnboardingSubmit(false, async () => ({ error: { code: '23505' } }), true, async () => ({ error: null }), finalizeOk)
  assert.deepEqual(r, { kind: 'username-taken' })
})

test('fresh, no project → done in one insert, finalize never called', async () => {
  let finalizeCalls = 0
  const r = await runOnboardingSubmit(false, async () => ({ error: null }), false, async () => { throw new Error('must not be called') }, async () => { finalizeCalls++; return finalizeOk() })
  assert.deepEqual(r, { kind: 'done' })
  assert.equal(finalizeCalls, 0)
})

test('fresh + project succeeds + finalize succeeds → done', async () => {
  const r = await runOnboardingSubmit(false, async () => ({ error: null }), true, async () => ({ error: null }), finalizeOk)
  assert.deepEqual(r, { kind: 'done' })
})

test('fresh + project fails (returned) → project-error, finalize never attempted', async () => {
  let finalizeCalls = 0
  const r = await runOnboardingSubmit(false, async () => ({ error: null }), true, async () => ({ error: { message: 'db down' } }), async () => { finalizeCalls++; return finalizeOk() })
  assert.deepEqual(r, { kind: 'project-error' })
  assert.equal(finalizeCalls, 0)
})

test('fresh + project throws → project-error', async () => {
  const r = await runOnboardingSubmit(false, async () => ({ error: null }), true, () => Promise.reject(new TypeError('x')), finalizeOk)
  assert.deepEqual(r, { kind: 'project-error' })
})

test('fresh + project succeeds + finalize returns an error → finalize-error, never done', async () => {
  const r = await runOnboardingSubmit(false, async () => ({ error: null }), true, async () => ({ error: null }), finalizeErr)
  assert.deepEqual(r, { kind: 'finalize-error' })
})

test('fresh + project succeeds + finalize throws → finalize-error', async () => {
  const r = await runOnboardingSubmit(false, async () => ({ error: null }), true, async () => ({ error: null }), () => Promise.reject(new Error('x')))
  assert.deepEqual(r, { kind: 'finalize-error' })
})

test('fresh + project succeeds + finalize returns no error but zero affected rows → finalize-error, never done', async () => {
  const r = await runOnboardingSubmit(false, async () => ({ error: null }), true, async () => ({ error: null }), finalizeZeroRows)
  assert.deepEqual(r, { kind: 'finalize-error' })
})

// ── Resume submission (profileExists = true) ──

test('resume + skip (no project) → finalize only, insertProfile/insertProject never called', async () => {
  let profileCalls = 0, projectCalls = 0
  const r = await runOnboardingSubmit(
    true, async () => { profileCalls++; return { error: null } }, false,
    async () => { projectCalls++; return { error: null } },
    finalizeOk
  )
  assert.deepEqual(r, { kind: 'done' })
  assert.equal(profileCalls, 0)
  assert.equal(projectCalls, 0)
})

test('resume + skip, but finalize matches zero rows → finalize-error, not done', async () => {
  const r = await runOnboardingSubmit(true, async () => ({ error: null }), false, async () => ({ error: null }), finalizeZeroRows)
  assert.deepEqual(r, { kind: 'finalize-error' })
})

test('resume + add project succeeds → done, profile insert never called', async () => {
  let profileCalls = 0
  const r = await runOnboardingSubmit(true, async () => { profileCalls++; return { error: null } }, true, async () => ({ error: null }), finalizeOk)
  assert.deepEqual(r, { kind: 'done' })
  assert.equal(profileCalls, 0)
})

test('resume + project fails → project-error, profile never re-inserted', async () => {
  let profileCalls = 0
  const r = await runOnboardingSubmit(true, async () => { profileCalls++; return { error: null } }, true, async () => ({ error: { message: 'x' } }), finalizeOk)
  assert.deepEqual(r, { kind: 'project-error' })
  assert.equal(profileCalls, 0)
})

// ── Retry helpers ──

test('profile insert is invoked exactly once across project retries (fresh flow)', async () => {
  let profileCalls = 0
  const insertProfile = async () => { profileCalls++; return { error: null } }
  const first = await runOnboardingSubmit(false, insertProfile, true, async () => ({ error: { message: 'x' } }), finalizeOk)
  assert.deepEqual(first, { kind: 'project-error' })
  await retryProjectOnly(async () => ({ error: { message: 'still down' } }), finalizeOk)
  await retryProjectOnly(async () => ({ error: null }), finalizeOk)
  assert.equal(profileCalls, 1)
})

test('retryProjectOnly succeeds through to finalize → done', async () => {
  const r = await retryProjectOnly(async () => ({ error: null }), finalizeOk)
  assert.deepEqual(r, { kind: 'done' })
})

test('retryProjectOnly: project still fails → project-error, finalize never attempted', async () => {
  let finalizeCalls = 0
  const r = await retryProjectOnly(async () => ({ error: { message: 'x' } }), async () => { finalizeCalls++; return finalizeOk() })
  assert.deepEqual(r, { kind: 'project-error' })
  assert.equal(finalizeCalls, 0)
})

test('retryProjectOnly: project succeeds but finalize fails → finalize-error (retryable, not project-error)', async () => {
  const r = await retryProjectOnly(async () => ({ error: null }), finalizeErr)
  assert.deepEqual(r, { kind: 'finalize-error' })
})

test('retryProjectOnly: project succeeds, finalize matches zero rows → finalize-error', async () => {
  const r = await retryProjectOnly(async () => ({ error: null }), finalizeZeroRows)
  assert.deepEqual(r, { kind: 'finalize-error' })
})

test('retryFinalizeOnly succeeds → done', async () => {
  const r = await retryFinalizeOnly(finalizeOk)
  assert.deepEqual(r, { kind: 'done' })
})

test('retryFinalizeOnly: zero-row update (error: null, no matching row) → finalize-error, never a false success', async () => {
  const r = await retryFinalizeOnly(finalizeZeroRows)
  assert.deepEqual(r, { kind: 'finalize-error' })
})

test('retryFinalizeOnly fails (returned) → finalize-error', async () => {
  const r = await retryFinalizeOnly(finalizeErr)
  assert.deepEqual(r, { kind: 'finalize-error' })
})

test('retryFinalizeOnly fails (thrown) → finalize-error, identical shape to a returned error', async () => {
  const thrown = await retryFinalizeOnly(() => Promise.reject(new Error('boom')))
  const returned = await retryFinalizeOnly(finalizeErr)
  assert.deepEqual(thrown, returned)
})

test('retryFinalizeOnly: thrown error and zero-row update produce the identical outcome', async () => {
  const thrown = await retryFinalizeOnly(() => Promise.reject(new Error('boom')))
  const zeroRows = await retryFinalizeOnly(finalizeZeroRows)
  assert.deepEqual(thrown, zeroRows)
})
