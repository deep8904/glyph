import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { GlyphShell } from '@/components/glyph/shell/GlyphShell'
import { GAvatar } from '@/components/glyph/ui/primitives'
import { GEmptyState, GErrorState } from '@/components/glyph/ui/States'
import { GlyphNetworkRow, type NetworkEntry } from '@/components/glyph/profile/GlyphNetworkRow'
import { classifyProfileLookup, classifyQuery } from '@/lib/glyph/networkQueryState'
import type { Profile } from '@/lib/supabase/types'

type FollowEntry = { follower_id: string; profiles: NetworkEntry }

export default async function FollowersPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .eq('username', username)
    .maybeSingle<Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>>()

  const profileOutcome = classifyProfileLookup(profile, profileError)
  if (profileOutcome.kind === 'not-found') notFound()
  if (profileOutcome.kind === 'error') {
    return (
      <GlyphShell>
        <div className="mx-auto w-full max-w-[640px]">
          <GErrorState title="We couldn't load this profile" description="This may be temporary. Reload the page to try again." action={<Link href={`/dev/${username}/followers`} className="text-small font-medium text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember">Reload</Link>} />
        </div>
      </GlyphShell>
    )
  }
  const p = profileOutcome.profile

  const { data: follows, error: followsError } = await supabase
    .from('follows')
    .select('follower_id, profiles!follower_id(id, username, display_name, avatar_url, primary_role, bio)')
    .eq('followed_id', p.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const followsOutcome = classifyQuery(follows as unknown as FollowEntry[] | null, followsError)
  const name = p.display_name || p.username

  return (
    <GlyphShell>
      <div className="mx-auto w-full max-w-[640px]">
        <Link href={`/dev/${username}`} className="inline-flex min-h-11 items-center gap-1.5 text-small font-medium text-ink-2 outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">
          <ArrowLeft aria-hidden strokeWidth={1.75} className="size-4" /> {name}
        </Link>

        <header className="mt-4 flex items-center gap-3">
          <GAvatar name={name} src={p.avatar_url} size={40} />
          <h1 className="text-h1 font-semibold tracking-[-0.02em] text-ink [overflow-wrap:anywhere]">
            {followsOutcome.kind === 'ok' ? `${followsOutcome.rows.length} ${followsOutcome.rows.length === 1 ? 'follower' : 'followers'}` : 'Followers'}
          </h1>
        </header>

        {followsOutcome.kind === 'error' ? (
          <div className="mt-6">
            <GErrorState title="We couldn't load followers" description="This may be temporary. Reload the page to try again." action={<Link href={`/dev/${username}/followers`} className="text-small font-medium text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember">Reload</Link>} />
          </div>
        ) : followsOutcome.kind === 'empty' ? (
          <div className="mt-6">
            <GEmptyState title="No followers yet" description={`Nobody follows ${name} yet.`} />
          </div>
        ) : (
          <ul className="mt-6 border-t border-hair">
            {followsOutcome.rows.map((entry) => <GlyphNetworkRow key={entry.follower_id} entry={entry.profiles} />)}
          </ul>
        )}
      </div>
    </GlyphShell>
  )
}
