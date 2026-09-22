import { cn } from '@/lib/utils'

/**
 * Loading placeholder. Compose these into the shape of the real content so the page does not
 * jump when data arrives. Decorative: wrap a region in `<div role="status" aria-busy>` with an
 * sr-only "Loading …" line (see LoadingRegion) instead of announcing every block.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-control bg-surface-muted motion-reduce:animate-none', className)} />
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div aria-hidden className={cn('space-y-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}

/** One list row: avatar/thumb, two text lines, trailing meta. */
export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('flex items-center gap-3 py-3', className)}>
      <Skeleton className="size-10 shrink-0 rounded-media" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <Skeleton className="h-3 w-12" />
    </div>
  )
}

/** Announces loading once to assistive tech; children are the visual skeleton. */
export function LoadingRegion({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}
