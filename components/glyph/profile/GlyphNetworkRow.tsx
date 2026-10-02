import Link from 'next/link'
import { GAvatar } from '@/components/glyph/ui/primitives'
import { labelFor, ROLES } from '@/lib/supabase/types'

export type NetworkEntry = { id: string; username: string; display_name: string | null; avatar_url: string | null; primary_role: string | null }

/**
 * One developer in a Profile-adjacent network directory (Followers/Following) — the same object
 * in the same context, so Followers and Following share this row. Deliberately not the same
 * anatomy as Search's developer result (GlyphDevListRow): that row's job is scan-and-compare across
 * a mixed search result set (current project, activity, collaboration status); this row's job is
 * simply "who is this person" as a continuation of the Profile page above it — role is the only
 * fact shown, and only because it's already real queried data, never fabricated popularity.
 */
export function GlyphNetworkRow({ entry }: { entry: NetworkEntry }) {
  const name = entry.display_name || entry.username
  const role = entry.primary_role ? labelFor(ROLES, entry.primary_role) : null
  return (
    <li className="border-b border-hair">
      <Link href={`/dev/${entry.username}`} className="flex min-h-11 items-center gap-3 rounded-sm py-3 outline-none hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-inset sm:min-h-0">
        <GAvatar name={name} src={entry.avatar_url} size={44} />
        <span className="min-w-0">
          <span className="block truncate font-medium text-ink [overflow-wrap:anywhere]">{name}</span>
          <span className="block truncate text-small text-ink-3">@{entry.username}{role && <> · {role}</>}</span>
        </span>
      </Link>
    </li>
  )
}
