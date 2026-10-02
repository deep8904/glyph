import Link from 'next/link'
import { GlyphWordmark } from '@/components/glyph/landing/LandingWordmark'

/**
 * Chrome shared by the whole auth family — brand only, no navigation, nothing to leave through by
 * accident. Reuses the same wordmark as Landing (the two are one continuous signed-out journey), but
 * is its own component: no top nav, no command menu, no account menu. A skip link and a real `main`
 * landmark are present on every screen, same as every other Glyph surface.
 */
export function GAuthShell({ children, width = 'sm' }: { children: React.ReactNode; width?: 'sm' | 'md' }) {
  return (
    <div className="gg-scope min-h-dvh bg-paper font-sans text-ink">
      <a href="#glyph-auth-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-[10px] focus:bg-ember focus:px-4 focus:py-2 focus:text-small focus:font-medium focus:text-ink-on-ember">
        Skip to content
      </a>
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center px-4 sm:px-6">
        <Link href="/" className="inline-flex min-h-11 items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ember">
          <GlyphWordmark />
        </Link>
      </header>
      <main id="glyph-auth-main" tabIndex={-1} className={`mx-auto w-full px-4 pb-16 pt-6 focus:outline-none sm:px-6 ${width === 'md' ? 'max-w-lg' : 'max-w-sm'}`}>
        {children}
      </main>
    </div>
  )
}
