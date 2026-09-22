'use client'

import { Dialog as D } from 'radix-ui'
import { X } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Modal dialog and drawer share one implementation (Radix Dialog: focus trap,
 * Escape, scroll lock, focus restored to the trigger, aria-modal). Use a Dialog for
 * a focused confirm or single-purpose form; use `side` for a drawer (filters, mobile nav).
 * A title is required — it is the dialog's accessible name.
 */
export const Dialog = D.Root
export const DialogTrigger = D.Trigger
export const DialogClose = D.Close

const panel = cva('fixed z-50 flex flex-col bg-surface-elevated text-fg shadow-dialog focus:outline-none', {
  variants: {
    side: {
      center: 'left-1/2 top-1/2 max-h-[85dvh] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-panel',
      right: 'inset-y-0 right-0 w-[calc(100vw-3rem)] max-w-sm border-l border-line',
      left: 'inset-y-0 left-0 w-[calc(100vw-3rem)] max-w-sm border-r border-line',
      bottom: 'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-panel border-t border-line',
    },
  },
  defaultVariants: { side: 'center' },
})

export function DialogContent({
  title,
  description,
  side,
  hideTitle,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof D.Content>, 'title'> &
  VariantProps<typeof panel> & { title: string; description?: string; hideTitle?: boolean }) {
  return (
    <D.Portal>
      <D.Overlay data-ui-overlay className="fixed inset-0 z-50 bg-overlay" />
      <D.Content
        data-ui-pop={side === 'center' || !side ? '' : undefined}
        data-ui-drawer={side && side !== 'center' ? side : undefined}
        className={cn(panel({ side }), className)}
        {...props}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <D.Title className={cn('text-h3 font-semibold', hideTitle && 'sr-only')}>{title}</D.Title>
            {description ? (
              <D.Description className="mt-0.5 text-small text-fg-secondary">{description}</D.Description>
            ) : (
              <D.Description className="sr-only">{title}</D.Description>
            )}
          </div>
          <D.Close
            aria-label="Close"
            className="-mr-2 inline-flex size-9 shrink-0 items-center justify-center rounded-control text-fg-secondary hover:bg-surface-muted hover:text-fg pointer-coarse:size-11"
          >
            <X aria-hidden className="size-4" strokeWidth={1.75} />
          </D.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </D.Content>
    </D.Portal>
  )
}

/** Right-aligned action row for the bottom of a dialog body. */
export function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />
}
