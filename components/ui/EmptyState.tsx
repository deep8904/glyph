import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Four different situations, four different messages — pick the kind, then write copy for it.
 *  first-use   never created anything  → say what it is for + ONE action to start
 *  cleared     had content, now none    → say what changed, offer the way back
 *  no-results  a query/filter matched nothing → say what was searched, offer to loosen it
 *  restricted  private / not permitted → say why it is hidden and who can see it (no fake "empty")
 * Never just "Nothing here."
 */
export type EmptyKind = 'first-use' | 'cleared' | 'no-results' | 'restricted'

export function EmptyState({
  kind,
  title,
  description,
  icon: Icon,
  action,
  className,
}: {
  kind: EmptyKind
  title: string
  description?: string
  icon?: LucideIcon
  action?: React.ReactNode
  className?: string
}) {
  return (
    <section data-empty-kind={kind} className={cn('border-y border-line-subtle py-10', className)}>
      <div className="flex max-w-md flex-col items-start gap-1">
        {Icon && <Icon aria-hidden strokeWidth={1.75} className="mb-2 size-5 text-fg-muted" />}
        <h3 className="text-h3 font-semibold text-fg">{title}</h3>
        {description && <p className="text-small text-fg-secondary">{description}</p>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </section>
  )
}
