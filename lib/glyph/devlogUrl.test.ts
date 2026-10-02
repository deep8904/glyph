import { test } from 'node:test'
import assert from 'node:assert/strict'
import { devlogUrl } from './devlogUrl.ts'

test('project slug + devlog slug → canonical URL', () => {
  assert.equal(devlogUrl('nova', 'emberfall-keep', 'alpha-build-live'), '/p/nova/emberfall-keep/alpha-build-live')
})

test('missing project slug (null) → null, no /null/ segment', () => {
  assert.equal(devlogUrl('deeppatel', null, 'some-devlog'), null)
})

test('missing project slug (undefined) → null', () => {
  assert.equal(devlogUrl('deeppatel', undefined, 'some-devlog'), null)
})

test('missing/invalid devlog slug (null) → null', () => {
  assert.equal(devlogUrl('nova', 'emberfall-keep', null), null)
})

test('missing/invalid devlog slug (empty string) → null', () => {
  assert.equal(devlogUrl('nova', 'emberfall-keep', ''), null)
})

test('both missing → null', () => {
  assert.equal(devlogUrl('nova', null, null), null)
})
