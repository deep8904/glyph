import { getOptionalIdentity } from '@/lib/dashboard/identity'
import { GlyphTopNav, type ShellUser } from './GlyphTopNav'

export type GlyphShellProps = {
  children: React.ReactNode
  /** Full-bleed content that manages its own gutters (e.g. a cinematic hero). */
  bleed?: boolean
}

/**
 * The new Glyph shell — a single quiet top bar over content. No persistent side rail, no baked-in
 * contextual tab row, no mobile bottom bar; navigation is the top bar + the ⌘K command palette, and
 * any surface that needs sub-modes composes them itself. `gg-scope` gives the whole surface the
 * Ember focus ring and selection, isolated from the legacy token system.
 */
export async function GlyphShell({ children, bleed = false }: GlyphShellProps) {
  const identity = await getOptionalIdentity()
  const user: ShellUser | null = identity
    ? { displayName: identity.displayName, username: identity.username, email: identity.email, nav: identity.nav }
    : null

  return (
    <div className="gg-scope min-h-dvh bg-paper font-sans text-ink">
      <a href="#glyph-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-[10px] focus:bg-ember focus:px-4 focus:py-2 focus:text-small focus:font-medium focus:text-ink-on-ember">
        Skip to content
      </a>
      <GlyphTopNav user={user} />
      <main id="glyph-main" tabIndex={-1} className={bleed ? 'focus:outline-none' : 'mx-auto w-full max-w-[1440px] px-4 py-8 focus:outline-none sm:px-6 lg:px-8 lg:py-10'}>
        {children}
      </main>
    </div>
  )
}
