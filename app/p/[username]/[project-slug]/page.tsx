import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Globe, GitBranch, Joystick, Pencil, PenLine, Building2, Trophy, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { GlyphShell } from '@/components/glyph/shell/GlyphShell'
import { GAvatar, GButton } from '@/components/glyph/ui/primitives'
import { GEmptyState, GErrorState } from '@/components/glyph/ui/States'
import { GlyphRichText } from '@/components/glyph/project/GlyphRichText'
import { GlyphProjectDevlogRow } from '@/components/glyph/project/GlyphProjectDevlogRow'
import { GlyphShortlistButton } from '@/components/glyph/project/GlyphShortlistButton'
import { GlyphCoverMedia, GlyphScreenshotGallery } from '@/components/glyph/project/GlyphMedia'
import { labelFor, ENGINES, PROJECT_STAGES, CONTRACT_TYPES } from '@/lib/supabase/types'
import { isHttpsUrl, relativeTime } from '@/lib/utils'
import type { Profile, Project } from '@/lib/supabase/types'

type RouteParams = { username: string; 'project-slug': string }

/**
 * Shared identity + visibility lookup for this route, memoized per request (React `cache`) so
 * `generateMetadata` and the page component read the profile/project once, not twice. Only the
 * minimal columns/queries needed to decide visibility and title — the heavier parallel fetch
 * (devlogs, playtest, publisher, studios, collab, jams) stays in the page below.
 */
const loadProjectIdentity = cache(async (username: string, projectSlug: string) => {
  const supabase = await createClient()
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .eq('username', username)
    .maybeSingle<Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>>()

  if (!profile) return { profile: null, project: null, isOwner: false, currentUserId: currentUser?.id ?? null }

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', profile.id)
    .eq('slug', projectSlug)
    .maybeSingle<Project>()

  const isOwner = currentUser?.id === profile.id
  return { profile, project, isOwner, currentUserId: currentUser?.id ?? null }
})

/** True when this viewer is not allowed to see the project at all (same rule the page enforces). */
function isInaccessible(project: Project | null, isOwner: boolean) {
  return !project || ((project.lifecycle === 'draft' || project.visibility === 'private') && !isOwner)
}

const SAFE_METADATA: Metadata = { title: 'Glyph', description: "The professional home for a game while it's being built." }

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { username, 'project-slug': projectSlug } = await params
  const { profile, project, isOwner } = await loadProjectIdentity(username, projectSlug)
  if (!profile || isInaccessible(project, isOwner)) return SAFE_METADATA
  return {
    title: `${project!.title} — Glyph`,
    description: project!.short_description || SAFE_METADATA.description,
  }
}

type PlaytestRequest = {
  id: string
  description: string
  platforms: string[]
  focus_areas: string[]
  requested_testers: number
  current_testers: number
  status: string
}

type StudioLink = { studios: { slug: string; name: string; status: string } | null }
type CollabPost = { id: string; post_type: string; role_needed: string | null; role_offered: string | null; contract_type: string }

const CONTRACT_LABELS = Object.fromEntries(CONTRACT_TYPES.map((c) => [c.value, c.label])) as Record<string, string>
const monogram = (title: string) => title.replace(/[^\p{L}\p{N} ]/gu, '').split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '·'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

/** Quiet section heading — no mono costume, no eyebrow above it. */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-h2 font-semibold tracking-[-0.01em] text-ink">{children}</h2>
}

