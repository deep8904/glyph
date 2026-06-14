import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Tag, Globe, GitBranch, Joystick } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { DevlogCard } from '@/components/devlog/DevlogCard'
import { MarkdownRenderer } from '@/components/devlog/MarkdownRenderer'
import { labelFor, ENGINES, PROJECT_STAGES } from '@/lib/supabase/types'
import type { Profile, Project, DevlogPost } from '@/lib/supabase/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default async function PublicProjectPage({
  params,
}: {
  params: Promise<{ username: string; 'project-slug': string }>
}) {
  const { username, 'project-slug': projectSlug } = await params
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
    .select('*')
    .eq('owner_id', profile.id)
    .eq('slug', projectSlug)
    .maybeSingle<Project>()

  if (!project) notFound()

  const isOwner = currentUser?.id === profile.id

  if (project.visibility === 'private' && !isOwner) notFound()

  const { data: devlogs } = await supabase
    .from('devlog_posts')
    .select('id, slug, title, content, published_at')
    .eq('project_id', project.id)
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(50)

  const typedDevlogs = (devlogs ?? []) as Pick<DevlogPost, 'id' | 'slug' | 'title' | 'content' | 'published_at'>[]

  const engine = labelFor(ENGINES, project.engine)
  const stage = labelFor(PROJECT_STAGES, project.stage)
  const ownerName = profile.display_name || profile.username

  const externalLinks = project.external_links as Record<string, string> | null ?? {}

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
              href={`/dev/${username}`}
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> {ownerName}
            </Link>
          </div>

          <div className="px-5 sm:px-8 md:px-12 py-8 sm:py-10 md:py-12 space-y-10">
            {/* Project header */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {stage && <Badge variant="default">{stage}</Badge>}
                {project.visibility === 'unlisted' && (
                  <Badge variant="muted">Unlisted</Badge>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-gray-900 mb-3">
                {project.title}
              </h1>
              {project.short_description && (
                <p className="text-base text-gray-500 leading-relaxed">{project.short_description}</p>
              )}
            </div>

            {/* Meta badges */}
            {(engine || project.genre || (project.tags && project.tags.length > 0)) && (
              <div className="flex flex-wrap gap-2">
                {engine && <Badge variant="muted">{engine}</Badge>}
                {project.genre && <Badge variant="muted">{project.genre}</Badge>}
                {(project.tags as string[])?.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[11px] font-mono text-gray-500"
                  >
                    <Tag className="h-3 w-3" />{tag}
                  </span>
                ))}
              </div>
            )}

            {/* External links */}
            {Object.keys(externalLinks).length > 0 && (
              <div className="flex flex-wrap gap-3">
                {Object.entries(externalLinks).map(([platform, url]) => {
                  const Icon = platform.toLowerCase().includes('github') ? GitBranch
                    : platform.toLowerCase().includes('itch') ? Joystick
                    : Globe
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:border-indigo-200 hover:text-indigo-600 transition-all duration-300"
                    >
                      <Icon className="h-4 w-4" /> {platform}
                    </a>
                  )
                })}
              </div>
            )}

            {/* Long description */}
            {project.long_description && (
              <div>
                <h2 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-4">
                  About
                </h2>
                <MarkdownRenderer content={project.long_description} />
              </div>
            )}

            {/* Devlog feed */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  Devlogs {typedDevlogs.length > 0 ? `(${typedDevlogs.length})` : ''}
                </h2>
                {isOwner && (
                  <Link
                    href={`/dashboard/projects/${project.id}/devlogs/new`}
                    className="text-[11px] font-mono uppercase tracking-wider text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    + Write
                  </Link>
                )}
              </div>

              {typedDevlogs.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {typedDevlogs.map((post) => (
                    <DevlogCard
                      key={post.id}
                      post={post}
                      href={`/p/${username}/${projectSlug}/${post.slug}`}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/40 p-8 text-center">
                  <p className="text-sm text-gray-400">No devlogs published yet.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <p className="pt-4 border-t border-gray-100 font-mono text-[11px] uppercase tracking-widest text-gray-400">
              Started {formatDate(project.created_at)} · by{' '}
              <Link href={`/dev/${username}`} className="hover:text-indigo-600 transition-colors">
                {ownerName}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
