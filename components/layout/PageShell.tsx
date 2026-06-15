import Link from 'next/link'

const GlassColumns = () => (
  <div className="fixed inset-y-0 right-0 w-[120vw] md:w-[70vw] translate-x-[10%] md:translate-x-0 z-0 flex pointer-events-none opacity-40 mix-blend-overlay">
    <div className="h-full flex-1 relative border-l border-white/60 shadow-[-15px_0_30px_-10px_rgba(255,255,255,1)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0.4))', backdropFilter: 'blur(20px)' }} />
    <div className="h-full flex-1 relative border-l border-white/40 shadow-[-15px_0_30px_-10px_rgba(255,255,255,0.8)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0.1))', backdropFilter: 'blur(10px)' }} />
    <div className="h-full flex-1 relative border-l border-white/20 shadow-[-15px_0_30px_-10px_rgba(255,255,255,0.4)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,0))', backdropFilter: 'blur(4px)' }} />
  </div>
)

export function PageShell({
  children,
  wide = false,
}: {
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <div className="min-h-screen relative overflow-hidden font-sans">
      <div className="fixed inset-0 z-0 bg-plasma pointer-events-none" />
      <GlassColumns />
      <main className={`relative z-10 w-full ${wide ? 'max-w-5xl' : 'max-w-3xl'} mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 min-h-screen flex flex-col`}>
        <div className="flex-1 bg-white/95 backdrop-blur-2xl rounded-[2.5rem] panel-shadow border border-white overflow-hidden flex flex-col">
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
    <div className="flex items-center justify-between px-5 py-5 sm:px-8 sm:py-6 md:px-10 border-b border-gray-100/50 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <Link href="/dashboard" className="flex items-center gap-0.5 text-lg font-semibold tracking-tighter text-gray-900 shrink-0">
          Glyph<span className="text-indigo-600 leading-none">°</span>
        </Link>
        {breadcrumb.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2 min-w-0">
            <span className="text-gray-300">/</span>
            {crumb.href ? (
              <Link href={crumb.href} className="font-mono text-[10px] uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors truncate">
                {crumb.label}
              </Link>
            ) : (
              <span className="font-mono text-[10px] uppercase tracking-widest text-gray-500 truncate">{crumb.label}</span>
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
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 mb-4">
        {icon}
      </div>
      <h2 className="text-lg font-medium tracking-tight text-gray-900 mb-2">{title}</h2>
      <p className="text-sm text-gray-500 max-w-xs mb-6">{description}</p>
      {action}
    </div>
  )
}
