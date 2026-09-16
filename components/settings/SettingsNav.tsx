'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserCircle, Key, Bell, AlertTriangle } from 'lucide-react'

const SETTINGS_NAV = [
  { href: '/settings/profile', label: 'Profile', Icon: UserCircle },
  { href: '/settings/account', label: 'Account', Icon: Key },
  { href: '/settings/notifications', label: 'Notifications', Icon: Bell },
  { href: '/settings/danger', label: 'Danger Zone', Icon: AlertTriangle },
]

export function SettingsNav() {
  const pathname = usePathname()
  return (
    <nav className="sm:w-48 shrink-0 border-b sm:border-b-0 sm:border-r border-gray-100 pb-4 sm:pb-0 sm:pr-6 mb-6 sm:mb-0 flex sm:flex-col gap-1 overflow-x-auto sm:overflow-x-visible">
      {SETTINGS_NAV.map(({ href, label, Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={
              'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 whitespace-nowrap ' +
              (active ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900')
            }
          >
            <Icon className="h-4 w-4 shrink-0" /> {label}
          </Link>
        )
      })}
    </nav>
  )
}
