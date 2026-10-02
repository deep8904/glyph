'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HonestImage } from '@/components/glyph/ui/HonestImage'
import { isHttpsUrl, relativeTime } from '@/lib/utils'
import { labelFor, PROJECT_STAGES } from '@/lib/supabase/types'

const monogram = (t: string) => t.replace(/[^\p{L}\p{N} ]/gu, '').split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '·'

export type OtherProjectData = {
  id: string
  title: string
  slug: string | null
  stage: string | null
  lifecycle: string | null
  cover_url: string | null
  cover_image_url: string | null
  updated_at: string
}

/**
 * Compact row for a developer's additional projects, sharing Explore's row grammar (same object,
 * different context) but its own file since Profile's project shape has no username/engine/genre.
 * A fixed 56px thumbnail slot degrades to the honest monogram plate on missing or failed media —
 * never a fabricated cover, never a collapsed/jumpy row.
 */
export function GlyphOtherProjectRow({ project, username, isOwner = false }: { project: OtherProjectData; username: string; isOwner?: boolean }) {
  const href = project.slug ? `/p/${username}/${project.slug}` : null
  const stage = project.stage ? labelFor(PROJECT_STAGES, project.stage) : null
  const cover = isHttpsUrl(project.cover_url) ? (project.cover_url as string) : isHttpsUrl(project.cover_image_url) ? (project.cover_image_url as string) : null
  const [failed, setFailed] = useState(false)
  const showImage = cover && !failed
  const showBadge = isOwner && project.lifecycle !== 'published'

  const inner = (
    <>
      <div className="relative size-14 shrink-0 overflow-hidden rounded-[10px] border border-hair bg-sunken">
        {showImage ? (
          <HonestImage src={cover} alt="" className="size-full object-cover" onFail={() => setFailed(true)} />
        ) : (
          <div className="flex size-full items-center justify-center font-mono text-small font-semibold text-ink-3">{monogram(project.title)}</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-body font-medium text-ink">{project.title}</p>
          {showBadge && (
            <span className="shrink-0 rounded-full bg-sunken px-2 py-0.5 text-micro font-medium uppercase tracking-wide text-ink-3">
              {project.lifecycle === 'archived' ? 'Archived' : 'Draft'}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-small text-ink-3">
          {stage && <>{stage} · </>}Updated {relativeTime(project.updated_at)}
        </p>
      </div>
    </>
  )

  if (!href) return <div className="flex items-center gap-3 rounded-[14px] border border-hair bg-panel px-3 py-3">{inner}</div>

  return (
    <Link href={href} className="flex items-center gap-3 rounded-[14px] border border-hair bg-panel px-3 py-3 outline-none transition-colors hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ember">
      {inner}
    </Link>
  )
}
