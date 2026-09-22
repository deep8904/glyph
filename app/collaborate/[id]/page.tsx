import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DiscoveryFrame } from '@/components/discovery/DiscoveryFrame'
import { ApplicationPanel } from '@/components/collaborate/ApplicationPanel'
import { ApplicationActions } from '@/components/collaborate/ApplicationActions'
import { ClosePostButton } from '@/components/collaborate/ClosePostButton'
import { APPLICATION_STATUS, POST_STATUS, StatusLabel, StatusText } from '@/components/workflow/StatusLabel'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { MetadataBar } from '@/components/ui/MetadataBar'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CONTRACT_TYPES } from '@/lib/supabase/types'
import { relativeTime } from '@/lib/utils'

const CONTRACT_LABELS = Object.fromEntries(CONTRACT_TYPES.map((c) => [c.value, c.label]))

type PostRow = {
  id: string
  project_id: string | null
  author_id: string
  post_type: 'seeking_collaborator' | 'available_to_collaborate'
  role_needed: string | null
  role_offered: string | null
  contract_type: string
  compensation_range: string | null
  time_commitment: string | null
  remote_allowed: boolean
  location: string | null
  description: string
  status: 'open' | 'filled' | 'closed'
  expires_at: string
  created_at: string
  projects: { title: string; slug: string | null } | null
  profiles: { username: string; display_name: string | null; primary_role: string | null }
}

type ApplicantRow = {
  id: string
  status: string
  message: string
  created_at: string
  profiles: { username: string; display_name: string | null; avatar_url: string | null; primary_role: string | null; bio: string | null } | null
}

