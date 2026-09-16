import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { MarkdownRenderer } from '@/components/devlog/MarkdownRenderer'
import { ReactionsBar } from '@/components/devlog/ReactionsBar'
import { CommentThread } from '@/components/devlog/CommentThread'
import { REACTION_TYPES } from '@/lib/supabase/types'
import type { Profile, Project, DevlogPost, Comment } from '@/lib/supabase/types'
import type { CommentData } from '@/components/devlog/CommentThread'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function initials(name: string) {
  return name.slice(0, 1).toUpperCase()
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
    .select('id, title, slug, visibility')
    .eq('owner_id', profile.id)
    .eq('slug', projectSlug)
    .maybeSingle<Pick<Project, 'id' | 'title' | 'slug' | 'visibility'>>()

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
    { data: rawComments },
    { data: currentProfile },
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
  ])

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
    <div className="min-h-screen relative overflow-hidden font-sans">
      <div className="fixed inset-0 z-0 bg-plasma pointer-events-none" />
      <div className="fixed inset-y-0 right-0 w-[120vw] md:w-[70vw] translate-x-[10%] md:translate-x-0 z-0 flex pointer-events-none opacity-40 mix-blend-overlay">
        <div className="h-full flex-1 relative border-l border-white/60 shadow-[-15px_0_30px_-10px_rgba(255,255,255,1)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0.4))', backdropFilter: 'blur(20px)' }} />
        <div className="h-full flex-1 relative border-l border-white/40 shadow-[-15px_0_30px_-10px_rgba(255,255,255,0.8)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0.1))', backdropFilter: 'blur(10px)' }} />
        <div className="h-full flex-1 relative border-l border-white/20 shadow-[-15px_0_30px_-10px_rgba(255,255,255,0.4)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,0))', backdropFilter: 'blur(4px)' }} />
      </div>

      <main className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 min-h-screen flex flex-col">
        <div className="flex-1 bg-white/95 backdrop-blur-2xl rounded-[2.5rem] panel-shadow border border-white overflow-hidden flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-5 sm:px-8 sm:py-6 md:px-10 border-b border-gray-100/50">
            <Link href="/" className="flex items-center gap-1 text-lg font-semibold tracking-tighter text-gray-900">
              Glyph<span className="text-indigo-600 leading-none">°</span>
            </Link>
            <Link
              href={`/p/${username}/${projectSlug}`}
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> {project.title}
            </Link>
          </div>

          <article className="px-5 sm:px-8 md:px-12 py-8 sm:py-10 md:py-12">
            {isDraft && (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-mono text-amber-700">
                Draft — only you can see this post.
              </div>
            )}

            {/* Post header */}
            <header className="mb-8 pb-8 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Link
                  href={`/dev/${username}`}
                  className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-mono font-semibold text-indigo-600">
                      {initials(ownerName)}
                    </span>
                  )}
                  {ownerName}
                </Link>
                <span className="text-gray-300">·</span>
                <Link href={`/p/${username}/${projectSlug}`} className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors">
                  {project.title}
                </Link>
              </div>

              <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-gray-900 mb-4 leading-tight">
                {post.title}
              </h1>

              {post.published_at && (
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-gray-400">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(post.published_at)}
                </div>
              )}
            </header>

            {/* Content */}
            <MarkdownRenderer content={post.content} />

            {/* Reactions */}
            <div className="mt-10 pt-8 border-t border-gray-100 space-y-2">
              <p className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-3">React</p>
              <ReactionsBar
                devlogPostId={post.id}
                devlogAuthorId={profile.id}
                currentUserId={currentUserId}
                initialCounts={reactionCounts}
              />
            </div>

            {/* Comments */}
            <div className="mt-10 pt-8 border-t border-gray-100">
              <CommentThread
                devlogPostId={post.id}
                devlogAuthorId={profile.id}
                currentUserId={currentUserId}
                comments={topLevel}
              />
            </div>

            {/* Footer */}
            <footer className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <Link
                href={`/p/${username}/${projectSlug}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> More devlogs from {project.title}
              </Link>
              <Link
                href={`/dev/${username}`}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                {ownerName}&apos;s profile →
              </Link>
            </footer>
          </article>
        </div>
      </main>
    </div>
  )
}
