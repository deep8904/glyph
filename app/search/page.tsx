import Link from 'next/link'
import { Suspense } from 'react'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { DevlogCard } from '@/components/devlog/DevlogCard'
import type { Profile, Project, DevlogPost } from '@/lib/supabase/types'

type SearchType = 'all' | 'profiles' | 'projects' | 'devlogs'

function sanitizeQuery(raw: string): string {
  return raw
    .replace(/[&|!:()'"`\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200)
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

async function SearchResults({ q, type }: { q: string; type: SearchType }) {
  const supabase = await createClient()
  const sanitized = sanitizeQuery(q)
  if (!sanitized) return null

  const tsQuery = sanitized.split(' ').filter(Boolean).join(' & ')

  const [
    profilesRes,
    projectsRes,
    devlogsRes,
  ] = await Promise.all([
    (type === 'all' || type === 'profiles')
      ? supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, bio, primary_role')
          .eq('is_onboarded', true)
          .textSearch('fts', tsQuery, { type: 'websearch', config: 'english' })
          .limit(20)
      : Promise.resolve({ data: [] }),
    (type === 'all' || type === 'projects')
      ? supabase
          .from('projects')
          .select('id, title, short_description, slug, stage, tags, visibility, profiles!owner_id(username)')
          .eq('visibility', 'public')
          .not('slug', 'is', null)
          .textSearch('fts', tsQuery, { type: 'websearch', config: 'english' })
          .limit(20)
      : Promise.resolve({ data: [] }),
    (type === 'all' || type === 'devlogs')
      ? supabase
          .from('devlog_posts')
          .select('id, slug, title, content, published_at, projects!project_id(slug, visibility, profiles!owner_id(username))')
          .not('published_at', 'is', null)
          .lte('published_at', new Date().toISOString())
          .textSearch('fts', tsQuery, { type: 'websearch', config: 'english' })
          .limit(20)
      : Promise.resolve({ data: [] }),
  ])

  type RawProfile = Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'bio' | 'primary_role'>
  type RawProject = Pick<Project, 'id' | 'title' | 'short_description' | 'slug' | 'stage' | 'tags'> & { profiles: { username: string } }
  type RawDevlog = Pick<DevlogPost, 'id' | 'slug' | 'title' | 'content' | 'published_at'> & { projects: { slug: string | null; visibility: string; profiles: { username: string } } }

  const profiles = (profilesRes.data ?? []) as RawProfile[]
  const projects = (projectsRes.data ?? []) as unknown as RawProject[]
  const devlogsRaw = (devlogsRes.data ?? []) as unknown as RawDevlog[]
  const devlogs = devlogsRaw.filter((d) => d.projects.slug && d.projects.visibility === 'public')

  const total = profiles.length + projects.length + devlogs.length

  if (total === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-gray-400">No results for <span className="font-mono text-gray-600">&ldquo;{q}&rdquo;</span>.</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {profiles.length > 0 && (
        <section>
          <h2 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-4">
            Developers ({profiles.length})
          </h2>
          <div className="space-y-2">
            {profiles.map((dev) => {
              const devName = dev.display_name || dev.username
              return (
                <Link
                  key={dev.id}
                  href={`/dev/${dev.username}`}
                  className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 hover:border-indigo-200 hover:shadow-sm transition-all duration-200"
                >
                  {dev.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={dev.avatar_url} alt="" className="h-10 w-10 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 font-mono text-sm font-semibold text-indigo-600">
                      {initials(devName)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-gray-900 truncate">{devName}</p>
                    <p className="text-xs font-mono text-gray-400">@{dev.username}</p>
                    {dev.bio && <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{dev.bio}</p>}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section>
          <h2 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-4">
            Projects ({projects.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/p/${project.profiles.username}/${project.slug}`}
                className="group rounded-3xl border border-gray-100 bg-white p-5 hover:border-indigo-200 hover:shadow-md transition-all duration-300"
              >
                <h3 className="font-medium text-sm text-gray-900 group-hover:text-indigo-600 transition-colors mb-1">{project.title}</h3>
                {project.short_description && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{project.short_description}</p>}
                <div className="flex flex-wrap gap-1.5">
                  {project.stage && <Badge variant="default">{project.stage}</Badge>}
                  {project.tags?.slice(0, 3).map((tag) => <Badge key={tag} variant="muted">{tag}</Badge>)}
                </div>
                <p className="mt-2 text-[11px] font-mono text-gray-400">by {project.profiles.username}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {devlogs.length > 0 && (
        <section>
          <h2 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-4">
            Devlogs ({devlogs.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {devlogs.map((devlog) => (
              <DevlogCard
                key={devlog.id}
                post={{ ...devlog, published_at: devlog.published_at }}
                href={`/p/${devlog.projects.profiles.username}/${devlog.projects.slug}/${devlog.slug}`}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>
}) {
  const { q = '', type = 'all' } = await searchParams
  const activeType = (['all', 'profiles', 'projects', 'devlogs'].includes(type) ? type : 'all') as SearchType

  const tabs: { value: SearchType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'profiles', label: 'Developers' },
    { value: 'projects', label: 'Projects' },
    { value: 'devlogs', label: 'Devlogs' },
  ]

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
          <div className="flex items-center justify-between px-5 py-5 sm:px-8 sm:py-6 md:px-10 border-b border-gray-100/50">
            <Link href="/" className="flex items-center gap-1 text-lg font-semibold tracking-tighter text-gray-900">
              Glyph<span className="text-indigo-600 leading-none">°</span>
            </Link>
            <Link href="/explore" className="text-xs font-mono uppercase tracking-wider text-gray-400 hover:text-gray-700 transition-colors">
              Explore →
            </Link>
          </div>

          <div className="flex-1 px-5 sm:px-8 md:px-10 py-8 space-y-6">
            {/* Search input */}
            <form method="GET" action="/search" className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search developers, projects, devlogs…"
                className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                maxLength={200}
                autoFocus
              />
              {type !== 'all' && <input type="hidden" name="type" value={type} />}
            </form>

            {/* Type filter tabs */}
            <div className="flex gap-2 flex-wrap">
              {tabs.map((tab) => (
                <Link
                  key={tab.value}
                  href={`/search?q=${encodeURIComponent(q)}&type=${tab.value}`}
                  className={`rounded-full px-4 py-2 text-[11px] font-mono uppercase tracking-wider transition-all duration-200 ${
                    activeType === tab.value
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'border border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:text-indigo-600'
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>

            {/* Results */}
            {q ? (
              <Suspense fallback={<div className="py-8 text-center text-sm text-gray-400">Searching…</div>}>
                <SearchResults q={q} type={activeType} />
              </Suspense>
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-400">Start typing to search across all content on Glyph.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
