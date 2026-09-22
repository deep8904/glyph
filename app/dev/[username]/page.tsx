import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GitBranch, Gamepad2, X, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { MetadataBar } from '@/components/ui/MetadataBar'
import { Section } from '@/components/ui/Section'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { FeaturedToggleButton } from '@/components/profile/FeaturedToggleButton'
import { ProjectRow } from '@/components/project/ProjectRow'
import { DevlogRow } from '@/components/devlog/DevlogRow'
import { CollaborationCard } from '@/components/profile/CollaborationCard'
import { relativeTime, isHttpsUrl } from '@/lib/utils'
import { Shell } from '@/components/shell/Shell'
import {
  labelFor,
  ROLES,
  ENGINES,
  EXPERIENCE_LEVELS,
  type Profile,
} from '@/lib/supabase/types'

function memberSince(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

type ProjectRow = {
  id: string
  title: string
  slug: string | null
  stage: string | null
  short_description: string | null
  cover_url: string | null
  cover_image_url: string | null
  updated_at: string
  is_primary: boolean
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle<Profile>()

  if (!profile) notFound()

  const isOwner = currentUser?.id === profile.id

  const [
    { data: projectRows, error: projectsError },
    { count: followerCount },
    { count: followingCount },
    { data: followRow },
    { data: blockRow },
    { data: muteRow },
    { data: collabPosts },
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('id, title, slug, stage, short_description, cover_url, cover_image_url, updated_at, is_primary')
      .eq('owner_id', profile.id)
      .order('is_primary', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(10),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('followed_id', profile.id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
    currentUser
      ? supabase.from('follows').select('follower_id').eq('follower_id', currentUser.id).eq('followed_id', profile.id).maybeSingle()
      : Promise.resolve({ data: null }),
    currentUser
      ? supabase.from('user_blocks').select('blocker_id').eq('blocker_id', currentUser.id).eq('blocked_id', profile.id).maybeSingle()
      : Promise.resolve({ data: null }),
    currentUser
      ? supabase.from('user_mutes').select('muter_id').eq('muter_id', currentUser.id).eq('muted_id', profile.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('collaboration_posts')
      .select('id, post_type, role_needed, role_offered, contract_type')
      .eq('author_id', profile.id)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  // Affiliation only: active studios this developer belongs to (team lists are public by design).
  const { data: studioRows } = await supabase
    .from('studio_members')
    .select('role, studios!studio_id(slug, name, status)')
    .eq('user_id', profile.id)
    .returns<{ role: string; studios: { slug: string; name: string; status: string } | null }[]>()
  const studioAffiliations = (studioRows ?? [])
    .filter((r) => r.studios && r.studios.status === 'active')
    .map((r) => ({ slug: r.studios!.slug, name: r.studios!.name, role: r.role }))

  const projects = (projectRows ?? []) as ProjectRow[]
  const currentProject = projects.find((p) => p.is_primary) ?? projects[0] ?? null
  const otherProjects = projects.filter((p) => p.id !== currentProject?.id)
  const projectIds = projects.map((p) => p.id)

  const [{ data: featuredRows }, { data: recentRows }] = await Promise.all([
    projectIds.length
      ? supabase
          .from('devlog_posts')
          .select('id, title, slug, published_at, is_featured, project_id, projects!inner(title, slug)')
          .in('project_id', projectIds)
          .eq('is_featured', true)
          .not('published_at', 'is', null)
          .lte('published_at', new Date().toISOString())
          .order('published_at', { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [] }),
    projectIds.length
      ? supabase
          .from('devlog_posts')
          .select('id, title, slug, published_at, is_featured, project_id, projects!inner(title, slug)')
          .in('project_id', projectIds)
          .eq('is_featured', false)
          .not('published_at', 'is', null)
          .lte('published_at', new Date().toISOString())
          .order('published_at', { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
  ])

  type RawDevlogRow = { id: string; title: string; slug: string; published_at: string; is_featured: boolean; project_id: string; projects: { title: string; slug: string | null } }
  const toDevlog = (d: RawDevlogRow) => ({
    id: d.id,
    title: d.title,
    slug: d.slug,
    published_at: d.published_at,
    is_featured: d.is_featured,
    projectTitle: d.projects.title,
    href: d.projects.slug ? `/p/${username}/${d.projects.slug}/${d.slug}` : '#',
  })

  const featuredDevlogs = ((featuredRows ?? []) as unknown as RawDevlogRow[]).map(toDevlog)
  const recentDevlogs = ((recentRows ?? []) as unknown as RawDevlogRow[]).map(toDevlog)
  const mostRecentDevlog = [...featuredDevlogs, ...recentDevlogs].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  )[0]

  const name = profile.display_name || profile.username
  const role = labelFor(ROLES, profile.primary_role)
  const engine = labelFor(ENGINES, profile.primary_engine)
  const experience = labelFor(EXPERIENCE_LEVELS, profile.experience_level)
  const isOpen = profile.collaboration_status === 'open'

  const socials = [
    { url: profile.github_url, label: 'GitHub', Icon: GitBranch },
    { url: profile.itchio_url, label: 'itch.io', Icon: Gamepad2 },
    { url: profile.twitter_url, label: 'Twitter / X', Icon: X },
    { url: profile.website_url, label: 'Website', Icon: Globe },
  ].filter((s) => isHttpsUrl(s.url))

  const facts = [role, engine, experience].filter((v): v is string => !!v)
  const projectsFailed = !!projectsError

  return (
    <Shell headerLabel="Developer profile">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        {/* Identity */}
        <ProfileHeader
          name={name}
          username={profile.username}
          avatarUrl={profile.avatar_url}
          location={profile.location}
          facts={facts}
          isOpenToCollab={isOpen}
          followerCount={followerCount ?? 0}
          followingCount={followingCount ?? 0}
          isOwner={isOwner}
          currentUserId={currentUser?.id ?? null}
          targetId={profile.id}
          isFollowing={!!followRow}
          isBlocked={!!blockRow}
          isMuted={!!muteRow}
          studios={studioAffiliations}
        />

        {projectsFailed && <ErrorState inline title="We couldn't load this developer's projects" description="This may be temporary. Reload the page to try again." />}

        {/* Current work */}
        <Section id="current-work" title="Current work">
          {currentProject ? (
            <ProjectRow project={currentProject} username={profile.username} variant="feature" />
          ) : (
            <EmptyState
              kind="first-use"
              className="border-y-0 py-2"
              title={isOwner ? 'No project yet' : `${name} has no public project yet`}
              description={isOwner ? 'A project is the work your devlogs belong to.' : undefined}
              action={isOwner ? <Button asChild variant="primary" size="sm"><Link href="/dashboard/projects/new">Create your first project</Link></Button> : undefined}
            />
          )}
        </Section>

        {/* Featured — curated, distinct from the chronological list below */}
        {(featuredDevlogs.length > 0 || isOwner) && (
          <Section id="featured" title="Featured" count={featuredDevlogs.length || undefined}>
            {featuredDevlogs.length > 0 ? (
              <ul className="divide-y divide-line-subtle">
                {featuredDevlogs.map((d) => (
                  <DevlogRow key={d.id} devlog={d} action={isOwner ? <FeaturedToggleButton devlogId={d.id} featured={d.is_featured} /> : undefined} />
                ))}
              </ul>
            ) : (
              <p className="text-small text-fg-secondary">Star a devlog below to feature your best work here.</p>
            )}
          </Section>
        )}

        {/* Projects — only when there is more than the current one */}
        {otherProjects.length > 0 && (
          <Section id="projects" title="Projects" count={otherProjects.length}>
            <ul className="divide-y divide-line-subtle">
              {otherProjects.map((p) => (
                <li key={p.id}><ProjectRow project={p} username={profile.username} variant="compact" /></li>
              ))}
            </ul>
          </Section>
        )}

        {/* Recent devlogs — chronological */}
        <Section id="devlogs" title="Recent devlogs">
          {recentDevlogs.length > 0 ? (
            <ul className="divide-y divide-line-subtle">
              {recentDevlogs.map((d) => (
                <DevlogRow key={d.id} devlog={d} action={isOwner ? <FeaturedToggleButton devlogId={d.id} featured={d.is_featured} /> : undefined} />
              ))}
            </ul>
          ) : (
            <EmptyState
              kind="first-use"
              className="border-y-0 py-2"
              title={isOwner ? "You haven't posted a devlog yet" : `${name} hasn't posted a devlog yet`}
              description={isOwner ? 'Devlogs are the dated record of what you build.' : undefined}
              action={isOwner && currentProject ? <Button asChild variant="primary" size="sm"><Link href={`/dashboard/projects/${currentProject.id}/devlogs/new`}>Write a devlog</Link></Button> : undefined}
            />
          )}
        </Section>

        {/* Activity — real timestamps only */}
        <Section id="activity" title="Activity">
          <MetadataBar
            layout="stacked"
            items={[
              { label: 'Last devlog', value: mostRecentDevlog ? <><Link href={mostRecentDevlog.href} className="inline-flex min-h-11 items-center text-link underline-offset-2 hover:underline">{mostRecentDevlog.title}</Link> <span className="text-fg-muted">· {relativeTime(mostRecentDevlog.published_at)}</span></> : null },
              { label: 'Current project updated', value: currentProject ? relativeTime(currentProject.updated_at) : null },
              { label: 'On Glyph since', value: memberSince(profile.created_at) },
            ]}
          />
        </Section>

        {/* About */}
        {profile.bio && (
          <Section id="about" title="About">
            <p className="max-w-prose whitespace-pre-line text-body text-fg-secondary [overflow-wrap:anywhere]">{profile.bio}</p>
          </Section>
        )}

        {/* Collaboration — can I work with this person? */}
        <CollaborationCard isOpenToCollab={isOpen} posts={collabPosts ?? []} name={name} />

        {/* Links */}
        {socials.length > 0 && (
          <Section id="links" title="Links">
            <ul className="flex flex-wrap gap-x-6">
              {socials.map(({ url, label, Icon }) => (
                <li key={label}>
                  <a href={url as string} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-small font-medium text-link underline-offset-2 hover:underline">
                    <Icon aria-hidden strokeWidth={1.75} className="size-4" /> {label}<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </Shell>
  )
}
