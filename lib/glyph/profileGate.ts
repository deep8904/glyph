/**
 * The profile lookup that gates every signed-in page (Feed, Notifications, …). A transient query
 * failure must never masquerade as "this user isn't onboarded yet" and silently redirect them to
 * /onboarding — it must render a retryable error instead, and the caller must not run any further
 * content queries once this fails. Only a successful query that genuinely finds no profile, or
 * finds one that fails the caller's own onboarded check, redirects.
 */

export type ProfileGateOutcome<P> = { kind: 'error' } | { kind: 'redirect' } | { kind: 'ok'; profile: P }

export function classifyProfileGate<P>(profile: P | null, error: unknown, satisfied: (profile: P) => boolean): ProfileGateOutcome<P> {
  if (error) return { kind: 'error' }
  if (!profile || !satisfied(profile)) return { kind: 'redirect' }
  return { kind: 'ok', profile }
}
