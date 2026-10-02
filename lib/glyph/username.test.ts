import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeUsernameInput, isValidUsernameFormat, classifyUsernameStatus } from './username.ts'

test('normalization: lowercases and trims', () => {
  assert.equal(normalizeUsernameInput('  Nova-Calder  '), 'nova-calder')
})

test('format: 3–30 chars, lowercase/digits/hyphen, not starting or ending with a hyphen', () => {
  assert.equal(isValidUsernameFormat('nova'), true)
  assert.equal(isValidUsernameFormat('nova-calder'), true)
  assert.equal(isValidUsernameFormat('no'), false) // too short
  assert.equal(isValidUsernameFormat('-nova'), false) // leading hyphen
  assert.equal(isValidUsernameFormat('nova-'), false) // trailing hyphen
  assert.equal(isValidUsernameFormat('Nova'), false) // uppercase
  assert.equal(isValidUsernameFormat('a'.repeat(31)), false) // too long
})

test('empty value → idle', () => {
  assert.equal(classifyUsernameStatus('', null), 'idle')
})

test('malformed value → invalid, never sent for a network check', () => {
  assert.equal(classifyUsernameStatus('-bad', null), 'invalid')
})

test('valid format, no resolved check yet → checking', () => {
  assert.equal(classifyUsernameStatus('nova', null), 'checking')
})

test('valid format, resolved for this exact value → its outcome', () => {
  assert.equal(classifyUsernameStatus('nova', { value: 'nova', outcome: 'available', message: 'Available' }), 'available')
  assert.equal(classifyUsernameStatus('nova', { value: 'nova', outcome: 'taken', message: 'Taken' }), 'taken')
  assert.equal(classifyUsernameStatus('nova', { value: 'nova', outcome: 'error', message: 'Network error' }), 'error')
})

test('stale resolved result (for a different, earlier value) → treated as still checking, not shown as an answer', () => {
  assert.equal(classifyUsernameStatus('nova2', { value: 'nova', outcome: 'available', message: 'Available' }), 'checking')
})
