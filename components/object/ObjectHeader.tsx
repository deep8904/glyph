import { cn } from '@/lib/utils'

/**
 * Top of an object page: its name, where it stands, and one or two lines of who/when. The heading
 * carries its own weight — what kind of object this is belongs in `state` (a type Badge and/or a
 * StatusText, sized to sit beside the title) or is already established by the section it's in
 * (the breadcrumb, the URL); it does not get a separate label floated above the heading.
 */
export function ObjectHeader({
  title,
  state,
  leading,
  children,
  className,
}: {
  title: string
  state?: React.ReactNode
  /** e.g. a studio mark shown beside the title block */
  leading?: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  return (
    <header className={cn('flex items-start gap-4', className)}>
      {leading}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-display font-semibold text-fg [overflow-wrap:anywhere]">{title}</h1>
          {state}
        </div>
        {children && <div className="mt-2 space-y-1 text-body text-fg-secondary">{children}</div>}
      </div>
    </header>
  )
}
