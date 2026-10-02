import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { GlyphShell } from '@/components/glyph/shell/GlyphShell'
import { GlyphFilterChips } from '@/components/glyph/explore/SectionObjects'
import { GEmptyState, GErrorState } from '@/components/glyph/ui/States'
import { GlyphNotificationRow } from '@/components/glyph/notifications/GlyphNotificationRow'
import { GlyphMarkAllReadButton } from '@/components/glyph/notifications/GlyphMarkAllReadButton'
import { classifyPrivacyGate, classifyObjectResolution } from '@/lib/glyph/notificationPrivacy'
import { classifyProfileGate } from '@/lib/glyph/profileGate'
import { presentNotifications, type ObjectInfo, type RawNotification, type PresentedRow } from '@/lib/notifications/present'

export const metadata = { title: 'Notifications — Glyph' }
const LIMIT = 100

type Row = {
  id: string; type: string; entity_type: string | null; entity_id: string | null; read_at: string | null; created_at: string
  actor_id: string | null; profiles: { username: string; display_name: string | null; avatar_url: string | null } | null
}

const ids = (rows: Row[], entity: string) => [...new Set(rows.filter((n) => n.entity_type === entity && n.entity_id).map((n) => n.entity_id as string))]

/** Today / Yesterday / Earlier — a pure grouping of already-sorted rows, no new data. */
function groupByDay(rows: PresentedRow[]) {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000)
  const today: PresentedRow[] = []
  const yesterday: PresentedRow[] = []
  const earlier: PresentedRow[] = []
  for (const r of rows) {
    const t = new Date(r.time)
    if (t >= startOfToday) today.push(r)
    else if (t >= startOfYesterday) yesterday.push(r)
    else earlier.push(r)
  }
  return [['Today', today], ['Yesterday', yesterday], ['Earlier', earlier]] as const
}

/**
 * Notification list: one dense row per event (or per merged group), newest first. Rows from anyone
 * blocked or muted are never shown — and if that block/mute check itself fails, the list fails
 * closed rather than risk showing something it shouldn't. Objects that no longer exist, or that
 * couldn't be checked, say so — and say which of those two true things happened.
 */
