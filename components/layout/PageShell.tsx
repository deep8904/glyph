import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Shell } from '@/components/shell/Shell'

// Public/utility pages (jams, events, pricing, admin) render inside the one global shell.
// The old floating rounded panel and its own brand header are gone; PanelHeader is now
// just the in-page breadcrumb + action, PanelBody just spacing.
export function PageShell({
  children,
  wide = false,
}: {
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <Shell>
      <div className={`w-full ${wide ? 'max-w-5xl' : 'max-w-3xl'}`}>{children}</div>
    </Shell>
  )
}

export function PanelHeader({
  breadcrumb,
  action,
}: {
  breadcrumb: { label: string; href?: string }[]
  action?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4 border-b border-line pb-4">
      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex flex-wrap items-center gap-1 text-small">
          {breadcrumb.map((crumb, i) => {
            const last = i === breadcrumb.length - 1
            return (
              <li key={i} className="flex min-w-0 items-center gap-1">
                {i > 0 && <ChevronRight aria-hidden strokeWidth={1.75} className="size-3.5 shrink-0 text-fg-muted" />}
                {crumb.href && !last ? (
                  <Link href={crumb.href} className="inline-flex min-h-11 items-center truncate text-fg-secondary underline-offset-2 hover:text-fg hover:underline">{crumb.label}</Link>
                ) : (
                  <span aria-current={last ? 'page' : undefined} className={last ? 'truncate font-medium text-fg' : 'truncate text-fg-secondary'}>{crumb.label}</span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function PanelBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
        {icon}
      </div>
      <h2 className="text-lg font-display font-medium tracking-tight text-gray-900 mb-2">{title}</h2>
      <p className="text-sm text-gray-500 max-w-xs mb-6">{description}</p>
      {action}
    </div>
  )
}
