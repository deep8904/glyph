import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/supabase/types'
import { Shell } from '@/components/shell/Shell'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'

type FollowEntry = {
  followed_id: string
  profiles: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'primary_role' | 'bio'>
}

export default async function FollowingPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .eq('username', username)
    .maybeSingle<Pick<Profile, 'id' | 'username' | 'display_name'>>()

  if (!profile) notFound()

  const { data: follows } = await supabase
    .from('follows')
    .select('followed_id, profiles!followed_id(id, username, display_name, avatar_url, primary_role, bio)')
    .eq('follower_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const entries = (follows ?? []) as unknown as FollowEntry[]
  const name = profile.display_name || profile.username

  return (
    <Shell breadcrumb={[{ label: name, href: `/dev/${username}` }, { label: 'Following' }]}>
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-h1 font-semibold text-fg">Following <span className="font-mono text-h3 font-normal text-fg-muted">{entries.length}</span></h1>
        {entries.length === 0 ? (
          <EmptyState className="mt-6" kind="first-use" title="Not following anyone yet" description={`${name} is not following anyone yet.`} />
        ) : (
          <ul className="mt-6 divide-y divide-line-subtle border-y border-line-subtle">
            {entries.map((entry) => {
              const p = entry.profiles
              const pName = p.display_name || p.username
              return (
                <li key={entry.followed_id}>
                  <Link href={`/dev/${p.username}`} className="flex min-h-11 items-center gap-3 py-3 hover:bg-surface-muted focus-visible:bg-surface-muted sm:min-h-0">
                    <Avatar name={pName} src={p.avatar_url} size="lg" />
                    <span className="min-w-0">
                      <span className="block truncate text-body font-medium text-fg">{pName}</span>
                      <span className="block truncate text-small text-fg-muted">@{p.username}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Shell>
  )
}
