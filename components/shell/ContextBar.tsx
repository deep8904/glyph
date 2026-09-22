'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isItemActive, sectionNav } from '@/lib/shell/nav'
import type { SidebarNavFlags } from '@/lib/dashboard/identity'

export type Crumb = { label: string; href?: string }

const NO_FLAGS: SidebarNavFlags = { isAdmin: false, hasPublisherAccount: false, hasStudio: false, hasPublisherContacts: false, unreadNotifications: 0 }

/**
 * Contextual navigation under the top bar. Two independent pieces:
 *  - breadcrumb: supplied by canonical-object pages (project → its owner, devlog → project → owner)
 *  - section nav: derived from the path for route groups (Explore sections, workspace, admin)
 * Renders nothing when a route has neither.
 */
export function ContextBar({ breadcrumb, flags }: { breadcrumb?: Crumb[]; flags?: SidebarNavFlags }) {
  const pathname = usePathname()
  const section = sectionNav(pathname, flags ?? NO_FLAGS)
  if (!breadcrumb?.length && !section) return null
  return (
    <div className="border-b border-line bg-surface">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="Breadcrumb" className="px-4 sm:px-6 lg:px-8">
          <ol className="flex min-h-11 flex-wrap items-center gap-x-1 py-1 text-small text-fg-secondary">
            {breadcrumb.map((c, i) => {
              const last = i === breadcrumb.length - 1
              return (
                <li key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1">
                  {i > 0 && <ChevronRight aria-hidden strokeWidth={1.75} className="size-3.5 shrink-0 text-fg-muted" />}
                  {c.href && !last ? (
                    <Link href={c.href} className="inline-flex min-h-11 items-center truncate hover:text-fg hover:underline underline-offset-2">{c.label}</Link>
                  ) : (
                    <span aria-current={last ? 'page' : undefined} className={cn('truncate', last && 'font-medium text-fg')}>{c.label}</span>
                  )}
                </li>
              )
            })}
          </ol>
        </nav>
      )}
      {section && (
        <nav aria-label={section.label} className="flex gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
          {section.items.map((it) => {
            const active = isItemActive(pathname, it)
            return (
              <Link
                key={it.href}
                href={it.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex h-11 shrink-0 items-center border-b-2 px-3 text-small font-medium transition-colors duration-150',
                  active ? 'border-accent text-fg' : 'border-transparent text-fg-secondary hover:text-fg'
                )}
              >
                {it.label}
              </Link>
            )
          })}
        </nav>
      )}
    </div>
  )
}
