import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createNotifyOnceGuard } from './notifyOnceGuard.ts'

test('onError before the [src] effect: exactly one notification', () => {
  const guard = createNotifyOnceGuard()
  const fromOnError = guard.tryNotify('B')
  const fromEffect = guard.tryNotify('B')
  assert.equal(fromOnError, true)
  assert.equal(fromEffect, false)
})

test('the [src] effect fires first (pre-hydration): exactly one notification, even if onError follows', () => {
  const guard = createNotifyOnceGuard()
  const fromEffect = guard.tryNotify('B')
  const fromOnError = guard.tryNotify('B')
  assert.equal(fromEffect, true)
  assert.equal(fromOnError, false)
})

test('changing source A → B permits B to notify', () => {
  const guard = createNotifyOnceGuard()
  assert.equal(guard.tryNotify('A'), true)
  assert.equal(guard.tryNotify('A'), false)
  assert.equal(guard.tryNotify('B'), true)
})

test('cycling A → B → A (B also fails) permits the new A load to notify again', () => {
  const guard = createNotifyOnceGuard()
  assert.equal(guard.tryNotify('A'), true)
  assert.equal(guard.tryNotify('B'), true)
  assert.equal(guard.tryNotify('A'), true)
})

// ── The source-transition case a failure-only guard cannot express ─────────────────────────────

test('A fails, B is only observed (loads successfully, never fails) → A fails again: both A failures notify', () => {
  const guard = createNotifyOnceGuard()
  assert.equal(guard.tryNotify('A'), true)          // A fails
  guard.observeSource('B')                          // effect runs for B; B loads fine, tryNotify(B) never called
  assert.equal(guard.tryNotify('A'), true)           // A is re-mounted and fails again — must notify
})

test('onError(B) before the B source effect, then observeSource(B) and the effect check: exactly one notification', () => {
  const guard = createNotifyOnceGuard()
  const fromOnError = guard.tryNotify('B')  // onError fires first, itself observes+syncs to B
  guard.observeSource('B')                  // the [src] effect's own observeSource call for the same B
  const fromEffectCheck = guard.tryNotify('B')
  assert.equal(fromOnError, true)
  assert.equal(fromEffectCheck, false)
})

test('effect observes B first, then detects the failure: exactly one notification', () => {
  const guard = createNotifyOnceGuard()
  guard.observeSource('B')
  const fromEffectCheck = guard.tryNotify('B')
  const fromRedundantOnError = guard.tryNotify('B')
  assert.equal(fromEffectCheck, true)
  assert.equal(fromRedundantOnError, false)
})

test('re-observing the same failed source does not re-arm it', () => {
  const guard = createNotifyOnceGuard()
  assert.equal(guard.tryNotify('A'), true)
  guard.observeSource('A') // same source observed again — must be a no-op, not a reset
  assert.equal(guard.tryNotify('A'), false)
})
