import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GitBranch, Gamepad2, X, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { GlyphShell } from '@/components/glyph/shell/GlyphShell'
import { GButton } from '@/components/glyph/ui/primitives'
import { GEmptyState, GErrorState } from '@/components/glyph/ui/States'
import { GlyphProfileHeader, type SocialLink, type StudioAffiliation } from '@/components/glyph/profile/GlyphProfileHeader'
import { GlyphBuildSnapshot, type SnapshotProject } from '@/components/glyph/profile/GlyphBuildSnapshot'
import { GlyphWorkTimeline } from '@/components/glyph/profile/GlyphWorkTimeline'
import { GlyphEcosystemPanel, hasEcosystemContent } from '@/components/glyph/profile/GlyphEcosystemPanel'
import type { OtherProjectData } from '@/components/glyph/profile/GlyphOtherProjectRow'
import { isHttpsUrl } from '@/lib/utils'
import { labelFor, ROLES, ENGINES, EXPERIENCE_LEVELS, type Profile } from '@/lib/supabase/types'

type RouteParams = { username: string }

function memberSince(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/** Shared identity lookup, memoized per request so `generateMetadata` and the page read the
 * profile once, matching the Project route's pattern. */
const loadProfileIdentity = cache(async (username: string) => {
  const supabase = await createClient()
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle<Profile>()

  return { profile, currentUserId: currentUser?.id ?? null }
})

const SAFE_METADATA: Metadata = { title: 'Glyph', description: "The professional home for a game while it's being built." }

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { username } = await params
  const { profile } = await loadProfileIdentity(username)
  if (!profile) return SAFE_METADATA
  const name = profile.display_name || profile.username
  return {
    title: `${name} (@${profile.username}) — Glyph`,
    description: profile.bio || SAFE_METADATA.description,
  }
}

type ProjectQueryRow = {
  id: string
  title: string
  slug: string | null
  stage: string | null
  short_description: string | null
  cover_url: string | null
  cover_image_url: string | null
  updated_at: string
  is_primary: boolean
  lifecycle: 'draft' | 'published' | 'archived'
}

