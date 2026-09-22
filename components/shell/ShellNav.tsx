'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Compass, Home, LogIn, LogOut, Plus, User, UserPlus, type LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { CREATE_ITEMS, activeGlobal, meLinks, type GlobalKey } from '@/lib/shell/nav'
import type { SidebarNavFlags } from '@/lib/dashboard/identity'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/components/ui/Dialog'
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from '@/components/ui/Menu'

export type ShellUser = { displayName: string; username: string; email: string; nav: SidebarNavFlags }

const BRAND = (
  <>
    Glyph<span className="text-accent">°</span>
  </>
)

function useSignOut() {
  const router = useRouter()
  return async () => {
    await createClient().auth.signOut()
    router.push('/')
    router.refresh()
  }
}

function UnreadBadge({ count, className }: { count: number; className?: string }) {
  if (!count) return null
  return (
    <span aria-hidden className={cn('inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 font-mono text-micro font-medium text-fg-on-accent', className)}>
      {count > 9 ? '9+' : count}
    </span>
  )
}

/* ── Desktop / tablet rail ── */

const railItem =
  'relative flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-small font-medium transition-colors duration-150 md:flex-col md:justify-center md:gap-0.5 md:px-1 md:py-1.5 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:py-0'
const railLabel = 'md:text-micro lg:text-small'
const stateClass = (active: boolean) => (active ? 'bg-surface-muted text-fg' : 'text-fg-secondary hover:bg-surface-muted hover:text-fg')

function RailLink({ href, label, Icon, active, badge, ariaLabel }: { href: string; label: string; Icon: LucideIcon; active: boolean; badge?: number; ariaLabel?: string }) {
  return (
    <Link href={href} aria-current={active ? 'page' : undefined} aria-label={ariaLabel} className={cn(railItem, stateClass(active))}>
      <Icon aria-hidden strokeWidth={1.75} className="size-5 shrink-0" />
      <span className={railLabel}>{label}</span>
      {!!badge && <UnreadBadge count={badge} className="ml-auto md:absolute md:right-1.5 md:top-0.5 md:ml-0 lg:static lg:ml-auto" />}
    </Link>
  )
}

