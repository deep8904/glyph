'use client'

import { Popover as P } from 'radix-ui'
import { cn } from '@/lib/utils'

/** Non-modal floating panel anchored to a trigger (filters, quick info). Escape closes; focus returns to trigger. */
export const Popover = P.Root
export const PopoverTrigger = P.Trigger
export const PopoverClose = P.Close

export function PopoverContent({ className, sideOffset = 6, align = 'start', ...props }: React.ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content
        data-ui-pop
        sideOffset={sideOffset}
        align={align}
        className={cn('z-50 w-72 rounded-media border border-line bg-surface-elevated p-3 text-small text-fg shadow-popover', className)}
        {...props}
      />
    </P.Portal>
  )
}
