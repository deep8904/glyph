import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildSearchHref, parseSearchType, type SearchState } from './searchHref.ts'

test('parseSearchType: valid tab values pass through', () => {
  assert.equal(parseSearchType('projects'), 'projects')
  assert.equal(parseSearchType('profiles'), 'profiles')
  assert.equal(parseSearchType('studios'), 'studios')
  assert.equal(parseSearchType('opportunities'), 'opportunities')
})

test('parseSearchType: legacy "devlogs" URLs remain parseable even though it is not a tab', () => {
  assert.equal(parseSearchType('devlogs'), 'devlogs')
})

test('parseSearchType: unknown/missing value defaults to "all"', () => {
  assert.equal(parseSearchType(undefined), 'all')
  assert.equal(parseSearchType('bogus'), 'all')
})

const base: SearchState = { q: 'ember', type: 'all', stage: null }

test('buildSearchHref: bare query, "all" and page 1 omitted from URL', () => {
  assert.equal(buildSearchHref(base), '/search?q=ember')
})

test('buildSearchHref: empty query omits q entirely', () => {
  assert.equal(buildSearchHref({ ...base, q: '' }), '/search')
})

test('buildSearchHref: non-"all" type is included', () => {
  assert.equal(buildSearchHref({ ...base, type: 'projects' }), '/search?q=ember&type=projects')
})

test('buildSearchHref: stage only applies when type is (or is overridden to) projects', () => {
  assert.equal(buildSearchHref({ q: 'e', type: 'projects', stage: 'alpha' }), '/search?q=e&type=projects&stage=alpha')
  assert.equal(buildSearchHref({ q: 'e', type: 'profiles', stage: 'alpha' }), '/search?q=e&type=profiles')
})

test('buildSearchHref: switching type away from projects via override drops the stage filter', () => {
  assert.equal(buildSearchHref({ q: 'e', type: 'projects', stage: 'alpha' }, { type: 'all' }), '/search?q=e')
})

test('buildSearchHref: explicit stage override wins over state stage', () => {
  assert.equal(buildSearchHref({ q: 'e', type: 'projects', stage: 'alpha' }, { stage: 'beta' }), '/search?q=e&type=projects&stage=beta')
})

test('buildSearchHref: explicit null stage override clears it', () => {
  assert.equal(buildSearchHref({ q: 'e', type: 'projects', stage: 'alpha' }, { stage: null }), '/search?q=e&type=projects')
})

test('buildSearchHref: page > 1 is included, page 1 is omitted', () => {
  assert.equal(buildSearchHref({ ...base, type: 'projects' }, { page: 2 }), '/search?q=ember&type=projects&page=2')
  assert.equal(buildSearchHref({ ...base, type: 'projects' }, { page: 1 }), '/search?q=ember&type=projects')
})
