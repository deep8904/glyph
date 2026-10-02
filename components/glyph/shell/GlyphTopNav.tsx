'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Dialog } from 'radix-ui'
import { Bell, ChevronDown, LogOut, Menu as MenuIcon, Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { CREATE_ITEMS, activeGlobal, meLinks, type GlobalKey } from '@/lib/shell/nav'
import type { SidebarNavFlags } from '@/lib/dashboard/identity'
import { GAvatar, GButton, GMenu, GMenuContent, GMenuItem, GMenuLabel, GMenuSeparator, GMenuTrigger } from '@/components/glyph/ui/primitives'
import { CommandMenu } from './CommandMenu'

export type ShellUser = { displayName: string; username: string; email: string; nav: SidebarNavFlags }

const GLOBAL: { key: GlobalKey; label: string; href: string }[] = [
  { key: 'home', label: 'Home', href: '/feed' },
  { key: 'explore', label: 'Explore', href: '/explore' },
]

export function GlyphWordmark({ className }: { className?: string }) {
  return <span className={cn('font-semibold tracking-[-0.02em] text-ink', className)}>Glyph<span className="text-ember">°</span></span>
}

function useSignOut() {
  const router = useRouter()
  return async () => { await createClient().auth.signOut(); router.push('/'); router.refresh() }
}

function CreateMenu() {
  return (
    <GMenu>
      <GMenuTrigger asChild>
        <GButton variant="ember" size="sm" aria-label="Create"><Plus aria-hidden strokeWidth={2.25} className="size-4" /><span className="hidden sm:inline">Create</span></GButton>
      </GMenuTrigger>
      <GMenuContent align="end" className="w-72">
        <GMenuLabel>Create</GMenuLabel>
        {CREATE_ITEMS.map((it) => (
          <GMenuItem key={it.href} asChild className="h-auto items-start py-2">
            <Link href={it.href}>
              {it.icon && <it.icon aria-hidden strokeWidth={1.75} className="mt-0.5 size-4 shrink-0 text-ink-3" />}
              <span><span className="block font-medium text-ink">{it.label}</span>{it.description && <span className="block text-micro text-ink-3">{it.description}</span>}</span>
            </Link>
          </GMenuItem>
        ))}
      </GMenuContent>
    </GMenu>
  )
}

function MeMenu({ user }: { user: ShellUser }) {
  const signOut = useSignOut()
  return (
    <GMenu>
      <GMenuTrigger asChild>
        <button aria-label={`Account menu for ${user.displayName}`} className="inline-flex items-center gap-1.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ember">
          <GAvatar name={user.displayName} size={32} />
          <ChevronDown aria-hidden strokeWidth={2} className="size-3.5 text-ink-3" />
        </button>
      </GMenuTrigger>
      <GMenuContent align="end" className="w-60">
        <GMenuLabel>{user.email}</GMenuLabel>
        {meLinks(user.username, user.nav).map((l) => <GMenuItem key={l.href} asChild><Link href={l.href}>{l.label}</Link></GMenuItem>)}
        <GMenuSeparator />
        <GMenuItem onSelect={signOut}><LogOut aria-hidden strokeWidth={1.75} className="size-4 text-ink-3" /> Sign out</GMenuItem>
      </GMenuContent>
    </GMenu>
  )
}

function MobileMenu({ user }: { user: ShellUser | null }) {
  const [open, setOpen] = React.useState(false)
  const signOut = useSignOut()
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button aria-label="Menu" className="inline-flex size-11 items-center justify-center rounded-[10px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-ember md:hidden"><MenuIcon aria-hidden strokeWidth={1.75} className="size-5" /></button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 data-[state=open]:animate-[ui-fade-in_150ms_ease-out] md:hidden" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[86%] max-w-sm flex-col bg-panel text-ink shadow-g3 data-[state=open]:animate-[ui-slide-in-right_200ms_cubic-bezier(0.16,1,0.3,1)] md:hidden">
          <Dialog.Title className="sr-only">Menu</Dialog.Title>
          <Dialog.Description className="sr-only">Primary navigation and account actions.</Dialog.Description>
          <div className="flex h-14 items-center justify-between border-b border-hair px-4">
            <GlyphWordmark className="text-[19px]" />
            <Dialog.Close asChild><button aria-label="Close menu" className="inline-flex size-11 items-center justify-center rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-ember"><X aria-hidden className="size-5" /></button></Dialog.Close>
          </div>
          <nav className="flex flex-col gap-0.5 p-3">
            {GLOBAL.map((l) => <Link key={l.key} href={l.key === 'home' ? (user ? '/feed' : '/') : l.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-[10px] px-3 text-body font-medium text-ink hover:bg-sunken">{l.label}</Link>)}
          </nav>
          <div className="mt-auto border-t border-hair p-3">
            {user ? (
              <>
                <p className="px-3 pb-2 font-mono text-micro text-ink-3">{user.email}</p>
                {meLinks(user.username, user.nav).map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-[10px] px-3 text-small text-ink hover:bg-sunken">{l.label}</Link>)}
                <button type="button" onClick={signOut} className="flex min-h-11 w-full items-center gap-2 rounded-[10px] px-3 text-small text-ink hover:bg-sunken"><LogOut aria-hidden strokeWidth={1.75} className="size-4 text-ink-3" /> Sign out</button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <GButton asChild variant="ember" size="md"><Link href="/signup" onClick={() => setOpen(false)}>Sign up</Link></GButton>
                <GButton asChild variant="outline" size="md"><Link href="/login" onClick={() => setOpen(false)}>Log in</Link></GButton>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function GlyphTopNav({ user }: { user: ShellUser | null }) {
  const pathname = usePathname()
  const g = activeGlobal(pathname, user?.username ?? '')
  return (
    <header className="sticky top-0 z-30 border-b border-hair bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href={user ? '/feed' : '/'} className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ember"><GlyphWordmark className="text-[20px]" /></Link>
        <nav aria-label="Primary" className="ml-3 hidden items-center gap-0.5 md:flex">
          {GLOBAL.map((l) => {
            const active = g === l.key
            const href = l.key === 'home' ? (user ? '/feed' : '/') : l.href
            return (
              <Link key={l.key} href={href} aria-current={active ? 'page' : undefined} className={cn('rounded-[9px] px-3 py-2 text-small font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ember', active ? 'text-ink' : 'text-ink-2 hover:text-ink')}>
                <span className="relative">{l.label}{active && <span aria-hidden className="absolute -bottom-[7px] left-0 right-0 h-0.5 rounded-full bg-ember" />}</span>
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <CommandMenu signedIn={!!user} />
          {user ? (
            <>
              <CreateMenu />
              <Link href="/notifications" aria-label={user.nav.unreadNotifications ? `Notifications, ${user.nav.unreadNotifications} unread` : 'Notifications'} className="relative hidden size-10 items-center justify-center rounded-[10px] text-ink-2 outline-none transition-colors hover:bg-sunken hover:text-ink focus-visible:ring-2 focus-visible:ring-ember md:inline-flex">
                <Bell aria-hidden strokeWidth={1.75} className="size-5" />
                {user.nav.unreadNotifications > 0 && <span aria-hidden className="absolute right-2 top-2 size-2 rounded-full bg-ember ring-2 ring-paper" />}
              </Link>
              <div className="hidden md:block"><MeMenu user={user} /></div>
            </>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <GButton asChild variant="ghost" size="sm"><Link href="/login">Log in</Link></GButton>
              <GButton asChild variant="ember" size="sm"><Link href="/signup">Sign up</Link></GButton>
            </div>
          )}
          <MobileMenu user={user} />
        </div>
      </div>
    </header>
  )
}
