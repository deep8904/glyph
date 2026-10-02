import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runMarkAllRead } from './markAllRead.ts'

test('resolved success → ok, no message', async () => {
  const r = await runMarkAllRead(async () => ({ error: null }))
  assert.deepEqual(r, { ok: true })
})

test('resolved with a returned Supabase error → not ok, retryable message', async () => {
  const r = await runMarkAllRead(async () => ({ error: { message: 'RLS denied' } }))
  assert.equal(r.ok, false)
  assert.match((r as { ok: false; message: string }).message, /Try again/)
})

test('thrown/rejected network failure → same not-ok, retryable outcome, never rejects', async () => {
  const r = await runMarkAllRead(() => Promise.reject(new TypeError('Failed to fetch')))
  assert.equal(r.ok, false)
  assert.match((r as { ok: false; message: string }).message, /Try again/)
})

test('a returned error and a thrown rejection produce the identical message', async () => {
  const returned = await runMarkAllRead(async () => ({ error: { message: 'x' } }))
  const thrown = await runMarkAllRead(() => { throw new Error('boom') })
  assert.equal((returned as { ok: false; message: string }).message, (thrown as { ok: false; message: string }).message)
})
