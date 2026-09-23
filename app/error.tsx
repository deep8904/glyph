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
    <div id="main-content" className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="flex items-center justify-center gap-1 text-2xl font-display font-semibold tracking-tighter text-gray-900 mb-6">
          Glyph<span className="text-indigo-600 leading-none">°</span>
        </div>
        <h1 className="text-xl font-medium tracking-tight text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          An unexpected error occurred. You can try again, or head back to Glyph.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-300"
          >
            Try again <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-600 transition-all duration-300"
          >
            Back to Glyph <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
