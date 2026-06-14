import Link from 'next/link'
import { Compass, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DevlogCard } from '@/components/devlog/DevlogCard'
import { Badge } from '@/components/ui/Badge'
import type { Profile, Project, DevlogPost } from '@/lib/supabase/types'

type FeaturedDev = Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'bio' | 'primary_role'>
type TrendingProject = Pick<Project, 'id' | 'title' | 'short_description' | 'slug' | 'stage' | 'tags'> & { username: string }
type RecentDevlog = Pick<DevlogPost, 'id' | 'slug' | 'title' | 'content' | 'published_at'> & { project_slug: string; username: string }

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

export default async function ExplorePage() {
  const supabase = await createClient()

  const [
    { data: featuredDevs },
    { data: recentProjects },
    { data: recentDevlogs },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, bio, primary_role')
      .eq('is_onboarded', true)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('projects')
      .select('id, title, short_description, slug, stage, tags, profiles!owner_id(username)')
      .eq('visibility', 'public')
      .not('slug', 'is', null)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('devlog_posts')
      .select('id, slug, title, content, published_at, projects!project_id(slug, profiles!owner_id(username))')
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(6),
  ])

  const devs = (featuredDevs ?? []) as FeaturedDev[]

  type RawProject = {
    id: string; title: string; short_description: string | null; slug: string | null; stage: string | null; tags: string[];
    profiles: { username: string }
  }
  const projects = ((recentProjects ?? []) as unknown as RawProject[]).map((p) => ({
    ...p,
    username: p.profiles.username,
  }))

  type RawDevlog = {
    id: string; slug: string; title: string; content: string; published_at: string;
    projects: { slug: string | null; profiles: { username: string } }
  }
  const devlogs = ((recentDevlogs ?? []) as unknown as RawDevlog[])
    .filter((d) => d.projects.slug)
    .map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      content: d.content,
      published_at: d.published_at,
      project_slug: d.projects.slug!,
      username: d.projects.profiles.username,
    }))

  return (
    <div className="min-h-screen relative overflow-hidden font-sans">
      <div className="fixed inset-0 z-0 bg-plasma pointer-events-none" />
      <div className="fixed inset-y-0 right-0 w-[120vw] md:w-[70vw] translate-x-[10%] md:translate-x-0 z-0 flex pointer-events-none opacity-40 mix-blend-overlay">
        <div className="h-full flex-1 relative border-l border-white/60 shadow-[-15px_0_30px_-10px_rgba(255,255,255,1)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0.4))', backdropFilter: 'blur(20px)' }} />
        <div className="h-full flex-1 relative border-l border-white/40 shadow-[-15px_0_30px_-10px_rgba(255,255,255,0.8)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0.1))', backdropFilter: 'blur(10px)' }} />
        <div className="h-full flex-1 relative border-l border-white/20 shadow-[-15px_0_30px_-10px_rgba(255,255,255,0.4)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,0))', backdropFilter: 'blur(4px)' }} />
      </div>

      <main className="relative z-10 w-full max-w-352 mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 min-h-screen flex flex-col">
        <div className="flex-1 bg-white/95 backdrop-blur-2xl rounded-[2.5rem] panel-shadow border border-white overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-5 sm:px-8 sm:py-6 md:px-10 border-b border-gray-100/50">
            <Link href="/" className="flex items-center gap-1 text-lg font-semibold tracking-tighter text-gray-900">
              Glyph<span className="text-indigo-600 leading-none">°</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/search" className="hidden sm:inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:border-indigo-200 hover:text-indigo-600 transition-all">
                Search developers, projects…
              </Link>
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-gray-400">
                <Compass className="h-3.5 w-3.5" /> Explore
              </div>
            </div>
          </div>

          <div className="flex-1 px-5 sm:px-8 md:px-10 py-8 md:py-10 space-y-12">
            {/* Featured developers */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-gray-400">Developers</h2>
                <Link href="/search?type=profiles" className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-indigo-600 hover:text-indigo-700 transition-colors">
                  See all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {devs.length === 0 ? (
                <p className="text-sm text-gray-400">No developers yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {devs.map((dev) => {
                    const devName = dev.display_name || dev.username
                    return (
                      <Link
                        key={dev.id}
                        href={`/dev/${dev.username}`}
                        className="flex flex-col items-center text-center rounded-3xl border border-gray-100 bg-white p-5 hover:border-indigo-200 hover:shadow-md transition-all duration-300"
                      >
                        {dev.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={dev.avatar_url} alt="" className="h-12 w-12 rounded-2xl object-cover mb-3" />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 font-mono text-lg font-semibold text-indigo-600 mb-3">
                            {initials(devName)}
                          </div>
                        )}
                        <p className="font-medium text-sm text-gray-900 truncate w-full">{devName}</p>
                        <p className="text-xs font-mono text-gray-400 truncate w-full">@{dev.username}</p>
                        {dev.bio && (
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{dev.bio}</p>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Trending projects */}
            {projects.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-gray-400">Recent Projects</h2>
                  <Link href="/search?type=projects" className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-indigo-600 hover:text-indigo-700 transition-colors">
                    See all <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/p/${project.username}/${project.slug}`}
                      className="group rounded-3xl border border-gray-100 bg-white p-5 hover:border-indigo-200 hover:shadow-md transition-all duration-300"
                    >
                      <h3 className="font-medium text-sm text-gray-900 group-hover:text-indigo-600 transition-colors mb-1">{project.title}</h3>
                      {project.short_description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{project.short_description}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {project.stage && <Badge variant="default">{project.stage}</Badge>}
                        {project.tags?.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="muted">{tag}</Badge>
                        ))}
                      </div>
                      <p className="mt-3 text-[11px] font-mono text-gray-400">by {project.username}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Recent devlogs */}
            {devlogs.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-gray-400">Recent Devlogs</h2>
                  <Link href="/search?type=devlogs" className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-indigo-600 hover:text-indigo-700 transition-colors">
                    See all <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {devlogs.map((devlog) => (
                    <DevlogCard
                      key={devlog.id}
                      post={devlog}
                      href={`/p/${devlog.username}/${devlog.project_slug}/${devlog.slug}`}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
