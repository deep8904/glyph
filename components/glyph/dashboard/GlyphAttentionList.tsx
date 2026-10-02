import Link from 'next/link'
import { GErrorState } from '@/components/glyph/ui/States'

export type AttentionItem = { id: string; href: string; actor: string; text: string; actionLabel: string }

/**
 * Real people waiting on a real response — a collaboration application, a playtest signup. Only
 * rendered when there is at least one, or the query that would have found them failed; an empty
 * inbox earns no space at all (no "You're all caught up" decoration).
 */
export function GlyphAttentionList({ items, failed }: { items: AttentionItem[]; failed: boolean }) {
  if (failed) {
    return <GErrorState title="We couldn't check what's waiting on you" description="This may be temporary. Reload the page to try again." />
  }
  if (items.length === 0) return null

  return (
    <ul className="divide-y divide-hair overflow-hidden rounded-[14px] border border-hair">
      {items.map((item) => (
        <li key={item.id}>
          <Link href={item.href} className="group flex min-h-11 items-center justify-between gap-3 bg-panel/60 px-4 py-3 outline-none transition-colors hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-inset">
            <span className="min-w-0 truncate text-small text-ink-2">
              <span className="font-medium text-ink">{item.actor}</span> {item.text}
            </span>
            <span className="shrink-0 text-small font-medium text-ember-ink group-hover:underline">{item.actionLabel}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
