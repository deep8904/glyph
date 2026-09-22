import { cn } from '@/lib/utils'

/**
 * Top of an object page: what kind of thing it is, its name, where it stands, and one or two lines of who/when.
 * Each page decides what goes in `state` (a StatusText or Badge) and in the body lines; this only fixes the rhythm
 * so Studio, Jam, Event and Publisher headers read as siblings of the Project and Devlog headers.
 */
export function ObjectHeader({
  eyebrow,
  title,
  state,
  leading,
  children,
  className,
}: {
  eyebrow: string
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
        <p className="text-small font-medium text-fg-muted">{eyebrow}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-display font-semibold text-fg [overflow-wrap:anywhere]">{title}</h1>
          {state}
        </div>
        {children && <div className="mt-2 space-y-1 text-body text-fg-secondary">{children}</div>}
      </div>
    </header>
  )
}
