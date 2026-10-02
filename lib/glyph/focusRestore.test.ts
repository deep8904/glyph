import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shouldRestoreFailureFocus } from './focusRestore.ts'

const base = { pendingFailureFocus: true, confirmDelete: true, loading: false, error: 'failed', buttonDisabled: false, buttonConnected: true }

test('all conditions satisfied → true', () => {
  assert.equal(shouldRestoreFailureFocus(base), true)
})

test('no pending flag → false (nothing to restore)', () => {
  assert.equal(shouldRestoreFailureFocus({ ...base, pendingFailureFocus: false }), false)
})

test('confirmation already closed (cancelled or succeeded) → false', () => {
  assert.equal(shouldRestoreFailureFocus({ ...base, confirmDelete: false }), false)
})

test('still mid-request → false (button may still be disabled)', () => {
  assert.equal(shouldRestoreFailureFocus({ ...base, loading: true }), false)
})

test('no error message yet → false', () => {
  assert.equal(shouldRestoreFailureFocus({ ...base, error: '' }), false)
})

test('button reports disabled → false, even if every other condition holds', () => {
  assert.equal(shouldRestoreFailureFocus({ ...base, buttonDisabled: true }), false)
})

test('button not connected to the DOM → false', () => {
  assert.equal(shouldRestoreFailureFocus({ ...base, buttonConnected: false }), false)
})
