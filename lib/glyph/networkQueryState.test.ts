import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyQuery, classifyProfileLookup } from './networkQueryState.ts'

test('classifyQuery: successful query with rows → ok', () => {
  assert.deepEqual(classifyQuery([{ id: 1 }], null), { kind: 'ok', rows: [{ id: 1 }] })
})

test('classifyQuery: successful query with zero rows → empty, not error', () => {
  assert.deepEqual(classifyQuery([], null), { kind: 'empty' })
})

test('classifyQuery: null rows with no error (defensive) → empty', () => {
  assert.deepEqual(classifyQuery(null, null), { kind: 'empty' })
})

test('classifyQuery: a real error → error, even if rows happen to be empty', () => {
  assert.deepEqual(classifyQuery([], { message: 'boom' }), { kind: 'error' })
  assert.deepEqual(classifyQuery(null, { message: 'boom' }), { kind: 'error' })
})

test('classifyProfileLookup: found → ok', () => {
  assert.deepEqual(classifyProfileLookup({ id: 'p1' }, null), { kind: 'ok', profile: { id: 'p1' } })
})

test('classifyProfileLookup: genuinely absent, no error → not-found (real 404)', () => {
  assert.deepEqual(classifyProfileLookup(null, null), { kind: 'not-found' })
})

test('classifyProfileLookup: query failure → error, never not-found', () => {
  assert.deepEqual(classifyProfileLookup(null, { message: 'boom' }), { kind: 'error' })
})
