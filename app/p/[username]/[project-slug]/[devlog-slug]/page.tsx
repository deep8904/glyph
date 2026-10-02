import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GlyphShell } from '@/components/glyph/shell/GlyphShell'
import { GlyphRichText } from '@/components/glyph/project/GlyphRichText'
import { GlyphDevlogHeader, type DevlogProject } from '@/components/glyph/devlog/GlyphDevlogHeader'
import { GlyphDraftNotice } from '@/components/glyph/devlog/GlyphDraftNotice'
import { GlyphDevlogNav } from '@/components/glyph/devlog/GlyphDevlogNav'
import { GlyphReactionsBar } from '@/components/glyph/devlog/GlyphReactionsBar'
import { GlyphCommentThread, type CommentData } from '@/components/glyph/devlog/GlyphCommentThread'
import { toPlainText } from '@/lib/glyph/text'
import { isUnpublished, findSiblings } from '@/lib/glyph/devlogNav'
import { gatedInteractionUserId } from '@/lib/glyph/devlogAuth'
import { REACTION_TYPES } from '@/lib/supabase/types'
import type { Profile, Project, DevlogPost } from '@/lib/supabase/types'

type RouteParams = { username: string; 'project-slug': string; 'devlog-slug': string }

type ProjectCols = Pick<Project, 'id' | 'title' | 'slug' | 'visibility' | 'lifecycle' | 'stage' | 'cover_url' | 'cover_image_url'>

/**
 * Shared identity + visibility lookup for this route, memoized per request so `generateMetadata`
 * and the page component read profile/project/post once — same pattern as the Project and Profile
 * routes. Owner-only gates (draft project, draft/scheduled post) are resolved here so both callers
 * agree on what "inaccessible" means.
 */
const loadDevlogIdentity = cache(async (username: string, projectSlug: string, devlogSlug: string) => {
  const supabase = await createClient()
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .eq('username', username)
    .maybeSingle<Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>>()

  if (!profile) return { profile: null, project: null, post: null, isOwner: false, isDraft: false, currentUserId: currentUser?.id ?? null }

  const { data: project } = await supabase
    .from('projects')
    .select('id, title, slug, visibility, lifecycle, stage, cover_url, cover_image_url')
    .eq('owner_id', profile.id)
    .eq('slug', projectSlug)
    .maybeSingle<ProjectCols>()

  const isOwner = currentUser?.id === profile.id

  if (!project || ((project.lifecycle === 'draft' || project.visibility === 'private') && !isOwner)) {
    return { profile, project: null, post: null, isOwner, isDraft: false, currentUserId: currentUser?.id ?? null }
  }

  const { data: post } = await supabase
    .from('devlog_posts')
    .select('*')
    .eq('project_id', project.id)
    .eq('slug', devlogSlug)
    .maybeSingle<DevlogPost>()

  const isDraft = !post || isUnpublished(post.published_at)
  if (!post || (isDraft && !isOwner)) {
    return { profile, project, post: null, isOwner, isDraft: false, currentUserId: currentUser?.id ?? null }
  }

  return { profile, project, post, isOwner, isDraft, currentUserId: currentUser?.id ?? null }
})

const SAFE_METADATA: Metadata = { title: 'Glyph', description: "The professional home for a game while it's being built." }

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { username, 'project-slug': projectSlug, 'devlog-slug': devlogSlug } = await params
  const { post } = await loadDevlogIdentity(username, projectSlug, devlogSlug)
  if (!post) return SAFE_METADATA
  return {
    title: `${post.title} — Glyph`,
    description: toPlainText(post.content, 160) || SAFE_METADATA.description,
  }
}

