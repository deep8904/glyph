import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function NotFound() {
  return (
    <div id="main-content" className="flex min-h-dvh items-center justify-center bg-canvas px-6 font-sans">
      <div className="max-w-sm text-center">
        <div className="mb-6 text-h3 font-semibold tracking-[-0.02em] text-fg">Glyph<span className="text-accent">°</span></div>
        <p className="mb-2 font-mono text-micro text-fg-muted">404</p>
        <h1 className="mb-2 text-h2 font-semibold tracking-[-0.015em] text-fg">Page not found</h1>
        <p className="mb-8 text-small leading-relaxed text-fg-secondary">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-control bg-fg px-5 text-small font-medium text-white transition-colors hover:bg-fg/90"
        >
          Back to Glyph <ArrowRight aria-hidden strokeWidth={1.75} className="size-3.5" />
        </Link>
      </div>
    </div>
  )
}
