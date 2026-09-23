import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'

export type Member = { user_id: string; role: string; username: string; display_name: string | null; avatar_url: string | null; primary_role: string | null }
const ROLE = { owner: 'Owner', admin: 'Admin', member: 'Member' } as Record<string, string>

/** One person on a studio's team: who they are and their role there. Links to their profile (the canonical developer page). Renders an <li>. */
export function MemberRow({ member }: { member: Member }) {
  const name = member.display_name || member.username
  return (
    <li>
      <Link href={`/dev/${member.username}`} className="group flex min-h-11 items-center gap-3 py-2">
        <Avatar name={name} src={member.avatar_url} size="lg" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body font-medium text-fg group-hover:text-link">{name}</span>
          <span className="block truncate text-small text-fg-muted">@{member.username}{member.primary_role && ` · ${member.primary_role.replace(/_/g, ' ')}`}</span>
        </span>
        <span className={`shrink-0 text-small ${member.role === 'owner' ? 'font-medium text-fg' : 'text-fg-muted'}`}>{ROLE[member.role] ?? member.role}</span>
      </Link>
    </li>
  )
}
