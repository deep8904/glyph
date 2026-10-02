import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyPrivacyGate, classifyObjectResolution } from './notificationPrivacy.ts'

// ── classifyPrivacyGate ──────────────────────────────────────────────────────

test('both lookups succeed → ready, with a real hidden-actor set', () => {
  const result = classifyPrivacyGate({
    blocks: [{ blocker_id: 'me', blocked_id: 'x' }],
    blocksError: null,
    mutes: [{ muted_id: 'y' }],
    mutesError: null,
    viewerId: 'me',
  })
  assert.deepEqual(result, { kind: 'ready', hiddenActorIds: new Set(['x', 'y']) })
})

test('block lookup fails → error, never "ready" with an incomplete set', () => {
  const result = classifyPrivacyGate({ blocks: null, blocksError: { message: 'boom' }, mutes: [], mutesError: null, viewerId: 'me' })
  assert.deepEqual(result, { kind: 'error' })
})

test('mute lookup fails → error, even if blocks succeeded', () => {
  const result = classifyPrivacyGate({ blocks: [], blocksError: null, mutes: null, mutesError: { message: 'boom' }, viewerId: 'me' })
  assert.deepEqual(result, { kind: 'error' })
})

test('viewer id is never left in its own hidden set', () => {
  const result = classifyPrivacyGate({
    blocks: [{ blocker_id: 'me', blocked_id: 'me' }],
    blocksError: null,
    mutes: [],
    mutesError: null,
    viewerId: 'me',
  })
  assert.deepEqual(result, { kind: 'ready', hiddenActorIds: new Set() })
})

// ── classifyObjectResolution ─────────────────────────────────────────────────

test('found, no error → found', () => {
  assert.equal(classifyObjectResolution(true, false), 'found')
})

test('not found, no error → gone (genuinely absent or RLS-hidden)', () => {
  assert.equal(classifyObjectResolution(false, false), 'gone')
})

test('query failed → unknown, regardless of whether the object happened to be "found"', () => {
  assert.equal(classifyObjectResolution(false, true), 'unknown')
  assert.equal(classifyObjectResolution(true, true), 'unknown')
})
