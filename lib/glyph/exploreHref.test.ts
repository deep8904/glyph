import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildExploreHref } from './exploreHref.ts'

const none = { stage: null, playtest: false, collab: false }

test('page 1 has no page param', () => {
  assert.equal(buildExploreHref('projects', none, { page: 1 }), '/explore/projects')
})

test('middle page: next and previous preserve stage filter', () => {
  const s = { stage: 'alpha', playtest: false, collab: false }
  assert.equal(buildExploreHref('projects', s, { page: 3 }), '/explore/projects?stage=alpha&page=3')       // current
  assert.equal(buildExploreHref('projects', s, { page: 2 }), '/explore/projects?stage=alpha&page=2')       // previous
  assert.equal(buildExploreHref('projects', s, { page: 4 }), '/explore/projects?stage=alpha&page=4')       // next
})

test('playtest filter preserved across pages', () => {
  const s = { stage: 'beta', playtest: true, collab: false }
  assert.equal(buildExploreHref('projects', s, { page: 2 }), '/explore/projects?stage=beta&playtest=open&page=2')
})

test('collab filter preserved on developers pagination', () => {
  const s = { stage: null, playtest: false, collab: true }
  assert.equal(buildExploreHref('developers', s, { page: 2 }), '/explore/developers?collab=open&page=2')
  assert.equal(buildExploreHref('developers', s, { page: 1 }), '/explore/developers?collab=open')
})

test('devlogs pagination has no project-only filters', () => {
  assert.equal(buildExploreHref('devlogs', none, { page: 5 }), '/explore/devlogs?page=5')
})

test('clearing a filter drops it from the URL', () => {
  const s = { stage: 'alpha', playtest: false, collab: false }
  assert.equal(buildExploreHref('projects', s, { stage: null }), '/explore/projects')
})
