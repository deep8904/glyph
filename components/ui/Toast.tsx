'use client'

import { Toast as T } from 'radix-ui'
import { create } from 'zustand'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tone = 'neutral' | 'success' | 'danger'
type Item = { id: number; title: string; description?: string; tone: Tone }

const useToasts = create<{ items: Item[]; push: (i: Omit<Item, 'id'>) => void; remove: (id: number) => void }>((set) => ({
  items: [],
  push: (i) => set((s) => ({ items: [...s.items, { ...i, id: Date.now() + Math.random() }].slice(-4) })),
  remove: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
}))

/** Fire-and-forget confirmation ("Saved", "Copied") or a recoverable failure. Not for anything the user must act on. */
export function toast(title: string, opts: { description?: string; tone?: Tone } = {}) {
  useToasts.getState().push({ title, description: opts.description, tone: opts.tone ?? 'neutral' })
}

const ICON = { neutral: Info, success: CheckCircle2, danger: AlertTriangle } as const
const TONE = { neutral: 'text-fg-muted', success: 'text-success', danger: 'text-danger' } as const

/** Mounted once in the root layout. Radix renders the ARIA live region; errors use the assertive `foreground` type. */
export function Toaster() {
  const { items, remove } = useToasts()
  return (
    <T.Provider swipeDirection="right" duration={5000} label="Notifications">
      {items.map((it) => {
        const Icon = ICON[it.tone]
        return (
          <T.Root
            key={it.id}
            type={it.tone === 'danger' ? 'foreground' : 'background'}
            data-ui-toast
            onOpenChange={(o) => !o && remove(it.id)}
            className="flex items-start gap-3 rounded-media border border-line bg-surface-elevated p-3 shadow-popover"
          >
            <Icon aria-hidden strokeWidth={1.75} className={cn('mt-0.5 size-4 shrink-0', TONE[it.tone])} />
            <div className="min-w-0 flex-1">
              <T.Title className="text-small font-medium text-fg">{it.title}</T.Title>
              {it.description && <T.Description className="mt-0.5 text-micro text-fg-secondary">{it.description}</T.Description>}
            </div>
            <T.Close aria-label="Dismiss" className="-m-1 inline-flex size-7 items-center justify-center rounded-control text-fg-muted hover:bg-surface-muted hover:text-fg">
              <X aria-hidden strokeWidth={1.75} className="size-3.5" />
            </T.Close>
          </T.Root>
        )
      })}
      <T.Viewport className="fixed bottom-4 right-4 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 outline-none max-md:bottom-20" />
    </T.Provider>
  )
}
