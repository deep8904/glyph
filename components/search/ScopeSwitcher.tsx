import Link from 'next/link'
import { cn } from '@/lib/utils'

export type ScopeOption = { value: string; label: string; count: number | null; href: string; active: boolean }

/**
 * The retrieval-tool scope switcher — a single joined, bordered strip (not pills, not underline
 * tabs). Search's job is "I know roughly what I want, find it fast," so the switcher reads as a
 * toolbar control, deliberately distinct from Explore's underline section tabs: this is a filter
 * on one query, not navigation between browse sections.
 */
export function ScopeSwitcher({ options, label }: { options: ScopeOption[]; label: string }) {
  return (
    <nav aria-label={label} className="inline-flex w-full overflow-x-auto rounded-control border border-line-strong bg-surface [mask-image:linear-gradient(to_right,black_calc(100%-16px),transparent)] sm:w-auto sm:[mask-image:none]">
      {options.map((o, i) => (
        <Link
          key={o.value}
          href={o.href}
          aria-current={o.active ? 'page' : undefined}
          className={cn(
            'flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap px-3 text-small font-medium transition-colors duration-150',
            i > 0 && 'border-l border-line',
            o.active ? 'bg-fg text-surface' : 'text-fg-secondary hover:bg-surface-muted hover:text-fg'
          )}
        >
          {o.label}
          {o.count !== null && (
            <span className={cn('font-mono text-micro', o.active ? 'text-surface/70' : 'text-fg-muted')}>{o.count}</span>
          )}
        </Link>
      ))}
    </nav>
  )
}
