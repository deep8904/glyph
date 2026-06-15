import Link from 'next/link'
import { Handshake, Plus, MapPin, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody, EmptyState } from '@/components/layout/PageShell'
import { Badge } from '@/components/ui/Badge'
import { CONTRACT_TYPES } from '@/lib/supabase/types'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

type CollabPost = {
  id: string; post_type: string; role_needed: string | null; role_offered: string | null
  contract_type: string; remote_allowed: boolean; location: string | null
  description: string; expires_at: string; created_at: string
  projects: { title: string; slug: string | null } | null
  profiles: { username: string; display_name: string | null } | null
}

const CONTRACT_LABELS = Object.fromEntries(CONTRACT_TYPES.map((c) => [c.value, c.label]))

export default async function CollaboratePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; contract?: string; remote?: string }>
}) {
  const { type, contract, remote } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('collaboration_posts')
    .select('id, post_type, role_needed, role_offered, contract_type, remote_allowed, location, description, expires_at, created_at, projects!project_id(title, slug), profiles!author_id(username, display_name)')
    .eq('status', 'open')
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(50)

  if (type) query = query.eq('post_type', type)
  if (contract) query = query.eq('contract_type', contract)
  if (remote === 'true') query = query.eq('remote_allowed', true)

  const { data } = await query
  const posts = (data ?? []) as unknown as CollabPost[]

  return (
    <PageShell wide>
      <PanelHeader
        breadcrumb={[{ label: 'Collaborate' }]}
        action={
          user ? (
            <Link href="/collaborate/new" className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Post</span>
            </Link>
          ) : null
        }
      />
      <PanelBody>
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Link href="/collaborate" className={`rounded-full px-3 py-1.5 text-xs font-mono transition-all duration-200 ${!type ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</Link>
          <Link href="/collaborate?type=seeking_collaborator" className={`rounded-full px-3 py-1.5 text-xs font-mono transition-all duration-200 ${type === 'seeking_collaborator' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Seeking</Link>
          <Link href="/collaborate?type=available_to_collaborate" className={`rounded-full px-3 py-1.5 text-xs font-mono transition-all duration-200 ${type === 'available_to_collaborate' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Available</Link>
          <Link href={`/collaborate${type ? `?type=${type}&` : '?'}remote=true`} className={`rounded-full px-3 py-1.5 text-xs font-mono transition-all duration-200 ${remote === 'true' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Remote Only</Link>
        </div>

        {posts.length === 0 ? (
          <EmptyState
            icon={<Handshake className="h-8 w-8 text-gray-300" />}
            title="No collaboration posts"
            description="Be the first to post a collaboration opportunity or advertise your availability."
            action={
              user ? (
                <Link href="/collaborate/new" className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20">
                  Post a collaboration
                </Link>
              ) : (
                <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20">
                  Join to collaborate
                </Link>
              )
            }
          />
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Link key={post.id} href={`/collaborate/${post.id}`} className="block group rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all duration-300">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${post.post_type === 'seeking_collaborator' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                    {post.post_type === 'seeking_collaborator' ? 'Seeking' : 'Available'}
                  </span>
                  <span className="text-base font-medium tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {post.post_type === 'seeking_collaborator' ? (post.role_needed ?? 'Collaborator') : (post.role_offered ?? 'Any role')}
                  </span>
                </div>
                {post.projects && (
                  <p className="text-xs font-mono text-indigo-600 mb-2">on {post.projects.title}</p>
                )}
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{post.description}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary" size="sm">{CONTRACT_LABELS[post.contract_type] ?? post.contract_type}</Badge>
                  {post.remote_allowed && <Badge variant="secondary" size="sm">Remote OK</Badge>}
                  {post.location && (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-gray-400">
                      <MapPin className="h-3 w-3" />{post.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[11px] font-mono text-gray-400">
                    <Clock className="h-3 w-3" />{timeAgo(post.created_at)}
                  </span>
                  <span className="text-[11px] font-mono text-gray-400">by {post.profiles?.display_name ?? post.profiles?.username}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </PanelBody>
    </PageShell>
  )
}
