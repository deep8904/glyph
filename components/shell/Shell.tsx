import Link from 'next/link'
import { getOptionalIdentity } from '@/lib/dashboard/identity'
import { ContextBar, type Crumb } from './ContextBar'
import { BottomBar, Rail, type ShellUser } from './ShellNav'
import { CommandPalette } from './CommandPalette'
import { CommandTrigger } from './CommandTrigger'

export type ShellProps = {
  children: React.ReactNode
  /** Small page label in the top bar (desktop). Chrome, not the page's heading. */
  headerLabel?: string
  /** Page-level action shown at the right of the top bar. */
  headerAction?: React.ReactNode
  /** Set on /search, which already has the full search box. */
  hideSearch?: boolean
  /** Canonical-object trail (e.g. owner → project → devlog). */
  breadcrumb?: Crumb[]
  /** Optional right-hand context rail (Console framework) — shown ≥1280px beside the content. */
  rail?: React.ReactNode
}

/**
 * The one shell. Desktop: left rail + content. Tablet: compact rail. Mobile: top utility bar +
 * bottom navigation. The same structure serves signed-in and signed-out visitors; only the
 * navigation items differ. Identity comes from the per-request memoised fetch, so pages that
 * already asked for it cost nothing extra.
 */
export async function Shell(props: ShellProps) {
  const identity = await getOptionalIdentity()
  const user: ShellUser | null = identity
    ? { displayName: identity.displayName, username: identity.username, email: identity.email, nav: identity.nav }
    : null
  return <ShellFrame user={user} {...props} />
}

export function ShellFrame({ user, children, headerLabel, headerAction, hideSearch = false, breadcrumb, rail }: ShellProps & { user: ShellUser | null }) {
  return (
    <div className="min-h-dvh bg-canvas font-sans text-fg md:flex">
      <CommandPalette signedIn={!!user} username={user?.username} />
      <Rail user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <Link href={user ? '/feed' : '/'} className="inline-flex min-h-11 items-center text-h3 font-semibold tracking-tight text-fg md:hidden">
            Glyph<span className="text-accent">°</span>
          </Link>
          {headerLabel && <span className="hidden truncate text-small font-medium text-fg-secondary md:block">{headerLabel}</span>}
          <div className="ml-auto flex items-center gap-2">
            {!hideSearch && <CommandTrigger />}
            {headerAction}
          </div>
        </header>
        <ContextBar breadcrumb={breadcrumb} flags={user?.nav} />
        <div className="flex min-w-0 flex-1">
          <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-6 focus:outline-none sm:px-6 md:pb-10 lg:px-8 lg:pt-8">
            {children}
          </main>
          {rail && (
            <aside aria-label="Context" className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-[320px] shrink-0 overflow-y-auto border-l border-line px-5 py-6 xl:block">
              {rail}
            </aside>
          )}
        </div>
      </div>
      <BottomBar user={user} />
    </div>
  )
}
