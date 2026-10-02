import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyCount, classifyCursorParam, classifyFeedPage } from './feedState.ts'

// ── classifyCount ────────────────────────────────────────────────────────────

test('classifyCount: successful query with a real count', () => {
  assert.deepEqual(classifyCount(3, null), { kind: 'ok', count: 3 })
})

test('classifyCount: successful query with null count defaults to 0', () => {
  assert.deepEqual(classifyCount(null, null), { kind: 'ok', count: 0 })
})

test('classifyCount: a query error is never reported as a count of 0', () => {
  assert.deepEqual(classifyCount(null, { message: 'boom' }), { kind: 'error' })
  assert.deepEqual(classifyCount(0, { message: 'boom' }), { kind: 'error' })
})

// ── classifyCursorParam ──────────────────────────────────────────────────────

const parse = (raw: string) => (raw === 'good' ? { id: raw } : null)

test('classifyCursorParam: no param at all → none', () => {
  assert.deepEqual(classifyCursorParam(undefined, parse), { kind: 'none' })
})

test('classifyCursorParam: a well-formed cursor → valid, carrying the parsed value', () => {
  assert.deepEqual(classifyCursorParam('good', parse), { kind: 'valid', cursor: { id: 'good' } })
})

test('classifyCursorParam: a present but unparseable cursor → malformed, distinct from none', () => {
  assert.deepEqual(classifyCursorParam('garbage', parse), { kind: 'malformed' })
})

// ── classifyFeedPage ─────────────────────────────────────────────────────────

const okFollowing = (n: number) => ({ kind: 'ok' as const, count: n })
const erroredFollowing = { kind: 'error' as const }

test('feed query failed → error, regardless of everything else', () => {
  assert.deepEqual(classifyFeedPage({ feedError: true, rowsCount: 5, hasCursor: true, following: okFollowing(3) }), { kind: 'error' })
})

test('rows present → results', () => {
  assert.deepEqual(classifyFeedPage({ feedError: false, rowsCount: 4, hasCursor: false, following: okFollowing(2) }), { kind: 'results' })
})

test('valid cursor, zero rows → past-end (not confused with a genuinely empty feed)', () => {
  assert.deepEqual(classifyFeedPage({ feedError: false, rowsCount: 0, hasCursor: true, following: okFollowing(2) }), { kind: 'past-end' })
})

test('first page, zero rows, following-count query failed → empty-unknown-follows, never "0"', () => {
  assert.deepEqual(classifyFeedPage({ feedError: false, rowsCount: 0, hasCursor: false, following: erroredFollowing }), { kind: 'empty-unknown-follows' })
})

test('first page, zero rows, genuinely following nobody → empty-no-follows', () => {
  assert.deepEqual(classifyFeedPage({ feedError: false, rowsCount: 0, hasCursor: false, following: okFollowing(0) }), { kind: 'empty-no-follows' })
})

test('first page, zero rows, following people who have not published → empty-has-follows, carries the real count', () => {
  assert.deepEqual(classifyFeedPage({ feedError: false, rowsCount: 0, hasCursor: false, following: okFollowing(5) }), { kind: 'empty-has-follows', following: 5 })
})