function CreateMenu() {
  return (
    <Menu>
      <MenuTrigger className={cn(railItem, stateClass(false), 'data-[state=open]:bg-surface-muted data-[state=open]:text-fg')}>
        <Plus aria-hidden strokeWidth={1.75} className="size-5 shrink-0" />
        <span className={railLabel}>Create</span>
      </MenuTrigger>
      <MenuContent side="right" align="start" sideOffset={8} className="w-72">
        <MenuLabel>Create</MenuLabel>
        {CREATE_ITEMS.map((it) => (
          <MenuItem key={it.href} asChild className="h-auto min-h-11 items-start py-2">
            <Link href={it.href}>
              {it.icon && <it.icon aria-hidden strokeWidth={1.75} className="mt-0.5 size-4 shrink-0 text-fg-muted" />}
              <span>
                <span className="block font-medium">{it.label}</span>
                {it.description && <span className="block text-micro text-fg-muted">{it.description}</span>}
              </span>
            </Link>
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  )
}

function MeMenu({ user, active }: { user: ShellUser; active: boolean }) {
  const signOut = useSignOut()
  return (
    <Menu>
      <MenuTrigger
        aria-label={`Account menu for ${user.displayName}`}
        className={cn('flex min-h-11 w-full items-center gap-3 rounded-control p-2 text-left transition-colors duration-150 hover:bg-surface-muted data-[state=open]:bg-surface-muted md:justify-center lg:justify-start', active && 'bg-surface-muted')}
      >
        <Avatar name={user.displayName} size="md" />
        <span className="hidden min-w-0 flex-1 lg:block">
          <span className="block truncate text-small font-medium text-fg">{user.displayName}</span>
          {user.username && <span className="block truncate font-mono text-micro text-fg-muted">@{user.username}</span>}
        </span>
      </MenuTrigger>
      <MenuContent side="top" align="start" sideOffset={8} className="w-64">
        <MenuLabel>{user.email}</MenuLabel>
        {meLinks(user.username, user.nav).map((l) => (
          <MenuItem key={l.href} asChild>
            <Link href={l.href}>{l.label}</Link>
          </MenuItem>
        ))}
        <MenuSeparator />
        <MenuItem onSelect={signOut}>
          <LogOut aria-hidden strokeWidth={1.75} className="size-4 text-fg-muted" /> Sign out
        </MenuItem>
      </MenuContent>
    </Menu>
  )
}

export function Rail({ user }: { user: ShellUser | null }) {
  const pathname = usePathname()
  const g: GlobalKey | null = activeGlobal(pathname, user?.username ?? '')
  return (
    <aside className="sticky top-0 hidden h-dvh w-24 shrink-0 flex-col border-r border-line bg-surface md:flex lg:w-60">
      <div className="flex h-14 items-center justify-center border-b border-line px-3 lg:justify-start lg:px-5">
        <Link href={user ? '/feed' : '/'} className="text-h3 font-semibold tracking-tight text-fg">{BRAND}</Link>
      </div>
      <nav aria-label="Primary" className="flex-1 space-y-1 overflow-y-auto p-2 lg:p-3">
        {user ? (
          <>
            <RailLink href="/feed" label="Home" Icon={Home} active={g === 'home'} />
            <RailLink href="/explore" label="Explore" Icon={Compass} active={g === 'explore'} />
            <CreateMenu />
            <RailLink
              href="/notifications"
              label="Notifications"
              Icon={Bell}
              active={g === 'notifications'}
              badge={user.nav.unreadNotifications}
              ariaLabel={user.nav.unreadNotifications ? `Notifications, ${user.nav.unreadNotifications} unread` : 'Notifications'}
            />
          </>
        ) : (
          <>
            <RailLink href="/" label="Home" Icon={Home} active={pathname === '/'} />
            <RailLink href="/explore" label="Explore" Icon={Compass} active={g === 'explore'} />
          </>
        )}
      </nav>
      <div className="border-t border-line p-2 lg:p-3">
        {user ? (
          <MeMenu user={user} active={g === 'me'} />
        ) : (
          <div className="flex flex-col gap-2">
            <Button asChild variant="secondary" size="sm" className="w-full px-2"><Link href="/login">Log in</Link></Button>
            <Button asChild variant="primary" size="sm" className="w-full px-2"><Link href="/signup">Sign up</Link></Button>
          </div>
        )}
      </div>
    </aside>
  )
}

/* ── Mobile bottom bar (below md) ── */

const barItem = 'flex min-h-14 flex-col items-center justify-center gap-0.5 text-micro font-medium transition-colors duration-150'
const barState = (active: boolean) => (active ? 'text-accent' : 'text-fg-secondary')

function BarLink({ href, label, Icon, active, badge, ariaLabel }: { href: string; label: string; Icon: LucideIcon; active: boolean; badge?: number; ariaLabel?: string }) {
  return (
    <Link href={href} aria-current={active ? 'page' : undefined} aria-label={ariaLabel} className={cn(barItem, barState(active), 'relative')}>
      <span className="flex size-8 items-center justify-center">
        <Icon aria-hidden strokeWidth={active ? 2 : 1.75} className="size-5" />
      </span>
      {label}
      {!!badge && <UnreadBadge count={badge} className="absolute right-1/2 top-1 -mr-6 h-4 min-w-4 px-1" />}
    </Link>
  )
}

function CreateSheet() {
  return (
    <Dialog>
      <DialogTrigger className={cn(barItem, barState(false))}>
        <span className="flex size-8 items-center justify-center rounded-control bg-accent text-fg-on-accent">
          <Plus aria-hidden strokeWidth={2} className="size-5" />
        </span>
        Create
      </DialogTrigger>
      <DialogContent side="bottom" title="Create">
        <ul className="-my-2">
          {CREATE_ITEMS.map((it) => (
            <li key={it.href}>
              <DialogClose asChild>
                <Link href={it.href} className="flex min-h-14 items-start gap-3 rounded-control py-2.5 hover:bg-surface-muted">
                  {it.icon && <it.icon aria-hidden strokeWidth={1.75} className="mt-0.5 size-5 shrink-0 text-fg-muted" />}
                  <span>
                    <span className="block text-body font-medium text-fg">{it.label}</span>
                    {it.description && <span className="block text-small text-fg-muted">{it.description}</span>}
                  </span>
                </Link>
              </DialogClose>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}

function MeSheet({ user, active }: { user: ShellUser; active: boolean }) {
  const signOut = useSignOut()
  return (
    <Dialog>
      <DialogTrigger className={cn(barItem, barState(active))} aria-label={`Account menu for ${user.displayName}`}>
        <span className="flex size-8 items-center justify-center">
          <User aria-hidden strokeWidth={active ? 2 : 1.75} className="size-5" />
        </span>
        <span aria-hidden>Me</span>
      </DialogTrigger>
      <DialogContent side="bottom" title={user.displayName} description={user.email}>
        <ul className="-my-2">
          {meLinks(user.username, user.nav).map((l) => (
            <li key={l.href}>
              <DialogClose asChild>
                <Link href={l.href} className="flex min-h-12 items-center rounded-control text-body text-fg hover:bg-surface-muted">{l.label}</Link>
              </DialogClose>
            </li>
          ))}
          <li>
            <button type="button" onClick={signOut} className="flex min-h-12 w-full items-center gap-2 rounded-control text-body text-fg hover:bg-surface-muted">
              <LogOut aria-hidden strokeWidth={1.75} className="size-4 text-fg-muted" /> Sign out
            </button>
          </li>
        </ul>
      </DialogContent>
    </Dialog>
  )
}

export function BottomBar({ user }: { user: ShellUser | null }) {
  const pathname = usePathname()
  const g = activeGlobal(pathname, user?.username ?? '')
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      {user ? (
        <div className="grid grid-cols-5">
          <BarLink href="/feed" label="Home" Icon={Home} active={g === 'home'} />
          <BarLink href="/explore" label="Explore" Icon={Compass} active={g === 'explore'} />
          <CreateSheet />
          <BarLink
            href="/notifications"
            label="Alerts"
            Icon={Bell}
            active={g === 'notifications'}
            badge={user.nav.unreadNotifications}
            ariaLabel={user.nav.unreadNotifications ? `Alerts, ${user.nav.unreadNotifications} unread notifications` : 'Alerts, notifications'}
          />
          <MeSheet user={user} active={g === 'me'} />
        </div>
      ) : (
        <div className="grid grid-cols-4">
          <BarLink href="/" label="Home" Icon={Home} active={pathname === '/'} />
          <BarLink href="/explore" label="Explore" Icon={Compass} active={g === 'explore'} />
          <BarLink href="/login" label="Log in" Icon={LogIn} active={pathname === '/login'} />
          <BarLink href="/signup" label="Sign up" Icon={UserPlus} active={pathname === '/signup'} />
        </div>
      )}
    </nav>
  )
}
