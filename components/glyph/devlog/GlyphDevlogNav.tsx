import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export type SiblingDevlog = { slug: string; title: string } | null

/**
 * Earlier/Later in this project's own record — a two-cell log strip continuing the header's
 * provenance grammar, not a card or a rail. Only published siblings ever appear here (drafts are
 * never a valid navigation target for anyone), so this reflects real publication order.
 */
export function GlyphDevlogNav({ prev, next, username, projectSlug }: { prev: SiblingDevlog; next: SiblingDevlog; username: string; projectSlug: string }) {
  if (!prev && !next) return null
  return (
    <nav aria-label="Devlog navigation" className="mt-12 grid gap-px overflow-hidden rounded-[12px] border border-hair sm:grid-cols-2">
      {prev ? (
        <Link href={`/p/${username}/${projectSlug}/${prev.slug}`} className="group block bg-panel/60 p-4 outline-none transition-colors hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-inset">
          <span className="flex items-center gap-1.5 font-mono text-micro uppercase tracking-[0.06em] text-ink-3"><ArrowLeft aria-hidden strokeWidth={1.75} className="size-3.5" /> Earlier</span>
          <span className="mt-1 line-clamp-2 block text-body font-medium text-ink group-hover:text-ember-ink">{prev.title}</span>
        </Link>
      ) : (
        <span className="hidden bg-panel/30 sm:block" />
      )}
      {next ? (
        <Link href={`/p/${username}/${projectSlug}/${next.slug}`} className="group block bg-panel/60 p-4 text-right outline-none transition-colors hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-inset">
          <span className="flex items-center justify-end gap-1.5 font-mono text-micro uppercase tracking-[0.06em] text-ink-3">Later <ArrowRight aria-hidden strokeWidth={1.75} className="size-3.5" /></span>
          <span className="mt-1 line-clamp-2 block text-body font-medium text-ink group-hover:text-ember-ink">{next.title}</span>
        </Link>
      ) : (
        <span className="hidden bg-panel/30 sm:block" />
      )}
    </nav>
  )
}
