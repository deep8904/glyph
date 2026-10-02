'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Compass, Home, LogOut, Plus, User, type LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { CREATE_ITEMS, activeGlobal, meLinks, type GlobalKey } from '@/lib/shell/nav'
import type { SidebarNavFlags } from '@/lib/dashboard/identity'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/components/ui/Dialog'
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from '@/components/ui/Menu'

export type ShellUser = { displayName: string; username: string; email: string; nav: SidebarNavFlags }

function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('font-semibold tracking-tight text-fg', className)}>
      Glyph<span className="text-accent">°</span>
    </span>
  )
}

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
  // Real measured count → tabular mono is legitimate here (data, not costume).
  return (
    <span aria-hidden className={cn('inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 font-mono text-[11px] font-medium tabular-nums text-fg-on-accent', className)}>
      {count > 9 ? '9+' : count}
    </span>
  )
}

/* ── Desktop / tablet rail ──
   md = compact icon rail (72px); lg = labelled rail (240px). Active reads as a quiet filled
   row (surface-muted + accent icon), not a raised pill. Content owns the page; the rail recedes. */

const navRow =
  'group relative flex min-h-11 items-center gap-3 rounded-control text-small font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-focus md:justify-center md:px-0 lg:justify-start lg:px-3'
const navState = (active: boolean) =>
  active ? 'bg-surface-muted text-fg' : 'text-fg-secondary hover:bg-surface-muted/70 hover:text-fg'

function RailLink({ href, label, Icon, active, badge, ariaLabel }: { href: string; label: string; Icon: LucideIcon; active: boolean; badge?: number; ariaLabel?: string }) {
  return (
    <Link href={href} aria-current={active ? 'page' : undefined} aria-label={ariaLabel} className={cn(navRow, navState(active), 'px-3')}>
      <Icon aria-hidden strokeWidth={1.75} className={cn('size-5 shrink-0 transition-colors', active ? 'text-accent' : 'text-fg-muted group-hover:text-fg')} />
      <span className="hidden lg:inline">{label}</span>
      {!!badge && <UnreadBadge count={badge} className="ml-auto hidden lg:inline-flex" />}
      {!!badge && <span aria-hidden className="absolute right-2 top-1.5 size-2 rounded-full bg-accent lg:hidden" />}
    </Link>
  )
}

function CreateMenu() {
  return (
    <Menu>
      <MenuTrigger
        aria-label="Create"
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-accent px-3 text-small font-medium text-fg-on-accent outline-none transition-[background-color,box-shadow] duration-150 hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas data-[state=open]:bg-accent-hover lg:justify-start lg:gap-3"
      >
        <Plus aria-hidden strokeWidth={2} className="size-5 shrink-0" />
        <span className="hidden lg:inline">Create</span>
      </MenuTrigger>
      <MenuContent side="right" align="start" sideOffset={10} className="w-72">
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
        className={cn('flex min-h-11 w-full items-center gap-3 rounded-control p-2 text-left outline-none transition-colors duration-150 hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-focus data-[state=open]:bg-surface-muted md:justify-center lg:justify-start', active && 'bg-surface-muted')}
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
    <aside className="sticky top-0 hidden h-dvh w-[72px] shrink-0 flex-col border-r border-line bg-canvas md:flex lg:w-60">
      <div className="flex h-14 items-center justify-center px-3 lg:justify-start lg:px-5">
        <Link href={user ? '/feed' : '/'} className="rounded-control outline-none focus-visible:ring-2 focus-visible:ring-focus">
          <Wordmark className="text-h3 lg:text-h3" />
        </Link>
      </div>

      {user ? (
        <>
          <div className="px-3 pt-1 lg:px-3"><CreateMenu /></div>
          <nav aria-label="Primary" className="mt-2 space-y-0.5 overflow-y-auto px-3 lg:px-3">
            <RailLink href="/feed" label="Home" Icon={Home} active={g === 'home'} />
            <RailLink href="/explore" label="Explore" Icon={Compass} active={g === 'explore'} />
            <RailLink
              href="/notifications"
              label="Notifications"
              Icon={Bell}
              active={g === 'notifications'}
              badge={user.nav.unreadNotifications}
              ariaLabel={user.nav.unreadNotifications ? `Notifications, ${user.nav.unreadNotifications} unread` : 'Notifications'}
            />
          </nav>
          <div className="mt-auto border-t border-line p-2 lg:p-3">
            <MeMenu user={user} active={g === 'me'} />
          </div>
        </>
      ) : (
        <>
          <nav aria-label="Primary" className="space-y-0.5 overflow-y-auto px-3 pt-1">
            <RailLink href="/" label="Home" Icon={Home} active={pathname === '/'} />
            <RailLink href="/explore" label="Explore" Icon={Compass} active={g === 'explore'} />
          </nav>
          <div className="mx-3 mt-3 hidden flex-col gap-2 rounded-panel border border-line bg-surface p-3 lg:flex">
            <p className="text-small font-medium text-fg">Join Glyph</p>
            <p className="text-micro leading-relaxed text-fg-secondary">Show your game as you build it — devlogs, playtests, collaborators.</p>
            <Button asChild variant="primary" size="sm" className="mt-1 w-full"><Link href="/signup">Sign up</Link></Button>
            <Button asChild variant="secondary" size="sm" className="w-full"><Link href="/login">Log in</Link></Button>
          </div>
          <div className="mt-auto flex flex-col gap-2 p-3 lg:hidden">
            <Button asChild variant="primary" size="sm" className="w-full px-0"><Link href="/signup" aria-label="Sign up">Join</Link></Button>
          </div>
        </>
      )}
    </aside>
  )
}

/* ── Mobile bottom bar (below md) ── */

const barItem = 'flex min-h-14 flex-col items-center justify-center gap-0.5 text-micro font-medium outline-none transition-colors duration-150'
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
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
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
        <div className="grid grid-cols-3">
          <BarLink href="/" label="Home" Icon={Home} active={pathname === '/'} />
          <BarLink href="/explore" label="Explore" Icon={Compass} active={g === 'explore'} />
          <Link href="/signup" className={cn(barItem, barState(false))}>
            <span className="flex size-8 items-center justify-center rounded-control bg-accent text-fg-on-accent">
              <User aria-hidden strokeWidth={2} className="size-5" />
            </span>
            Join
          </Link>
        </div>
      )}
    </nav>
  )
}
