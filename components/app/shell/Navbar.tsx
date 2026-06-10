'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Search, Settings, LogOut, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Profile } from '@/types/database'

export function Navbar({ profile }: { profile: Profile | null }) {
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)
  const [searchFocused, setSearchFocused] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-4 border-b border-[var(--color-glyph-border)] bg-[var(--color-glyph-black)]/95 px-4 backdrop-blur">
      {/* Wordmark */}
      <Link
        href="/feed"
        className="flex shrink-0 items-center gap-1.5 lg:w-[188px]"
      >
        <span className="font-mono text-base text-[var(--color-glyph-orange)]">◈</span>
        <span className="font-heading text-lg font-bold text-[var(--color-glyph-text)]">Glyph</span>
      </Link>

      {/* Search */}
      <div className="relative flex-1 max-w-sm mx-auto hidden sm:flex">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-glyph-text-3)]"
        />
        <input
          ref={searchRef}
          type="text"
          placeholder={searchFocused ? 'Search developers and games…' : 'Search  ⌘K'}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="h-8 w-full rounded-lg border border-[var(--color-glyph-border)] bg-[var(--color-glyph-surface-2)] pl-8 pr-3 font-sans text-sm text-[var(--color-glyph-text)] placeholder:text-[var(--color-glyph-text-3)] outline-none transition-all focus:border-[var(--color-glyph-border-hi)] focus:ring-1 focus:ring-[var(--color-glyph-orange)]/20"
        />
      </div>

      {/* Right actions */}
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <button className="flex size-8 items-center justify-center rounded-lg text-[var(--color-glyph-text-2)] transition hover:bg-[var(--color-glyph-surface-2)] hover:text-[var(--color-glyph-text)]">
          <Bell size={17} />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex size-8 items-center justify-center rounded-full overflow-hidden ring-2 ring-transparent transition hover:ring-[var(--color-glyph-border-hi)] focus:outline-none">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-[var(--color-glyph-surface-3)]">
                  <span className="font-heading text-xs font-bold text-[var(--color-glyph-text-2)]">
                    {(profile?.display_name?.[0] ?? '?').toUpperCase()}
                  </span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 bg-[var(--color-glyph-surface)] border-[var(--color-glyph-border)]">
            <DropdownMenuLabel className="text-[var(--color-glyph-text-3)]">
              @{profile?.username ?? 'account'}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={profile?.username ? `/dev/${profile.username}` : '/onboarding'} className="cursor-pointer">
                <User size={14} /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings size={14} /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer"
              onClick={handleSignOut}
            >
              <LogOut size={14} /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
