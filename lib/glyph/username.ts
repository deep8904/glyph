/**
 * Pure username rules, shared by the onboarding username field. Preserved exactly from the prior
 * implementation: the same format regex, the same normalization (lowercase, trimmed), and the same
 * "only trust a resolved check when it matches the value currently on screen" staleness guard — an
 * in-flight or late-arriving response for a value the user has since changed away from must never be
 * shown as if it answered the current value.
 */

export const USERNAME_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/

export function normalizeUsernameInput(raw: string): string {
  return raw.toLowerCase().trim()
}

export function isValidUsernameFormat(value: string): boolean {
  return USERNAME_REGEX.test(value)
}

export type UsernameCheckResult = { value: string; outcome: 'available' | 'taken' | 'error'; message: string }

export type UsernameStatus = 'idle' | 'invalid' | 'checking' | 'available' | 'taken' | 'error'

/** `resolved` is only used when it was computed for exactly this `value` — a stale result (for a
 * value the user has since edited away from) must never be reported as answering the current value;
 * a genuinely-invalid format is never sent for a network check at all, so it can't produce one. */
export function classifyUsernameStatus(value: string, resolved: UsernameCheckResult | null): UsernameStatus {
  if (!value) return 'idle'
  if (!isValidUsernameFormat(value)) return 'invalid'
  const resolvedForCurrent = resolved?.value === value ? resolved : null
  if (!resolvedForCurrent) return 'checking'
  return resolvedForCurrent.outcome
}
