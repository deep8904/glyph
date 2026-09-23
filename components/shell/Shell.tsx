import Link from 'next/link'
import { Search } from 'lucide-react'
import { getOptionalIdentity } from '@/lib/dashboard/identity'
import { Input } from '@/components/ui/controls'
import { ContextBar, type Crumb } from './ContextBar'
import { BottomBar, Rail, type ShellUser } from './ShellNav'

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

export function ShellFrame({ user, children, headerLabel, headerAction, hideSearch = false, breadcrumb }: ShellProps & { user: ShellUser | null }) {
  return (
    <div className="min-h-dvh bg-canvas font-sans text-fg md:flex">
      <Rail user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface px-4 sm:px-6 lg:px-8">
          <Link href={user ? '/feed' : '/'} className="inline-flex min-h-11 items-center text-h3 font-semibold tracking-tight text-fg md:hidden">
            Glyph<span className="text-accent">°</span>
          </Link>
          {headerLabel && <span className="hidden truncate text-small font-medium text-fg-secondary md:block">{headerLabel}</span>}
          <div className="ml-auto flex items-center gap-2">
            {!hideSearch && (
              <>
                <form action="/search" method="get" role="search" className="relative hidden md:block">
                  <Search aria-hidden strokeWidth={1.75} className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
                  <Input type="search" name="q" aria-label="Search developers, projects and devlogs" placeholder="Search Glyph" maxLength={100} className="h-9 w-56 pl-9 lg:w-72" />
                </form>
                <Link href="/search" aria-label="Search" title="Search" className="inline-flex size-11 items-center justify-center rounded-control text-fg-secondary hover:bg-surface-muted hover:text-fg md:hidden">
                  <Search aria-hidden strokeWidth={1.75} className="size-5" />
                </Link>
              </>
            )}
            {headerAction}
          </div>
        </header>
        <ContextBar breadcrumb={breadcrumb} flags={user?.nav} />
        <main id="main-content" tabIndex={-1} className="flex-1 px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-6 focus:outline-none sm:px-6 md:pb-10 lg:px-8 lg:pt-8">
          {children}
        </main>
      </div>
      <BottomBar user={user} />
    </div>
  )
}
