import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { labelFor, ROLES, ENGINES, type Profile } from '@/lib/supabase/types'

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function ProfileCard({ profile }: { profile: Profile }) {
  const name = profile.display_name || profile.username
  const role = labelFor(ROLES, profile.primary_role)
  const engine = labelFor(ENGINES, profile.primary_engine)
  const isOpen = profile.collaboration_status === 'open'

  return (
    <Link
      href={`/dev/${profile.username}`}
      className="group flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover" />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 font-mono text-sm font-semibold text-indigo-600">
            {initials(name)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-medium tracking-tight text-gray-900">{name}</p>
          <p className="truncate font-mono text-xs text-gray-500">@{profile.username}</p>
        </div>
      </div>

      {(role || engine) && (
        <div className="flex flex-wrap gap-2">
          {role && <Badge variant="muted">{role}</Badge>}
          {engine && <Badge variant="muted">{engine}</Badge>}
        </div>
      )}

      <span
        className={`inline-flex w-fit items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider ${
          isOpen ? 'text-green-600' : 'text-gray-400'
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${isOpen ? 'bg-green-500' : 'bg-gray-300'}`} />
        {isOpen ? 'Open to Collaborate' : 'Not Available'}
      </span>
    </Link>
  )
}
