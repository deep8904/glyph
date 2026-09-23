import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Discovery data access. Visibility (public projects only, published/non-future
 * devlogs only, no unlisted/private/draft), and block/mute relative to the
 * viewer are enforced inside the `discoverable_*` views and `search_*`
 * functions (migration 030) — not here — so Explore, Search and every page of
 * either apply identical rules.
 */

export const LIST_PAGE_SIZE = 20
export const SEARCH_ALL_PREVIEW = 5

export type DeveloperRowData = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  primary_role: string | null
  is_open_to_collab: boolean
  current_project_title: string | null
  current_project_slug: string | null
  last_activity_at: string | null
}

export type ProjectRowData = {
  id: string
  title: string
  short_description: string | null
  slug: string
  stage: string | null
  tags: string[] | null
  engine: string | null
  genre: string | null
  cover_url: string | null
  username: string
  display_name: string | null
  last_activity_at: string
  has_open_playtest: boolean
}

export type DevlogRowData = {
  id: string
  slug: string
  title: string
  content_preview: string
  published_at: string
  project_title: string
  project_slug: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

export type Section = 'projects' | 'developers' | 'devlogs'

export function isSection(v: string): v is Section {
  return v === 'projects' || v === 'developers' || v === 'devlogs'
}

/** Positive integer page from a URL param; anything else is page 1. */
export function parsePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? '', 10)
  return Number.isFinite(n) && n >= 1 && n <= 200 ? n : 1
}

const DEV_COLS = 'id, username, display_name, avatar_url, bio, primary_role, is_open_to_collab, current_project_title, current_project_slug, last_activity_at'
const PROJECT_COLS = 'id, title, short_description, slug, stage, tags, engine, genre, cover_url, username, display_name, last_activity_at, has_open_playtest'
const DEVLOG_COLS = 'id, slug, title, content_preview, published_at, project_title, project_slug, username, display_name, avatar_url'

type Page<T> = { rows: T[]; hasMore: boolean; error: boolean }

function toPage<T>(data: T[] | null, error: unknown, size: number): Page<T> {
  if (error) return { rows: [], hasMore: false, error: true }
  const all = data ?? []
  return { rows: all.slice(0, size), hasMore: all.length > size, error: false }
}

// ── Explore (browse, no query) ───────────────────────────────────────────────
// Ordering is always most-recent-activity first with id as tie-break; there is
// no popularity or engagement input.

export async function exploreProjects(
  supabase: SupabaseClient,
  opts: { page?: number; size?: number; stage?: string | null; openPlaytest?: boolean } = {}
): Promise<Page<ProjectRowData>> {
  const size = opts.size ?? LIST_PAGE_SIZE
  const from = ((opts.page ?? 1) - 1) * size
  let q = supabase.from('discoverable_projects').select(PROJECT_COLS)
  if (opts.stage) q = q.eq('stage', opts.stage)
  // Read-only conditions on columns the view already exposes; no ranking is involved.
  if (opts.openPlaytest) q = q.eq('has_open_playtest', true)
  const { data, error } = await q
    .order('last_activity_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, from + size) // size + 1 rows to detect a next page
    .returns<ProjectRowData[]>()
  return toPage(data, error, size)
}

export async function exploreDevelopers(
  supabase: SupabaseClient,
  opts: { page?: number; size?: number; excludeUserId?: string | null; openToCollab?: boolean } = {}
): Promise<Page<DeveloperRowData>> {
  const size = opts.size ?? LIST_PAGE_SIZE
  const from = ((opts.page ?? 1) - 1) * size
  let q = supabase.from('discoverable_developers').select(DEV_COLS).not('last_activity_at', 'is', null)
  if (opts.excludeUserId) q = q.neq('id', opts.excludeUserId)
  if (opts.openToCollab) q = q.eq('is_open_to_collab', true)
  const { data, error } = await q
    .order('last_activity_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, from + size)
    .returns<DeveloperRowData[]>()
  return toPage(data, error, size)
}

export async function exploreDevlogs(
  supabase: SupabaseClient,
  opts: { page?: number; size?: number } = {}
): Promise<Page<DevlogRowData>> {
  const size = opts.size ?? LIST_PAGE_SIZE
  const from = ((opts.page ?? 1) - 1) * size
  const { data, error } = await supabase
    .from('discoverable_devlogs')
    .select(DEVLOG_COLS)
    .order('published_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, from + size)
    .returns<DevlogRowData[]>()
  return toPage(data, error, size)
}

// ── Search ───────────────────────────────────────────────────────────────────

type Counted<T> = { rows: T[]; total: number; error: boolean }

function toCounted<T extends { total_count: number | string }>(data: T[] | null, error: unknown): Counted<Omit<T, 'total_count' | 'match_tier'>> {
  if (error) return { rows: [], total: 0, error: true }
  const rows = data ?? []
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0
  return { rows: rows as unknown as Counted<Omit<T, 'total_count' | 'match_tier'>>['rows'], total, error: false }
}

type WithCount = { total_count: number | string; match_tier: number }

export async function searchDevelopers(supabase: SupabaseClient, q: string, limit: number, offset: number) {
  const { data, error } = await supabase.rpc('search_developers', { p_q: q, p_limit: limit, p_offset: offset })
  return toCounted<DeveloperRowData & WithCount>(data as (DeveloperRowData & WithCount)[] | null, error)
}

export async function searchProjects(supabase: SupabaseClient, q: string, stage: string | null, limit: number, offset: number) {
  const { data, error } = await supabase.rpc('search_projects', { p_q: q, p_stage: stage, p_limit: limit, p_offset: offset })
  return toCounted<ProjectRowData & WithCount>(data as (ProjectRowData & WithCount)[] | null, error)
}

export async function searchDevlogs(supabase: SupabaseClient, q: string, limit: number, offset: number) {
  const { data, error } = await supabase.rpc('search_devlogs', { p_q: q, p_limit: limit, p_offset: offset })
  return toCounted<DevlogRowData & WithCount>(data as (DevlogRowData & WithCount)[] | null, error)
}

/** Which of these developers the viewer already follows — one query for a whole page. */
export async function followedAmong(supabase: SupabaseClient, viewerId: string | null, developerIds: string[]): Promise<Set<string>> {
  if (!viewerId || developerIds.length === 0) return new Set()
  const { data } = await supabase.from('follows').select('followed_id').eq('follower_id', viewerId).in('followed_id', developerIds)
  return new Set(((data ?? []) as { followed_id: string }[]).map((r) => r.followed_id))
}
