import Link from 'next/link'
import { GlyphOtherProjectRow, type OtherProjectData } from '@/components/glyph/profile/GlyphOtherProjectRow'
import { GlyphCollaborationCard } from '@/components/glyph/profile/GlyphCollaborationCard'

type CollabPost = { id: string; post_type: string; role_needed: string | null; role_offered: string | null; contract_type: string }

/**
 * Whether the Ecosystem region has anything to show. The page decides layout (whether to reserve
 * the sidebar column and render the "Ecosystem" heading at all) from this — the panel itself never
 * silently returns null, or the page would be left with an empty landmark and a wasted column.
 */
export function hasEcosystemContent({
  otherProjects,
  collabPosts,
  followerCount,
  followingCount,
  isOwner,
}: {
  otherProjects: unknown[]
  collabPosts: unknown[]
  followerCount: number
  followingCount: number
  isOwner: boolean
}): boolean {
  return isOwner || otherProjects.length > 0 || collabPosts.length > 0 || followerCount > 0 || followingCount > 0
}

/**
 * Everything about this developer besides the work itself: other projects, open collaboration,
 * network standing. A tile cluster grouped by purpose, not a fourth and fifth stacked hairline
 * section — each concern gets its own small card instead of a shared divided list. Callers must
 * check `hasEcosystemContent` before rendering this (including its heading) at all.
 */
export function GlyphEcosystemPanel({
  otherProjects,
  username,
  isOwner,
  isOpenToCollab,
  collabPosts,
  name,
  followerCount,
  followingCount,
  memberSince,
}: {
  otherProjects: OtherProjectData[]
  username: string
  isOwner: boolean
  isOpenToCollab: boolean
  collabPosts: CollabPost[]
  name: string
  followerCount: number
  followingCount: number
  memberSince: string
}) {
  const hasOtherProjects = otherProjects.length > 0
  const hasCollab = collabPosts.length > 0

  return (
    <div className="space-y-4">
      <div className="rounded-[16px] border border-hair bg-panel/60 p-4">
        <h3 className="text-small font-semibold text-ink-3">Network</h3>
        <div className="mt-2 flex flex-wrap gap-x-1 text-small">
          {(followerCount > 0 || isOwner) && (
            <Link href={`/dev/${username}/followers`} className="inline-flex min-h-11 items-center gap-1.5 rounded-[8px] px-1 outline-none hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">
              <span className="font-mono font-medium tabular-nums text-ink">{followerCount}</span>
              <span className="text-ink-3">followers</span>
            </Link>
          )}
          {(followingCount > 0 || isOwner) && (
            <Link href={`/dev/${username}/following`} className="inline-flex min-h-11 items-center gap-1.5 rounded-[8px] px-1 outline-none hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">
              <span className="font-mono font-medium tabular-nums text-ink">{followingCount}</span>
              <span className="text-ink-3">following</span>
            </Link>
          )}
        </div>
        <p className="mt-2 text-small text-ink-3">On Glyph since {memberSince}</p>
      </div>

      {hasCollab && (
        <div className="rounded-[16px] border border-hair bg-panel/60 p-4">
          <h3 className="text-small font-semibold text-ink-3">Collaboration</h3>
          <div className="mt-2">
            <GlyphCollaborationCard isOpenToCollab={isOpenToCollab} posts={collabPosts} name={name} />
          </div>
        </div>
      )}

      {hasOtherProjects && (
        <div className="rounded-[16px] border border-hair bg-panel/40 p-4">
          <h3 className="text-small font-semibold text-ink-3">Other projects</h3>
          <div className="mt-3 space-y-3">
            {otherProjects.map((p) => (
              <GlyphOtherProjectRow key={p.id} project={p} username={username} isOwner={isOwner} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
