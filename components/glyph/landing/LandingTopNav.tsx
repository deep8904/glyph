import Link from 'next/link'
import { LandingMobileMenu } from './LandingMobileMenu'
import { GlyphWordmark } from './LandingWordmark'

/**
 * Landing-specific top bar — not GlyphTopNav. This surface is signed-out-first: Explore is the one
 * public destination worth naming in the bar, and the account state resolves to exactly one plain
 * link (Dashboard, or Log in + Sign up) with no Ember fill — the page's single Ember action lives in
 * the hero, not repeated here.
 */
export function LandingTopNav({ authed }: { authed: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-hair bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="inline-flex min-h-11 items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">
          <GlyphWordmark />
        </Link>
        <nav aria-label="Primary" className="ml-4 hidden md:flex">
          <Link href="/explore" className="rounded-[9px] px-3 py-2 text-small font-medium text-ink-2 outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ember">
            Explore
          </Link>
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          {authed ? (
            <Link href="/dashboard" className="inline-flex min-h-9 items-center rounded-[9px] border border-hair-strong px-3.5 text-small font-medium text-ink outline-none transition-colors hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ember">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="rounded-[9px] px-3.5 py-2 text-small font-medium text-ink-2 outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ember">
                Log in
              </Link>
              <Link href="/signup" className="inline-flex min-h-9 items-center rounded-[9px] border border-hair-strong px-3.5 text-small font-medium text-ink outline-none transition-colors hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ember">
                Sign up
              </Link>
            </>
          )}
        </div>
        <div className="ml-auto md:hidden">
          <LandingMobileMenu authed={authed} />
        </div>
      </div>
    </header>
  )
}
