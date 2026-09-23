import type { ReactNode } from 'react'
import { getOptionalIdentity } from '@/lib/dashboard/identity'
import { Shell } from '@/components/shell/Shell'

/**
 * Explore, Search and the other browse surfaces are public: signed-out visitors get the same
 * shell as everyone else, with sign-in actions in place of the account items. The viewer id
 * (null when signed out) is handed to the page for viewer-relative UI.
 */
export async function DiscoveryFrame({
  label,
  hideSearch = false,
  width = 'reading',
  children,
}: {
  label: string
  hideSearch?: boolean
  /** 'reading' (max-w-3xl) for list/detail browse; 'wide' (max-w-6xl) for grid discovery that should use the canvas. */
  width?: 'reading' | 'wide'
  children: (viewer: { id: string } | null) => ReactNode
}) {
  const identity = await getOptionalIdentity()
  return (
    <Shell headerLabel={label} hideSearch={hideSearch}>
      <div className={width === 'wide' ? 'mx-auto w-full max-w-6xl' : 'mx-auto w-full max-w-3xl'}>
        {children(identity ? { id: identity.user.id } : null)}
      </div>
    </Shell>
  )
}
