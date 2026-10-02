import Link from 'next/link'
import { GAvatar } from '@/components/glyph/ui/primitives'
import { labelFor, ROLES } from '@/lib/supabase/types'
import type { SuggestedDeveloper } from '@/lib/feed/queries'

/**
 * A developer suggested only in the eligible empty-feed state ("you follow no one, or the people
 * you follow haven't published yet") — plain identity + role, nothing else. Not the Search/Explore
 * identity row (that carries current-project/activity/open-to-collab facts this suggestion list
 * deliberately doesn't compute or claim), and not a recommendation with any scoring language.
 */
export function GlyphSuggestedDeveloperRow({ dev }: { dev: SuggestedDeveloper }) {
  const name = dev.display_name || dev.username
  const role = dev.primary_role ? labelFor(ROLES, dev.primary_role) : null
  return (
    <li className="border-b border-hair">
      <Link href={`/dev/${dev.username}`} className="flex min-h-11 items-center gap-3 rounded-sm py-3 outline-none hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-inset sm:min-h-0">
        <GAvatar name={name} src={dev.avatar_url} size={40} />
        <span className="min-w-0">
          <span className="block truncate font-medium text-ink [overflow-wrap:anywhere]">{name}</span>
          <span className="block truncate text-small text-ink-3">@{dev.username}{role && <> · {role}</>}</span>
        </span>
      </Link>
    </li>
  )
}
