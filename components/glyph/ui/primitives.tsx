'use client'

import * as React from 'react'
import { DropdownMenu, Avatar as RAvatar, Slot } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/* Fresh Glyph presentation primitives, built directly on Radix behavior — no legacy
   components/ui/* presentation is imported into the new surface. */

/* ── Button ── */
const button = cva(
  'inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-[10px] font-medium outline-none transition-[background-color,color,box-shadow,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
  {
    variants: {
      variant: {
        ember: 'bg-ember text-ink-on-ember hover:bg-ember-press',
        solid: 'bg-ink text-paper hover:opacity-90',
        outline: 'border border-hair-strong bg-panel text-ink hover:bg-sunken',
        ghost: 'text-ink-2 hover:bg-sunken hover:text-ink',
        onMedia: 'bg-on-media text-ink hover:bg-on-media/90',
      },
      size: {
        sm: 'h-9 px-3.5 text-small',
        md: 'h-11 px-5 text-small',
        lg: 'h-12 px-6 text-body',
        /* 44px tap target on mobile, compact 36px from sm: up — for secondary actions (pagers,
           mark-all-read) that sit next to plain text on desktop but must still meet the mobile
           minimum touch-target size. */
        touchSm: 'h-11 px-3.5 text-small sm:h-9',
      },
    },
    defaultVariants: { variant: 'ember', size: 'md' },
  }
)

export type GButtonProps = React.ComponentProps<'button'> & VariantProps<typeof button> & { asChild?: boolean }
export function GButton({ className, variant, size, asChild, ...props }: GButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'
  return <Comp className={cn(button({ variant, size }), className)} {...props} />
}

/* ── Avatar ── */
export function GAvatar({ name, src, size = 40, className }: { name: string; src?: string | null; size?: number; className?: string }) {
  const initials = name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
  return (
    <RAvatar.Root className={cn('relative inline-flex shrink-0 overflow-hidden rounded-full bg-sunken', className)} style={{ width: size, height: size }}>
      {src && <RAvatar.Image src={src} alt="" className="size-full object-cover" />}
      <RAvatar.Fallback className="flex size-full items-center justify-center font-semibold text-ink-2" style={{ fontSize: size * 0.4 }}>{initials || '·'}</RAvatar.Fallback>
    </RAvatar.Root>
  )
}

/* ── Dropdown menu ── */
export const GMenu = DropdownMenu.Root
export const GMenuTrigger = DropdownMenu.Trigger

export function GMenuContent({ className, children, ...props }: React.ComponentProps<typeof DropdownMenu.Content>) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        sideOffset={8}
        className={cn(
          'z-50 min-w-56 overflow-hidden rounded-[12px] border border-hair bg-panel p-1.5 text-ink shadow-g2',
          'data-[state=open]:animate-[ui-pop-in_150ms_ease-out]',
          className
        )}
        {...props}
      >
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  )
}

export function GMenuItem({ className, ...props }: React.ComponentProps<typeof DropdownMenu.Item>) {
  return (
    <DropdownMenu.Item
      className={cn(
        'flex min-h-10 cursor-pointer select-none items-center gap-2.5 rounded-[8px] px-2.5 text-small text-ink outline-none',
        'data-[highlighted]:bg-ember-quiet data-[highlighted]:text-ink',
        className
      )}
      {...props}
    />
  )
}

export function GMenuLabel({ className, ...props }: React.ComponentProps<typeof DropdownMenu.Label>) {
  return <DropdownMenu.Label className={cn('px-2.5 pb-1 pt-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3', className)} {...props} />
}

export function GMenuSeparator({ className, ...props }: React.ComponentProps<typeof DropdownMenu.Separator>) {
  return <DropdownMenu.Separator className={cn('my-1 h-px bg-hair', className)} {...props} />
}
