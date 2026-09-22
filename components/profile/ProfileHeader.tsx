import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { FollowButton } from '@/components/social/FollowButton'
import { BlockMuteButtons } from '@/components/moderation/BlockMuteButtons'
import { cn } from '@/lib/utils'

/**
 * Who is this person. Identity only: name, handle, affiliation, a plain facts line, availability, network counts.
 * Owner and visitor share this skeleton; only the action cluster differs (edit vs follow + more).
 */
export function ProfileHeader({
  name,
  username,
  avatarUrl,
  location,
  facts,
  isOpenToCollab,
  followerCount,
  followingCount,
  isOwner,
  currentUserId,
  targetId,
  isFollowing,
  isBlocked,
  isMuted,
  studios = [],
}: {
  name: string
  username: string
  avatarUrl: string | null
  location: string | null
  /** Role, engine, experience — already labelled, empty entries dropped. */
  facts: string[]
  isOpenToCollab: boolean
  followerCount: number
  followingCount: number
  isOwner: boolean
  currentUserId: string | null
  targetId: string
  isFollowing: boolean
  isBlocked: boolean
  isMuted: boolean
  /** Active studios this developer belongs to, with their role — affiliation, not a resume. */
  studios?: { slug: string; name: string; role: string }[]
}) {
  const line = [location, ...facts].filter(Boolean).join(' · ')
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-start">
      <Avatar name={name} src={avatarUrl} size="xl" className="size-20 text-h2" />
      <div className="min-w-0 flex-1">
        <h1 className="text-display font-semibold text-fg [overflow-wrap:anywhere]">{name}</h1>
        <p className="mt-0.5 font-mono text-small text-fg-muted">@{username}</p>
        {studios.length > 0 && (
          <p className="mt-2 text-small text-fg-secondary">
            {studios.map((st, i) => (
              <span key={st.slug}>
                {i > 0 && ' · '}
                {st.role === 'owner' ? 'Owner' : st.role === 'admin' ? 'Admin' : 'Developer'} at{' '}
                <Link href={`/studios/${st.slug}`} className="font-medium text-link underline-offset-2 hover:underline">{st.name}</Link>
              </span>
            ))}
          </p>
        )}
        {line && <p className="mt-2 text-body text-fg-secondary">{line}</p>}
        <p className={cn('mt-2 flex items-center gap-2 text-small', isOpenToCollab ? 'font-medium text-success' : 'text-fg-muted')}>
          <span aria-hidden className={cn('size-2 rounded-full', isOpenToCollab ? 'bg-success' : 'bg-line-strong')} />
          {isOpenToCollab ? 'Open to collaborate' : 'Not currently available'}
        </p>
        <p className="mt-3 flex flex-wrap gap-x-4 text-small text-fg-secondary">
          <Link href={`/dev/${username}/followers`} className="inline-flex min-h-11 items-center hover:text-fg hover:underline underline-offset-2">
            <span className="mr-1 font-mono font-medium text-fg">{followerCount}</span> {followerCount === 1 ? 'follower' : 'followers'}
          </Link>
          <Link href={`/dev/${username}/following`} className="inline-flex min-h-11 items-center hover:text-fg hover:underline underline-offset-2">
            <span className="mr-1 font-mono font-medium text-fg">{followingCount}</span> following
          </Link>
        </p>
      </div>

      {isOwner ? (
        <Button asChild variant="secondary" className="shrink-0 self-start">
          <Link href="/settings/profile"><Pencil aria-hidden strokeWidth={1.75} className="size-4" /> Edit profile</Link>
        </Button>
      ) : (
        <div className="flex shrink-0 items-start gap-2 self-start">
          <FollowButton targetId={targetId} currentUserId={currentUserId} initialFollowing={isFollowing} />
          {currentUserId && <BlockMuteButtons targetId={targetId} targetUsername={username} isBlocked={isBlocked} isMuted={isMuted} />}
        </div>
      )}
    </header>
  )
}
