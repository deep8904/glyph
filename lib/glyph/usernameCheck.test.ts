import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyUsernameCheckResponse, runUsernameCheck } from './usernameCheck.ts'

const fakeRes = (ok: boolean, body: unknown) => ({ ok, json: async () => body })
const brokenJsonRes = (ok: boolean) => ({ ok, json: async () => { throw new SyntaxError('Unexpected token') } })

test('returned database error (ok, {error}) → error, never available', () => {
  assert.deepEqual(classifyUsernameCheckResponse(true, { error: 'lookup_failed' }), { outcome: 'error' })
})

test('503 lookup failure status → error, regardless of body', () => {
  assert.deepEqual(classifyUsernameCheckResponse(false, { error: 'lookup_failed' }), { outcome: 'error' })
})

test('429 rate-limit response → error', () => {
  assert.deepEqual(classifyUsernameCheckResponse(false, { available: false, error: 'Too many requests. Slow down.' }), { outcome: 'error' })
})

test('malformed body (not an object) → error', () => {
  assert.deepEqual(classifyUsernameCheckResponse(true, null), { outcome: 'error' })
  assert.deepEqual(classifyUsernameCheckResponse(true, 'available'), { outcome: 'error' })
})

test('body missing a boolean `available` → error', () => {
  assert.deepEqual(classifyUsernameCheckResponse(true, {}), { outcome: 'error' })
  assert.deepEqual(classifyUsernameCheckResponse(true, { available: 'yes' }), { outcome: 'error' })
})

test('available → available', () => {
  assert.deepEqual(classifyUsernameCheckResponse(true, { available: true }), { outcome: 'available' })
})

test('taken → taken', () => {
  assert.deepEqual(classifyUsernameCheckResponse(true, { available: false }), { outcome: 'taken' })
})

test('runUsernameCheck: thrown fetch → error, never rejects', async () => {
  const r = await runUsernameCheck(() => Promise.reject(new TypeError('Failed to fetch')))
  assert.deepEqual(r, { outcome: 'error' })
})

test('runUsernameCheck: non-JSON/unparseable body → error', async () => {
  const r = await runUsernameCheck(async () => brokenJsonRes(true))
  assert.deepEqual(r, { outcome: 'error' })
})

test('runUsernameCheck: real success path → available', async () => {
  const r = await runUsernameCheck(async () => fakeRes(true, { available: true }))
  assert.deepEqual(r, { outcome: 'available' })
})

test('runUsernameCheck: real taken path → taken', async () => {
  const r = await runUsernameCheck(async () => fakeRes(true, { available: false }))
  assert.deepEqual(r, { outcome: 'taken' })
})

test('runUsernameCheck: 503 database error → error', async () => {
  const r = await runUsernameCheck(async () => fakeRes(false, { error: 'lookup_failed' }))
  assert.deepEqual(r, { outcome: 'error' })
})

test('runUsernameCheck: 429 → error', async () => {
  const r = await runUsernameCheck(async () => fakeRes(false, { available: false, error: 'Too many requests. Slow down.' }))
  assert.deepEqual(r, { outcome: 'error' })
})
