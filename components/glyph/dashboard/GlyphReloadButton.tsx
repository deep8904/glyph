'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { GButton } from '@/components/glyph/ui/primitives'
import { cn } from '@/lib/utils'

/**
 * The only interactive piece of the Next region's unavailable state — isolated as its own tiny
 * client component so the rest of GlyphNextStep (and the page around it) stays server-rendered.
 * `router.refresh()` re-runs the server component, which re-issues all five decision queries;
 * `useTransition`'s `isPending` is the guard against rapid duplicate activation (the button is
 * disabled for the whole refresh) and doubles as the visible pending state — no separate "clicked"
 * flag that could outlive the transition and strand the button disabled after a failed retry.
 */
export function GlyphReloadButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <GButton
      type="button"
      variant="outline"
      size="sm"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      aria-busy={isPending}
      className="mt-4 min-h-11 sm:min-h-9"
    >
      <RefreshCw aria-hidden strokeWidth={1.75} className={cn('size-3.5', isPending && 'animate-spin')} />
      {isPending ? 'Reloading…' : 'Reload'}
    </GButton>
  )
}
