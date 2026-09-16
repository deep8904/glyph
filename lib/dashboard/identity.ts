import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Shared identity fetch for every authenticated app page that renders <AppShell>.
 * Redirects to /login if unauthenticated — proxy.ts already guards these routes,
 * this is the defensive fallback the rest of the app already follows.
 */
export async function getSidebarIdentity() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, username')
    .eq('id', user.id)
    .maybeSingle<{ display_name: string | null; username: string }>()

  return {
    user,
    displayName: profile?.display_name || profile?.username || 'there',
    username: profile?.username ?? '',
    email: user.email ?? '',
  }
}
