import Link from 'next/link'
import { cn } from '@/lib/utils'

export type FilterOption = { label: string; href: string; active: boolean }

/**
 * URL-driven filter chips: every option is a real link to a shareable URL (so back/forward, reload and
 * sharing all work) and the active one carries aria-current. Used for stage / playtest / collaboration filters.
 */
export function FilterLinks({ label, options }: { label: string; options: FilterOption[] }) {
  return (
    <nav aria-label={label}>
      <ul className="-mx-1 flex flex-wrap items-center gap-1">
        {options.map((o) => (
          <li key={o.label}>
            <Link
              href={o.href}
              aria-current={o.active ? 'true' : undefined}
              className={cn(
                'inline-flex h-9 items-center rounded-control border px-3 text-small font-medium transition-colors duration-150 pointer-coarse:h-11',
                o.active ? 'border-fg bg-fg text-surface' : 'border-line-strong bg-surface text-fg-secondary hover:bg-surface-muted hover:text-fg'
              )}
            >
              {o.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
