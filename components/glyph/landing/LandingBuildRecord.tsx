import Link from 'next/link'
import { GAvatar } from '@/components/glyph/ui/primitives'
import { GEmptyState, GErrorState } from '@/components/glyph/ui/States'
import { toPlainText } from '@/lib/glyph/text'
import { relativeTime } from '@/lib/utils'
import type { LandingProofState } from '@/lib/glyph/landingProof'
import type { DevlogRowData, ProjectRowData } from '@/lib/discovery/queries'
import { LandingProofMediaSlot } from './LandingProofMediaSlot'

/**
 * The landing page's one piece of concrete product proof: a real, currently-public devlog, read as
 * Developer → Project → Build record → Participation — not a copy of the Project page's full-bleed
 * hero, the Profile's fused build-snapshot, Explore's directory tile, or the standalone Devlog's
 * log-line anatomy. Those all read as pages about one object; this reads as a small diagram of the
 * relationship between four objects, for a visitor who hasn't seen any of them yet.
 */
export function LandingBuildRecord({ state, devlog, project }: { state: LandingProofState; devlog: DevlogRowData | null; project: ProjectRowData | null }) {
  if (state.kind === 'error') {
    return <GErrorState title="The build record couldn't be loaded" description="This may be temporary — the rest of Glyph is unaffected. Reload to try again." />
  }
  if (state.kind === 'empty' || !devlog) {
    return <GEmptyState title="No public build record yet" description="As soon as a developer publishes a public devlog, it appears here — this space stays honest rather than showing something fabricated." />
  }

  const author = devlog.display_name || devlog.username
  const projectHref = `/p/${devlog.username}/${devlog.project_slug}`
  const devlogHref = `${projectHref}/${devlog.slug}`
  const excerpt = toPlainText(devlog.content_preview, 200)

  return (
    <div className="grid gap-6 rounded-[16px] border border-hair bg-panel p-5 sm:p-7 md:grid-cols-[1fr_1.3fr] md:items-center md:gap-8">
      {state.projectStatus === 'unknown' ? (
        // A project-lookup failure is not the same true statement as "this project has no cover" —
        // same stable slot geometry, but its own honest, contained message, and the devlog itself
        // (below) still renders normally.
        <div className="flex aspect-[4/3] w-full items-center justify-center rounded-[12px] border border-hair bg-sunken p-4 text-center sm:aspect-square">
          <p className="text-small text-ink-3">The project behind this devlog couldn&apos;t be checked right now.</p>
        </div>
      ) : (
        <LandingProofMediaSlot
          coverUrl={state.projectStatus === 'cover' ? (project?.cover_url ?? null) : null}
          alt={project ? `${project.title} cover art` : ''}
          monogramName={project?.title || devlog.project_title}
        />
      )}

      <div className="min-w-0">
        <p className="flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-1 text-small text-ink-2">
          <Link href={`/dev/${devlog.username}`} className="inline-flex min-h-11 max-w-full items-center gap-1.5 font-semibold text-ink outline-none [overflow-wrap:anywhere] hover:text-ember-ink focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">
            <GAvatar name={author} src={devlog.avatar_url} size={20} /> {author}
          </Link>
          <span>is building</span>
          <Link href={projectHref} className="inline-flex min-h-11 max-w-full items-center font-medium text-ink-2 underline-offset-4 outline-none [overflow-wrap:anywhere] hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">
            {devlog.project_title}
          </Link>
        </p>
        <h3 className="mt-2 text-h2 font-semibold tracking-[-0.01em] text-ink [overflow-wrap:anywhere]">
          <Link href={devlogHref} className="-my-2 block py-2 outline-none hover:text-ember-ink focus-visible:ring-2 focus-visible:ring-ember">{devlog.title}</Link>
        </h3>
        {excerpt && <p className="mt-2 text-body text-ink-2 [overflow-wrap:anywhere]">{excerpt}</p>}
        <p className="mt-2 font-mono text-micro text-ink-3">Published {relativeTime(devlog.published_at)}</p>

        <div className="mt-2 flex flex-wrap items-center gap-x-5 text-small font-medium">
          <Link href={devlogHref} className="inline-flex min-h-11 items-center underline-offset-4 text-ink outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">Read this devlog</Link>
          <Link href={projectHref} className="inline-flex min-h-11 items-center underline-offset-4 text-ink-2 outline-none hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">See the project</Link>
          <Link href="/explore" className="inline-flex min-h-11 items-center underline-offset-4 text-ink-2 outline-none hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">Explore more build records</Link>
        </div>
      </div>
    </div>
  )
}
