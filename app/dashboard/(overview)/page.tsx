import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { daysSince } from '@/lib/utils'
import { GlyphShell } from '@/components/glyph/shell/GlyphShell'
import { GlyphNextStep } from '@/components/glyph/dashboard/GlyphNextStep'
import { GlyphAttentionList, type AttentionItem } from '@/components/glyph/dashboard/GlyphAttentionList'
import { GlyphBuildStatus, type CurrentProjectData } from '@/components/glyph/dashboard/GlyphBuildStatus'
import { GlyphProfileNudge } from '@/components/glyph/dashboard/GlyphProfileNudge'
import type { OtherProjectData } from '@/components/glyph/profile/GlyphOtherProjectRow'
import { computeNextAction, describeNextAction } from '@/lib/glyph/dashboardNextAction'
import type { Profile } from '@/lib/supabase/types'

type ProjectRow = {
  id: string
  title: string
  slug: string | null
  stage: string | null
  cover_url: string | null
  cover_image_url: string | null
  updated_at: string
  is_primary: boolean
  lifecycle: 'draft' | 'published' | 'archived'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  // Shared identity fetch (memoised per request) — same as every other authenticated page.
  const { user } = await getSidebarIdentity()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<Profile>()

  // First-time / incomplete onboarding → wizard.
  if (!profile || !profile.is_onboarded) redirect('/onboarding')

  const missing: string[] = []
  if (!profile.bio) missing.push('Bio')
  if (!profile.location) missing.push('Location')
  if (!profile.primary_role) missing.push('Role')
  if (!profile.primary_engine) missing.push('Engine')
  if (!profile.experience_level) missing.push('Experience')
  if (!profile.avatar_url) missing.push('Avatar')

  const { data: projectRows, error: projectsError } = await supabase
    .from('projects')
    .select('id, title, slug, stage, cover_url, cover_image_url, updated_at, is_primary, lifecycle')
    .eq('owner_id', user.id)
    .order('is_primary', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(20)

  const projects = (projectRows ?? []) as ProjectRow[]
  // "Currently building" never surfaces an archived project — that phrase is a lifecycle claim.
  // Draft is fine here (this page is always owner-only): a draft is exactly "what I'm currently
  // building," maybe the most literal case of it.
  const currentProject = projects.find((p) => p.lifecycle !== 'archived') ?? null
  const otherProjects = projects.filter((p) => p.id !== currentProject?.id)

  const [
    { data: latestDevlog, error: latestDevlogError },
    { data: openPlaytestRow, error: openPlaytestError },
    { data: pendingApplications, error: applicationsError },
    { data: pendingSessions, error: sessionsError },
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
      : Promise.resolve({ data: null, error: null }),
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
      : Promise.resolve({ data: null, error: null }),
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
  ])

  type RawApplication = { id: string; message: string; created_at: string; profiles: { username: string; display_name: string | null } | null; collaboration_posts: { id: string; role_needed: string | null } }
  type RawSession = { id: string; created_at: string; profiles: { username: string; display_name: string | null } | null; playtest_requests: { id: string; projects: { title: string } | null } }
  const applications = (pendingApplications ?? []) as unknown as RawApplication[]
  const sessions = (pendingSessions ?? []) as unknown as RawSession[]

  const latestDevlogTyped = latestDevlog as { title: string; slug: string; published_at: string } | null
  const openPlaytest = openPlaytestRow ? { id: openPlaytestRow.id, currentTesters: openPlaytestRow.current_testers as number, requestedTesters: openPlaytestRow.requested_testers as number } : null

  const nextActionResult = computeNextAction({
    currentProject: currentProject ? { id: currentProject.id, slug: currentProject.slug } : null,
    projectsFailed: !!projectsError,
    latestDevlogPublishedAt: latestDevlogTyped?.published_at ?? null,
    latestDevlogFailed: !!latestDevlogError,
    pendingApplicationsCount: applications.length,
    applicationsFailed: !!applicationsError,
    pendingSessionsCount: sessions.length,
    sessionsFailed: !!sessionsError,
    openPlaytest: openPlaytest ? { id: openPlaytest.id, currentTesters: openPlaytest.currentTesters } : null,
    openPlaytestFailed: !!openPlaytestError,
    daysSinceLatestDevlog: daysSince,
  })

  const actorOf = (p: { username: string; display_name: string | null } | null) => p?.display_name ?? p?.username ?? 'Someone'
  const attentionRaw = [
    ...applications.map((a) => ({ id: `app-${a.id}`, href: `/collaborate/${a.collaboration_posts.id}`, time: a.created_at, actor: actorOf(a.profiles), text: `applied for ${a.collaboration_posts.role_needed ?? 'a role'}`, actionLabel: 'Review application' })),
    ...sessions.map((s) => ({ id: `session-${s.id}`, href: '/dashboard/playtests', time: s.created_at, actor: actorOf(s.profiles), text: `requested to test ${s.playtest_requests.projects?.title ?? 'your project'}`, actionLabel: 'Review request' })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  const attention: AttentionItem[] = attentionRaw.map(({ id, href, actor, text, actionLabel }) => ({ id, href, actor, text, actionLabel }))

  return (
    <GlyphShell>
      <div className="mx-auto w-full max-w-[720px] space-y-10">
        <div className="flex items-center justify-between gap-3">
          <p className="text-small text-ink-3">Welcome back, {profile.display_name || profile.username}</p>
          <Link href={`/dev/${profile.username}`} className="inline-flex min-h-11 items-center gap-1.5 text-small font-medium text-ink-3 outline-none hover:text-ink-2 focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">
            <span className="hidden sm:inline">View public profile</span> <ExternalLink aria-hidden strokeWidth={1.75} className="size-3.5" />
          </Link>
        </div>

        {nextActionResult.status === 'ready' ? (
          <GlyphNextStep status="ready" step={describeNextAction(nextActionResult.action)} />
        ) : (
          <GlyphNextStep status="unavailable" />
        )}

        <GlyphProfileNudge missingFields={missing} />

        {(attention.length > 0 || applicationsError || sessionsError) && (
          <section aria-labelledby="attention-heading" className="space-y-3">
            <h2 id="attention-heading" className="text-h3 font-semibold text-ink">Needs attention</h2>
            <GlyphAttentionList items={attention} failed={!!(applicationsError || sessionsError)} />
          </section>
        )}

        {(currentProject || projectsError) && (
          <section aria-labelledby="build-heading" className="space-y-3">
            <h2 id="build-heading" className="text-h3 font-semibold text-ink">Your build</h2>
            <GlyphBuildStatus
              project={currentProject as CurrentProjectData | null}
              otherProjects={otherProjects as OtherProjectData[]}
              username={profile.username}
              latestDevlog={latestDevlogTyped}
              openPlaytest={openPlaytest}
              failed={!!projectsError}
            />
          </section>
        )}
      </div>
    </GlyphShell>
  )
}