export default async function CollabPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // RLS decides who can see a post: everyone while open/filled; the author and
  // its applicants once it is closed; nobody else (they get a 404).
  const { data: post } = await supabase
    .from('collaboration_posts')
    .select('*, projects!project_id(title, slug), profiles!author_id(username, display_name, primary_role)')
    .eq('id', id)
    .maybeSingle<PostRow>()
  if (!post) notFound()

  const isAuthor = user?.id === post.author_id
  const authorName = post.profiles.display_name || post.profiles.username
  const seeking = post.post_type === 'seeking_collaborator'
  const roleTitle = (seeking ? post.role_needed : post.role_offered) ?? (seeking ? 'Collaborator' : 'Any role')
  const nowIso = new Date().toISOString()
  const expired = post.status === 'open' && post.expires_at <= nowIso
  const accepting = post.status === 'open' && !expired
  const stateLabel = expired ? { label: 'Expired', tone: 'negative' as const } : POST_STATUS[post.status]

  const [applicantsRes, mineRes] = await Promise.all([
    isAuthor
      ? supabase
          .from('collaboration_applications')
          .select('id, status, message, created_at, profiles!applicant_id(username, display_name, avatar_url, primary_role, bio)')
          .eq('post_id', id)
          .order('created_at', { ascending: false })
          .returns<ApplicantRow[]>()
      : Promise.resolve({ data: null }),
    user && !isAuthor
      ? supabase.from('collaboration_applications').select('id, status, message, created_at').eq('post_id', id).eq('applicant_id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  // Waiting first (they need a decision), then decided, each newest first.
  const applicants = [...(applicantsRes.data ?? [])].sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending'))
  const pendingCount = applicants.filter((a) => a.status === 'pending').length

  const facts = [
    { label: 'Contract', value: CONTRACT_LABELS[post.contract_type] ?? post.contract_type },
    { label: 'Work', value: post.remote_allowed ? 'Remote OK' : 'Not remote' },
    { label: 'Location', value: post.location },
    { label: 'Compensation', value: post.compensation_range },
    { label: 'Time', value: post.time_commitment },
    { label: expired ? 'Expired' : post.status === 'open' ? 'Expires' : 'Expiry', value: new Date(post.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
  ]

  return (
    <DiscoveryFrame label="Collaborate">
      {() => (
        <article className="max-w-2xl">
          <Link href="/collaborate" className="inline-flex min-h-11 items-center text-small text-fg-secondary hover:text-fg">← Collaborate</Link>

          <header className="mt-1">
            <p className="text-small font-medium text-fg-muted">{seeking ? 'Looking for' : 'Available to collaborate as'}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="text-display font-semibold text-fg [overflow-wrap:anywhere]">{roleTitle}</h1>
              <StatusLabel label={stateLabel.label} tone={stateLabel.tone} />
            </div>
            <p className="mt-2 text-body text-fg-secondary [overflow-wrap:anywhere]">
              {post.projects && (
                <>
                  For{' '}
                  {post.projects.slug ? (
                    <Link href={`/p/${post.profiles.username}/${post.projects.slug}`} className="font-medium text-link underline-offset-2 hover:underline">{post.projects.title}</Link>
                  ) : (
                    <span className="font-medium text-fg">{post.projects.title}</span>
                  )}
                  {' · '}
                </>
              )}
              Posted by{' '}
              <Link href={`/dev/${post.profiles.username}`} className="font-medium text-link underline-offset-2 hover:underline">{authorName}</Link>
              {post.profiles.primary_role && <span className="text-fg-muted"> ({post.profiles.primary_role.replace(/_/g, ' ')})</span>}
              {' · '}{relativeTime(post.created_at)}
            </p>
          </header>

          <MetadataBar className="mt-5 border-y border-line-subtle py-4" items={facts} />

          <section aria-labelledby="about-role" className="mt-6">
            <h2 id="about-role" className="text-h3 font-semibold text-fg">{seeking ? 'About the role' : 'About'}</h2>
            <p className="mt-2 max-w-prose whitespace-pre-wrap text-body text-fg-secondary [overflow-wrap:anywhere]">{post.description}</p>
          </section>

          {!isAuthor && (
            <div className="mt-8">
              <ApplicationPanel
                postId={id}
                signedIn={!!user}
                acceptingApplications={accepting}
                roleTitle={roleTitle}
                projectTitle={post.projects?.title ?? null}
                authorName={authorName}
                authorUsername={post.profiles.username}
                reachingOut={!seeking}
                application={mineRes.data ?? null}
              />
            </div>
          )}

          {isAuthor && (
            <div className="mt-8 space-y-8">
              <section aria-labelledby="manage-post" className="border-t border-line pt-6">
                <h2 id="manage-post" className="text-h3 font-semibold text-fg">Manage this post</h2>
                {post.status === 'open' ? (
                  <>
                    <p className="mb-3 mt-1 text-body text-fg-secondary">
                      {expired ? 'This post has expired and no longer accepts applications.' : 'Visible on the board and on your project until you close it or it expires.'}
                    </p>
                    <ClosePostButton postId={id} pendingCount={pendingCount} />
                  </>
                ) : (
                  <p role="status" className="mt-1 text-body text-fg-secondary">
                    {post.status === 'filled' ? 'You marked this post as filled.' : 'You closed this post.'} It no longer accepts applications.
                  </p>
                )}
              </section>

              <section aria-labelledby="applicants-heading" className="border-t border-line pt-6">
                <SectionHeader
                  id="applicants-heading"
                  title="Applicants"
                  count={applicants.length}
                  description={pendingCount > 0 ? `${pendingCount} awaiting your decision, oldest decisions last.` : undefined}
                  className="mb-3"
                />
                {applicants.length === 0 ? (
                  <EmptyState
                    kind="first-use"
                    className="border-y-0 py-2"
                    title={post.status === 'open' ? 'No applications yet' : 'Nobody applied'}
                    description={post.status === 'open' ? 'People who apply appear here and you will be notified.' : undefined}
                  />
                ) : (
                  <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                    {applicants.map((a) => {
                      const name = a.profiles?.display_name || a.profiles?.username || 'Applicant'
                      const st = APPLICATION_STATUS[a.status] ?? { label: a.status, tone: 'neutral' as const }
                      return (
                        <li key={a.id} className="py-5">
                          <div className="flex items-start gap-3">
                            <Avatar name={name} src={a.profiles?.avatar_url} size="lg" />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                                {a.profiles ? (
                                  <Link href={`/dev/${a.profiles.username}`} className="text-body font-medium text-fg hover:text-link [overflow-wrap:anywhere]">{name}</Link>
                                ) : (
                                  <span className="text-body font-medium text-fg">{name}</span>
                                )}
                                <StatusText label={st.label} tone={st.tone} />
                              </div>
                              <p className="text-small text-fg-muted">
                                {a.profiles?.primary_role && <>{a.profiles.primary_role.replace(/_/g, ' ')} · </>}applied <time dateTime={a.created_at}>{relativeTime(a.created_at)}</time>
                              </p>
                              {a.profiles?.bio && <p className="mt-1 line-clamp-1 text-small text-fg-secondary">{a.profiles.bio}</p>}
                            </div>
                          </div>
                          <p className="mt-3 max-w-prose whitespace-pre-wrap text-body text-fg-secondary [overflow-wrap:anywhere]">{a.message}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                            {a.status === 'pending' && <ApplicationActions applicationId={a.id} applicantName={name} />}
                            {a.profiles && (
                              <Link href={`/dev/${a.profiles.username}`} className="inline-flex min-h-11 items-center text-small font-medium text-link underline-offset-2 hover:underline">View profile and work</Link>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            </div>
          )}
        </article>
      )}
    </DiscoveryFrame>
  )
}