export default async function DevlogPostPage({ params }: { params: Promise<RouteParams> }) {
  const { username, 'project-slug': projectSlug, 'devlog-slug': devlogSlug } = await params
  const { profile, project, post, isOwner, isDraft, currentUserId } = await loadDevlogIdentity(username, projectSlug, devlogSlug)

  if (!profile || !project || !post) notFound()

  const supabase = await createClient()

  const [{ data: allReactions }, { data: rawComments, error: commentsError }, { data: siblings }, { data: currentProfile }] = await Promise.all([
    supabase.from('reactions').select('id, user_id, reaction_type').eq('devlog_post_id', post.id),
    supabase
      .from('comments')
      .select('id, author_id, parent_comment_id, content, created_at, profiles!author_id(id, username, display_name, avatar_url)')
      .eq('devlog_post_id', post.id)
      .order('created_at', { ascending: true }),
    // Published siblings in publish order, for previous/next. Drafts never appear here, so neither
    // visitors nor the owner can step into a draft from this nav.
    supabase
      .from('devlog_posts')
      .select('slug, title, published_at')
      .eq('project_id', project.id)
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: true })
      .limit(200),
    // Confirms the signed-in Auth user actually has a `profiles` row before handing out mutation
    // controls — reactions/comments carry a foreign key to `profiles`, not to `auth.users`, so an
    // account mid-onboarding must see the same read-only surface as a signed-out visitor.
    currentUserId ? supabase.from('profiles').select('id').eq('id', currentUserId).maybeSingle() : Promise.resolve({ data: null }),
  ])

  const interactionUserId = gatedInteractionUserId(currentUserId, !!currentProfile)

  // A draft never appears in the published-only timeline, so findSiblings naturally returns no
  // navigation for it — no separate isDraft branch needed here.
  const { prev: prevPost, next: nextPost } = findSiblings(post.slug, siblings ?? [])
  const editHref = `/dashboard/projects/${project.id}/devlogs/${post.id}/edit`

  const reactionCounts = REACTION_TYPES.map(({ type }) => ({
    type,
    count: (allReactions ?? []).filter((r) => r.reaction_type === type).length,
    reacted: currentUserId ? (allReactions ?? []).some((r) => r.reaction_type === type && r.user_id === currentUserId) : false,
  }))

  type RawComment = {
    id: string; author_id: string; parent_comment_id: string | null; content: string; created_at: string
    profiles: { id: string; username: string; display_name: string | null; avatar_url: string | null }
  }
  const rawList = (rawComments ?? []) as unknown as RawComment[]
  const topLevel: CommentData[] = rawList
    .filter((c) => !c.parent_comment_id)
    .map((c) => ({
      id: c.id,
      author_id: c.author_id,
      parent_comment_id: null,
      content: c.content,
      created_at: c.created_at,
      author: c.profiles,
      replies: rawList.filter((r) => r.parent_comment_id === c.id).map((r) => ({
        id: r.id, author_id: r.author_id, parent_comment_id: r.parent_comment_id, content: r.content, created_at: r.created_at, author: r.profiles,
      })),
    }))

  const ownerName = profile.display_name || profile.username

  return (
    <GlyphShell>
      <article className="mx-auto w-full max-w-[680px]">
        {isDraft && <GlyphDraftNotice publishedAt={post.published_at} editHref={editHref} />}

        <GlyphDevlogHeader
          project={project as DevlogProject}
          username={username}
          title={post.title}
          publishedAt={post.published_at}
          authorName={ownerName}
          authorUsername={profile.username}
          authorAvatarUrl={profile.avatar_url}
          isOwner={isOwner}
          editHref={editHref}
        />

        <div className="mt-8 border-t border-hair pt-8">
          <GlyphRichText content={post.content} />
        </div>

        <GlyphDevlogNav prev={prevPost} next={nextPost} username={username} projectSlug={projectSlug} />

        <section aria-labelledby="reactions-heading" className="mt-10 border-t border-hair pt-6">
          <h2 id="reactions-heading" className="mb-3 text-h3 font-semibold text-ink">Reactions</h2>
          <GlyphReactionsBar devlogPostId={post.id} devlogAuthorId={profile.id} currentUserId={interactionUserId} initialCounts={reactionCounts} />
        </section>

        <section id="comments" aria-labelledby="comments-heading" className="mt-10 scroll-mt-20 border-t border-hair pt-6">
          <h2 id="comments-heading" className="mb-4 text-h3 font-semibold text-ink">
            Feedback{rawList.length > 0 && <span className="ml-1.5 font-mono text-small font-normal text-ink-3">{rawList.length}</span>}
          </h2>
          <GlyphCommentThread devlogPostId={post.id} devlogAuthorId={profile.id} currentUserId={interactionUserId} comments={topLevel} loadFailed={!!commentsError} />
        </section>

        <footer className="mt-12 flex flex-col gap-2 border-t border-hair pt-6 text-small text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href={`/p/${username}/${projectSlug}`} className="inline-flex min-h-11 items-center font-medium text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">More from {project.title}</Link>
          <Link href={`/dev/${username}`} className="inline-flex min-h-11 items-center outline-none hover:text-ink-2 hover:underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">{ownerName}&apos;s profile</Link>
        </footer>
      </article>
    </GlyphShell>
  )
}
