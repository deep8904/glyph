import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isUnpublished, findSiblings } from './devlogNav.ts'

test('isUnpublished: null published_at is a draft', () => {
  assert.equal(isUnpublished(null), true)
})

test('isUnpublished: future published_at is scheduled', () => {
  const now = new Date('2026-01-01T00:00:00Z')
  assert.equal(isUnpublished('2026-06-01T00:00:00Z', now), true)
})

test('isUnpublished: past published_at is published', () => {
  const now = new Date('2026-06-01T00:00:00Z')
  assert.equal(isUnpublished('2026-01-01T00:00:00Z', now), false)
})

test('findSiblings: middle entry has both prev and next', () => {
  const t = [{ slug: 'a', title: 'A' }, { slug: 'b', title: 'B' }, { slug: 'c', title: 'C' }]
  assert.deepEqual(findSiblings('b', t), { prev: t[0], next: t[2] })
})

test('findSiblings: first entry has no prev', () => {
  const t = [{ slug: 'a', title: 'A' }, { slug: 'b', title: 'B' }]
  assert.deepEqual(findSiblings('a', t), { prev: null, next: t[1] })
})

test('findSiblings: last entry has no next', () => {
  const t = [{ slug: 'a', title: 'A' }, { slug: 'b', title: 'B' }]
  assert.deepEqual(findSiblings('b', t), { prev: t[0], next: null })
})

test('findSiblings: a draft (not in the published timeline) gets no navigation at all', () => {
  const t = [{ slug: 'a', title: 'A' }, { slug: 'c', title: 'C' }]
  assert.deepEqual(findSiblings('draft-slug', t), { prev: null, next: null })
})

test('findSiblings: single-entry timeline has neither', () => {
  const t = [{ slug: 'only', title: 'Only' }]
  assert.deepEqual(findSiblings('only', t), { prev: null, next: null })
})
