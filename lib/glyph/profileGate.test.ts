import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyProfileGate } from './profileGate.ts'

test('query fails → error, even if a profile also came back', () => {
  const r = classifyProfileGate({ id: '1', is_onboarded: true }, new Error('boom'), (p: { is_onboarded: boolean }) => p.is_onboarded)
  assert.deepEqual(r, { kind: 'error' })
})

test('query succeeds, profile null → redirect (never treated as error)', () => {
  const r = classifyProfileGate<{ is_onboarded: boolean }>(null, null, (p) => p.is_onboarded)
  assert.deepEqual(r, { kind: 'redirect' })
})

test('query succeeds, profile fails onboarded check → redirect', () => {
  const r = classifyProfileGate({ id: '1', is_onboarded: false }, null, (p: { is_onboarded: boolean }) => p.is_onboarded)
  assert.deepEqual(r, { kind: 'redirect' })
})

test('query succeeds, profile satisfies check → ok, carries profile', () => {
  const profile = { id: '1', is_onboarded: true }
  const r = classifyProfileGate(profile, null, (p) => p.is_onboarded)
  assert.deepEqual(r, { kind: 'ok', profile })
})

test('caller with an always-true check (existence-only gate) → ok whenever profile exists', () => {
  const profile = { id: '1' }
  const r = classifyProfileGate(profile, null, () => true)
  assert.deepEqual(r, { kind: 'ok', profile })
})
