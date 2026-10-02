import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyLandingProof } from './landingProof.ts'

test('devlog query fails → error, even if a devlog and a cover also came back', () => {
  assert.deepEqual(classifyLandingProof(true, { id: '1' }, false, true), { kind: 'error' })
})

test('query succeeds, no public devlog → empty', () => {
  assert.deepEqual(classifyLandingProof(false, null, false, false), { kind: 'empty' })
})

test('devlog exists, project lookup succeeded with a cover → ready/cover', () => {
  assert.deepEqual(classifyLandingProof(false, { id: '1' }, false, true), { kind: 'ready', projectStatus: 'cover' })
})

test('devlog exists, project lookup succeeded without a cover → ready/no-cover', () => {
  assert.deepEqual(classifyLandingProof(false, { id: '1' }, false, false), { kind: 'ready', projectStatus: 'no-cover' })
})

test('devlog exists, project lookup failed → ready/unknown, never reported as no-cover', () => {
  assert.deepEqual(classifyLandingProof(false, { id: '1' }, true, false), { kind: 'ready', projectStatus: 'unknown' })
})

test('project lookup failure wins over a stale/true hasCover flag', () => {
  assert.deepEqual(classifyLandingProof(false, { id: '1' }, true, true), { kind: 'ready', projectStatus: 'unknown' })
})
