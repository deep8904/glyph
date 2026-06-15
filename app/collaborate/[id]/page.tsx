import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody } from '@/components/layout/PageShell'
import { Badge } from '@/components/ui/Badge'
import { CONTRACT_TYPES } from '@/lib/supabase/types'
import { ApplyToPostButton } from '@/components/collaborate/ApplyToPostButton'

const CONTRACT_LABELS = Object.fromEntries(CONTRACT_TYPES.map((c) => [c.value, c.label]))

export default async function CollabPostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: post } = await supabase
    .from('collaboration_posts')
    .select('*, projects!project_id(title, slug), profiles!author_id(username, display_name, primary_role, avatar_url)')
    .eq('id', id)
    .maybeSingle()

  if (!post || post.status === 'closed') notFound()

  type Post = typeof post & {
    projects: { title: string; slug: string | null } | null
    profiles: { username: string; display_name: string | null; primary_role: string | null; avatar_url: string | null }
  }
  const p = post as unknown as Post

  const isAuthor = user && (await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle()).data?.username === p.profiles.username

  let hasApplied = false
  if (user && !isAuthor) {
    const { data: app } = await supabase.from('collaboration_applications').select('id').eq('post_id', id).eq('applicant_id', user.id).maybeSingle()
    hasApplied = !!app
  }

  const { data: apps } = isAuthor
    ? await supabase.from('collaboration_applications').select('id, status, message, created_at, profiles!applicant_id(username, display_name)').eq('post_id', id)
    : { data: null }

  type App = { id: string; status: string; message: string; created_at: string; profiles: { username: string; display_name: string | null } | null }

  const typedApps = isAuthor && apps ? (apps as unknown as App[]) : null

  return (
    <PageShell>
      <PanelHeader breadcrumb={[{ label: 'Collaborate', href: '/collaborate' }, { label: p.post_type === 'seeking_collaborator' ? 'Seeking' : 'Available' }]} />
      <PanelBody>
        <Link href="/collaborate" className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-colors mb-6">
          <ArrowLeft className="h-3 w-3" /> Back to board
        </Link>

        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${p.post_type === 'seeking_collaborator' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
            {p.post_type === 'seeking_collaborator' ? 'Seeking' : 'Available'}
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">
            {p.post_type === 'seeking_collaborator' ? (p.role_needed ?? 'Collaborator') : (p.role_offered ?? 'Any role')}
          </h1>
          {p.status === 'filled' && <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-mono text-gray-500 uppercase tracking-wider">Filled</span>}
        </div>

        <p className="text-sm text-gray-500 mb-6">
          Posted by{' '}
          <Link href={`/dev/${p.profiles.username}`} className="text-indigo-600 hover:underline">
            {p.profiles.display_name ?? p.profiles.username}
          </Link>
        </p>

        {p.projects && (
          <div className="mb-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Project: </span>
            {p.projects.slug ? (
              <Link href={`/p/${p.profiles.username}/${p.projects.slug}`} className="text-sm text-indigo-600 hover:underline">{p.projects.title}</Link>
            ) : (
              <span className="text-sm text-gray-700">{p.projects.title}</span>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          <Badge>{CONTRACT_LABELS[p.contract_type] ?? p.contract_type}</Badge>
          {p.remote_allowed && <Badge variant="secondary">Remote OK</Badge>}
          {p.location && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-gray-400">
              <MapPin className="h-3 w-3" />{p.location}
            </span>
          )}
          {p.compensation_range && <Badge variant="secondary">{p.compensation_range}</Badge>}
          {p.time_commitment && <Badge variant="secondary">{p.time_commitment}</Badge>}
        </div>

        <div className="mb-8">
          <h2 className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-3">Description</h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{p.description}</p>
        </div>

        <div className="mb-4 flex items-center gap-1 text-[11px] font-mono text-gray-400">
          <Clock className="h-3 w-3" />
          Expires {new Date(p.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>

        {!isAuthor && p.status === 'open' && (
          <ApplyToPostButton postId={id} isSignedIn={!!user} hasApplied={hasApplied} />
        )}

        {typedApps && typedApps.length > 0 && (
          <div className="mt-8">
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-4">Applications ({typedApps.length})</h2>
            <div className="space-y-3">
              {typedApps.map((app) => (
                <div key={app.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Link href={`/dev/${app.profiles?.username}`} className="text-sm font-medium text-indigo-600 hover:underline">
                      {app.profiles?.display_name ?? app.profiles?.username}
                    </Link>
                    <span className="text-[10px] font-mono text-gray-400">{app.status}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </PanelBody>
    </PageShell>
  )
}
