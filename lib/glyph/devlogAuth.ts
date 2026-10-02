/**
 * The interaction gate the legacy route enforced: an authenticated Supabase Auth user is only
 * handed mutation controls (react, comment, reply, edit, delete) once their `profiles` row is
 * confirmed to exist — those tables carry a foreign key to `profiles`, not to `auth.users`, so an
 * account mid-onboarding (auth exists, profile row doesn't yet) must see the same read-only
 * surface as a signed-out visitor rather than controls that would fail against that foreign key.
 */
export function gatedInteractionUserId(authUserId: string | null, hasProfile: boolean): string | null {
  return authUserId && hasProfile ? authUserId : null
}
