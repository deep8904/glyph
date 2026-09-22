import { cn } from '@/lib/utils'

/** Section title with optional real count and a trailing action. Replaces the h2+mono-count pattern repeated across pages. */
export function SectionHeader({
  id,
  title,
  count,
  description,
  action,
  className,
}: {
  id?: string
  title: string
  count?: number
  /** One plain line under the title, e.g. how the list is ordered. */
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <h2 id={id} className="text-h3 font-semibold text-fg">
          {title}
          {count !== undefined && <span className="ml-2 font-mono text-micro font-normal text-fg-muted">{count}</span>}
        </h2>
        {description && <p className="text-small text-fg-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}
