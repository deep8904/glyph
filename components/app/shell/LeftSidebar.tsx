'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Flame,
  Compass,
  Gamepad2,
  TestTube2,
  MapPin,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types/database'

const NAV = [
  { href: '/feed',          icon: Flame,      label: 'Home' },
  { href: '/discover',      icon: Compass,    label: 'Discover' },
  { href: '/projects/new',  icon: Gamepad2,   label: 'My Projects' },
  { href: '/playtest',      icon: TestTube2,  label: 'Playtests' },
  { href: '/events',        icon: MapPin,     label: 'Events' },
]

function NavItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string
  icon: React.ElementType
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'relative flex items-center gap-3 rounded-xl px-3 py-2.5 font-sans text-sm transition-all',
        active
          ? 'bg-[var(--color-glyph-orange-lo)] text-[var(--color-glyph-orange)]'
          : 'text-[var(--color-glyph-text-2)] hover:bg-[var(--color-glyph-surface-2)] hover:text-[var(--color-glyph-text)]'
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-[var(--color-glyph-orange)]" />
      )}
      <Icon size={17} />
      <span>{label}</span>
    </Link>
  )
}

export function LeftSidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-14 hidden h-[calc(100vh-3.5rem)] w-[220px] flex-col border-r border-[var(--color-glyph-border)] bg-[var(--color-glyph-black)] lg:flex">
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {NAV.map(item => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={pathname === item.href || pathname.startsWith(item.href + '/')}
          />
        ))}

        <div className="my-2 h-px bg-[var(--color-glyph-border)]" />

        <NavItem
          href="/settings"
          icon={Settings}
          label="Settings"
          active={pathname.startsWith('/settings')}
        />
      </nav>

      {/* Bottom: user identity */}
      {profile && (
        <Link
          href={profile.username ? `/dev/${profile.username}` : '/onboarding'}
          className="flex items-center gap-3 border-t border-[var(--color-glyph-border)] px-4 py-3 transition hover:bg-[var(--color-glyph-surface-2)]"
        >
          <div className="size-8 shrink-0 overflow-hidden rounded-full bg-[var(--color-glyph-surface-3)]">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center">
                <span className="font-heading text-xs font-bold text-[var(--color-glyph-text-3)]">
                  {(profile.display_name?.[0] ?? '?').toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-sans text-xs font-medium text-[var(--color-glyph-text)]">
              {profile.display_name || 'Your Name'}
            </p>
            <p className="truncate font-mono text-[10px] text-[var(--color-glyph-text-3)]">
              @{profile.username ?? 'setup required'}
            </p>
          </div>
        </Link>
      )}
    </aside>
  )
}

/** Mobile bottom nav — shown only on small screens */
export function MobileBottomNav({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const mobileNav = NAV.slice(0, 4)

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 flex h-16 items-center justify-around border-t border-[var(--color-glyph-border)] bg-[var(--color-glyph-black)]/95 px-2 backdrop-blur lg:hidden">
      {mobileNav.map(item => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition',
              active ? 'text-[var(--color-glyph-orange)]' : 'text-[var(--color-glyph-text-3)]'
            )}
          >
            <item.icon size={20} />
            <span className="font-mono text-[9px] uppercase tracking-wide">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
