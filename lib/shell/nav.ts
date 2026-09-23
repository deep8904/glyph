import {
  Building2,
  Calendar,
  FolderPlus,
  Handshake,
  Joystick,
  PenLine,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import type { SidebarNavFlags } from '@/lib/dashboard/identity'

/**
 * Shell navigation model: which global destination is active for a path, which
 * section nav (if any) belongs under the top bar, and what Create / Me contain.
 * Presentation only — every destination still enforces its own access on load.
 */
export type NavLink = { label: string; href: string; description?: string; icon?: LucideIcon; match?: string[]; exact?: boolean }
export type GlobalKey = 'home' | 'explore' | 'notifications' | 'me'

const on = (pathname: string, href: string) => pathname === href || pathname.startsWith(href + '/')

// Sections that live under "Explore" (browse surfaces for people who are not managing their own work).
const DISCOVER_PREFIXES = ['/explore', '/collaborate', '/playtests', '/jams', '/events', '/publishers', '/studios']

export const DISCOVER_NAV: NavLink[] = [
  { label: 'Explore', href: '/explore', match: ['/explore'] },
  { label: 'Collaborate', href: '/collaborate', match: ['/collaborate'] },
  { label: 'Playtests', href: '/playtests/browse', match: ['/playtests'] },
  { label: 'Studios', href: '/studios', match: ['/studios'] },
  { label: 'Jams', href: '/jams', match: ['/jams'] },
  { label: 'Events', href: '/events', match: ['/events'] },
  { label: 'Publishers', href: '/publishers', match: ['/publishers'] },
]

export const CREATE_ITEMS: NavLink[] = [
  { label: 'Project', href: '/dashboard/projects/new', description: 'Start documenting a game', icon: FolderPlus },
  { label: 'Devlog', href: '/dashboard/projects', description: 'Choose a project to post to', icon: PenLine },
  { label: 'Collaboration post', href: '/collaborate/new', description: 'Find or offer a role', icon: Handshake },
  { label: 'Playtest', href: '/dashboard/playtests/new', description: 'Request testers for a build', icon: Joystick },
  { label: 'Event', href: '/dashboard/events/new', description: 'Host a local meetup', icon: Calendar },
  { label: 'Game jam', href: '/dashboard/jams/new', description: 'Propose a jam', icon: Trophy },
  { label: 'Studio', href: '/dashboard/studios/new', description: 'Group your team and projects', icon: Building2 },
]

/** Account-level links for the Me menu. Role-gated entries follow the same flags as before. */
export function meLinks(username: string, flags: SidebarNavFlags): NavLink[] {
  return [
    ...(username ? [{ label: 'Your profile', href: `/dev/${username}` }] : []),
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Your projects', href: '/dashboard/projects' },
    ...(flags.hasStudio ? [{ label: 'Studios', href: '/dashboard/studios' }] : []),
    ...(flags.hasPublisherAccount ? [{ label: 'Publisher tools', href: '/dashboard/publisher' }] : []),
    ...(flags.hasPublisherContacts ? [{ label: 'Publisher messages', href: '/dashboard/publisher-contacts' }] : []),
    ...(flags.isAdmin ? [{ label: 'Admin', href: '/admin' }] : []),
    { label: 'Settings', href: '/settings/profile' },
  ]
}

/** Which of the five global destinations owns this path (null = none, e.g. someone else's profile). */
export function activeGlobal(pathname: string, username: string): GlobalKey | null {
  if (on(pathname, '/feed')) return 'home'
  if (on(pathname, '/notifications')) return 'notifications'
  if (pathname === '/collaborate/new') return null // Create
  if (DISCOVER_PREFIXES.some((p) => on(pathname, p))) return 'explore'
  if (on(pathname, '/dashboard') || on(pathname, '/settings') || on(pathname, '/admin')) return 'me'
  if (username && on(pathname, `/dev/${username}`)) return 'me'
  return null
}

const ADMIN_NAV: NavLink[] = [
  { label: 'Overview', href: '/admin', exact: true },
  { label: 'Users', href: '/admin/users' },
  { label: 'Moderation', href: '/admin/moderation' },
  { label: 'Featured', href: '/admin/featured' },
  { label: 'Flags', href: '/admin/flags' },
  { label: 'Jams', href: '/admin/jams' },
  { label: 'Studios', href: '/admin/studios' },
  { label: 'Publishers', href: '/admin/publishers' },
  { label: 'Audit', href: '/admin/audit' },
]

/** Section navigation shown under the top bar for a group of related routes; null when the route has none. */
export function sectionNav(pathname: string, flags: SidebarNavFlags): { label: string; items: NavLink[] } | null {
  if (on(pathname, '/admin')) return { label: 'Admin', items: ADMIN_NAV }
  if (on(pathname, '/dashboard')) {
    return {
      label: 'Your workspace',
      items: [
        { label: 'Overview', href: '/dashboard', exact: true },
        { label: 'Projects', href: '/dashboard/projects' },
        { label: 'Playtests', href: '/dashboard/playtests' },
        { label: 'Studios', href: '/dashboard/studios' },
        ...(flags.hasPublisherContacts ? [{ label: 'Publisher messages', href: '/dashboard/publisher-contacts' }] : []),
        ...(flags.hasPublisherAccount ? [{ label: 'Publisher tools', href: '/dashboard/publisher' }] : []),
        { label: 'Billing', href: '/dashboard/billing' },
      ],
    }
  }
  if (isDiscoveryHub(pathname)) return { label: 'Explore sections', items: DISCOVER_NAV }
  return null
}

/**
 * The Explore/Collaborate/Playtests/Studios/Jams/Events/Publishers tab row is browsing chrome:
 * it belongs on the hub/list pages where moving between those browsing modes is the task. It does
 * NOT belong on a detail page (a studio, a collaboration post, a playtest, a jam, an event, a
 * publisher) — that page is a destination, not a browsing context, and showing seven unrelated
 * tabs there adds navigation with no relevance to "look at this one thing."
 */
function isDiscoveryHub(pathname: string): boolean {
  if (pathname === '/explore' || pathname.startsWith('/explore/')) return true
  if (pathname === '/collaborate') return true
  if (pathname === '/playtests/browse') return true
  if (pathname === '/studios') return true
  if (pathname === '/jams') return true
  if (pathname === '/events' || pathname.startsWith('/events/city/')) return true
  if (pathname === '/publishers') return true
  return false
}

export function isItemActive(pathname: string, item: NavLink): boolean {
  if (item.exact) return pathname === item.href
  return (item.match ?? [item.href]).some((m) => on(pathname, m))
}
