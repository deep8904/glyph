'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BadgeCheck } from 'lucide-react'
import { HonestImage } from '@/components/glyph/ui/HonestImage'
import { isHttpsUrl } from '@/lib/utils'
import { labelFor, STUDIO_SIZES } from '@/lib/supabase/types'
import type { StudioRowData } from '@/lib/discovery/queries'

const monogram = (t: string) => t.replace(/[^\p{L}\p{N} ]/gu, '').split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '·'

/**
 * A studio as a search result: team identity first (logo/plate, name, verified mark), then size —
 * no project thumbnails here, that's the studio page's own job. Own small anatomy — a studio is a
 * team, not a person or a project, so it doesn't borrow the developer or project row. Logo failure
 * (pre- or post-hydration) degrades to the same honest monogram plate as "no logo," never a broken
 * icon or dead space — same `HonestImage` mechanism already proven on Profile/Project/Dashboard.
 */
export function GlyphStudioResultRow({ studio }: { studio: StudioRowData }) {
  const size = labelFor(STUDIO_SIZES, studio.size) ?? studio.size
  const logo = isHttpsUrl(studio.logo_url) ? studio.logo_url : null
  const [failed, setFailed] = useState(false)
  const showImage = logo && !failed

  return (
    <li className="border-b border-hair">
      <Link href={`/studios/${studio.slug}`} className="group flex items-center gap-4 rounded-sm py-3.5 outline-none focus-visible:ring-2 focus-visible:ring-ember">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-[10px] border border-hair bg-sunken">
          {showImage ? (
            <HonestImage src={logo} alt="" className="size-full object-cover" onFail={() => setFailed(true)} />
          ) : (
            <div className="flex size-full items-center justify-center font-mono text-small font-semibold text-ink-2">{monogram(studio.name)}</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="flex flex-wrap items-center gap-1.5 font-semibold tracking-[-0.01em] text-ink group-hover:text-ember-ink [overflow-wrap:anywhere]">
            {studio.name}
            {studio.verified && <BadgeCheck aria-label="Verified studio" strokeWidth={1.75} className="size-4 shrink-0 text-ink-2" />}
          </h3>
          <p className="mt-0.5 text-small text-ink-3">{size}</p>
          {studio.description && <p className="mt-0.5 line-clamp-1 text-small text-ink-2">{studio.description}</p>}
        </div>
      </Link>
    </li>
  )
}
