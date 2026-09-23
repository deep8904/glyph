'use client'

import { DropdownMenu as M } from 'radix-ui'
import { cn } from '@/lib/utils'

/** Action menu (Radix DropdownMenu: arrow keys, typeahead, Escape, focus return to trigger). */
export const Menu = M.Root
export const MenuTrigger = M.Trigger

export function MenuContent({ className, sideOffset = 6, align = 'end', ...props }: React.ComponentProps<typeof M.Content>) {
  return (
    <M.Portal>
      <M.Content
        data-ui-pop
        sideOffset={sideOffset}
        align={align}
        className={cn('z-50 min-w-48 rounded-media border border-line bg-surface-elevated p-1 shadow-popover', className)}
        {...props}
      />
    </M.Portal>
  )
}

const item =
  'flex min-h-9 cursor-default select-none items-center gap-2 rounded-control px-2.5 text-small text-fg outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-surface-muted pointer-coarse:min-h-11'

export function MenuItem({ className, danger, ...props }: React.ComponentProps<typeof M.Item> & { danger?: boolean }) {
  return <M.Item className={cn(item, danger && 'text-danger', className)} {...props} />
}

export function MenuLabel({ className, ...props }: React.ComponentProps<typeof M.Label>) {
  return <M.Label className={cn('px-2.5 py-1.5 text-micro font-medium text-fg-muted', className)} {...props} />
}

export function MenuSeparator({ className, ...props }: React.ComponentProps<typeof M.Separator>) {
  return <M.Separator className={cn('-mx-1 my-1 h-px bg-line', className)} {...props} />
}
