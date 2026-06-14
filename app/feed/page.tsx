import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Rss, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/supabase/types'

type FeedItem = {
  id: string
  devlog_slug: string
  devlog_title: string
  content: string
  published_at: string
  project_title: string
  project_slug: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

type SuggestedDev = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  primary_role: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function excerpt(content: string, max = 200) {
  const plain = content.replace(/[#*`>_~\[\]!|]/g, '').replace(/\s+/g, ' ').trim()
  return plain.length > max ? plain.slice(0, max).replace(/\s\S*$/, '') + '…' : plain
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

export default async function FeedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, is_onboarded')
    .eq('id', user.id)
    .maybeSingle<Pick<Profile, 'id' | 'is_onboarded'>>()

  if (!profile?.is_onboarded) redirect('/onboarding')

  // Fetch feed items for this user
  const { data: feedData } = await supabase
    .from('feed_items')
    .select('id, devlog_slug, devlog_title, content, published_at, project_title, project_slug, username, display_name, avatar_url')
    .eq('follower_id', user.id)
    .order('published_at', { ascending: false })
    .limit(50)

  const feedItems = (feedData ?? []) as FeedItem[]

  // If feed is empty, show suggested developers (most recently joined, not already followed)
  let suggested: SuggestedDev[] = []
  if (feedItems.length === 0) {
    const { data: suggestedData } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, bio, primary_role')
      .eq('is_onboarded', true)
      .neq('id', user.id)
      .order('created_at', { ascending: false })
      .limit(12)

    suggested = (suggestedData ?? []) as SuggestedDev[]
  }

  return (
    <div className="min-h-screen relative overflow-hidden font-sans">
      <div className="fixed inset-0 z-0 bg-plasma pointer-events-none" />
      <div className="fixed inset-y-0 right-0 w-[120vw] md:w-[70vw] translate-x-[10%] md:translate-x-0 z-0 flex pointer-events-none opacity-40 mix-blend-overlay">
        <div className="h-full flex-1 relative border-l border-white/60 shadow-[-15px_0_30px_-10px_rgba(255,255,255,1)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0.4))', backdropFilter: 'blur(20px)' }} />
        <div className="h-full flex-1 relative border-l border-white/40 shadow-[-15px_0_30px_-10px_rgba(255,255,255,0.8)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0.1))', backdropFilter: 'blur(10px)' }} />
        <div className="h-full flex-1 relative border-l border-white/20 shadow-[-15px_0_30px_-10px_rgba(255,255,255,0.4)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,0))', backdropFilter: 'blur(4px)' }} />
      </div>

      <main className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 min-h-screen flex flex-col">
        <div className="flex-1 bg-white/95 backdrop-blur-2xl rounded-[2.5rem] panel-shadow border border-white overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-5 sm:px-8 sm:py-6 md:px-10 border-b border-gray-100/50">
            <Link href="/dashboard" className="flex items-center gap-1 text-lg font-semibold tracking-tighter text-gray-900">
              Glyph<span className="text-indigo-600 leading-none">°</span>
            </Link>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-gray-400">
              <Rss className="h-3.5 w-3.5" /> Feed
            </div>
          </div>

          <div className="flex-1 px-5 sm:px-8 md:px-10 py-8 space-y-6">
            {feedItems.length > 0 ? (
              <>
                <h1 className="text-xl font-medium tracking-tight text-gray-900">Your Feed</h1>
                <div className="space-y-4">
                  {feedItems.map((item) => {
                    const authorName = item.display_name || item.username
                    return (
                      <Link
                        key={item.id}
                        href={`/p/${item.username}/${item.project_slug}/${item.devlog_slug}`}
                        className="group block rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          {item.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.avatar_url} alt="" className="h-8 w-8 rounded-xl object-cover shrink-0" />
                          ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 font-mono text-xs font-semibold text-indigo-600">
                              {initials(authorName)}
                            </div>
                          )}
                          <div className="text-sm text-gray-600">
                            <span className="font-medium text-gray-900">{authorName}</span>
                            <span className="text-gray-400"> · </span>
                            <span className="text-indigo-600">{item.project_title}</span>
                          </div>
                        </div>
                        <h3 className="text-base font-medium tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors mb-2 line-clamp-2">
                          {item.devlog_title}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">
                          {excerpt(item.content)}
                        </p>
                        <div className="mt-4 flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-gray-400">
                          <Calendar className="h-3 w-3" />
                          {formatDate(item.published_at)}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="space-y-8">
                <div>
                  <h1 className="text-xl font-medium tracking-tight text-gray-900 mb-2">Your feed is empty</h1>
                  <p className="text-sm text-gray-500">
                    Follow some developers to see their devlogs here. Here are some people to get you started:
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggested.map((dev) => {
                    const devName = dev.display_name || dev.username
                    return (
                      <Link
                        key={dev.id}
                        href={`/dev/${dev.username}`}
                        className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 hover:border-indigo-200 hover:shadow-sm transition-all duration-200"
                      >
                        {dev.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={dev.avatar_url} alt="" className="h-10 w-10 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 font-mono text-sm font-semibold text-indigo-600">
                            {initials(devName)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate text-sm">{devName}</p>
                          <p className="text-xs font-mono text-gray-400 truncate">@{dev.username}</p>
                          {dev.bio && (
                            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{dev.bio}</p>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                  {suggested.length === 0 && (
                    <p className="text-sm text-gray-400 col-span-2">No other developers to suggest yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
