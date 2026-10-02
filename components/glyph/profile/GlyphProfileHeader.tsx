import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { GAvatar, GButton } from '@/components/glyph/ui/primitives'
import { GlyphFollowButton } from '@/components/glyph/profile/GlyphFollowButton'
import { GlyphAccountMenu } from '@/components/glyph/profile/GlyphAccountMenu'
import { isHttpsUrl } from '@/lib/utils'

export type StudioAffiliation = { slug: string; name: string; role: string }
export type SocialLink = { url: string; label: string; Icon: React.ComponentType<{ 'aria-hidden'?: boolean; strokeWidth?: number; className?: string }> }

/**
 * Who this person is, professionally — a byline-then-masthead composition, not the old
 * avatar-left / details-middle / actions-right row. The avatar rides with the handle as a small
 * byline; the name stands alone as the dominant line; actions and links share one bottom bar
 * instead of a separate "Links" block. Activity counters (followers, member-since) live in the
 * Ecosystem layer, not here — this block is identity and availability only.
 */
export function GlyphProfileHeader({
  name,
  username,
  avatarUrl,
  location,
  facts,
  bio,
  isOpenToCollab,
  isOwner,
  currentUserId,
  targetId,
  isFollowing,
  isBlocked,
  isMuted,
  studios,
  socials,
}: {
  name: string
  username: string
  avatarUrl: string | null
  location: string | null
  facts: string[]
  bio: string | null
  isOpenToCollab: boolean
  isOwner: boolean
  currentUserId: string | null
  targetId: string
  isFollowing: boolean
  isBlocked: boolean
  isMuted: boolean
  studios: StudioAffiliation[]
  socials: SocialLink[]
}) {
  return (
    <div>
      <div className="flex items-center gap-2.5">
        <GAvatar name={name} src={avatarUrl} size={32} className="ring-1 ring-hair" />
        <p className="text-body text-ink-3">
          @{username}
          {studios.map((s) => (
            <span key={s.slug}>
              {' · '}
              <Link href={`/studios/${s.slug}`} className="inline-flex items-center gap-1 font-medium text-ink-2 underline-offset-4 outline-none hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-ember">
                <Building2 aria-hidden strokeWidth={1.75} className="size-3.5" />{s.name}
              </Link>
              <span className="text-ink-3"> ({s.role})</span>
            </span>
          ))}
        </p>
      </div>

      <h1 className="mt-1 text-display font-semibold tracking-[-0.025em] text-ink [overflow-wrap:anywhere]">{name}</h1>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="inline-flex items-center gap-1.5 text-small font-medium">
          <span aria-hidden className={isOpenToCollab ? 'size-1.5 rounded-full bg-ember' : 'size-1.5 rounded-full bg-ink-3'} />
          <span className={isOpenToCollab ? 'text-ember-ink' : 'text-ink-3'}>{isOpenToCollab ? 'Open to collaborate' : 'Not looking for collaborators'}</span>
        </span>
        {(facts.length > 0 || location) && (
          <span className="text-small text-ink-2 [overflow-wrap:anywhere]">{[location, ...facts].filter(Boolean).join(' · ')}</span>
        )}
      </div>

      {bio && <p className="mt-4 max-w-prose text-h3 leading-relaxed text-ink-2 [overflow-wrap:anywhere]">{bio}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        {isOwner ? (
          <GButton asChild variant="outline" size="sm">
            <Link href="/settings/profile">Edit profile</Link>
          </GButton>
        ) : (
          currentUserId && (
            <div className="flex items-center gap-2">
              <GlyphFollowButton targetId={targetId} currentUserId={currentUserId} initialFollowing={isFollowing} />
              <GlyphAccountMenu targetId={targetId} targetUsername={username} isBlocked={isBlocked} isMuted={isMuted} />
            </div>
          )
        )}
        {socials.filter((s) => isHttpsUrl(s.url)).map(({ url, label, Icon }) => (
          <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-small font-medium text-ink-2 outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">
            <Icon aria-hidden strokeWidth={1.75} className="size-4" /> {label}<span className="sr-only"> (opens in a new tab)</span>
          </a>
        ))}
      </div>
    </div>
  )
}
