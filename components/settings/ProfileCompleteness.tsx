import type { Profile } from '@/lib/supabase/types'

/** Names the profile fields that are still empty. Says nothing when the profile is complete. No score, no percentage. */
export function missingProfileFields(p: Pick<Profile, 'display_name' | 'bio' | 'location' | 'primary_role' | 'primary_engine'>): string[] {
  const out: string[] = []
  if (!p.display_name) out.push('display name')
  if (!p.bio) out.push('bio')
  if (!p.primary_role) out.push('primary role')
  if (!p.primary_engine) out.push('primary engine')
  if (!p.location) out.push('location')
  return out
}

export function ProfileCompleteness({ profile }: { profile: Pick<Profile, 'display_name' | 'bio' | 'location' | 'primary_role' | 'primary_engine'> }) {
  const missing = missingProfileFields(profile)
  if (missing.length === 0) return null
  return (
    <p className="mb-6 border-l-2 border-warning-line bg-warning-subtle px-3 py-2 text-small text-fg-secondary">
      Your profile does not show a {missing.join(', ').replace(/, ([^,]*)$/, ' or $1')} yet. People use these to decide whether to follow, collaborate or playtest with you.
    </p>
  )
}
