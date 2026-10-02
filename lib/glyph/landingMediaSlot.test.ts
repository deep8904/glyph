import { test } from 'node:test'
import assert from 'node:assert/strict'
import { initialMediaTrack, observeMediaSource, markMediaFailed, shouldShowImage } from './landingMediaSlot.ts'

test('mount with A, A fails → fallback', () => {
  let s = initialMediaTrack('A')
  assert.equal(shouldShowImage(s, 'A'), true)
  s = markMediaFailed(s, 'A')
  assert.equal(shouldShowImage(s, 'A'), false)
})

test('1: A fails → B succeeds → A returns and is attempted', () => {
  let s = initialMediaTrack('A')
  s = markMediaFailed(s, 'A')
  s = observeMediaSource(s, 'B') // genuine transition — re-armed
  assert.equal(shouldShowImage(s, 'B'), true)
  // B succeeds: no markMediaFailed call, state unchanged
  assert.equal(shouldShowImage(s, 'B'), true)
  s = observeMediaSource(s, 'A') // A returns — genuine transition, re-armed despite prior failure
  assert.equal(shouldShowImage(s, 'A'), true)
})

test('2: the returned A fails again → fallback', () => {
  let s = initialMediaTrack('A')
  s = markMediaFailed(s, 'A')
  s = observeMediaSource(s, 'B')
  s = observeMediaSource(s, 'A')
  s = markMediaFailed(s, 'A')
  assert.equal(shouldShowImage(s, 'A'), false)
})

test('3: re-observing the same failed source does not re-arm it', () => {
  let s = initialMediaTrack('A')
  s = markMediaFailed(s, 'A')
  const before = s
  s = observeMediaSource(s, 'A') // same source, no transition
  assert.equal(s, before) // identity-stable no-op
  assert.equal(shouldShowImage(s, 'A'), false)
})

test('4: A fails → B fails → A returns and is attempted', () => {
  let s = initialMediaTrack('A')
  s = markMediaFailed(s, 'A')
  s = observeMediaSource(s, 'B')
  s = markMediaFailed(s, 'B')
  assert.equal(shouldShowImage(s, 'B'), false)
  s = observeMediaSource(s, 'A')
  assert.equal(shouldShowImage(s, 'A'), true)
})

test('5: cover → no-cover → same cover returns and is attempted', () => {
  let s = initialMediaTrack('X')
  s = markMediaFailed(s, 'X')
  assert.equal(shouldShowImage(s, 'X'), false)
  s = observeMediaSource(s, null) // no-cover
  assert.equal(shouldShowImage(s, null), false) // null coverUrl never shows an image regardless
  s = observeMediaSource(s, 'X') // same cover returns — re-armed by the intervening transition
  assert.equal(shouldShowImage(s, 'X'), true)
})

test('a failure reported for a source that has since changed away does not corrupt the new source', () => {
  let s = initialMediaTrack('A')
  s = observeMediaSource(s, 'B') // moved on before A's failure notification arrives
  s = markMediaFailed(s, 'A') // stale notification for the old source
  assert.equal(shouldShowImage(s, 'B'), true) // B unaffected
})

test('no-cover is shown regardless of tracked failure state', () => {
  let s = initialMediaTrack('A')
  s = markMediaFailed(s, 'A')
  assert.equal(shouldShowImage(s, null), false)
})
