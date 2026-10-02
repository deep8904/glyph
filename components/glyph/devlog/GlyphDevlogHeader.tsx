'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { HonestImage } from '@/components/glyph/ui/HonestImage'
import { GAvatar } from '@/components/glyph/ui/primitives'
import { isHttpsUrl } from '@/lib/utils'
import { isUnpublished } from '@/lib/glyph/devlogNav'
import { labelFor, PROJECT_STAGES } from '@/lib/supabase/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export type DevlogProject = { title: string; slug: string | null; stage: string | null; cover_url: string | null; cover_image_url: string | null }

/**
 * The masthead of a build record — a quiet, monospace "log line" carrying project provenance and
 * the real publish date ahead of the title, then the title itself at entry scale (h1, not the
 * display-hero scale Project and Profile use for their own identity) so the page reads as one
 * dated piece of evidence in a larger record, not a magazine article or a small Project page.
 */
export function GlyphDevlogHeader({
  project,
  username,
  title,
  publishedAt,
  authorName,
  authorUsername,
  authorAvatarUrl,
  isOwner,
  editHref,
}: {
  project: DevlogProject
  username: string
  title: string
  publishedAt: string | null
  authorName: string
  authorUsername: string
  authorAvatarUrl: string | null
  isOwner: boolean
  editHref: string
}) {
  const projectHref = project.slug ? `/p/${username}/${project.slug}` : null
  const stage = project.stage ? labelFor(PROJECT_STAGES, project.stage) : null
  const cover = isHttpsUrl(project.cover_url) ? project.cover_url : isHttpsUrl(project.cover_image_url) ? project.cover_image_url : null
  const [failed, setFailed] = useState(false)
  const showImage = cover && !failed

  const thumb = (
    <span className="inline-flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-[5px] border border-hair bg-sunken align-[-0.3em]">
      {showImage ? (
        <HonestImage src={cover} alt="" className="size-full object-cover" onFail={() => setFailed(true)} />
      ) : (
        <span aria-hidden className="font-mono text-[9px] font-semibold text-ink-3">{project.title.charAt(0).toUpperCase()}</span>
      )}
    </span>
  )

  return (
    <header>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-micro uppercase tracking-[0.06em] text-ink-3">
        {projectHref ? (
          <Link href={projectHref} className="inline-flex items-center gap-1.5 outline-none hover:text-ink-2 focus-visible:ring-2 focus-visible:ring-ember">
            {thumb}<span className="normal-case tracking-normal text-ink-2">{project.title}</span>
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1.5">{thumb}<span className="normal-case tracking-normal text-ink-2">{project.title}</span></span>
        )}
        {stage && <><span aria-hidden>·</span><span>{stage}</span></>}
        {publishedAt && <><span aria-hidden>·</span><time dateTime={publishedAt} className="normal-case tracking-normal">{formatDate(publishedAt)}</time></>}
      </p>

      <h1 className="mt-3 text-h1 font-semibold tracking-[-0.015em] text-ink [overflow-wrap:anywhere]">{title}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Link href={`/dev/${authorUsername}`} className="inline-flex min-h-11 items-center gap-2 text-small font-medium text-ink-2 outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">
          <GAvatar name={authorName} src={authorAvatarUrl} size={24} />
          {authorName}
        </Link>
        {isOwner && !isUnpublished(publishedAt) && (
          <Link href={editHref} className="inline-flex min-h-11 items-center gap-1.5 text-small font-medium text-ink-3 outline-none hover:text-ink-2 focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">
            <Pencil aria-hidden strokeWidth={1.75} className="size-3.5" /> Edit devlog
          </Link>
        )}
      </div>
    </header>
  )
}
