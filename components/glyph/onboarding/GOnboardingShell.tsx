import { GlyphWordmark } from '@/components/glyph/landing/LandingWordmark'

/**
 * Onboarding's own chrome — brand only, and deliberately not a link. A half-created account has
 * nowhere useful to go back to; the prior implementation made the same choice (`brandHref={null}`),
 * kept here as a real product decision, not carried over as leftover presentation.
 */
export function GOnboardingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="gg-scope min-h-dvh bg-paper font-sans text-ink">
      <a href="#glyph-onboarding-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-[10px] focus:bg-ember focus:px-4 focus:py-2 focus:text-small focus:font-medium focus:text-ink-on-ember">
        Skip to content
      </a>
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center px-4 sm:px-6">
        <span className="inline-flex min-h-11 items-center"><GlyphWordmark /></span>
      </header>
      <main id="glyph-onboarding-main" tabIndex={-1} className="mx-auto w-full max-w-lg px-4 pb-16 pt-6 focus:outline-none sm:px-6">
        {children}
      </main>
    </div>
  )
}
