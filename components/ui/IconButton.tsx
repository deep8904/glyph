import { Slot } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const iconButtonVariants = cva(
  'inline-flex shrink-0 items-center justify-center rounded-control transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        ghost: 'text-fg-secondary hover:bg-surface-muted hover:text-fg',
        secondary: 'border border-line-strong bg-surface text-fg-secondary hover:bg-surface-muted hover:text-fg',
      },
      size: {
        sm: 'size-9 pointer-coarse:size-11',
        md: 'size-10 pointer-coarse:size-11',
      },
    },
    defaultVariants: { variant: 'ghost', size: 'md' },
  }
)

/**
 * Icon-only control. `label` is required: it becomes the accessible name and the
 * native tooltip, so an icon without a visible label is never unlabelled.
 */
export function IconButton({
  label,
  variant,
  size,
  asChild,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<'button'>, 'aria-label'> & VariantProps<typeof iconButtonVariants> & { label: string; asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp type={asChild ? undefined : 'button'} aria-label={label} title={label} className={cn(iconButtonVariants({ variant, size }), className)} {...props}>
      {children}
    </Comp>
  )
}
