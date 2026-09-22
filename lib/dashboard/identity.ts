import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Flags that drive which secondary/contextual navigation destinations
 * AppShell renders. Computed once here — the single shared identity fetch
 * every authenticated page already calls — rather than re-implementing
 * admin/publisher/studio checks separately in the nav component. This is
 * a presentation signal only, not the authorization boundary: every route
 * these flags point at (e.g. /admin, /dashboard/publisher) already does
 * its own server-side check on load, matching the existing admin_users
 * lookup pattern in app/admin/*.
 */
export type SidebarNavFlags = {
  isAdmin: boolean
  hasPublisherAccount: boolean
  hasStudio: boolean
  /** true once any publisher has contacted this developer */
  hasPublisherContacts: boolean
  unreadNotifications: number
}

/**
 * Shared identity fetch for every authenticated app page that renders <AppShell>.
 * Redirects to /login if unauthenticated — proxy.ts already guards these routes,
 * this is the defensive fallback the rest of the app already follows.
 */
export async function getSidebarIdentity() {
  const identity = await getOptionalIdentity()
  if (!identity) redirect('/login')
  return identity
}

/**
 * Memoised per request (React `cache`): the page and the shell both ask for identity,
 * and the 7 queries below run once.
 *
 * Same identity as getSidebarIdentity() but returns null for signed-out
 * visitors instead of redirecting. For public pages (Explore, Search) that
 * render inside the app shell when signed in and a public frame when not.
 */
export const getOptionalIdentity = cache(async function getOptionalIdentity() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: profile }, { data: adminRow }, { data: publisherRow }, { data: studioRow }, { count: unread }, { count: invited }, { count: contacted }] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', user.id)
      .maybeSingle<{ display_name: string | null; username: string }>(),
    supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle(),
    supabase.from('publisher_accounts').select('id').eq('user_id', user.id).maybeSingle(),
    supabase.from('studio_members').select('id').eq('user_id', user.id).limit(1).maybeSingle(),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('recipient_id', user.id).is('read_at', null),
    supabase.from('studio_invitations').select('id', { count: 'exact', head: true }).eq('invitee_id', user.id).eq('status', 'pending').gt('expires_at', new Date().toISOString()),
    supabase.from('publisher_contacts').select('id', { count: 'exact', head: true }).eq('developer_id', user.id),
  ])

  const nav: SidebarNavFlags = {
    isAdmin: !!adminRow,
    hasPublisherAccount: !!publisherRow,
    // "Studios" is also where a pending invitation lives, so it counts as a reason to show the entry.
    hasStudio: !!studioRow || (invited ?? 0) > 0,
    hasPublisherContacts: (contacted ?? 0) > 0,
    unreadNotifications: unread ?? 0,
  }

  return {
    user,
    displayName: profile?.display_name || profile?.username || 'there',
    username: profile?.username ?? '',
    email: user.email ?? '',
    nav,
  }
})
