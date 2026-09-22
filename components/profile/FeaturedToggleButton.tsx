'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Star } from 'lucide-react'
import { setDevlogFeatured } from '@/app/actions/devlogs'
import { cn } from '@/lib/utils'

/** Owner-only: pin/unpin a devlog to Featured. The action (and its ownership check) is unchanged. */
export function FeaturedToggleButton({ devlogId, featured }: { devlogId: string; featured: boolean }) {
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
      {error && <span role="alert" className="text-micro text-danger">{error}</span>}
      <button
        type="button"
        onClick={handle}
        disabled={pending}
        aria-pressed={featured}
        aria-label={label}
        title={label}
        className={cn(
          'inline-flex size-10 shrink-0 items-center justify-center rounded-control border transition-colors duration-150 disabled:opacity-50 pointer-coarse:size-11',
          featured ? 'border-warning-line bg-warning-subtle text-warning' : 'border-line-strong bg-surface text-fg-muted hover:bg-surface-muted hover:text-fg'
        )}
      >
        <Star aria-hidden strokeWidth={1.75} className="size-4" fill={featured ? 'currentColor' : 'none'} />
      </button>
    </span>
  )
}
