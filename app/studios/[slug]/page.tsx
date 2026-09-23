import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Building2, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DiscoveryFrame } from '@/components/discovery/DiscoveryFrame'
import { ProjectRow } from '@/components/project/ProjectRow'
import { DevlogRow, fromDiscoveryRow } from '@/components/devlog/DevlogRow'
import { MemberRow, type Member } from '@/components/studios/MemberRow'
import { ObjectHeader } from '@/components/object/ObjectHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { MetadataBar } from '@/components/ui/MetadataBar'
import { Section } from '@/components/ui/Section'
import { STUDIO_SIZES } from '@/lib/supabase/types'
import { isHttpsUrl } from '@/lib/utils'
import type { DevlogRowData, ProjectRowData } from '@/lib/discovery/queries'

const SIZE_LABELS = Object.fromEntries(STUDIO_SIZES.map((s) => [s.value, s.label]))
const RANK: Record<string, number> = { owner: 0, admin: 1, member: 2 }
type TeamRow = Member & { joined_at: string }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('studios').select('name').eq('slug', slug).eq('status', 'active').maybeSingle()
  return { title: data ? `${data.name} — Glyph` : 'Studio — Glyph' }
}

/**
 * Public studio page: an organisation identity around work that already exists in Glyph.
 * Identity → About → Projects (the canonical project rows, linked to /p/…) → Team (developers, linked to /dev/…)
 * → Recent work (the newest published devlogs of those projects, linked to their canonical pages).
 * The studio owns no posts or content of its own; membership and management are separate screens.
 */
