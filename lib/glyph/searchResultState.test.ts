import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeSearchTotal, classifySearchResults, type SearchCounts } from './searchResultState.ts'

const zero: SearchCounts = { profiles: 0, projects: 0, studios: 0, opportunities: 0, devlogs: 0 }

test('All mode: only devlogs match → total is nonzero (the regression this fixes)', () => {
  const counts: SearchCounts = { ...zero, devlogs: 1 }
  assert.equal(computeSearchTotal('all', counts, 0), 1)
  assert.equal(classifySearchResults({ anyError: false, page: 1, offset: 0, total: computeSearchTotal('all', counts, 0) }), 'results')
})

test('All mode: nothing matches at all → total is 0, state is no-results', () => {
  const total = computeSearchTotal('all', zero, 0)
  assert.equal(total, 0)
  assert.equal(classifySearchResults({ anyError: false, page: 1, offset: 0, total }), 'no-results')
})

test('All mode: devlogs plus primary results → total sums every category including devlogs', () => {
  const counts: SearchCounts = { profiles: 2, projects: 3, studios: 1, opportunities: 0, devlogs: 4 }
  assert.equal(computeSearchTotal('all', counts, 0), 10)
})

test('Scoped type=devlogs: total is devlogs count alone, unaffected by the All-mode fix', () => {
  const counts: SearchCounts = { profiles: 5, projects: 5, studios: 5, opportunities: 5, devlogs: 2 }
  assert.equal(computeSearchTotal('devlogs', counts, 0), 2)
})

test('Scoped type=projects: total comes from the stage-filter-aware scoped total, not counts.projects', () => {
  // counts.projects intentionally ignores the stage filter (tab-count contract); the scoped total
  // passed in separately is the one that must drive pagination/no-results for that scope.
  const counts: SearchCounts = { ...zero, projects: 9 }
  assert.equal(computeSearchTotal('projects', counts, 3), 3)
})

test('Any error suppresses normal result rendering regardless of totals', () => {
  assert.equal(classifySearchResults({ anyError: true, page: 1, offset: 0, total: 5 }), 'error')
  assert.equal(classifySearchResults({ anyError: true, page: 1, offset: 0, total: 0 }), 'error')
})

test('past-end only applies past page 1 with a real total behind it', () => {
  assert.equal(classifySearchResults({ anyError: false, page: 2, offset: 20, total: 10 }), 'past-end')
  assert.equal(classifySearchResults({ anyError: false, page: 1, offset: 0, total: 10 }), 'results')
})
