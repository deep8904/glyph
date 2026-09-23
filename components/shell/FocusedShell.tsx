import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * Chrome for single-purpose flows (sign in, sign up, onboarding): brand only, no navigation,
 * nothing to leave through by accident. Plain canvas — no decorative background.
 * Pure markup (no data, no client code) so both server and client pages can use it.
 */
export function FocusedShell({
  children,
  width = 'md',
  brandHref = '/',
  className,
}: {
  children: React.ReactNode
  width?: 'md' | 'lg'
  /** Onboarding has no destination yet, so it passes null and the brand is not a link. */
  brandHref?: string | null
  className?: string
}) {
  const brand = (
    <span className="text-h2 font-semibold tracking-tight text-fg">
      Glyph<span className="text-accent">°</span>
    </span>
  )
  return (
    <div className="min-h-dvh bg-canvas font-sans text-fg">
      <header className="mx-auto flex h-16 max-w-5xl items-center px-4 sm:px-6">
        {brandHref ? <Link href={brandHref} aria-label="Glyph home" className="inline-flex min-h-11 items-center">{brand}</Link> : brand}
      </header>
      <main id="main-content" tabIndex={-1} className={cn('mx-auto w-full px-4 pb-16 pt-6 focus:outline-none sm:px-6', width === 'lg' ? 'max-w-xl' : 'max-w-md', className)}>
        {children}
      </main>
    </div>
  )
}
