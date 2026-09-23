import type { ReactNode } from 'react'
import { Shell } from '@/components/shell/Shell'
import type { SidebarNavFlags } from '@/lib/dashboard/identity'

/**
 * Compatibility wrapper. The authenticated app now renders through the one global shell
 * (`components/shell/Shell`). The identity props that pages used to pass are ignored — the
 * shell reads the memoised per-request identity itself — and are kept only so existing
 * callers compile until each page is migrated in later phases.
 */
export function AppShell({
  headerLabel,
  headerAction,
  hideSearch,
  children,
}: {
  /** @deprecated ignored; the shell reads identity itself */
  displayName?: string
  /** @deprecated ignored */
  email?: string
  /** @deprecated ignored */
  nav?: SidebarNavFlags
  headerLabel: string
  headerAction?: ReactNode
  hideSearch?: boolean
  children: ReactNode
}) {
  return (
    <Shell headerLabel={headerLabel} headerAction={headerAction} hideSearch={hideSearch}>
      {children}
    </Shell>
  )
}
