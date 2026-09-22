'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

// Six pages, each backed by real behaviour (docs/design/glyph-phase-g-account-architecture.md).
// Profile = what others see; the rest are private account controls. Deleting the account is
// last and set apart. Studio, billing and publisher settings live with their objects.
const ITEMS = [
  { href: '/settings/profile', label: 'Profile' },
  { href: '/settings/account', label: 'Account' },
  { href: '/settings/security', label: 'Security' },
  { href: '/settings/privacy', label: 'Privacy' },
  { href: '/settings/notifications', label: 'Notifications' },
  { href: '/settings/danger', label: 'Delete account' },
]

export function SettingsNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Settings" className="mb-6 shrink-0 border-b border-line sm:mb-0 sm:mr-8 sm:w-44 sm:border-b-0">
      <ul className="-mb-px flex overflow-x-auto sm:mb-0 sm:flex-col sm:overflow-visible">
        {ITEMS.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          const last = href === '/settings/danger'
          return (
            <li key={href} className={cn('shrink-0', last && 'sm:mt-4 sm:border-t sm:border-line sm:pt-2')}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-11 items-center whitespace-nowrap border-b-2 px-3 text-small transition-colors duration-150 sm:h-9 sm:rounded-control sm:border-b-0 sm:pointer-coarse:h-11',
                  active ? 'border-accent font-medium text-fg sm:bg-surface-muted' : 'border-transparent text-fg-secondary hover:text-fg sm:hover:bg-surface-muted',
                  last && !active && 'text-fg-muted'
                )}
              >
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
