import Link from 'next/link'
import { Button } from '@/components/ui/Button'

/**
 * Newer / Older links for a paged list. The caller supplies the href for a
 * page number, so every query parameter (q, type, stage) is preserved and each
 * page has its own shareable URL.
 */
export function Pager({ page, hasMore, hrefForPage }: { page: number; hasMore: boolean; hrefForPage: (page: number) => string }) {
  if (page <= 1 && !hasMore) return null
  return (
    <nav aria-label="Pages" className="mt-4 flex items-center justify-between gap-3">
      {page > 1 ? <Button asChild variant="secondary"><Link href={hrefForPage(page - 1)} rel="prev">← Previous</Link></Button> : <span />}
      <span className="font-mono text-micro text-fg-muted">Page {page}</span>
      {hasMore ? <Button asChild variant="secondary"><Link href={hrefForPage(page + 1)} rel="next">Next →</Link></Button> : <span />}
    </nav>
  )
}
