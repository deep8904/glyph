/**
 * Presentation rules for the notification list — one place, deterministic, no schema.
 *
 * Every row reads ACTOR → ACTION → OBJECT → TIME. Rows that describe the same
 * thing by several people are merged with a fixed rule: follows, comments and
 * reactions merge when they share type and object ("A, B and 2 others commented
 * on your devlog X"). Everything else is one row per event.
 */

export type NotifType =
  | 'follow' | 'comment' | 'reply' | 'reaction' | 'mention'
  | 'collab_application' | 'collab_accepted' | 'collab_rejected' | 'collab_closed'
  | 'playtest_signup' | 'playtest_accepted' | 'playtest_skipped' | 'playtest_feedback'
  | 'studio_invitation' | 'studio_invite_accepted' | 'studio_role_changed' | 'studio_removed'
  | 'publisher_contact'

export type RawNotification = {
  id: string
  type: string
  entity_type: string | null
  entity_id: string | null
  read_at: string | null
  created_at: string
  actor_id: string | null
  actorName: string | null
}

/** What the notification points at, resolved from real rows. `gone` = the object no longer exists / is not visible. */
export type ObjectInfo = { title: string | null; role?: string | null; slug?: string | null; extra?: string | null; href?: string | null; gone?: boolean }

export type PresentedRow = {
  key: string
  ids: string[]
  unread: boolean
  time: string
  actors: string
  action: string
  href: string | null
  /** The object exists no more, or the viewer can no longer see it. The event still happened, so the row stays, but it does not link. */
  unavailable: boolean
}

const MERGE_TYPES = new Set(['follow', 'comment', 'reaction'])

function actorList(names: string[]): string {
  const unique = [...new Set(names)]
  if (unique.length === 1) return unique[0]
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`
  return `${unique[0]}, ${unique[1]} and ${unique.length - 2} ${unique.length - 2 === 1 ? 'other' : 'others'}`
}

/** When the object is gone or hidden the sentence names the kind of object only; the row adds one line saying why there is no link. */
function action(type: string, obj: ObjectInfo | undefined): string {
  const gone = !!obj?.gone
  const forProject = obj?.title ? ` for ${obj.title}` : obj?.role ? ` (${obj.role})` : ''
  const game = gone ? 'a game' : obj?.title ?? 'a game'
  const devlogRef = gone ? ' a devlog' : obj?.title ? ` your devlog “${obj.title}”` : ' your devlog'
  const studio = gone ? 'a studio' : obj?.title ?? 'a studio'
  switch (type) {
    case 'follow': return 'followed you'
    case 'comment': return `commented on${devlogRef}`
    case 'reply': return gone ? 'replied in a devlog' : `replied to your comment on${obj?.title ? ` “${obj.title}”` : ' your devlog'}`
    case 'reaction': return `reacted to${devlogRef}`
    case 'mention': return 'mentioned you'
    case 'collab_application': return gone ? 'applied to a collaboration post' : `applied to your collaboration post${forProject}`
    case 'collab_accepted': return gone ? 'accepted your application to a collaboration post' : `accepted your application${forProject}`
    case 'collab_rejected': return gone ? 'did not select your application to a collaboration post' : `did not select your application${forProject}`
    case 'collab_closed': return gone ? 'closed a collaboration post you applied to' : `closed a collaboration post you applied to${forProject}`
    case 'playtest_signup': return `signed up to test ${game}`
    case 'playtest_accepted': return `accepted you as a tester for ${game}`
    case 'playtest_skipped': return gone ? 'did not select you for a playtest' : `did not select you for the ${game} playtest`
    case 'playtest_feedback': return `submitted feedback on ${game}`
    case 'studio_invitation': return gone ? 'invited you to join a studio' : `invited you to join ${studio}${obj?.extra ? ` as ${obj.extra}` : ''}`
    case 'studio_invite_accepted': return `accepted your invitation to ${gone ? studio : obj?.title ?? 'your studio'}`
    case 'studio_role_changed': return `changed your role in ${studio}`
    case 'studio_removed': return `removed you from ${studio}`
    case 'publisher_contact': return gone ? 'contacted you about a project' : `contacted you${obj?.title ? ` about ${obj.title}` : ''}`
    default: return 'sent you a notification'
  }
}

/** Where a notification leads. null = no destination (the object is gone). */
export function hrefFor(n: RawNotification, obj: ObjectInfo | undefined, actorUsername: string | null): string | null {
  if (n.type === 'follow') return actorUsername ? `/dev/${actorUsername}` : null
  if (!n.entity_id) return null
  if (obj?.gone) return null
  switch (n.entity_type) {
    case 'devlog_post': return obj?.href ? (n.type === 'reaction' ? obj.href : `${obj.href}#comments`) : null
    case 'collaboration_post': return `/collaborate/${n.entity_id}`
    case 'studio_invitation': return '/dashboard/studios'
    case 'studio':
      if (n.type === 'studio_removed') return obj?.slug ? `/studios/${obj.slug}` : null
      return obj?.slug ? `/dashboard/studios/${obj.slug}` : '/dashboard/studios'
    case 'publisher_contact': return '/dashboard/publisher-contacts'
    case 'playtest_request': return n.type === 'playtest_signup' || n.type === 'playtest_feedback' ? '/dashboard/playtests' : `/playtests/${n.entity_id}`
    default: return null
  }
}

export function presentNotifications(
  rows: RawNotification[],
  objects: Map<string, ObjectInfo>,
  actorUsernames: Map<string, string>
): PresentedRow[] {
  const groups = new Map<string, RawNotification[]>()
  const order: string[] = []
  for (const n of rows) {
    const key = MERGE_TYPES.has(n.type) ? `${n.type}|${n.entity_type}|${n.entity_id}` : n.id
    if (!groups.has(key)) { groups.set(key, []); order.push(key) }
    groups.get(key)!.push(n)
  }
  return order.map((key) => {
    const g = groups.get(key)!
    const first = g[0] // rows arrive newest first
    const obj = first.entity_id ? objects.get(first.entity_id) : undefined
    return {
      key,
      ids: g.map((x) => x.id),
      unread: g.some((x) => !x.read_at),
      time: first.created_at,
      actors: actorList(g.map((x) => x.actorName ?? (first.type === 'publisher_contact' && obj?.extra ? obj.extra : 'A deleted account'))),
      action: action(first.type, obj),
      href: hrefFor(first, obj, first.actor_id ? actorUsernames.get(first.actor_id) ?? null : null),
      unavailable: !!obj?.gone,
    }
  })
}
