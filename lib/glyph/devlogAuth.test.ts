import { test } from 'node:test'
import assert from 'node:assert/strict'
import { gatedInteractionUserId } from './devlogAuth.ts'

test('signed out: no auth id, no profile → null', () => {
  assert.equal(gatedInteractionUserId(null, false), null)
})

test('authenticated with a valid profile → the auth id passes through', () => {
  assert.equal(gatedInteractionUserId('user-123', true), 'user-123')
})

test('authenticated without a profile row → null, not the raw auth id', () => {
  assert.equal(gatedInteractionUserId('user-123', false), null)
})
