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
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="flex items-center justify-center gap-1 text-xl font-display font-semibold tracking-tighter text-gray-900 mb-6">
          Glyph<span className="text-indigo-600 leading-none">°</span>
        </div>
        <h1 className="text-lg font-medium tracking-tight text-gray-900 mb-2">This page hit a snag</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          Something went wrong loading this part of your dashboard. Your data is safe — try again or head home.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-300"
          >
            Try again <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-600 transition-all duration-300"
          >
            Back to Dashboard <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
