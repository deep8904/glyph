import { Slot } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The one button. Variants, not copies. One `primary` per view.
 * Height: 36/40px pointer, 44px on coarse pointers (touch).
 */
export const buttonVariants = cva(
  'inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-control text-small font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-fg-on-accent hover:bg-accent-hover',
        secondary: 'border border-line-strong bg-surface text-fg hover:bg-surface-muted',
        ghost: 'text-fg-secondary hover:bg-surface-muted hover:text-fg',
        danger: 'bg-danger text-fg-on-accent hover:bg-danger-hover',
        link: 'h-auto min-h-0 rounded-none px-0 text-link underline-offset-2 hover:underline',
      },
      size: {
        sm: 'h-9 px-3 pointer-coarse:h-11',
        md: 'h-10 px-4 pointer-coarse:h-11',
        lg: 'h-11 px-5',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  }
)

export type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    /** Render as the child element (e.g. a next/link) instead of a <button>. */
    asChild?: boolean
    /** Shows a spinner, disables the button and sets aria-busy. Keep the label. */
    loading?: boolean
  }

export function Button({ className, variant, size, asChild, loading, disabled, children, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" strokeWidth={1.75} />}
          {children}
        </>
      )}
    </Comp>
  )
}
