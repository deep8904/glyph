import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { MarkAllReadButton } from '@/components/notifications/MarkAllReadButton'

type NotifType = 'follow' | 'comment' | 'reply' | 'reaction' | 'mention'

type Notification = {
  id: string
  type: NotifType
  entity_type: string | null
  entity_id: string | null
  read_at: string | null
  created_at: string
  actor: { username: string; display_name: string | null; avatar_url: string | null } | null
}

function notifLabel(n: Notification): string {
  const actor = n.actor?.display_name || n.actor?.username || 'Someone'
  switch (n.type) {
    case 'follow': return `${actor} followed you`
    case 'comment': return `${actor} commented on your devlog`
    case 'reply': return `${actor} replied to your comment`
    case 'reaction': return `${actor} reacted to your devlog`
    case 'mention': return `${actor} mentioned you`
    default: return `${actor} did something`
  }
}

function formatDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

export default async function NotificationsPage() {
  const { user, displayName, email } = await getSidebarIdentity()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) redirect('/onboarding')

  const { data: notifs } = await supabase
    .from('notifications')
    .select('id, type, entity_type, entity_id, read_at, created_at, profiles!actor_id(username, display_name, avatar_url)')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  type RawNotif = {
    id: string; type: string; entity_type: string | null; entity_id: string | null;
    read_at: string | null; created_at: string;
    profiles: { username: string; display_name: string | null; avatar_url: string | null } | null
  }

  const notifications = ((notifs ?? []) as unknown as RawNotif[]).map((n) => ({
    id: n.id,
    type: n.type as NotifType,
    entity_type: n.entity_type,
    entity_id: n.entity_id,
    read_at: n.read_at,
    created_at: n.created_at,
    actor: n.profiles,
  })) as Notification[]

  const unreadCount = notifications.filter((n) => !n.read_at).length

  return (
    <AppShell
      displayName={displayName}
      email={email}
      headerLabel="Notifications"
      headerAction={unreadCount > 0 ? <MarkAllReadButton recipientId={user.id} /> : undefined}
    >
      <div className="max-w-2xl">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-20">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-50 text-gray-300 mb-4">
                  <Bell className="h-8 w-8" />
                </div>
                <h2 className="text-sm font-medium text-gray-900 mb-1">All caught up</h2>
                <p className="text-sm text-gray-400">Notifications will appear here when people follow you or interact with your content.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notif) => {
                  const isUnread = !notif.read_at
                  const actorName = notif.actor?.display_name || notif.actor?.username || '?'
                  return (
                    <div
                      key={notif.id}
                      className={`flex items-center gap-4 rounded-2xl border p-4 transition-all duration-200 ${
                        isUnread
                          ? 'border-indigo-100 bg-indigo-50/60'
                          : 'border-gray-100 bg-white'
                      }`}
                    >
                      {notif.actor ? (
                        <Link href={`/dev/${notif.actor.username}`} className="shrink-0">
                          {notif.actor.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={notif.actor.avatar_url} alt="" className="h-10 w-10 rounded-xl object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 font-mono text-sm font-semibold text-indigo-600">
                              {initials(actorName)}
                            </div>
                          )}
                        </Link>
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                          <Bell className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${isUnread ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                          {notifLabel(notif)}
                        </p>
                        <p className="text-[11px] font-mono text-gray-400 mt-0.5">{formatDate(notif.created_at)}</p>
                      </div>
                      {isUnread && (
                        <div className="shrink-0 h-2 w-2 rounded-full bg-indigo-600" />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
      </div>
    </AppShell>
  )
}