export default async function ProfilePage({ params }: { params: Promise<RouteParams> }) {
  const { username } = await params
  const { profile, currentUserId } = await loadProfileIdentity(username)

  if (!profile) notFound()

  const isOwner = currentUserId === profile.id
  const supabase = await createClient()

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
      .select('id, title, slug, stage, short_description, cover_url, cover_image_url, updated_at, is_primary, lifecycle')
      .eq('owner_id', profile.id)
      .order('is_primary', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(10),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('followed_id', profile.id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
    currentUserId
      ? supabase.from('follows').select('follower_id').eq('follower_id', currentUserId).eq('followed_id', profile.id).maybeSingle()
      : Promise.resolve({ data: null }),
    currentUserId
      ? supabase.from('user_blocks').select('blocker_id').eq('blocker_id', currentUserId).eq('blocked_id', profile.id).maybeSingle()
      : Promise.resolve({ data: null }),
    currentUserId
      ? supabase.from('user_mutes').select('muter_id').eq('muter_id', currentUserId).eq('muted_id', profile.id).maybeSingle()
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
  const studioAffiliations: StudioAffiliation[] = (studioRows ?? [])
    .filter((r) => r.studios && r.studios.status === 'active')
    .map((r) => ({ slug: r.studios!.slug, name: r.studios!.name, role: r.role }))

  // A visitor never sees draft (RLS already stops that row) or archived (app-level — archived is
  // "not actively representing current work"). The owner sees everything, including drafts and
  // archived, so they can find and manage them.
  const allProjects = (projectRows ?? []) as ProjectQueryRow[]
  const projects = isOwner ? allProjects : allProjects.filter((p) => p.lifecycle === 'published')
  // Current work never surfaces an archived project as "currently building," even for the owner.
  const currentCandidates = projects.filter((p) => p.lifecycle !== 'archived')
  const currentProject: ProjectQueryRow | null = currentCandidates.find((p) => p.is_primary) ?? currentCandidates[0] ?? null
  const otherProjects = projects.filter((p) => p.id !== currentProject?.id)
  const projectIds = projects.map((p) => p.id)

  const [{ data: featuredRows }, { data: recentRows }] = await Promise.all([
    projectIds.length
      ? supabase
          .from('devlog_posts')
          .select('id, title, content, slug, published_at, is_featured, project_id, projects!inner(title, slug)')
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
          .select('id, title, content, slug, published_at, is_featured, project_id, projects!inner(title, slug)')
          .in('project_id', projectIds)
          .eq('is_featured', false)
          .not('published_at', 'is', null)
          .lte('published_at', new Date().toISOString())
          .order('published_at', { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
  ])

  type RawDevlogRow = { id: string; title: string; content: string | null; slug: string; published_at: string; is_featured: boolean; project_id: string; projects: { title: string; slug: string | null } }
  const toDevlog = (d: RawDevlogRow) => ({
    id: d.id,
    title: d.title,
    body: d.content,
    slug: d.slug,
    published_at: d.published_at,
    is_featured: d.is_featured,
    projectId: d.project_id,
    projectTitle: d.projects.title,
    href: d.projects.slug ? `/p/${username}/${d.projects.slug}/${d.slug}` : '#',
  })

  const featuredDevlogs = ((featuredRows ?? []) as unknown as RawDevlogRow[]).map(toDevlog)
  const recentDevlogs = ((recentRows ?? []) as unknown as RawDevlogRow[]).map(toDevlog)
  // One chronological record, newest first. Curated (featured) entries keep their own visual
  // marker (see GlyphProfileDevlogRow) instead of being pulled into a separate stacked section.
  const workRecord = [...featuredDevlogs, ...recentDevlogs].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  )
  const currentProjectDevlogsDesc = currentProject
    ? workRecord.filter((d) => d.projectId === currentProject.id).map((d) => ({ title: d.title, body: d.body, published_at: d.published_at }))
    : []

  const name = profile.display_name || profile.username
  const role = labelFor(ROLES, profile.primary_role)
  const engine = labelFor(ENGINES, profile.primary_engine)
  const experience = labelFor(EXPERIENCE_LEVELS, profile.experience_level)
  const isOpenToCollab = profile.collaboration_status === 'open'
  const projectsFailed = !!projectsError

  const socials: SocialLink[] = [
    { url: profile.github_url, label: 'GitHub', Icon: GitBranch },
    { url: profile.itchio_url, label: 'itch.io', Icon: Gamepad2 },
    { url: profile.twitter_url, label: 'Twitter / X', Icon: X },
    { url: profile.website_url, label: 'Website', Icon: Globe },
  ]
    .filter((s) => isHttpsUrl(s.url))
    .map((s) => ({ ...s, url: s.url as string }))

  const facts = [role, engine, experience].filter((v): v is string => !!v)

  const showEcosystem = hasEcosystemContent({
    otherProjects,
    collabPosts: collabPosts ?? [],
    followerCount: followerCount ?? 0,
    followingCount: followingCount ?? 0,
    isOwner,
  })

  return (
    <GlyphShell>
      <div className="mx-auto w-full max-w-[1180px]">
        <div className="max-w-[640px]">
          <GlyphProfileHeader
            name={name}
            username={profile.username}
            avatarUrl={profile.avatar_url}
            location={profile.location}
            facts={facts}
            bio={profile.bio}
            isOpenToCollab={isOpenToCollab}
            isOwner={isOwner}
            currentUserId={currentUserId}
            targetId={profile.id}
            isFollowing={!!followRow}
            isBlocked={!!blockRow}
            isMuted={!!muteRow}
            studios={studioAffiliations}
            socials={socials}
          />
        </div>

        <div className="mt-8">
          {currentProject ? (
            <GlyphBuildSnapshot
              project={currentProject as SnapshotProject}
              username={profile.username}
              projectDevlogsDesc={currentProjectDevlogsDesc}
              isOwner={isOwner}
            />
          ) : (
            <GEmptyState
              title={isOwner ? 'No project yet' : `${name} has no public project yet`}
              description={isOwner ? 'A project is the work your devlogs belong to.' : undefined}
              action={isOwner ? <GButton asChild variant="ember" size="sm"><Link href="/dashboard/projects/new">Create your first project</Link></GButton> : undefined}
            />
          )}
        </div>

        {projectsFailed && (
          <div className="mt-6">
            <GErrorState title="We couldn't load this developer's projects" description="This may be temporary. Reload the page to try again." />
          </div>
        )}

        <div className={showEcosystem ? 'mt-12 grid gap-10 lg:grid-cols-[1fr_300px] lg:items-start' : 'mt-12'}>
          <section aria-labelledby="work-record-heading">
            <h2 id="work-record-heading" className="text-h2 font-semibold tracking-[-0.01em] text-ink">Work record</h2>
            <div className="mt-5">
              <GlyphWorkTimeline
                devlogs={workRecord}
                isOwner={isOwner}
                emptyTitle={isOwner ? "You haven't posted a devlog yet" : `${name} hasn't posted a devlog yet`}
                emptyDescription={isOwner ? 'Devlogs are the dated record of what you build.' : undefined}
                emptyAction={isOwner && currentProject ? <GButton asChild variant="ember" size="sm"><Link href={`/dashboard/projects/${currentProject.id}/devlogs/new`}>Write a devlog</Link></GButton> : undefined}
              />
            </div>
          </section>

          {showEcosystem && (
            <aside aria-labelledby="ecosystem-heading">
              <h2 id="ecosystem-heading" className="text-h2 font-semibold tracking-[-0.01em] text-ink">Ecosystem</h2>
              <div className="mt-5">
                <GlyphEcosystemPanel
                  otherProjects={otherProjects as OtherProjectData[]}
                  username={profile.username}
                  isOwner={isOwner}
                  isOpenToCollab={isOpenToCollab}
                  collabPosts={collabPosts ?? []}
                  name={name}
                  followerCount={followerCount ?? 0}
                  followingCount={followingCount ?? 0}
                  memberSince={memberSince(profile.created_at)}
                />
              </div>
            </aside>
          )}
        </div>
      </div>
    </GlyphShell>
  )
}
