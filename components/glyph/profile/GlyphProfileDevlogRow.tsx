import Link from 'next/link'
import { Star } from 'lucide-react'
import { toPlainText } from '@/lib/glyph/text'
import { relativeTime } from '@/lib/utils'
import { GlyphFeaturedToggle } from '@/components/glyph/profile/GlyphFeaturedToggle'

export type ProfileDevlogData = {
  id: string
  title: string
  body: string | null
  published_at: string
  is_featured: boolean
  href: string
  projectTitle: string
}

/**
 * One entry in the Work record timeline. Curated (featured) work is distinguished from the
 * chronological record by an inline pin marker on the entry itself, not by a separate stacked
 * "Featured" section. Heading level is h3 — the timeline's own h2 sits above the list, so entry
 * titles are one level below it, never skipping to h4.
 */
export function GlyphProfileDevlogRow({ devlog, isOwner = false }: { devlog: ProfileDevlogData; isOwner?: boolean }) {
  const excerpt = toPlainText(devlog.body, 160)
  return (
    <li className="flex items-start gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-small text-ink-3">
          {devlog.is_featured && <Star aria-label="Featured" strokeWidth={1.75} className="size-3.5 fill-ember-ink text-ember-ink" />}
          via {devlog.projectTitle} · {relativeTime(devlog.published_at)}
        </p>
        <h3 className="mt-0.5 text-h3 font-medium text-ink [overflow-wrap:anywhere]">
          <Link href={devlog.href} className="outline-none hover:text-ember-ink focus-visible:ring-2 focus-visible:ring-ember">{devlog.title}</Link>
        </h3>
        {excerpt && <p className="mt-1 text-small text-ink-2 [overflow-wrap:anywhere]">{excerpt}</p>}
      </div>
      {isOwner && <GlyphFeaturedToggle devlogId={devlog.id} featured={devlog.is_featured} />}
    </li>
  )
}
