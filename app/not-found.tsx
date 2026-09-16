import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="flex items-center justify-center gap-1 text-2xl font-display font-semibold tracking-tighter text-gray-900 mb-6">
          Glyph<span className="text-indigo-600 leading-none">°</span>
        </div>
        <p className="text-sm font-mono text-gray-400 mb-2">404</p>
        <h1 className="text-xl font-medium tracking-tight text-gray-900 mb-2">Page not found</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-600 transition-all duration-300"
        >
          Back to Glyph <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
