import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyLandingCta } from './landingCta.ts'

test('signed out → /signup, create-profile copy at both call sites', () => {
  const cta = classifyLandingCta(false)
  assert.equal(cta.href, '/signup')
  assert.match(cta.heroLabel, /profile/i)
  assert.match(cta.finalLabel, /profile/i)
})

test('signed in → /dashboard, no "create your profile" instruction anywhere', () => {
  const cta = classifyLandingCta(true)
  assert.equal(cta.href, '/dashboard')
  assert.doesNotMatch(cta.heroLabel, /create.*profile/i)
  assert.doesNotMatch(cta.finalLabel, /create.*profile/i)
})
