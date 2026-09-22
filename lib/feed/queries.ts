import type { SupabaseClient } from '@supabase/supabase-js'
import { REACTION_TYPES } from '@/lib/supabase/types'

/**
 * Feed = published devlogs, on public projects, from developers the viewer
 * follows, newest first. Nothing else enters it (see the Phase 6 section of
 * docs/glyph-implementation-plan.md for why playtests/collaboration do not).
 *
 * All visibility, follow, block and mute rules live in the `feed_items` view
 * (migration 029) so they cannot be forgotten by a caller or skipped by a
 * later page of a paginated read. This module only orders, pages and decorates.
 */

export const FEED_PAGE_SIZE = 20

export type FeedRow = {
  id: string
  author_id: string
  devlog_slug: string
  devlog_title: string
  content_preview: string
  published_at: string
  project_title: string
  project_slug: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

export type FeedEngagement = {
  comments: number
  reactions: { type: (typeof REACTION_TYPES)[number]['type']; count: number }[]
}

export type FeedCursor = { publishedAt: string; id: string }

// published_at is kept as the raw string PostgREST returned (microsecond
// precision). Round-tripping it through Date would truncate to milliseconds and
// break the tie-break comparison below.
const CURSOR_RE = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2}))\|([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i

export function encodeCursor(row: Pick<FeedRow, 'published_at' | 'id'>): string {
  return `${row.published_at}|${row.id}`
}

/** Returns null for anything that is not a well-formed cursor (never trust the URL). */
export function parseCursor(raw: string | undefined): FeedCursor | null {
  if (!raw) return null
  const m = CURSOR_RE.exec(raw)
  return m ? { publishedAt: m[1], id: m[2] } : null
}

export async function fetchFeedPage(
  supabase: SupabaseClient,
  userId: string,
  cursor: FeedCursor | null
): Promise<{ rows: FeedRow[]; hasMore: boolean; error: boolean }> {
  let query = supabase
    .from('feed_items')
    .select('id, author_id, devlog_slug, devlog_title, content_preview, published_at, project_title, project_slug, username, display_name, avatar_url')
    .eq('follower_id', userId)
    // Total order: published_at alone is not unique, id breaks ties, so a row
    // can neither repeat nor be skipped across pages.
    .order('published_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(FEED_PAGE_SIZE + 1)

  if (cursor) {
    query = query.or(
      `published_at.lt.${cursor.publishedAt},and(published_at.eq.${cursor.publishedAt},id.lt.${cursor.id})`
    )
  }

  const { data, error } = await query.returns<FeedRow[]>()
  if (error) return { rows: [], hasMore: false, error: true }
  const all = data ?? []
  return { rows: all.slice(0, FEED_PAGE_SIZE), hasMore: all.length > FEED_PAGE_SIZE, error: false }
}

/** Comment count and per-type reaction totals for the devlogs on one page. Two queries, not one per row. */
export async function fetchEngagement(
  supabase: SupabaseClient,
  devlogIds: string[]
): Promise<Map<string, FeedEngagement>> {
  const out = new Map<string, FeedEngagement>()
  if (devlogIds.length === 0) return out
  for (const id of devlogIds) out.set(id, { comments: 0, reactions: [] })

  const [{ data: comments }, { data: reactions }] = await Promise.all([
    supabase.from('comments').select('devlog_post_id').in('devlog_post_id', devlogIds),
    supabase.from('reactions').select('devlog_post_id, reaction_type').in('devlog_post_id', devlogIds),
  ])

  for (const c of (comments ?? []) as { devlog_post_id: string }[]) {
    const e = out.get(c.devlog_post_id)
    if (e) e.comments += 1
  }
  for (const r of (reactions ?? []) as { devlog_post_id: string; reaction_type: FeedEngagement['reactions'][number]['type'] }[]) {
    const e = out.get(r.devlog_post_id)
    if (!e) continue
    const slot = e.reactions.find((x) => x.type === r.reaction_type)
    if (slot) slot.count += 1
    else e.reactions.push({ type: r.reaction_type, count: 1 })
  }
  return out
}

export type SuggestedDeveloper = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  primary_role: string | null
}

/**
 * Suggestion rule, stated plainly so it can be shown to the user: developers
 * who most recently published a public devlog, minus yourself, people you
 * already follow, and anyone you have a block/mute relationship with. No
 * scoring, no engagement weighting.
 */
export async function fetchSuggestedDevelopers(
  supabase: SupabaseClient,
  userId: string,
  limit = 6
): Promise<SuggestedDeveloper[]> {
  const [{ data: follows }, { data: blocks }, { data: mutes }, { data: recent }] = await Promise.all([
    supabase.from('follows').select('followed_id').eq('follower_id', userId),
    // blocks_read RLS returns rows where the viewer is blocker OR blocked, i.e. both directions.
    supabase.from('user_blocks').select('blocker_id, blocked_id'),
    supabase.from('user_mutes').select('muted_id').eq('muter_id', userId),
    supabase
      .from('devlog_posts')
      .select('author_id, projects!inner(visibility)')
      .eq('projects.visibility', 'public')
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(80),
  ])

  const excluded = new Set<string>([userId])
  for (const f of (follows ?? []) as { followed_id: string }[]) excluded.add(f.followed_id)
  for (const b of (blocks ?? []) as { blocker_id: string; blocked_id: string }[]) {
    excluded.add(b.blocker_id)
    excluded.add(b.blocked_id)
  }
  for (const m of (mutes ?? []) as { muted_id: string }[]) excluded.add(m.muted_id)

  const authorIds: string[] = []
  for (const r of (recent ?? []) as unknown as { author_id: string }[]) {
    if (!excluded.has(r.author_id) && !authorIds.includes(r.author_id)) authorIds.push(r.author_id)
    if (authorIds.length >= limit) break
  }
  if (authorIds.length === 0) return []

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, primary_role')
    .in('id', authorIds)
    .eq('is_onboarded', true)
    .returns<SuggestedDeveloper[]>()

  // Keep "most recently active first" order.
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]))
  return authorIds.map((id) => byId.get(id)).filter((p): p is SuggestedDeveloper => !!p)
}
