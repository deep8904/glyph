import { cn } from '@/lib/utils'

/**
 * A project-page opportunity signal (open playtest, open collaboration role) — a compact,
 * bordered block with an accent left edge, not a generic Section or a plain badge. Distinct
 * enough to read as "you can act on this" without becoming its own dashboard panel.
 */
export function OpportunitySummary({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('border-l-2 border-accent bg-accent-subtle/40 py-3 pl-4 pr-4', className)}>
      <h3 className="text-h3 font-semibold text-fg">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  )
}
