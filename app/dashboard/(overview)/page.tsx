import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { daysSince } from '@/lib/utils'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { Shell } from '@/components/shell/Shell'
import { DashboardView } from '@/components/dashboard/DashboardView'
import { fetchSuggestedDevelopers } from '@/lib/feed/queries'
import { labelFor, ROLES, ENGINES, EXPERIENCE_LEVELS } from '@/lib/supabase/types'
import type { Profile } from '@/lib/supabase/types'

const STALE_DAYS = 14

type ProjectRow = {
  id: string
  title: string
  slug: string | null
  stage: string | null
  cover_url: string | null
  cover_image_url: string | null
  updated_at: string
  is_primary: boolean
}

export type NextAction =
  | { kind: 'create_project' }
  | { kind: 'write_first_devlog'; projectId: string }
  | { kind: 'review_applications'; count: number }
  | { kind: 'review_playtesters'; count: number }
  | { kind: 'share_playtest'; requestId: string }
  | { kind: 'post_update'; projectId: string }
  | { kind: 'continue_building'; projectId: string; projectSlug: string | null }

type Step = { label: string; href: string; reason?: string }

/** The one next step, chosen by the state machine below. Same destinations as before. */
function describeAction(action: NextAction, project: { id: string } | null): Step {
  switch (action.kind) {
    case 'create_project':
      return { label: 'Create your first project', href: '/dashboard/projects/new' }
    case 'write_first_devlog':
      return { label: 'Write your first devlog', href: `/dashboard/projects/${project?.id}/devlogs/new`, reason: 'A devlog starts the public record of this project.' }
    case 'review_applications':
      return { label: 'Review applications', href: '/collaborate', reason: `${action.count} pending` }
    case 'review_playtesters':
      return { label: 'Review playtest signups', href: '/dashboard/playtests', reason: `${action.count} waiting` }
    case 'share_playtest':
      return { label: 'Share your playtest request', href: `/playtests/${action.requestId}`, reason: 'No testers yet.' }
    case 'post_update':
      return { label: 'Post an update', href: `/dashboard/projects/${project?.id}/devlogs/new`, reason: 'Your last devlog is more than two weeks old.' }
    case 'continue_building':
      return { label: 'Write a devlog', href: `/dashboard/projects/${project?.id}/devlogs/new` }
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  // Reuses the shared identity fetch for both its nav flags (isAdmin/hasPublisherAccount/
  // hasStudio/unreadNotifications) and `user` (getOptionalIdentity already called
  // auth.getUser() once — memoised per request via React `cache()` — so this page must not
  // call it again). This page still runs its own separate profile query below: identity's
  // profile select is a narrow (display_name, username) subset shared by every authenticated
  // page, while this page needs the full row (bio, location, role, engine, experience,
  // avatar) to compute "missing profile fields" — see docs/design/glyph-phase-j-architecture.md P2.
  const { user, nav } = await getSidebarIdentity()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<Profile>()

  // First-time / incomplete onboarding → wizard.
  if (!profile || !profile.is_onboarded) redirect('/onboarding')

  // Surface which optional fields are still empty so the user can complete them.
  const missing: string[] = []
  if (!profile.bio) missing.push('Bio')
  if (!profile.location) missing.push('Location')
  if (!profile.primary_role) missing.push('Role')
  if (!profile.primary_engine) missing.push('Engine')
  if (!profile.experience_level) missing.push('Experience')
  if (!profile.avatar_url) missing.push('Avatar')

  // Every user's own project (capped — indie developers realistically have
  // a handful; if this cap is ever hit in practice, "Your Work" should grow
  // pagination rather than raise the cap silently).
  const { data: projectRows, error: projectsError } = await supabase
    .from('projects')
    .select('id, title, slug, stage, cover_url, cover_image_url, updated_at, is_primary')
    .eq('owner_id', user.id)
    .order('is_primary', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(20)

  const projects = (projectRows ?? []) as ProjectRow[]
  const currentProject = projects[0] ?? null
  const otherProjects = projects.slice(1)

  const [
    { data: latestDevlog },
    { data: openPlaytest },
    { data: pendingApplications, error: applicationsError },
    { data: pendingSessions, error: sessionsError },
    { data: unreadNotifications },
    { data: myDevlogsForActivity },
    { data: feedItemsData },
    { count: followsCount },
  ] = await Promise.all([
    currentProject
      ? supabase
          .from('devlog_posts')
          .select('title, slug, published_at')
          .eq('project_id', currentProject.id)
          .not('published_at', 'is', null)
          .lte('published_at', new Date().toISOString())
          .order('published_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    currentProject
      ? supabase
          .from('playtest_requests')
          .select('id, current_testers, requested_testers')
          .eq('project_id', currentProject.id)
          .eq('author_id', user.id)
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('collaboration_applications')
      .select('id, message, created_at, profiles!applicant_id(username, display_name), collaboration_posts!inner(id, role_needed, author_id)')
      .eq('status', 'pending')
      .eq('collaboration_posts.author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('playtest_sessions')
      .select('id, created_at, profiles!tester_id(username, display_name), playtest_requests!inner(id, author_id, projects!project_id(title))')
      .eq('status', 'requested')
      .eq('playtest_requests.author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('notifications')
      .select('id, type, entity_type, created_at, profiles!actor_id(username, display_name)')
      .eq('recipient_id', user.id)
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('devlog_posts')
      .select('id, title, slug, project_id, projects!inner(slug, owner_id)')
      .eq('projects.owner_id', user.id)
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .limit(20),
    supabase
      .from('feed_items')
      .select('*')
      .eq('follower_id', user.id)
      .order('published_at', { ascending: false })
      .limit(5),
    supabase.from('follows').select('followed_id', { count: 'exact', head: true }).eq('follower_id', user.id),
  ])

  type RawApplication = { id: string; message: string; created_at: string; profiles: { username: string; display_name: string | null } | null; collaboration_posts: { id: string; role_needed: string | null } }
  type RawSession = { id: string; created_at: string; profiles: { username: string; display_name: string | null } | null; playtest_requests: { id: string; projects: { title: string } | null } }
  type RawNotification = { id: string; type: string; entity_type: string | null; created_at: string; profiles: { username: string; display_name: string | null } | null }
  type RawDevlog = { id: string; title: string; slug: string; project_id: string; projects: { slug: string | null } }
  type RawFeedItem = { id: string; devlog_slug: string; devlog_title: string; project_title: string; project_slug: string; username: string; display_name: string | null; avatar_url: string | null; published_at: string }

  const applications = (pendingApplications ?? []) as unknown as RawApplication[]
  const sessions = (pendingSessions ?? []) as unknown as RawSession[]
  const notifPreview = (unreadNotifications ?? []) as unknown as RawNotification[]
  const myDevlogs = (myDevlogsForActivity ?? []) as unknown as RawDevlog[]
  const feedPreview = (feedItemsData ?? []) as unknown as RawFeedItem[]

  // Comments on the user's own devlogs — the one real "activity around my
  // work" source available without inventing a dedicated activity log.
  const devlogIds = myDevlogs.map((d) => d.id)
  const { data: recentComments, error: commentsError } = devlogIds.length
    ? await supabase
        .from('comments')
        .select('id, content, created_at, devlog_post_id, profiles!author_id(username, display_name)')
        .in('devlog_post_id', devlogIds)
        .order('created_at', { ascending: false })
        .limit(5)
    : { data: [], error: null }

  type RawComment = { id: string; content: string; created_at: string; devlog_post_id: string; profiles: { username: string; display_name: string | null } | null }
  const comments = (recentComments ?? []) as unknown as RawComment[]
  const devlogLookup = new Map(myDevlogs.map((d) => [d.id, d]))

  // Suggested developers only when the user follows no one yet — the SAME rule and function the Feed
  // uses for its empty state (recent public devlogs; excludes yourself, blocked and muted people).
  const suggestedDevs = (followsCount ?? 0) === 0 ? await fetchSuggestedDevelopers(supabase, user.id, 4) : []

  // ── Dynamic next action ────────────────────────────────────────────
  let nextAction: NextAction
  if (!currentProject) {
    nextAction = { kind: 'create_project' }
  } else if (!latestDevlog) {
    nextAction = { kind: 'write_first_devlog', projectId: currentProject.id }
  } else if (applications.length > 0) {
    nextAction = { kind: 'review_applications', count: applications.length }
  } else if (sessions.length > 0) {
    nextAction = { kind: 'review_playtesters', count: sessions.length }
  } else if (openPlaytest && openPlaytest.current_testers === 0) {
    nextAction = { kind: 'share_playtest', requestId: openPlaytest.id }
  } else {
    const daysSinceDevlog = daysSince(latestDevlog.published_at as string)
    nextAction = daysSinceDevlog > STALE_DAYS
      ? { kind: 'post_update', projectId: currentProject.id }
      : { kind: 'continue_building', projectId: currentProject.id, projectSlug: currentProject.slug }
  }

  const nextStep = describeAction(nextAction, currentProject)
  const facts = [labelFor(ROLES, profile.primary_role), labelFor(ENGINES, profile.primary_engine), labelFor(EXPERIENCE_LEVELS, profile.experience_level)].filter((v): v is string => !!v)
  const actorOf = (p: { username: string; display_name: string | null } | null) => p?.display_name ?? p?.username ?? 'Someone'
  const attention = [
    ...applications.map((a) => ({ id: `app-${a.id}`, href: `/collaborate/${a.collaboration_posts.id}`, time: a.created_at, actor: actorOf(a.profiles), text: `applied for ${a.collaboration_posts.role_needed ?? 'a role'}` })),
    ...sessions.map((x) => ({ id: `session-${x.id}`, href: '/dashboard/playtests', time: x.created_at, actor: actorOf(x.profiles), text: `requested to test ${x.playtest_requests.projects?.title ?? 'your project'}` })),
  ].sort((x, y) => new Date(y.time).getTime() - new Date(x.time).getTime())
  const feedback = comments.flatMap((c) => {
    const devlog = devlogLookup.get(c.devlog_post_id)
    if (!devlog || !devlog.projects.slug) return []
    return [{ id: c.id, href: `/p/${profile.username}/${devlog.projects.slug}/${devlog.slug}#comments`, time: c.created_at, actor: actorOf(c.profiles), devlogTitle: devlog.title }]
  })

  return (
    <Shell
      headerLabel="Dashboard"
      headerAction={
        <Link href={`/dev/${profile.username}`} className="inline-flex min-h-11 items-center gap-1.5 text-small font-medium text-fg-secondary hover:text-fg">
          <span className="hidden sm:inline">View public profile</span> <ExternalLink aria-hidden strokeWidth={1.75} className="size-3.5" />
        </Link>
      }
    >
      <DashboardView
        userId={user.id}
        username={profile.username}
        displayName={profile.display_name || profile.username}
        avatarUrl={profile.avatar_url}
        facts={facts}
        missingProfileFields={missing}
        currentProject={currentProject}
        otherProjects={otherProjects}
        projectsFailed={!!projectsError}
        latestDevlog={latestDevlog as { title: string; slug: string; published_at: string } | null}
        nextStep={nextStep}
        attention={attention}
        attentionFailed={!!(applicationsError || sessionsError)}
        unreadNotifications={nav.unreadNotifications}
        latestNotification={notifPreview[0] ? { at: notifPreview[0].created_at, actor: actorOf(notifPreview[0].profiles) } : null}
        feedback={feedback}
        feedbackFailed={!!commentsError}
        followsCount={followsCount ?? 0}
        network={feedPreview.map((f) => ({ id: f.id, href: `/p/${f.username}/${f.project_slug}/${f.devlog_slug}`, title: f.devlog_title, context: `${f.display_name ?? f.username} on ${f.project_title}`, published_at: f.published_at }))}
        suggested={suggestedDevs}
      />
    </Shell>
  )
}
