'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HonestImage } from '@/components/glyph/ui/HonestImage'
import { GlyphOtherProjectRow, type OtherProjectData } from '@/components/glyph/profile/GlyphOtherProjectRow'
import { GErrorState } from '@/components/glyph/ui/States'
import { isHttpsUrl, relativeTime } from '@/lib/utils'
import { devlogUrl } from '@/lib/glyph/devlogUrl'
import { labelFor, PROJECT_STAGES } from '@/lib/supabase/types'

const monogram = (t: string) => t.replace(/[^\p{L}\p{N} ]/gu, '').split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '·'

export type CurrentProjectData = {
  id: string
  title: string
  slug: string | null
  stage: string | null
  lifecycle: 'draft' | 'published' | 'archived'
  cover_url: string | null
  cover_image_url: string | null
  updated_at: string
}

/**
 * "Understand current project state" and "manage projects" — a compact status object, not a
 * portfolio card. The owner always sees true lifecycle (draft/published/archived) since this is
 * an owner-only surface; a real open-playtest fact is shown inline when one exists, never a
 * fabricated metric.
 */
export function GlyphBuildStatus({
  project,
  otherProjects,
  username,
  latestDevlog,
  openPlaytest,
  failed,
}: {
  project: CurrentProjectData | null
  otherProjects: OtherProjectData[]
  username: string
  latestDevlog: { title: string; slug: string; published_at: string } | null
  openPlaytest: { id: string; currentTesters: number; requestedTesters: number } | null
  failed: boolean
}) {
  const [imgFailed, setImgFailed] = useState(false)

  if (failed) {
    return <GErrorState title="We couldn't load your projects" description="This may be temporary. Reload the page to try again." />
  }
  if (!project) return null

  const href = project.slug ? `/p/${username}/${project.slug}` : null
  const stage = project.stage ? labelFor(PROJECT_STAGES, project.stage) : null
  const cover = isHttpsUrl(project.cover_url) ? project.cover_url : isHttpsUrl(project.cover_image_url) ? project.cover_image_url : null
  const showImage = cover && !imgFailed
  const devlogHref = latestDevlog ? devlogUrl(username, project.slug, latestDevlog.slug) : null

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-[16px] border border-hair bg-panel/40 p-4 sm:flex-row sm:items-center">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-[10px] border border-hair bg-sunken">
          {showImage ? (
            <HonestImage src={cover} alt="" className="size-full object-cover" onFail={() => setImgFailed(true)} />
          ) : (
            <div className="flex size-full items-center justify-center font-mono text-small font-semibold text-ink-3">{monogram(project.title)}</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 flex-1 text-body font-semibold text-ink">
              {href ? (
                <Link href={href} className="flex min-h-11 min-w-0 max-w-full items-center truncate outline-none hover:text-ember-ink focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">{project.title}</Link>
              ) : (
                <span className="block truncate">{project.title}</span>
              )}
            </h3>
            {project.lifecycle !== 'published' && (
              <span className="shrink-0 rounded-full bg-sunken px-2 py-0.5 text-micro font-medium uppercase tracking-wide text-ink-3">{project.lifecycle === 'archived' ? 'Archived' : 'Draft'}</span>
            )}
          </div>
          <p className="mt-0.5 text-small text-ink-3 [overflow-wrap:anywhere]">
            {stage && <>{stage} · </>}
            {latestDevlog ? (
              <>
                Last devlog{' '}
                {devlogHref ? (
                  <Link href={devlogHref} className="inline-flex min-h-11 items-center font-medium text-ink-2 underline-offset-4 outline-none hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">{latestDevlog.title}</Link>
                ) : (
                  <span className="font-medium text-ink-2">{latestDevlog.title}</span>
                )}{' '}
                · {relativeTime(latestDevlog.published_at)}
              </>
            ) : (
              <>No devlogs yet</>
            )}
          </p>
          {openPlaytest && (
            <p className="mt-0.5 text-small text-ink-3">
              Playtest open · <span className="font-mono tabular-nums">{openPlaytest.currentTesters}/{openPlaytest.requestedTesters}</span> testers
            </p>
          )}
        </div>
        <Link href={`/dashboard/projects/${project.id}/edit`} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-[10px] border border-hair-strong bg-panel px-4 text-small font-medium text-ink outline-none transition-colors hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ember sm:min-h-9">
          Manage
        </Link>
      </div>

      {otherProjects.length > 0 && (
        <div>
          <h3 className="text-small font-semibold text-ink-3">Other projects</h3>
          <div className="mt-2 space-y-2">
            {otherProjects.map((p) => (
              <GlyphOtherProjectRow key={p.id} project={p} username={username} isOwner />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
