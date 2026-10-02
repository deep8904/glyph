import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runResetRequest } from './resetRequestOutcome.ts'

test('successful request → ok (neutral notice)', async () => {
  const r = await runResetRequest(async () => ({ error: null }))
  assert.deepEqual(r, { ok: true })
})

test('unknown-account-shaped success (no error, address has no account) → same neutral notice', async () => {
  // Supabase returns no error for a nonexistent address — indistinguishable from a real success.
  const r = await runResetRequest(async () => ({ error: null }))
  assert.deepEqual(r, { ok: true })
})

test('returned 400 → generic failure, not success', async () => {
  const r = await runResetRequest(async () => ({ error: { status: 400, message: 'Bad Request' } }))
  assert.equal(r.ok, false)
})

test('returned 429 (rate limit) → generic failure', async () => {
  const r = await runResetRequest(async () => ({ error: { status: 429, message: 'Too Many Requests' } }))
  assert.equal(r.ok, false)
})

test('returned 500 → generic failure', async () => {
  const r = await runResetRequest(async () => ({ error: { status: 500, message: 'Internal Server Error' } }))
  assert.equal(r.ok, false)
})

test('thrown rejection → generic failure, never rejects', async () => {
  const r = await runResetRequest(() => Promise.reject(new TypeError('Failed to fetch')))
  assert.equal(r.ok, false)
})

test('failure message never includes the raw Supabase error text', async () => {
  const r = await runResetRequest(async () => ({ error: { status: 500, message: 'a very specific internal detail' } }))
  assert.equal(r.ok, false)
  assert.doesNotMatch((r as { ok: false; message: string }).message, /internal detail/)
})

test('every failure path produces the identical message (no status-based branching)', async () => {
  const r400 = await runResetRequest(async () => ({ error: { status: 400 } }))
  const r429 = await runResetRequest(async () => ({ error: { status: 429 } }))
  const r500 = await runResetRequest(async () => ({ error: { status: 500 } }))
  const thrown = await runResetRequest(() => { throw new Error('boom') })
  const messages = [r400, r429, r500, thrown].map((r) => (r as { ok: false; message: string }).message)
  assert.equal(new Set(messages).size, 1)
})
