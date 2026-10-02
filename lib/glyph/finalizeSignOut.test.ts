import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runMutationThenSignOut, retrySignOut } from './finalizeSignOut.ts'

test('mutation fails (returned error) → mutation-failed, sign-out never attempted', async () => {
  let signOutCalls = 0
  const r = await runMutationThenSignOut(
    async () => ({ error: { message: 'bad' } }),
    async () => { signOutCalls++; return { error: null } }
  )
  assert.deepEqual(r, { kind: 'mutation-failed' })
  assert.equal(signOutCalls, 0)
})

test('mutation fails (thrown) → mutation-failed, sign-out never attempted', async () => {
  let signOutCalls = 0
  const r = await runMutationThenSignOut(
    () => Promise.reject(new Error('network')),
    async () => { signOutCalls++; return { error: null } }
  )
  assert.deepEqual(r, { kind: 'mutation-failed' })
  assert.equal(signOutCalls, 0)
})

test('mutation succeeds + sign-out succeeds → done', async () => {
  const r = await runMutationThenSignOut(async () => ({ error: null }), async () => ({ error: null }))
  assert.deepEqual(r, { kind: 'done' })
})

test('mutation succeeds + sign-out returns an error → partial (never mutation-failed)', async () => {
  const r = await runMutationThenSignOut(async () => ({ error: null }), async () => ({ error: { message: 'boom' } }))
  assert.deepEqual(r, { kind: 'partial' })
})

test('mutation succeeds + sign-out throws → partial (never mutation-failed)', async () => {
  const r = await runMutationThenSignOut(async () => ({ error: null }), () => Promise.reject(new TypeError('Failed to fetch')))
  assert.deepEqual(r, { kind: 'partial' })
})

test('retry sign-out succeeds → done', async () => {
  const r = await retrySignOut(async () => ({ error: null }))
  assert.deepEqual(r, { kind: 'done' })
})

test('retry sign-out fails (returned error) → partial', async () => {
  const r = await retrySignOut(async () => ({ error: { message: 'still failing' } }))
  assert.deepEqual(r, { kind: 'partial' })
})

test('retry sign-out fails (thrown) → partial, identical shape to a returned error', async () => {
  const thrown = await retrySignOut(() => Promise.reject(new Error('boom')))
  const returned = await retrySignOut(async () => ({ error: { message: 'boom' } }))
  assert.deepEqual(thrown, returned)
})

test('mutation is invoked exactly once across sign-out retries', async () => {
  let mutateCalls = 0
  const mutate = async () => { mutateCalls++; return { error: null } }
  let signOutAttempt = 0
  const flaky = async () => { signOutAttempt++; return signOutAttempt < 3 ? { error: { message: 'still down' } } : { error: null } }

  const first = await runMutationThenSignOut(mutate, flaky)
  assert.deepEqual(first, { kind: 'partial' })
  const retry1 = await retrySignOut(flaky)
  assert.deepEqual(retry1, { kind: 'partial' })
  const retry2 = await retrySignOut(flaky)
  assert.deepEqual(retry2, { kind: 'done' })

  assert.equal(mutateCalls, 1)
})

test('navigation occurs only after confirmed sign-out (only the done outcome should trigger it)', async () => {
  let navigated = false
  const act = (outcome: { kind: string }) => { if (outcome.kind === 'done') navigated = true }

  act(await runMutationThenSignOut(async () => ({ error: null }), async () => ({ error: { message: 'x' } })))
  assert.equal(navigated, false)

  act(await retrySignOut(async () => ({ error: null })))
  assert.equal(navigated, true)
})
