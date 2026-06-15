import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'secondary' | 'solid' | 'success' | 'muted'
type BadgeSize = 'sm' | 'md'

const VARIANTS: Record<BadgeVariant, string> = {
  default: 'border border-indigo-200/80 bg-indigo-50/50 text-indigo-600',
  secondary: 'border border-gray-200 bg-gray-50 text-gray-600',
  solid: 'border border-indigo-500/30 bg-indigo-500/20 text-indigo-300',
  success: 'border border-green-200 bg-green-50 text-green-700',
  muted: 'border border-gray-200 bg-gray-50 text-gray-500',
}

const SIZES: Record<BadgeSize, string> = {
  sm: 'px-2.5 py-0.5 text-[10px]',
  md: 'px-3 py-1 text-[11px]',
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wider font-mono',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
    >
      {children}
    </span>
  )
}
