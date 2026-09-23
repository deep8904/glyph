'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, RotateCcw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Intentionally not surfacing error.message/stack in the UI — see below.
    console.error(error)
  }, [error])

  return (
    <div id="main-content" className="flex min-h-dvh items-center justify-center bg-canvas px-6 font-sans">
      <div className="max-w-sm text-center">
        <div className="mb-6 text-h3 font-semibold tracking-[-0.02em] text-fg">Glyph<span className="text-accent">°</span></div>
        <h1 className="mb-2 text-h2 font-semibold tracking-[-0.015em] text-fg">Something went wrong</h1>
        <p className="mb-8 text-small leading-relaxed text-fg-secondary">
          An unexpected error occurred. You can try again, or head back to Glyph.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-control border border-line-strong bg-surface px-5 text-small font-medium text-fg transition-colors hover:bg-surface-muted"
          >
            Try again <RotateCcw aria-hidden strokeWidth={1.75} className="size-3.5" />
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-control bg-fg px-5 text-small font-medium text-white transition-colors hover:bg-fg/90"
          >
            Back to Glyph <ArrowRight aria-hidden strokeWidth={1.75} className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