export default async function PublicProjectPage({
  params,
}: {
  params: Promise<RouteParams>
}) {
  const { username, 'project-slug': projectSlug } = await params
  const { profile, project, isOwner, currentUserId } = await loadProjectIdentity(username, projectSlug)

  if (!profile || !project) notFound()
  // Draft gates viewing regardless of visibility (mirrors devlog draft behaviour and the
  // projects_read RLS policy from the B4 migration) — a private project is visibility-gated,
  // a draft project is lifecycle-gated, and both apply. Unlisted stays reachable by this exact link.
  if (isInaccessible(project, isOwner)) notFound()

  const supabase = await createClient()
  const currentUser = currentUserId ? { id: currentUserId } : null
  const nowIso = new Date().toISOString()

  const [{ data: devlogRows, error: devlogsError }, { data: openPlaytest }, { data: publisherAccount }, { data: studioLinks }, { data: collabPosts }] =
    await Promise.all([
      // Owner sees every devlog (drafts included, via owner-only RLS); visitors
      // only ever get published ones, filtered here and again by RLS.
      isOwner
        ? supabase
            .from('devlog_posts')
            .select('id, slug, title, content, published_at')
            .eq('project_id', project.id)
            .order('published_at', { ascending: false, nullsFirst: true })
            .limit(100)
        : supabase
            .from('devlog_posts')
            .select('id, slug, title, content, published_at')
            .eq('project_id', project.id)
            .not('published_at', 'is', null)
            .lte('published_at', nowIso)
            .order('published_at', { ascending: false })
            .limit(100),
      supabase
        .from('playtest_requests')
        .select('id, description, platforms, focus_areas, requested_testers, current_testers, status')
        .eq('project_id', project.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle<PlaytestRequest>(),
      currentUser && !isOwner
        ? supabase.from('publisher_accounts').select('id').eq('user_id', currentUser.id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from('studio_projects')
        .select('studios(slug, name, status)')
        .eq('project_id', project.id)
        .returns<StudioLink[]>(),
      supabase
        .from('collaboration_posts')
        .select('id, post_type, role_needed, role_offered, contract_type')
        .eq('project_id', project.id)
        .eq('status', 'open')
        .gt('expires_at', nowIso)
        .order('created_at', { ascending: false })
        .limit(5)
        .returns<CollabPost[]>(),
    ])
  const isPublisherViewer = !!publisherAccount

  // Where this project has been entered (game jams). The jam page links back here; nothing is copied.
  const { data: jamEntryRows } = await supabase
    .from('jam_entries')
    .select('id, game_jams!jam_id(slug, title, status, admin_approved)')
    .eq('project_id', project.id)
  type JamLink = { slug: string; title: string; status: string; admin_approved: boolean }
  const jams = ((jamEntryRows ?? []) as unknown as { id: string; game_jams: JamLink | null }[])
    .map((r) => r.game_jams)
    .filter((j): j is JamLink => !!j && j.admin_approved)

  const { data: publisherShortlists } = isPublisherViewer
    ? await supabase.from('publisher_shortlists').select('id, name, items').eq('publisher_id', publisherAccount!.id)
    : { data: null }
  type ShortlistRow = { id: string; name: string; items: string[] }
  const typedShortlists = (publisherShortlists ?? []) as unknown as ShortlistRow[]

  const entries = (devlogRows ?? []).map((d) => ({
    ...d,
    isDraft: !d.published_at || d.published_at > nowIso,
  }))
  const publishedCount = entries.filter((e) => !e.isDraft).length
  const latestPublished = entries.find((e) => !e.isDraft)?.published_at ?? null
  const studios = (studioLinks ?? []).map((l) => l.studios).filter((st): st is NonNullable<StudioLink['studios']> => !!st && st.status === 'active')
  const collabs = collabPosts ?? []

  const coverUrl = [project.cover_url, project.cover_image_url].find(isHttpsUrl) ?? null
  const screenshots = ((project.screenshots as string[] | null) ?? []).filter(isHttpsUrl)
  const externalLinks = Object.entries((project.external_links as Record<string, string> | null) ?? {}).filter(([, url]) => isHttpsUrl(url))

  const engine = labelFor(ENGINES, project.engine)
  const stage = labelFor(PROJECT_STAGES, project.stage)
  const ownerName = profile.display_name || profile.username
  const projectHref = `/p/${username}/${projectSlug}`
  const tags = ((project.tags as string[] | null) ?? []).filter(Boolean)
  const isArchived = project.lifecycle === 'archived'

  const metaFacts = [engine, project.genre, `Started ${formatDate(project.created_at)}`].filter(Boolean) as string[]

  return (
    <GlyphShell>
      <div className="mx-auto w-full max-w-4xl">
        {/* Identity — established in the first viewport, independent of media. Owner + project,
            stage/lifecycle truth, evidence-of-activity, and the one viewer-relative primary action. */}
        <div>
          <Link href={`/dev/${username}`} className="group inline-flex items-center gap-2.5 outline-none">
            <GAvatar name={ownerName} src={profile.avatar_url} size={28} />
            <span className="text-small font-medium text-ink-2 group-hover:text-ink">{ownerName}</span>
            <span className="font-mono text-micro text-ink-3">@{profile.username}</span>
          </Link>

          <div className="mt-4 flex items-start gap-4">
            {!coverUrl && (
              <span aria-hidden className="mt-1 flex size-14 shrink-0 items-center justify-center rounded-[12px] border border-hair bg-sunken font-mono text-h3 font-semibold text-ink-2">
                {monogram(project.title)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-display font-semibold tracking-[-0.025em] text-ink [overflow-wrap:anywhere]">{project.title}</h1>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                {stage && <span className="rounded-full bg-sunken px-2.5 py-0.5 text-small font-medium text-ink-2">{stage}</span>}
                {isArchived && <span className="font-mono text-micro uppercase tracking-[0.08em] text-ink-3">Archived</span>}
                {openPlaytest && <span className="inline-flex items-center gap-1.5 rounded-full bg-ember px-2.5 py-0.5 text-small font-semibold text-ink-on-ember"><span aria-hidden className="size-1.5 rounded-full bg-ink-on-ember" />Open playtest</span>}
                {isOwner && project.visibility !== 'public' && (
                  <span className="rounded-full bg-gwarning/15 px-2.5 py-0.5 text-small font-medium text-gwarning">{project.visibility === 'private' ? 'Private — only you can see this' : 'Unlisted — reachable by link only'}</span>
                )}
              </div>
              {metaFacts.length > 0 && <p className="mt-2 text-small text-ink-2">{metaFacts.join(' · ')}</p>}
            </div>
          </div>

          {project.short_description && <p className="mt-4 max-w-[68ch] text-body-lg leading-relaxed text-ink-2 [overflow-wrap:anywhere]">{project.short_description}</p>}

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {!isOwner && openPlaytest && <GButton asChild variant="ember" size="md"><Link href={`/playtests/${openPlaytest.id}`}>Join playtest</Link></GButton>}
            {isOwner && (
              <>
                <GButton asChild variant="outline" size="md"><Link href={`/dashboard/projects/${project.id}/edit`}><Pencil aria-hidden strokeWidth={1.75} className="size-4" /> Edit</Link></GButton>
                <GButton asChild variant="ember" size="md"><Link href={`/dashboard/projects/${project.id}/devlogs/new`}><PenLine aria-hidden strokeWidth={1.75} className="size-4" /> Write devlog</Link></GButton>
              </>
            )}
            {latestPublished && <span className="text-small text-ink-3">Last devlog {relativeTime(latestPublished)}</span>}
          </div>

          {tags.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1 font-mono text-small text-ink-3">
              {tags.map((tag) => <li key={tag}>#{tag}</li>)}
            </ul>
          )}
        </div>

        {/* Media — evidence, not identity. Real crop preserved, no overlay, honest labelling. A
            failed load or a disabled image never leaves a reserved slot (GlyphCoverMedia /
            GlyphScreenshotGallery own their own error handling and unmount rather than showing a
            broken box). */}
        {coverUrl && <GlyphCoverMedia src={coverUrl} alt={`${project.title} cover art`} />}

        {screenshots.length > 0 && (
          <GlyphScreenshotGallery
            title="Screenshots"
            screenshots={screenshots.map((url, i) => ({ url, alt: `${project.title} screenshot ${i + 1}` }))}
          />
        )}

        {project.long_description && (
          <section aria-labelledby="about" className="mt-10 max-w-[68ch]">
            <SectionHeading><span id="about">About</span></SectionHeading>
            <div className="mt-4"><GlyphRichText content={project.long_description} /></div>
          </section>
        )}

        {/* Development record — the differentiator: evidence this is actively being built. */}
        <section aria-labelledby="devlogs" className="mt-12">
          <div className="flex items-baseline gap-2">
            <SectionHeading><span id="devlogs">Development record</span></SectionHeading>
            {publishedCount > 0 && <span className="font-mono text-small tabular-nums text-ink-3">{publishedCount}</span>}
          </div>
          <div className="mt-4">
            {devlogsError ? (
              <GErrorState title="We couldn't load the devlogs" description="This may be temporary. Reload the page to try again." />
            ) : entries.length > 0 ? (
              <ul>
                {entries.map((entry) => (
                  <GlyphProjectDevlogRow key={entry.id} entry={entry} projectHref={projectHref} editHref={isOwner ? `/dashboard/projects/${project.id}/devlogs/${entry.id}/edit` : undefined} />
                ))}
              </ul>
            ) : (
              <GEmptyState
                title="No devlogs yet"
                description={isOwner ? "The first one starts this project's public record — the history testers and collaborators read to catch up." : `${ownerName} hasn't published a devlog for this project yet.`}
                action={isOwner ? <GButton asChild variant="ember" size="sm" className="h-11 sm:h-9"><Link href={`/dashboard/projects/${project.id}/devlogs/new`}>Write the first devlog</Link></GButton> : undefined}
              />
            )}
          </div>
        </section>

        {/* Supporting context — discoverable without a persistent rail. Only sections with real data render. */}
        {(openPlaytest || collabs.length > 0) && (
          <section aria-labelledby="involved" className="mt-12">
            <SectionHeading><span id="involved">Get involved</span></SectionHeading>
            <div className="mt-4 space-y-4">
              {openPlaytest && (
                <div className="rounded-[12px] border border-hair bg-panel p-4">
                  <div className="flex items-center gap-2"><span aria-hidden className="size-1.5 rounded-full bg-ember" /><p className="text-small font-medium text-ink">Open playtest</p></div>
                  <p className="mt-1.5 text-small text-ink-2">
                    <span className="font-mono tabular-nums text-ink">{openPlaytest.current_testers}/{openPlaytest.requested_testers}</span> testers
                    {openPlaytest.focus_areas.length > 0 && <> · {openPlaytest.focus_areas.map((f) => f.replace(/_/g, ' ')).join(', ')}</>}
                  </p>
                  {/* The single Ember "Join playtest" primary action already lives in the identity
                      row above — this stays a quiet secondary affordance to the same destination
                      (owner: manage it instead) so the page never shows two equivalent CTAs. */}
                  <GButton asChild variant="outline" size="sm" className="mt-3 h-11 sm:h-9">
                    <Link href={isOwner ? '/dashboard/playtests' : `/playtests/${openPlaytest.id}`}>{isOwner ? 'Manage playtest' : 'View playtest details'}</Link>
                  </GButton>
                </div>
              )}
              {collabs.length > 0 && (
                <div className="rounded-[12px] border border-hair bg-panel p-4">
                  <p className="mb-1 flex items-center gap-2 text-small font-medium text-ink"><Users aria-hidden strokeWidth={1.75} className="size-4 text-ink-3" /> Looking for collaborators</p>
                  <ul className="divide-y divide-hair">
                    {collabs.map((post) => (
                      <li key={post.id}>
                        <Link href={`/collaborate/${post.id}`} className="group flex min-h-11 items-center justify-between gap-3 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ember">
                          <span className="truncate text-small text-ink group-hover:text-ember-ink">{post.post_type === 'seeking_collaborator' ? `Seeking ${post.role_needed ?? 'a role'}` : `Offering ${post.role_offered ?? 'help'}`}</span>
                          <span className="shrink-0 font-mono text-micro text-ink-3">{CONTRACT_LABELS[post.contract_type] ?? post.contract_type}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {(studios.length > 0 || jams.length > 0) && (
          <section aria-labelledby="elsewhere" className="mt-12">
            <SectionHeading><span id="elsewhere">Elsewhere on Glyph</span></SectionHeading>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {studios.length > 0 && (
                <div>
                  <p className="mb-2 text-micro font-medium text-ink-3">Studio</p>
                  <ul className="space-y-1">{studios.map((st) => <li key={st.slug}><Link href={`/studios/${st.slug}`} className="inline-flex min-h-11 items-center gap-1.5 text-small text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-9"><Building2 aria-hidden strokeWidth={1.75} className="size-3.5" /> {st.name}</Link></li>)}</ul>
                </div>
              )}
              {jams.length > 0 && (
                <div>
                  <p className="mb-2 text-micro font-medium text-ink-3">Game jams</p>
                  <ul className="space-y-1">{jams.map((j) => <li key={j.slug}><Link href={`/jams/${j.slug}`} className="inline-flex min-h-11 items-center gap-1.5 text-small text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-9"><Trophy aria-hidden strokeWidth={1.75} className="size-3.5" /> {j.title}</Link></li>)}</ul>
                </div>
              )}
            </div>
          </section>
        )}

        {externalLinks.length > 0 && (
          <section aria-labelledby="links" className="mt-12">
            <SectionHeading><span id="links">Links</span></SectionHeading>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {externalLinks.map(([platform, url]) => {
                const Icon = platform.toLowerCase().includes('github') ? GitBranch : platform.toLowerCase().includes('itch') ? Joystick : Globe
                return (
                  <li key={platform}>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-small font-medium text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember">
                      <Icon aria-hidden strokeWidth={1.75} className="size-4" /> {platform}<span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {isPublisherViewer && (
          <section aria-labelledby="publisher" className="mt-12 border-t border-hair pt-8">
            <SectionHeading><span id="publisher">Publisher tools</span></SectionHeading>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <GlyphShortlistButton projectId={project.id} shortlists={typedShortlists} />
              <Link href={`/dashboard/publisher/contact/${project.owner_id}?project=${project.id}`} className="text-small font-medium text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember">Contact developer about this project</Link>
            </div>
          </section>
        )}
      </div>
    </GlyphShell>
  )
}
