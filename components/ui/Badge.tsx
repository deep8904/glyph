import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'solid' | 'success' | 'muted'

const VARIANTS: Record<BadgeVariant, string> = {
  default: 'border border-indigo-200/80 bg-indigo-50/50 text-indigo-600',
  solid: 'border border-indigo-500/30 bg-indigo-500/20 text-indigo-300',
  success: 'border border-green-200 bg-green-50 text-green-700',
  muted: 'border border-gray-200 bg-gray-50 text-gray-500',
}

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider font-mono backdrop-blur-md',
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