export default async function StudioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: studio } = await supabase
    .from('studios')
    .select('id, slug, name, description, logo_url, website, founded_year, location, size, verified')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()
  if (!studio) notFound()

  const [{ data: links }, { data: teamRows, error: teamError }] = await Promise.all([
    supabase.from('studio_projects').select('project_id').eq('studio_id', studio.id),
    supabase.from('studio_team').select('user_id, role, joined_at, username, display_name, avatar_url, primary_role').eq('studio_id', studio.id).returns<TeamRow[]>(),
  ])
  const projectIds = (links ?? []).map((l) => l.project_id)
  // discoverable_projects = public, slugged, viewer-relative (block/mute) — so unlisted and private projects never surface through a studio.
  const { data: projectRows, error: projectsError } = projectIds.length
    ? await supabase
        .from('discoverable_projects')
        .select('id, title, short_description, slug, stage, tags, engine, genre, cover_url, username, display_name, last_activity_at, has_open_playtest')
        .in('id', projectIds)
        .order('last_activity_at', { ascending: false })
        .returns<ProjectRowData[]>()
    : { data: [] as ProjectRowData[], error: null }
  const projects = projectRows ?? []
  const team = [...(teamRows ?? [])].sort((a, b) => (RANK[a.role] ?? 9) - (RANK[b.role] ?? 9) || a.joined_at.localeCompare(b.joined_at))

  // Recent work: the studio's own projects' newest devlogs (existing devlogs, same visibility rules as Explore).
  const slugs = [...new Set(projects.map((p) => p.slug))]
  const { data: devlogRows } = slugs.length
    ? await supabase
        .from('discoverable_devlogs')
        .select('id, slug, title, content_preview, published_at, project_title, project_slug, username, display_name, avatar_url')
        .in('project_slug', slugs)
        .order('published_at', { ascending: false })
        .limit(30)
        .returns<DevlogRowData[]>()
    : { data: [] as DevlogRowData[] }
  const owned = new Set(projects.map((p) => `${p.username}/${p.slug}`))
  const recent = (devlogRows ?? []).filter((d) => owned.has(`${d.username}/${d.project_slug}`)).slice(0, 5)

  return (
    <DiscoveryFrame label="Studios">
      {async (viewer) => {
        const [{ data: mine }, { count: invited }] = viewer
          ? await Promise.all([
              supabase.from('studio_members').select('role').eq('studio_id', studio.id).eq('user_id', viewer.id).maybeSingle(),
              supabase.from('studio_invitations').select('id', { count: 'exact', head: true }).eq('studio_id', studio.id).eq('invitee_id', viewer.id).eq('status', 'pending').gt('expires_at', new Date().toISOString()),
            ])
          : [{ data: null }, { count: 0 }]
        const website = isHttpsUrl(studio.website) ? studio.website : null
        const logo = isHttpsUrl(studio.logo_url) ? studio.logo_url : null

        return (
          <article className="max-w-3xl">
            <ObjectHeader
              title={studio.name}
              state={studio.verified ? <Badge tone="success">Verified studio</Badge> : undefined}
              leading={
                logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt="" className="size-16 shrink-0 rounded-media border border-line object-cover" />
                ) : (
                  <span aria-hidden className="flex size-16 shrink-0 items-center justify-center rounded-media border border-line bg-surface-muted text-h1 font-semibold text-fg-muted">
                    {studio.name.charAt(0).toUpperCase()}
                  </span>
                )
              }
            >
              <MetadataBar
                items={[
                  { label: 'Size', value: studio.size ? SIZE_LABELS[studio.size] : null },
                  { label: 'Location', value: studio.location },
                  { label: 'Founded', value: studio.founded_year ? String(studio.founded_year) : null, mono: true },
                  { label: 'Website', value: website ? <a href={website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-link underline-offset-2 hover:underline"><Globe aria-hidden strokeWidth={1.75} className="size-3.5" />{new URL(website).hostname}<span className="sr-only"> (opens in a new tab)</span></a> : null },
                ]}
              />
              {mine && <p className="pt-2"><Button asChild variant="secondary" size="sm"><Link href={`/dashboard/studios/${studio.slug}`}>Manage studio</Link></Button></p>}
            </ObjectHeader>

            {!mine && (invited ?? 0) > 0 && (
              <p role="status" className="mt-6 rounded-media border border-warning-line bg-warning-subtle px-4 py-3 text-small text-warning">
                You have been invited to join this studio. <Link href="/dashboard/studios" className="font-medium underline">Review the invitation</Link>.
              </p>
            )}

            <div className="mt-8 space-y-8">
              {studio.description && (
                <Section id="studio-about" title="About">
                  <p className="max-w-prose whitespace-pre-wrap text-body text-fg-secondary [overflow-wrap:anywhere]">{studio.description}</p>
                </Section>
              )}

              <Section id="studio-projects" title="Projects" count={projects.length || undefined} description="The studio's public projects. Each opens its own project page.">
                {projectsError ? (
                  <ErrorState inline title="We couldn't load the projects" description="This may be temporary. Reload the page to try again." />
                ) : projects.length === 0 ? (
                  <EmptyState kind="first-use" className="border-y-0 py-2" title={`${studio.name} has no public projects yet`} description="Projects appear here when a member links one and it is public." />
                ) : (
                  <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                    {projects.map((p) => <ProjectRow key={p.id} variant="listing" project={p} />)}
                  </ul>
                )}
              </Section>

              <Section id="studio-team" title="Team" count={team.length || undefined} description="Developers in this studio. Each opens their profile.">
                {teamError ? (
                  <ErrorState inline title="We couldn't load the team" description="This may be temporary. Reload the page to try again." />
                ) : team.length === 0 ? (
                  <EmptyState kind="cleared" className="border-y-0 py-2" title="No team members to show" />
                ) : (
                  <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                    {team.map((m) => <MemberRow key={m.user_id} member={m} />)}
                  </ul>
                )}
              </Section>

              {recent.length > 0 && (
                <Section id="studio-recent" title="Recent work" description="The newest devlogs from the studio's projects.">
                  <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                    {recent.map((d) => <DevlogRow key={d.id} variant="listing" devlog={fromDiscoveryRow(d)} />)}
                  </ul>
                </Section>
              )}
            </div>
            <p className="mt-8 flex items-center gap-1.5 text-small text-fg-muted"><Building2 aria-hidden strokeWidth={1.75} className="size-3.5" /> A studio is a shared identity; the work lives on project pages.</p>
          </article>
        )
      }}
    </DiscoveryFrame>
  )
}
