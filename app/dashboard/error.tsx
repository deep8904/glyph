'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, RotateCcw } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div id="main-content" className="flex min-h-dvh items-center justify-center bg-canvas px-6 font-sans">
      <div className="max-w-sm text-center">
        <div className="mb-6 text-h3 font-semibold tracking-[-0.02em] text-fg">Glyph<span className="text-accent">°</span></div>
        <h1 className="mb-2 text-h2 font-semibold tracking-[-0.015em] text-fg">This page hit a snag</h1>
        <p className="mb-8 text-small leading-relaxed text-fg-secondary">
          Something went wrong loading this part of your dashboard. Your data is safe — try again or head home.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-control border border-line-strong bg-surface px-5 text-small font-medium text-fg transition-colors hover:bg-surface-muted"
          >
            Try again <RotateCcw aria-hidden strokeWidth={1.75} className="size-3.5" />
          </button>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-control bg-fg px-5 text-small font-medium text-white transition-colors hover:bg-fg/90"
          >
            Back to Dashboard <ArrowRight aria-hidden strokeWidth={1.75} className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
