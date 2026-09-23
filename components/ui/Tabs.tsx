'use client'

import { Tabs as T } from 'radix-ui'
import Link from 'next/link'
import { cn } from '@/lib/utils'

/** In-page tabs (panels on the same URL). Radix supplies roles, arrow-key roving focus and aria-controls. */
export const Tabs = T.Root

export function TabsList({ className, ...props }: React.ComponentProps<typeof T.List>) {
  return <T.List className={cn('flex gap-1 overflow-x-auto border-b border-line [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)]', className)} {...props} />
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof T.Trigger>) {
  return (
    <T.Trigger
      className={cn(
        '-mb-px inline-flex h-10 shrink-0 items-center border-b-2 border-transparent px-3 text-small font-medium text-fg-secondary transition-colors duration-150 hover:text-fg pointer-coarse:h-11 data-[state=active]:border-accent data-[state=active]:text-fg',
        className
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof T.Content>) {
  return <T.Content className={cn('pt-4', className)} {...props} />
}

/**
 * Route tabs (each tab is its own URL — profile sections, project sections).
 * These are navigation, not ARIA tabs: a <nav> of links with aria-current.
 */
export function TabLinks({
  label,
  items,
  activeHref,
  className,
}: {
  label: string
  items: { href: string; label: string; count?: number }[]
  activeHref: string
  className?: string
}) {
  return (
    <nav aria-label={label} className={cn('flex gap-1 overflow-x-auto border-b border-line [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)]', className)}>
      {items.map((it) => {
        const active = it.href === activeHref
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              '-mb-px inline-flex h-10 shrink-0 items-center gap-1.5 border-b-2 px-3 text-small font-medium transition-colors duration-150 pointer-coarse:h-11',
              active ? 'border-accent text-fg' : 'border-transparent text-fg-secondary hover:text-fg'
            )}
          >
            {it.label}
            {it.count !== undefined && <span className="font-mono text-micro text-fg-muted">{it.count}</span>}
          </Link>
        )
      })}
    </nav>
  )
}
