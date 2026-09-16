'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  UserCircle,
  Folder,
  Joystick,
  Calendar,
  Handshake,
  Rss,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { label: 'Profile', Icon: UserCircle, href: '/dashboard' },
  { label: 'My Projects', Icon: Folder, href: '/dashboard/projects' },
  { label: 'Playtests', Icon: Joystick, href: '/dashboard/playtests' },
  { label: 'Events', Icon: Calendar, href: '/events' },
  { label: 'Collaborate', Icon: Handshake, href: '/collaborate' },
  { label: 'Feed', Icon: Rss, href: '/feed' },
]

// Shared sidebar body — reused by the fixed desktop sidebar and the mobile drawer.
function SidebarBody({
  displayName,
  email,
  initial,
  onSignOut,
  onNavClick,
}: {
  displayName: string
  email: string
  initial: string
  onSignOut: () => void
  onNavClick?: () => void
}) {
  const pathname = usePathname()
  return (
    <>
      <div className="px-7 py-8">
        <Link href="/" className="flex items-center gap-1 text-xl font-display font-semibold tracking-tighter text-gray-900">
          Glyph<span className="text-indigo-600 leading-none">°</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {NAV_ITEMS.map(({ label, Icon, href }) => {
          const active = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
          return (
            <Link
              key={label}
              href={href}
              onClick={onNavClick}
              className={
                'flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ' +
                (active ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900')
              }
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-semibold">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{displayName || '—'}</p>
            <p className="text-[11px] text-gray-400 font-mono truncate">{email}</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-3 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-300"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign Out
        </button>
      </div>
    </>
  )
}

/**
 * The one authenticated-app shell: persistent sidebar + top bar, used by every
 * page under the auth boundary. Replaces the old pattern of each page building
 * its own floating-panel-on-dark-backdrop chrome with no way to reach siblings.
 */
export function AppShell({
  displayName,
  email,
  headerLabel,
  headerAction,
  children,
}: {
  displayName: string
  email: string
  headerLabel: string
  headerAction?: ReactNode
  children: ReactNode
}) {
  const router = useRouter()
  const supabase = createClient()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const initial = (displayName || 'D').charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Mobile drawer */}
      <div
        onClick={() => setDrawerOpen(false)}
        className={`lg:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden
      />
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[82vw] flex-col bg-white shadow-2xl transition-transform duration-300 ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-label="Navigation"
      >
        <div className="flex justify-end px-4 pt-4">
          <button
            onClick={() => setDrawerOpen(false)}
            className="flex h-10 w-10 items-center justify-center text-gray-500 hover:text-gray-900"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarBody
          displayName={displayName}
          email={email}
          initial={initial}
          onSignOut={handleSignOut}
          onNavClick={() => setDrawerOpen(false)}
        />
      </aside>

      <div className="flex min-h-screen">
        {/* Desktop sidebar — fixed, full height, real app chrome */}
        <aside className="hidden lg:flex w-[240px] shrink-0 flex-col border-r border-gray-100 bg-white">
          <SidebarBody displayName={displayName} email={email} initial={initial} onSignOut={handleSignOut} />
        </aside>

        {/* Main content */}
        <section className="flex-1 flex flex-col min-w-0">
          {/* Mobile top bar with logo + hamburger */}
          <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
            <Link href="/" className="flex items-center gap-1 text-lg font-display font-semibold tracking-tighter text-gray-900">
              Glyph<span className="text-indigo-600 leading-none">°</span>
            </Link>
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex h-11 w-11 -mr-2 items-center justify-center text-gray-700 hover:text-gray-900"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          {/* Content top bar */}
          <div className="flex items-center justify-between px-5 sm:px-6 md:px-10 py-5 border-b border-gray-100 bg-white">
            <span className="text-[13px] font-medium text-gray-500">{headerLabel}</span>
            {headerAction}
          </div>

          <div className="flex-1 px-5 sm:px-6 md:px-10 py-8 sm:py-10">{children}</div>
        </section>
      </div>
    </div>
  )
}
