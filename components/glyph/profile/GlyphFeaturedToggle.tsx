'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Star } from 'lucide-react'
import { setDevlogFeatured } from '@/app/actions/devlogs'
import { cn } from '@/lib/utils'

/** Owner-only: pin/unpin a devlog to Featured. Same action + ownership check as the legacy button. */
export function GlyphFeaturedToggle({ devlogId, featured }: { devlogId: string; featured: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const handle = () => {
    setError('')
    startTransition(async () => {
      const result = await setDevlogFeatured(devlogId, !featured)
      if (result?.error) setError(result.error)
      else router.refresh()
    })
  }

  const label = featured ? 'Remove from Featured' : 'Add to Featured'
  return (
    <span className="inline-flex items-center gap-2">
      {error && <span role="alert" className="text-micro text-gdanger">{error}</span>}
      <button
        type="button"
        onClick={handle}
        disabled={pending}
        aria-pressed={featured}
        aria-label={label}
        title={label}
        className={cn(
          'inline-flex size-11 shrink-0 items-center justify-center rounded-[9px] border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ember disabled:opacity-50 sm:size-9',
          featured ? 'border-ember-line bg-ember-quiet text-ember-ink' : 'border-hair-strong bg-panel text-ink-3 hover:bg-sunken hover:text-ink'
        )}
      >
        <Star aria-hidden strokeWidth={1.75} className="size-4" fill={featured ? 'currentColor' : 'none'} />
      </button>
    </span>
  )
}
