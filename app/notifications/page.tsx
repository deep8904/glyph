import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { NotificationsView } from '@/components/notifications/NotificationsView'
import { presentNotifications, type ObjectInfo, type RawNotification } from '@/lib/notifications/present'

export const metadata = { title: 'Notifications — Glyph' }
const LIMIT = 100

type Row = {
  id: string; type: string; entity_type: string | null; entity_id: string | null; read_at: string | null; created_at: string
  actor_id: string | null; profiles: { username: string; display_name: string | null } | null
}

const ids = (rows: Row[], entity: string) => [...new Set(rows.filter((n) => n.entity_type === entity && n.entity_id).map((n) => n.entity_id as string))]

/**
 * Notification list: one dense row per event (or per merged group), newest first.
 * Rows from anyone you have blocked or muted are never shown (the database also stops
 * new ones from being created). Objects that no longer exist say so instead of linking to nothing.
 */
export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter: rawFilter } = await searchParams
  const { user } = await getSidebarIdentity()
  const supabase = await createClient()

  const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle()
  if (!profile) redirect('/onboarding')

  const [{ data: notifs, error }, { data: blocks }, { data: mutes }] = await Promise.all([
    supabase
      .from('notifications')
      .select('id, type, entity_type, entity_id, read_at, created_at, actor_id, profiles!actor_id(username, display_name)')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(LIMIT)
      .returns<Row[]>(),
    // blocks_read RLS returns rows where you are blocker or blocked, i.e. both directions.
    supabase.from('user_blocks').select('blocker_id, blocked_id'),
    supabase.from('user_mutes').select('muted_id').eq('muter_id', user.id),
  ])

  const hidden = new Set<string>()
  for (const b of (blocks ?? []) as { blocker_id: string; blocked_id: string }[]) { hidden.add(b.blocker_id); hidden.add(b.blocked_id) }
  for (const m of (mutes ?? []) as { muted_id: string }[]) hidden.add(m.muted_id)
  hidden.delete(user.id)
  const rows = (notifs ?? []).filter((n) => !n.actor_id || !hidden.has(n.actor_id))

  // Resolve the objects the rows point at (one query per kind, not per row).
  const [devlogIds, postIds, requestIds, studioIds, inviteIds, contactIds] = [
    ids(rows, 'devlog_post'), ids(rows, 'collaboration_post'), ids(rows, 'playtest_request'),
    ids(rows, 'studio'), ids(rows, 'studio_invitation'), ids(rows, 'publisher_contact'),
  ]
  const none = Promise.resolve({ data: [] as unknown[] })
  const [dv, po, rq, st, iv, ct] = await Promise.all([
    devlogIds.length ? supabase.from('devlog_posts').select('id, title, slug, projects!project_id(slug, profiles!owner_id(username))').in('id', devlogIds) : none,
    postIds.length ? supabase.from('collaboration_posts').select('id, role_needed, role_offered, projects!project_id(title)').in('id', postIds) : none,
    requestIds.length ? supabase.from('playtest_requests').select('id, projects!project_id(title)').in('id', requestIds) : none,
    studioIds.length ? supabase.from('studios').select('id, slug, name').in('id', studioIds) : none,
    inviteIds.length ? supabase.from('studio_invitations').select('id, role, studios!studio_id(name, slug)').in('id', inviteIds) : none,
    contactIds.length ? supabase.from('publisher_contacts').select('id, projects!project_id(title), publisher_accounts!publisher_id(company_name)').in('id', contactIds) : none,
  ])

  const objects = new Map<string, ObjectInfo>()
  const found = new Set<string>()
  for (const d of (dv.data ?? []) as { id: string; title: string; slug: string; projects: { slug: string | null; profiles: { username: string } | null } | null }[]) {
    found.add(d.id)
    objects.set(d.id, { title: d.title, href: d.projects?.slug && d.projects.profiles ? `/p/${d.projects.profiles.username}/${d.projects.slug}/${d.slug}` : null })
  }
  for (const p of (po.data ?? []) as { id: string; role_needed: string | null; role_offered: string | null; projects: { title: string } | null }[]) {
    found.add(p.id); objects.set(p.id, { title: p.projects?.title ?? null, role: p.role_needed ?? p.role_offered })
  }
  for (const r of (rq.data ?? []) as { id: string; projects: { title: string } | null }[]) { found.add(r.id); objects.set(r.id, { title: r.projects?.title ?? null }) }
  for (const s of (st.data ?? []) as { id: string; slug: string; name: string }[]) { found.add(s.id); objects.set(s.id, { title: s.name, slug: s.slug }) }
  for (const i of (iv.data ?? []) as { id: string; role: string; studios: { name: string; slug: string } | null }[]) { found.add(i.id); objects.set(i.id, { title: i.studios?.name ?? null, slug: i.studios?.slug ?? null, extra: i.role }) }
  for (const c of (ct.data ?? []) as { id: string; projects: { title: string } | null; publisher_accounts: { company_name: string } | null }[]) {
    found.add(c.id); objects.set(c.id, { title: c.projects?.title ?? null, extra: c.publisher_accounts?.company_name ?? null })
  }
  // Any object that was deleted or is no longer visible to this viewer is stated as unavailable, and never linked.
  // (Row-level security makes "deleted" and "hidden" indistinguishable here, so one wording covers both.)
  const RESOLVED = new Set(['devlog_post', 'collaboration_post', 'playtest_request', 'studio', 'studio_invitation', 'publisher_contact'])
  for (const n of rows) {
    if (n.entity_id && n.entity_type && RESOLVED.has(n.entity_type) && !found.has(n.entity_id)) objects.set(n.entity_id, { title: null, gone: true })
  }

  const actorNames = new Map<string, string>()
  const actorUsernames = new Map<string, string>()
  for (const n of rows) if (n.actor_id && n.profiles) { actorNames.set(n.actor_id, n.profiles.display_name || n.profiles.username); actorUsernames.set(n.actor_id, n.profiles.username) }
  const raw: RawNotification[] = rows.map((n) => ({
    id: n.id, type: n.type, entity_type: n.entity_type, entity_id: n.entity_id, read_at: n.read_at, created_at: n.created_at,
    actor_id: n.actor_id, actorName: n.actor_id ? actorNames.get(n.actor_id) ?? null : null,
  }))
  const presented = presentNotifications(raw, objects, actorUsernames)

  return (
    <AppShell headerLabel="Notifications">
      <NotificationsView rows={presented} failed={!!error} filter={rawFilter === 'unread' ? 'unread' : 'all'} recipientId={user.id} limit={LIMIT} truncated={(notifs ?? []).length === LIMIT} />
    </AppShell>
  )
}
