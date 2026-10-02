'use client'

import * as React from 'react'
import Link from 'next/link'
import { Dialog } from 'radix-ui'
import { Menu as MenuIcon, X } from 'lucide-react'
import { GlyphWordmark } from './LandingWordmark'

/**
 * The landing page's own mobile navigation sheet — not GlyphTopNav's, built fresh for this
 * signed-out-first surface. Radix Dialog gives real dialog semantics for free: Escape closes it,
 * focus is trapped inside while open and restored to the trigger on close, and the overlay is
 * `aria-hidden` from the rest of the page. No Ember fill here — the primary action lives once, in
 * the hero.
 */
export function LandingMobileMenu({ authed }: { authed: boolean }) {
  const [open, setOpen] = React.useState(false)
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button aria-label="Open menu" className="inline-flex size-11 items-center justify-center rounded-[10px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-ember md:hidden">
          <MenuIcon aria-hidden strokeWidth={1.75} className="size-5" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 data-[state=open]:animate-[ui-fade-in_150ms_ease-out] md:hidden" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[86%] max-w-sm flex-col bg-panel text-ink shadow-g3 data-[state=open]:animate-[ui-slide-in-right_200ms_cubic-bezier(0.16,1,0.3,1)] md:hidden">
          <Dialog.Title className="sr-only">Menu</Dialog.Title>
          <Dialog.Description className="sr-only">Glyph navigation and sign-in.</Dialog.Description>
          <div className="flex h-14 items-center justify-between border-b border-hair px-4">
            <GlyphWordmark />
            <Dialog.Close asChild>
              <button aria-label="Close menu" className="inline-flex size-11 items-center justify-center rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-ember">
                <X aria-hidden strokeWidth={1.75} className="size-5" />
              </button>
            </Dialog.Close>
          </div>
          <nav aria-label="Primary" className="flex flex-col gap-0.5 p-3">
            <Link href="/explore" onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-[10px] px-3 text-body font-medium text-ink outline-none hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ember">
              Explore
            </Link>
          </nav>
          <div className="mt-auto border-t border-hair p-3">
            {authed ? (
              <Link href="/dashboard" onClick={() => setOpen(false)} className="flex min-h-11 items-center justify-center rounded-[10px] border border-hair-strong px-3 text-body font-medium text-ink outline-none hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ember">
                Go to Dashboard
              </Link>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/signup" onClick={() => setOpen(false)} className="flex min-h-11 items-center justify-center rounded-[10px] border border-hair-strong px-3 text-body font-medium text-ink outline-none hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ember">
                  Sign up
                </Link>
                <Link href="/login" onClick={() => setOpen(false)} className="flex min-h-11 items-center justify-center rounded-[10px] px-3 text-body font-medium text-ink-2 outline-none hover:bg-sunken hover:text-ink focus-visible:ring-2 focus-visible:ring-ember">
                  Log in
                </Link>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
