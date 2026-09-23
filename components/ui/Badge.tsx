import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Small status/label chip. Text always says the state; colour only reinforces it.
 * Legacy `variant` names (default/secondary/solid/success/muted) still work so
 * existing callers keep rendering; new code uses `tone`.
 */
const badgeVariants = cva('inline-flex items-center gap-1 rounded-badge border font-medium', {
  variants: {
    tone: {
      neutral: 'border-line bg-surface-muted text-fg-secondary',
      accent: 'border-accent-line bg-accent-subtle text-link',
      success: 'border-success-line bg-success-subtle text-success',
      warning: 'border-warning-line bg-warning-subtle text-warning',
      danger: 'border-danger-line bg-danger-subtle text-danger',
      info: 'border-info-line bg-info-subtle text-info',
      /** For dark backdrops (public plasma pages) until they are migrated. */
      'on-dark': 'border-white/20 bg-white/10 text-white',
    },
    size: {
      sm: 'px-1.5 py-px text-micro',
      md: 'px-2 py-0.5 text-micro',
    },
    mono: { true: 'font-mono', false: '' },
  },
  defaultVariants: { tone: 'neutral', size: 'md', mono: false },
})

type LegacyVariant = 'default' | 'secondary' | 'solid' | 'success' | 'muted'
const LEGACY: Record<LegacyVariant, NonNullable<VariantProps<typeof badgeVariants>['tone']>> = {
  default: 'accent',
  secondary: 'neutral',
  solid: 'on-dark',
  success: 'success',
  muted: 'neutral',
}

export function Badge({
  children,
  tone,
  variant,
  size,
  mono,
  className,
}: VariantProps<typeof badgeVariants> & {
  children: React.ReactNode
  /** @deprecated use `tone` */
  variant?: LegacyVariant
  className?: string
}) {
  return <span className={cn(badgeVariants({ tone: tone ?? (variant ? LEGACY[variant] : 'neutral'), size, mono }), className)}>{children}</span>
}
