'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HonestImage } from '@/components/glyph/ui/HonestImage'
import { SampleTag } from '@/components/glyph/ui/SampleTag'
import { isSampleMedia } from '@/lib/glyph/media'
import { toPlainText } from '@/lib/glyph/text'
import { projectHref, cadenceLabel } from '@/lib/glyph/buildSnapshot'
import { isHttpsUrl, relativeTime } from '@/lib/utils'
import { labelFor, PROJECT_STAGES } from '@/lib/supabase/types'

const monogram = (t: string) => t.replace(/[^\p{L}\p{N} ]/gu, '').split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '·'

export type SnapshotProject = {
  id: string
  title: string
  slug: string | null
  stage: string | null
  short_description: string | null
  cover_url: string | null
  cover_image_url: string | null
  updated_at: string
  lifecycle: 'draft' | 'published' | 'archived'
}
export type SnapshotDevlog = { title: string; body: string | null; published_at: string }

/**
 * The single object that answers "what are they making, and what happened recently?" — current
 * project, latest devlog evidence, and posting cadence fused into one profile-specific object.
 * Not a Current Work section that links out to a separate metadata bar, and not a miniature copy
 * of the Project page's own hero: no full-bleed cover, no gallery, an eyebrow label instead of a
 * section title, and the devlog excerpt lives inline rather than as a "view project" afterthought.
 *
 * A project without a canonical route (no slug yet) never becomes a fake link: the media and title
 * render as plain, non-interactive content and no CTA is offered.
 */
export function GlyphBuildSnapshot({
  project,
  username,
  projectDevlogsDesc,
  isOwner = false,
}: {
  project: SnapshotProject
  username: string
  /** This project's own published devlogs, newest first — drives both the excerpt and cadence. */
  projectDevlogsDesc: SnapshotDevlog[]
  isOwner?: boolean
}) {
  const href = projectHref(username, project.slug)
  const stage = project.stage ? labelFor(PROJECT_STAGES, project.stage) : null
  const cover = isHttpsUrl(project.cover_url) ? (project.cover_url as string) : isHttpsUrl(project.cover_image_url) ? (project.cover_image_url as string) : null
  const [failed, setFailed] = useState(false)
  const showImage = cover && !failed

  const latest = projectDevlogsDesc[0] ?? null
  const excerpt = latest ? toPlainText(latest.body, 150) : null
  const cadence = cadenceLabel(projectDevlogsDesc.map((d) => d.published_at))

  const media = (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[16px] border border-hair bg-sunken sm:aspect-square sm:w-[220px] sm:shrink-0">
      {showImage ? (
        <>
          <HonestImage src={cover} alt="" className="size-full object-cover" onFail={() => setFailed(true)} />
          {isSampleMedia(cover) && <SampleTag />}
        </>
      ) : (
        <div className="flex size-full items-center justify-center font-mono text-h1 font-semibold text-ink-2">{monogram(project.title)}</div>
      )}
    </div>
  )

  return (
    <div className="rounded-[20px] border border-hair bg-panel/60 p-5 sm:p-7">
      <h2 className="text-micro font-semibold uppercase tracking-[0.08em] text-ink-3">Building now</h2>
      <div className="mt-4 flex flex-col gap-6 sm:flex-row">
        {href ? (
          <Link href={href} aria-label={project.title} className="outline-none focus-visible:ring-2 focus-visible:ring-ember rounded-[16px]">
            {media}
          </Link>
        ) : (
          media
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {stage && <span className="rounded-full bg-sunken px-2.5 py-0.5 text-small font-medium text-ink-2">{stage}</span>}
            {isOwner && project.lifecycle !== 'published' && (
              <span className="rounded-full bg-sunken px-2.5 py-0.5 text-small font-medium text-ink-2">{project.lifecycle === 'archived' ? 'Archived' : 'Draft'}</span>
            )}
          </div>
          {href ? (
            <h3 className="mt-2 text-display font-semibold tracking-[-0.02em] text-ink [overflow-wrap:anywhere]">
              <Link href={href} className="outline-none hover:text-ember-ink focus-visible:ring-2 focus-visible:ring-ember">{project.title}</Link>
            </h3>
          ) : (
            <p className="mt-2 text-display font-semibold tracking-[-0.02em] text-ink [overflow-wrap:anywhere]">{project.title}</p>
          )}
          {project.short_description && <p className="mt-2 max-w-prose text-body text-ink-2 [overflow-wrap:anywhere]">{project.short_description}</p>}

          <div className="mt-4 border-t border-hair pt-4">
            {latest ? (
              <>
                <p className="text-small text-ink-3">Latest build note</p>
                <p className="mt-1 text-body font-medium text-ink [overflow-wrap:anywhere]">{latest.title}</p>
                {excerpt && <p className="mt-1 max-w-prose text-small text-ink-2 [overflow-wrap:anywhere]">{excerpt}</p>}
                <p className="mt-1.5 text-small text-ink-3">
                  {relativeTime(latest.published_at)}
                  {cadence && <span> · {cadence}</span>}
                </p>
              </>
            ) : (
              <p className="text-small text-ink-3">No build notes yet · updated {relativeTime(project.updated_at)}</p>
            )}
          </div>

          {href && (
            <Link href={href} className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-small font-medium text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">
              View project
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
