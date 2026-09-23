import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Globe, GitBranch, Joystick, Pencil, PenLine, Building2, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { DevlogRow } from '@/components/devlog/DevlogRow'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { MetadataBar } from '@/components/ui/MetadataBar'
import { MarkdownRenderer } from '@/components/devlog/MarkdownRenderer'
import { OpportunitySummary } from '@/components/project/OpportunitySummary'
import { AddToShortlistButton } from '@/components/publisher/AddToShortlistButton'
import { labelFor, ENGINES, PROJECT_STAGES, CONTRACT_TYPES } from '@/lib/supabase/types'
import { isHttpsUrl, relativeTime } from '@/lib/utils'
import type { Profile, Project } from '@/lib/supabase/types'
import { Shell } from '@/components/shell/Shell'

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default async function PublicProjectPage({
  params,
}: {
  params: Promise<{ username: string; 'project-slug': string }>
}) {
  const { username, 'project-slug': projectSlug } = await params
  const supabase = await createClient()

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .eq('username', username)
    .maybeSingle<Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>>()

  if (!profile) notFound()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', profile.id)
    .eq('slug', projectSlug)
    .maybeSingle<Project>()

  if (!project) notFound()

  const isOwner = currentUser?.id === profile.id

  if (project.visibility === 'private' && !isOwner) notFound()

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

  const facts = [
    // Stage is already the title badge above — stating it a second time here was pure repetition.
    { label: 'Engine', value: engine },
    { label: 'Genre', value: project.genre },
    { label: 'Started', value: formatDate(project.created_at) },
    { label: 'Last devlog', value: latestPublished ? relativeTime(latestPublished) : null },
    { label: 'Devlogs', value: publishedCount > 0 ? String(publishedCount) : null, mono: true },
  ]
  const tags = ((project.tags as string[] | null) ?? []).filter(Boolean)

  const ownerActions = isOwner ? (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="secondary" size="sm"><Link href={`/dashboard/projects/${project.id}/edit`}><Pencil aria-hidden strokeWidth={1.75} className="size-4" /> Edit</Link></Button>
      <Button asChild variant="primary" size="sm"><Link href={`/dashboard/projects/${project.id}/devlogs/new`}><PenLine aria-hidden strokeWidth={1.75} className="size-4" /> Write devlog</Link></Button>
    </div>
  ) : null

  // The context rail: who + facts + how to participate + where else this project lives. Rendered
  // in the Shell's rail slot ≥1280px, and inline (below the hero) under that width.
  const railContent = (
    <div className="space-y-7">
      <div>
        <Link href={`/dev/${username}`} className="group flex items-center gap-3">
          <Avatar name={ownerName} src={profile.avatar_url} size="lg" />
          <span className="min-w-0">
            <span className="block truncate text-body font-semibold text-fg group-hover:text-link">{ownerName}</span>
            <span className="block truncate font-mono text-micro text-fg-muted">@{profile.username}</span>
          </span>
        </Link>
      </div>

      <div className="border-t border-line-subtle pt-5">
        <h2 className="mb-2 font-mono text-micro font-medium uppercase tracking-wide text-fg-muted">Details</h2>
        <MetadataBar layout="stacked" items={facts} />
      </div>

      {(openPlaytest || collabs.length > 0) && (
        <div className="space-y-3 border-t border-line-subtle pt-5">
          <h2 className="font-mono text-micro font-medium uppercase tracking-wide text-fg-muted">Get involved</h2>
          {openPlaytest && (
            <OpportunitySummary title="Open playtest">
              <p className="text-small text-fg-secondary">
                <span className="font-mono text-fg">{openPlaytest.current_testers}/{openPlaytest.requested_testers}</span> testers
                {openPlaytest.focus_areas.length > 0 && <> · {openPlaytest.focus_areas.map((f) => f.replace(/_/g, ' ')).join(', ')}</>}
              </p>
              <Button asChild variant={isOwner ? 'secondary' : 'primary'} size="sm" className="mt-3">
                <Link href={isOwner ? '/dashboard/playtests' : `/playtests/${openPlaytest.id}`}>{isOwner ? 'Manage playtest' : 'View and sign up'}</Link>
              </Button>
            </OpportunitySummary>
          )}
          {collabs.length > 0 && (
            <OpportunitySummary title="Looking for collaborators">
              <ul className="divide-y divide-line-subtle">
                {collabs.map((post) => (
                  <li key={post.id}>
                    <Link href={`/collaborate/${post.id}`} className="group flex min-h-11 items-center justify-between gap-3 py-1.5">
                      <span className="truncate text-small text-fg group-hover:text-link">{post.post_type === 'seeking_collaborator' ? `Seeking ${post.role_needed ?? 'a role'}` : `Offering ${post.role_offered ?? 'help'}`}</span>
                      <span className="shrink-0 font-mono text-micro text-fg-muted">{CONTRACT_LABELS[post.contract_type] ?? post.contract_type}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </OpportunitySummary>
          )}
        </div>
      )}

      {externalLinks.length > 0 && (
        <div className="border-t border-line-subtle pt-5">
          <h2 className="mb-1.5 font-mono text-micro font-medium uppercase tracking-wide text-fg-muted">Links</h2>
          <ul>
            {externalLinks.map(([platform, url]) => {
              const Icon = platform.toLowerCase().includes('github') ? GitBranch : platform.toLowerCase().includes('itch') ? Joystick : Globe
              return (
                <li key={platform}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-small font-medium text-link underline-offset-2 hover:underline lg:min-h-0 lg:py-1">
                    <Icon aria-hidden strokeWidth={1.75} className="size-4" /> {platform}<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {(studios.length > 0 || jams.length > 0) && (
        <div className="space-y-4 border-t border-line-subtle pt-5">
          {studios.length > 0 && (
            <div>
              <h2 className="mb-1.5 font-mono text-micro font-medium uppercase tracking-wide text-fg-muted">Studio</h2>
              <ul className="space-y-0.5">
                {studios.map((st) => <li key={st.slug}><Link href={`/studios/${st.slug}`} className="inline-flex min-h-11 items-center gap-1.5 text-small text-link underline-offset-2 hover:underline lg:min-h-0"><Building2 aria-hidden strokeWidth={1.75} className="size-3.5" /> {st.name}</Link></li>)}
              </ul>
            </div>
          )}
          {jams.length > 0 && (
            <div>
              <h2 className="mb-1.5 font-mono text-micro font-medium uppercase tracking-wide text-fg-muted">Game jams</h2>
              <ul className="space-y-0.5">
                {jams.map((j) => <li key={j.slug}><Link href={`/jams/${j.slug}`} className="inline-flex min-h-11 items-center gap-1.5 text-small text-link underline-offset-2 hover:underline lg:min-h-0"><Trophy aria-hidden strokeWidth={1.75} className="size-3.5" /> {j.title}</Link></li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {tags.length > 0 && (
        <div className="border-t border-line-subtle pt-5">
          <ul className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-small text-fg-secondary">
            {tags.map((tag) => <li key={tag}>#{tag}</li>)}
          </ul>
        </div>
      )}

      {isPublisherViewer && (
        <div className="space-y-2 border-t border-line-subtle pt-5">
          <h2 className="font-mono text-micro font-medium uppercase tracking-wide text-fg-muted">Publisher tools</h2>
          <AddToShortlistButton projectId={project.id} shortlists={typedShortlists} />
          <Link href={`/dashboard/publisher/contact/${project.owner_id}?project=${project.id}`} className="block text-small font-medium text-link underline-offset-2 hover:underline">Contact developer about this project</Link>
        </div>
      )}
    </div>
  )

  return (
    <Shell breadcrumb={[{ label: ownerName, href: `/dev/${username}` }, { label: project.title }]} rail={railContent}>
      <div className="mx-auto w-full max-w-3xl xl:mx-0 xl:max-w-2xl">
        {/* Hero — cinematic when there is cover art, editorial when there isn't (media poverty must
            never look like a broken box). Either way it establishes game identity in one glance. */}
        {coverUrl ? (
          <section className="relative -mx-4 overflow-hidden sm:-mx-6 sm:rounded-panel lg:-mx-8 lg:rounded-panel" style={{ boxShadow: '0 1px 2px rgb(24 25 37 / 0.06), 0 30px 60px -30px rgb(24 25 37 / 0.28)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverUrl} alt={`${project.title} cover art`} className="aspect-[3/2] max-h-[420px] w-full object-cover sm:aspect-[2/1]" />
            <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(10,10,12,.9) 6%, rgba(10,10,12,.45) 46%, rgba(10,10,12,.08) 100%)' }} />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {stage && <span className="rounded-badge bg-white/18 px-2 py-0.5 font-mono text-micro font-medium backdrop-blur-sm">{stage}</span>}
                {openPlaytest && <span className="rounded-badge bg-accent px-2 py-0.5 font-mono text-micro font-semibold">Open for playtesting</span>}
                {isOwner && project.visibility !== 'public' && <span className="rounded-badge bg-warning px-2 py-0.5 font-mono text-micro font-semibold text-white">{project.visibility === 'private' ? 'Private' : 'Unlisted'}</span>}
              </div>
              <h1 className="text-[2rem] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[2.75rem] [overflow-wrap:anywhere]">{project.title}</h1>
              {project.short_description && <p className="mt-2 max-w-[46ch] text-body leading-relaxed text-white/85 [overflow-wrap:anywhere]">{project.short_description}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
                <Link href={`/dev/${username}`} className="inline-flex items-center gap-2 text-small font-medium hover:underline"><Avatar name={ownerName} src={profile.avatar_url} size="sm" /> {ownerName}</Link>
                {!isOwner && openPlaytest && <Button asChild variant="secondary" size="sm" className="border-transparent bg-white text-fg hover:bg-white/90"><Link href={`/playtests/${openPlaytest.id}`}>Join playtest</Link></Button>}
                {isOwner && ownerActions}
              </div>
            </div>
          </section>
        ) : (
          <header>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {stage && <Badge tone="accent">{stage}</Badge>}
              {project.is_primary && <Badge>Current project</Badge>}
              {openPlaytest && <Badge tone="success">Open for playtesting</Badge>}
              {isOwner && project.visibility !== 'public' && <Badge tone="warning">{project.visibility === 'private' ? 'Private — only you can see this' : 'Unlisted — reachable by link only'}</Badge>}
            </div>
            <h1 className="text-display font-semibold tracking-[-0.02em] text-fg [overflow-wrap:anywhere]">{project.title}</h1>
            {project.short_description && <p className="mt-2 max-w-prose text-h3 font-normal text-fg-secondary [overflow-wrap:anywhere]">{project.short_description}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
              <Link href={`/dev/${username}`} className="inline-flex min-h-11 items-center gap-2 text-small font-medium text-fg hover:text-link"><Avatar name={ownerName} src={profile.avatar_url} size="sm" /> {ownerName}</Link>
              {!isOwner && openPlaytest && <Button asChild variant="primary" size="sm"><Link href={`/playtests/${openPlaytest.id}`}>Join playtest</Link></Button>}
              {isOwner && ownerActions}
            </div>
          </header>
        )}

        {/* Rail content inline below the hero on < xl (the Shell rail only renders ≥ 1280). */}
        <div className="mt-8 border-t border-line pt-6 xl:hidden">{railContent}</div>

        {/* Narrative + the development record (the differentiator, given its own weight). */}
        <div className="mt-10 space-y-12">
          {project.long_description && (
            <section aria-labelledby="about">
              <h2 id="about" className="mb-4 text-h2 font-semibold tracking-[-0.01em] text-fg">About</h2>
              <MarkdownRenderer content={project.long_description} />
            </section>
          )}

          {screenshots.length > 0 && (
            <section aria-labelledby="screenshots">
              <h2 id="screenshots" className="mb-4 text-h2 font-semibold tracking-[-0.01em] text-fg">Screenshots</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {screenshots.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={url} alt={`${project.title} screenshot ${i + 1}`} loading="lazy" className="aspect-video w-full rounded-media border border-line object-cover transition-transform duration-300 ease-out motion-safe:hover:scale-[1.01]" />
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="devlogs">
            <div className="mb-4 flex items-baseline gap-2">
              <h2 id="devlogs" className="text-h2 font-semibold tracking-[-0.01em] text-fg">Development history</h2>
              {publishedCount > 0 && <span className="font-mono text-small text-fg-muted">{publishedCount}</span>}
            </div>
            {devlogsError ? (
              <ErrorState inline title="We couldn't load the devlogs" description="This may be temporary. Reload the page to try again." />
            ) : entries.length > 0 ? (
              <ol className="divide-y divide-line-subtle border-y border-line-subtle">
                {entries.map((entry) => (
                  <DevlogRow key={entry.id} variant="timeline" entry={entry} projectHref={projectHref} editHref={isOwner ? `/dashboard/projects/${project.id}/devlogs/${entry.id}/edit` : undefined} />
                ))}
              </ol>
            ) : (
              <EmptyState
                kind="first-use"
                className="border-y-0 py-2"
                title="No devlogs yet"
                description={isOwner ? "The first one starts this project's public record." : `${ownerName} hasn't published a devlog for this project yet.`}
                action={isOwner ? <Button asChild variant="primary" size="sm"><Link href={`/dashboard/projects/${project.id}/devlogs/new`}>Write the first devlog</Link></Button> : undefined}
              />
            )}
          </section>
        </div>
      </div>
    </Shell>
  )
}
