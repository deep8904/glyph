import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { MarkdownRenderer } from '@/components/devlog/MarkdownRenderer'
import { ReactionsBar } from '@/components/devlog/ReactionsBar'
import { CommentThread } from '@/components/devlog/CommentThread'
import { ProjectIdentityMarker } from '@/components/project/ProjectIdentityMarker'
import { REACTION_TYPES } from '@/lib/supabase/types'
import type { Profile, Project, DevlogPost } from '@/lib/supabase/types'
import type { CommentData } from '@/components/devlog/CommentThread'
import { Shell } from '@/components/shell/Shell'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function DevlogPostPage({
  params,
}: {
  params: Promise<{ username: string; 'project-slug': string; 'devlog-slug': string }>
}) {
  const { username, 'project-slug': projectSlug, 'devlog-slug': devlogSlug } = await params
  const supabase = await createClient()

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .eq('username', username)
    .maybeSingle<Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>>()

  if (!profile) notFound()

  const { data: project } = await supabase
    .from('projects')
    .select('id, title, slug, visibility, stage, cover_url, cover_image_url')
    .eq('owner_id', profile.id)
    .eq('slug', projectSlug)
    .maybeSingle<Pick<Project, 'id' | 'title' | 'slug' | 'visibility' | 'stage' | 'cover_url' | 'cover_image_url'>>()

  if (!project) notFound()

  const isOwner = currentUser?.id === profile.id
  if (project.visibility === 'private' && !isOwner) notFound()

  const { data: post } = await supabase
    .from('devlog_posts')
    .select('*')
    .eq('project_id', project.id)
    .eq('slug', devlogSlug)
    .maybeSingle<DevlogPost>()

  if (!post) notFound()

  const isDraft = !post.published_at || new Date(post.published_at) > new Date()
  if (isDraft && !isOwner) notFound()

  // Fetch reactions, comments, and current user's profile in parallel
  const [
    { data: allReactions },
    { data: rawComments, error: commentsError },
    { data: currentProfile },
    { data: siblings },
  ] = await Promise.all([
    supabase
      .from('reactions')
      .select('id, user_id, reaction_type')
      .eq('devlog_post_id', post.id),
    supabase
      .from('comments')
      .select('id, author_id, parent_comment_id, content, created_at, profiles!author_id(id, username, display_name, avatar_url)')
      .eq('devlog_post_id', post.id)
      .order('created_at', { ascending: true }),
    currentUser
      ? supabase.from('profiles').select('id').eq('id', currentUser.id).maybeSingle()
      : Promise.resolve({ data: null }),
    // Published siblings in publish order, for previous/next. Drafts never
    // appear here, so neither visitors nor the owner can step into a draft.
    supabase
      .from('devlog_posts')
      .select('slug, title, published_at')
      .eq('project_id', project.id)
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: true })
      .limit(200),
  ])

  const timeline = siblings ?? []
  const idx = isDraft ? -1 : timeline.findIndex((d) => d.slug === post.slug)
  const prevPost = idx > 0 ? timeline[idx - 1] : null
  const nextPost = idx >= 0 && idx < timeline.length - 1 ? timeline[idx + 1] : null
  const editHref = `/dashboard/projects/${project.id}/devlogs/${post.id}/edit`

  // Build reaction counts
  const reactionCounts = REACTION_TYPES.map(({ type }) => ({
    type,
    count: (allReactions ?? []).filter((r) => r.reaction_type === type).length,
    reacted: currentUser
      ? (allReactions ?? []).some((r) => r.reaction_type === type && r.user_id === currentUser.id)
      : false,
  }))

  // Build comment tree (one level deep)
  type RawComment = {
    id: string
    author_id: string
    parent_comment_id: string | null
    content: string
    created_at: string
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
      replies: rawList
        .filter((r) => r.parent_comment_id === c.id)
        .map((r) => ({
          id: r.id,
          author_id: r.author_id,
          parent_comment_id: r.parent_comment_id,
          content: r.content,
          created_at: r.created_at,
          author: r.profiles,
        })),
    }))

  const ownerName = profile.display_name || profile.username
  const currentUserId = currentProfile ? currentUser?.id ?? null : null

  return (
    <Shell breadcrumb={[{ label: ownerName, href: `/dev/${username}` }, { label: project.title, href: `/p/${username}/${projectSlug}` }, { label: post.title }]}>
      <article className="mx-auto w-full max-w-2xl">
        {isDraft && (
          <div role="note" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-media border border-warning-line bg-warning-subtle px-4 py-3 text-small text-warning">
            <span className="font-medium">Draft — only you can see this post.</span>
            <Button asChild variant="secondary" size="sm"><Link href={editHref}>Continue editing</Link></Button>
          </div>
        )}

        {/* Record header: project identity, title, author, date */}
        <header className="mb-8">
          <div className="mb-4">
            <ProjectIdentityMarker project={{ title: project.title, slug: project.slug, stage: project.stage, cover_url: project.cover_url, cover_image_url: project.cover_image_url, username }} />
          </div>
          <h1 className="text-display font-semibold text-fg [overflow-wrap:anywhere]">{post.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-fg-secondary">
            <Link href={`/dev/${username}`} className="inline-flex min-h-11 items-center gap-2 font-medium text-fg hover:text-link">
              <Avatar name={ownerName} src={profile.avatar_url} size="sm" />
              {ownerName}
            </Link>
            {post.published_at && <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>}
            {isOwner && !isDraft && (
              <Button asChild variant="ghost" size="sm"><Link href={editHref}><Pencil aria-hidden strokeWidth={1.75} className="size-3.5" /> Edit devlog</Link></Button>
            )}
          </div>
        </header>

        {/* Body */}
        <MarkdownRenderer content={post.content} />

        {/* Earlier / later in this project's record */}
        {(prevPost || nextPost) && (
          <nav aria-label="Devlog navigation" className="mt-12 grid gap-6 border-t border-line pt-6 sm:grid-cols-2">
            {prevPost ? (
              <Link href={`/p/${username}/${projectSlug}/${prevPost.slug}`} className="group block min-h-11">
                <span className="flex items-center gap-1 text-small text-fg-muted"><ArrowLeft aria-hidden strokeWidth={1.75} className="size-3.5" /> Earlier</span>
                <span className="mt-1 line-clamp-2 block text-body font-medium text-fg group-hover:text-link">{prevPost.title}</span>
              </Link>
            ) : <span className="hidden sm:block" />}
            {nextPost && (
              <Link href={`/p/${username}/${projectSlug}/${nextPost.slug}`} className="group block min-h-11 sm:text-right">
                <span className="flex items-center gap-1 text-small text-fg-muted sm:justify-end">Later <ArrowRight aria-hidden strokeWidth={1.75} className="size-3.5" /></span>
                <span className="mt-1 line-clamp-2 block text-body font-medium text-fg group-hover:text-link">{nextPost.title}</span>
              </Link>
            )}
          </nav>
        )}

        {/* Reactions */}
        <section aria-labelledby="reactions-heading" className="mt-10 border-t border-line pt-6">
          <h2 id="reactions-heading" className="mb-3 text-h3 font-semibold text-fg">Reactions</h2>
          <ReactionsBar devlogPostId={post.id} devlogAuthorId={profile.id} currentUserId={currentUserId} initialCounts={reactionCounts} />
        </section>

        {/* Feedback */}
        <section id="comments" aria-labelledby="comments-heading" className="mt-10 scroll-mt-20 border-t border-line pt-6">
          <SectionHeader id="comments-heading" title="Feedback" count={rawList.length > 0 ? rawList.length : undefined} className="mb-4" />
          <CommentThread devlogPostId={post.id} devlogAuthorId={profile.id} currentUserId={currentUserId} comments={topLevel} loadFailed={!!commentsError} />
        </section>

        {/* Related context */}
        <footer className="mt-12 flex flex-col gap-1 border-t border-line pt-6 text-small text-fg-secondary sm:flex-row sm:items-center sm:justify-between">
          <Link href={`/p/${username}/${projectSlug}`} className="inline-flex min-h-11 items-center font-medium text-link underline-offset-2 hover:underline">More from {project.title}</Link>
          <Link href={`/dev/${username}`} className="inline-flex min-h-11 items-center hover:text-fg hover:underline underline-offset-2">{ownerName}&apos;s profile</Link>
        </footer>
      </article>
    </Shell>
  )
}
