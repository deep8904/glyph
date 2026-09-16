import Link from 'next/link'

// A calm public-page shell (marketing-adjacent pages: pricing, events, jams,
// public collaborate/studio listings). No decorative backdrop, no glassmorphism —
// same flat, editorial language as the landing page and authenticated app.
export function PageShell({
  children,
  wide = false,
}: {
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <main className={`w-full ${wide ? 'max-w-5xl' : 'max-w-3xl'} mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 min-h-screen flex flex-col`}>
        <div className="flex-1 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          {children}
        </div>
      </main>
    </div>
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
    <div className="flex items-center justify-between px-5 py-5 sm:px-8 sm:py-6 md:px-10 border-b border-gray-100 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <Link href="/dashboard" className="flex items-center gap-0.5 text-lg font-display font-semibold tracking-tighter text-gray-900 shrink-0">
          Glyph<span className="text-indigo-600 leading-none">°</span>
        </Link>
        {breadcrumb.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2 min-w-0">
            <span className="text-gray-300">/</span>
            {crumb.href ? (
              <Link href={crumb.href} className="text-[13px] font-medium text-indigo-600 hover:text-indigo-700 transition-colors truncate">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-[13px] font-medium text-gray-500 truncate">{crumb.label}</span>
            )}
          </span>
        ))}
      </div>
      {action && <div className="shrink-0 ml-4">{action}</div>}
    </div>
  )
}

export function PanelBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex-1 px-5 sm:px-8 md:px-10 py-8 overflow-y-auto ${className}`}>
      {children}
    </div>
  )
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
