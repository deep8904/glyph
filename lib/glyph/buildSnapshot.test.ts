import { test } from 'node:test'
import assert from 'node:assert/strict'
import { projectHref, cadenceLabel } from './buildSnapshot.ts'

test('projectHref: slug present builds canonical route', () => {
  assert.equal(projectHref('nova', 'emberfall-keep'), '/p/nova/emberfall-keep')
})

test('projectHref: slug null returns null (no fake link)', () => {
  assert.equal(projectHref('deeppatel', null), null)
})

test('cadenceLabel: fewer than two valid dates says nothing', () => {
  assert.equal(cadenceLabel([]), null)
  assert.equal(cadenceLabel(['2026-09-10T00:00:00Z']), null)
})

test('cadenceLabel: exactly two dates — count-and-span, no recurrence claim', () => {
  assert.equal(cadenceLabel(['2026-09-10T00:00:00Z', '2026-09-17T00:00:00Z']), '2 build notes across 7 days')
})

test('cadenceLabel: three dates with unequal intervals uses full span, not an average', () => {
  // day 0, day 3, day 12 — uneven gaps (3d, 9d); span must be 12d, not an averaged interval.
  assert.equal(
    cadenceLabel(['2026-09-01T00:00:00Z', '2026-09-04T00:00:00Z', '2026-09-13T00:00:00Z']),
    '3 build notes across 12 days'
  )
})

test('cadenceLabel: invalid dates are dropped, not counted', () => {
  assert.equal(cadenceLabel(['not-a-date', '2026-09-10T00:00:00Z']), null) // only 1 valid left
  assert.equal(
    cadenceLabel(['garbage', '2026-09-01T00:00:00Z', '2026-09-08T00:00:00Z']),
    '2 build notes across 7 days'
  )
})

test('cadenceLabel: duplicate dates never overstate — zero span says nothing', () => {
  assert.equal(cadenceLabel(['2026-09-10T00:00:00Z', '2026-09-10T00:00:00Z']), null)
})

test('cadenceLabel: duplicate plus a distinct date still counts every valid post', () => {
  assert.equal(
    cadenceLabel(['2026-09-10T00:00:00Z', '2026-09-10T00:00:00Z', '2026-09-15T00:00:00Z']),
    '3 build notes across 5 days'
  )
})

test('cadenceLabel: unordered input gives the same result as sorted input', () => {
  const ordered = cadenceLabel(['2026-09-01T00:00:00Z', '2026-09-08T00:00:00Z', '2026-09-13T00:00:00Z'])
  const shuffled = cadenceLabel(['2026-09-13T00:00:00Z', '2026-09-01T00:00:00Z', '2026-09-08T00:00:00Z'])
  assert.equal(shuffled, ordered)
  assert.equal(shuffled, '3 build notes across 12 days')
})
