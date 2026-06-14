import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/supabase/types'

type FollowEntry = {
  follower_id: string
  profiles: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'primary_role' | 'bio'>
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

export default async function FollowersPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .eq('username', username)
    .maybeSingle<Pick<Profile, 'id' | 'username' | 'display_name'>>()

  if (!profile) notFound()

  const { data: follows } = await supabase
    .from('follows')
    .select('follower_id, profiles!follower_id(id, username, display_name, avatar_url, primary_role, bio)')
    .eq('followed_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const entries = (follows ?? []) as unknown as FollowEntry[]
  const name = profile.display_name || profile.username

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
          <div className="flex items-center gap-3 px-5 py-5 sm:px-8 sm:py-6 md:px-10 border-b border-gray-100/50">
            <Link href={`/dev/${username}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-4 w-4" /> {name}
            </Link>
            <span className="text-gray-300">/</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400">Followers</span>
          </div>

          <div className="flex-1 px-5 sm:px-8 md:px-10 py-8">
            <h1 className="text-xl font-medium tracking-tight text-gray-900 mb-6">
              {entries.length} {entries.length === 1 ? 'Follower' : 'Followers'}
            </h1>
            {entries.length === 0 ? (
              <p className="text-sm text-gray-400">No followers yet.</p>
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => {
                  const p = entry.profiles
                  const pName = p.display_name || p.username
                  return (
                    <Link
                      key={entry.follower_id}
                      href={`/dev/${p.username}`}
                      className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 hover:border-indigo-200 hover:shadow-sm transition-all duration-200"
                    >
                      {p.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.avatar_url} alt="" className="h-10 w-10 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 font-mono text-sm font-semibold text-indigo-600">
                          {initials(pName)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{pName}</p>
                        <p className="text-xs font-mono text-gray-400 truncate">@{p.username}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
