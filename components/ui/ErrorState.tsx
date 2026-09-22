'use client'

import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

/**
 * A failed load. Visually and semantically different from an empty state: it says something went
 * wrong, that it may be temporary, and offers a retry. Never shows codes or stack traces.
 * `role="alert"` so the failure is announced. Use `inline` inside a section, default for a whole surface.
 */
export function ErrorState({
  title = "We couldn't load this",
  description = 'This may be temporary. Try again.',
  onRetry,
  retryHref,
  inline,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  /** For server-rendered surfaces where "retry" is a reload/navigation. */
  retryHref?: string
  inline?: boolean
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-media border border-danger-line bg-danger-subtle text-danger',
        inline ? 'p-3' : 'p-4',
        className
      )}
    >
      <AlertTriangle aria-hidden strokeWidth={1.75} className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-small font-medium">{title}</p>
        <p className="mt-0.5 text-small text-fg-secondary">{description}</p>
        {(onRetry || retryHref) && (
          <div className="mt-3">
            {retryHref ? (
              <Button asChild size="sm" variant="secondary">
                <a href={retryHref}>Try again</a>
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={onRetry}>Try again</Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
