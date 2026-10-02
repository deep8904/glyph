/**
 * The landing page's one action, derived once and reused at both call sites (hero, final section)
 * so the two never drift. Signed out, it always points at account creation; signed in, it always
 * points at Dashboard, and the copy never tells an already-registered visitor to "create a profile."
 */

export type LandingCta = { href: string; heroLabel: string; finalLabel: string }

export function classifyLandingCta(authed: boolean): LandingCta {
  return authed
    ? { href: '/dashboard', heroLabel: 'Go to your Dashboard', finalLabel: 'Go to your Dashboard' }
    : { href: '/signup', heroLabel: 'Create your free profile', finalLabel: 'Create your profile' }
}