export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter: rawFilter } = await searchParams
  const { user } = await getSidebarIdentity()
  const supabase = await createClient()
  const filter: 'all' | 'unread' = rawFilter === 'unread' ? 'unread' : 'all'

  const { data: profile, error: profileError } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle()
  const profileGate = classifyProfileGate(profile, profileError, () => true)
  if (profileGate.kind === 'redirect') redirect('/onboarding')
  if (profileGate.kind === 'error') {
    return (
      <GlyphShell>
        <div className="mx-auto w-full max-w-2xl">
          <h1 className="text-h1 font-semibold tracking-[-0.02em] text-ink">Notifications</h1>
          <div className="mt-6">
            <GErrorState
              title="We couldn't load your notifications"
              description="This may be temporary. Nothing was lost. Reload to try again."
              action={
                <Link href="/notifications" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm px-2 text-small font-medium text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0 sm:min-w-0 sm:px-0">
                  Reload
                </Link>
              }
            />
          </div>
        </div>
      </GlyphShell>
    )
  }

  const [{ data: notifs, error: notifsError }, { data: blocks, error: blocksError }, { data: mutes, error: mutesError }] = await Promise.all([
    supabase
      .from('notifications')
      .select('id, type, entity_type, entity_id, read_at, created_at, actor_id, profiles!actor_id(username, display_name, avatar_url)')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(LIMIT)
      .returns<Row[]>(),
    // blocks_read RLS returns rows where you are blocker or blocked, i.e. both directions.
    supabase.from('user_blocks').select('blocker_id, blocked_id'),
    supabase.from('user_mutes').select('muted_id').eq('muter_id', user.id),
  ])

  const gate = classifyPrivacyGate({ blocks, blocksError, mutes, mutesError, viewerId: user.id })

  return (
    <GlyphShell>
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <h1 className="text-h1 font-semibold tracking-[-0.02em] text-ink">Notifications</h1>
          <Link href="/settings/notifications" className="inline-flex min-h-11 items-center text-small font-medium text-ink-2 underline-offset-4 outline-none hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">Settings</Link>
        </div>

        {notifsError ? (
          <div className="mt-6"><GErrorState title="We couldn't load your notifications" description="This may be temporary. Nothing was lost. Reload to try again." action={<Link href="/notifications" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm px-2 text-small font-medium text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0 sm:min-w-0 sm:px-0">Reload</Link>} /></div>
        ) : gate.kind === 'error' ? (
          <div className="mt-6"><GErrorState title="We couldn't confirm your blocks and mutes" description="Showing notifications now could reveal someone you've blocked or muted, so nothing is shown until this succeeds. Reload to try again." action={<Link href="/notifications" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm px-2 text-small font-medium text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0 sm:min-w-0 sm:px-0">Reload</Link>} /></div>
        ) : (
          <NotificationsBody supabase={supabase} recipientId={user.id} rawRows={notifs ?? []} hiddenActorIds={gate.hiddenActorIds} filter={filter} truncated={(notifs ?? []).length === LIMIT} />
        )}
      </div>
    </GlyphShell>
  )
}

async function NotificationsBody({
  supabase,
  recipientId,
  rawRows,
  hiddenActorIds,
  filter,
  truncated,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>
  recipientId: string
  rawRows: Row[]
  hiddenActorIds: Set<string>
  filter: 'all' | 'unread'
  truncated: boolean
}) {
  const rows = rawRows.filter((n) => !n.actor_id || !hiddenActorIds.has(n.actor_id))

  const [devlogIds, postIds, requestIds, studioIds, inviteIds, contactIds] = [
    ids(rows, 'devlog_post'), ids(rows, 'collaboration_post'), ids(rows, 'playtest_request'),
    ids(rows, 'studio'), ids(rows, 'studio_invitation'), ids(rows, 'publisher_contact'),
  ]
  const none = Promise.resolve({ data: [] as unknown[], error: null })
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

  // Any object not returned by its own resolution query is either genuinely gone/hidden (the query
  // succeeded) or unresolved (that query itself failed) — these are different true statements.
  const errorByType: Record<string, boolean> = {
    devlog_post: !!dv.error, collaboration_post: !!po.error, playtest_request: !!rq.error,
    studio: !!st.error, studio_invitation: !!iv.error, publisher_contact: !!ct.error,
  }
  const RESOLVED = new Set(Object.keys(errorByType))
  for (const n of rows) {
    if (n.entity_id && n.entity_type && RESOLVED.has(n.entity_type) && !found.has(n.entity_id)) {
      const resolution = classifyObjectResolution(false, errorByType[n.entity_type])
      objects.set(n.entity_id, resolution === 'unknown' ? { title: null, unknown: true } : { title: null, gone: true })
    }
  }

  const actorNames = new Map<string, string>()
  const actorAvatars = new Map<string, string | null>()
  const actorUsernames = new Map<string, string>()
  for (const n of rows) if (n.actor_id && n.profiles) {
    actorNames.set(n.actor_id, n.profiles.display_name || n.profiles.username)
    actorUsernames.set(n.actor_id, n.profiles.username)
    actorAvatars.set(n.actor_id, n.profiles.avatar_url)
  }
  const raw: RawNotification[] = rows.map((n) => ({
    id: n.id, type: n.type, entity_type: n.entity_type, entity_id: n.entity_id, read_at: n.read_at, created_at: n.created_at,
    actor_id: n.actor_id, actorName: n.actor_id ? actorNames.get(n.actor_id) ?? null : null,
    actorAvatar: n.actor_id ? actorAvatars.get(n.actor_id) ?? null : null,
  }))
  const presented = presentNotifications(raw, objects, actorUsernames)

  const unreadCount = presented.filter((p) => p.unread).length
  const shown = filter === 'unread' ? presented.filter((p) => p.unread) : presented

  return (
    <>
      {presented.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="text-small text-ink-2">{unreadCount > 0 ? `${unreadCount} unread` : 'Nothing unread'}</p>
          {unreadCount > 0 && <GlyphMarkAllReadButton recipientId={recipientId} />}
        </div>
      )}

      {presented.length === 0 ? (
        <div className="mt-6">
          <GEmptyState title="No notifications yet" description="Follows, comments, applications, playtest and studio activity, and publisher messages show up here." />
        </div>
      ) : (
        <>
          <div className="mt-4">
            <GlyphFilterChips
              label="Filter notifications"
              options={[
                { label: 'All', href: '/notifications', active: filter === 'all' },
                { label: `Unread · ${unreadCount}`, href: '/notifications?filter=unread', active: filter === 'unread' },
              ]}
            />
          </div>
          {shown.length === 0 ? (
            <div className="mt-6">
              <GEmptyState title="Nothing unread" description="Every notification has been read." action={<Link href="/notifications" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm px-2 text-small font-medium text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0 sm:min-w-0 sm:px-0">Show all notifications</Link>} />
            </div>
          ) : (
            groupByDay(shown).map(([label, group]) => group.length === 0 ? null : (
              <div key={label} className="mt-6 first:mt-5">
                <h2 className="mb-1 font-mono text-micro font-medium uppercase tracking-wide text-ink-3">{label}</h2>
                <ul className="border-t border-hair">{group.map((p) => <GlyphNotificationRow key={p.key} row={p} />)}</ul>
              </div>
            ))
          )}
          {truncated && <p className="mt-3 text-micro text-ink-3">Showing the latest {LIMIT}.</p>}
        </>
      )}
    </>
  )
}
