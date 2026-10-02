/**
 * URL builder for /search — extracted verbatim from the legacy route's inline `href()` closure so
 * the exact contract (q/type/stage/page semantics, `all` and `page=1` omitted from the URL) is
 * unit-testable and shared between the page and any future caller (e.g. the command menu).
 */
export type SearchType = 'all' | 'profiles' | 'projects' | 'studios' | 'opportunities' | 'devlogs'

export const SEARCH_TABS: SearchType[] = ['all', 'projects', 'profiles', 'studios', 'opportunities']
/** 'devlogs' stays parseable for old links but is not a switcher tab — see legacy comment this was
 * extracted from: devlogs surface inline under "All" instead of owning a primary category. */
export const SEARCH_VALID_TYPES: SearchType[] = [...SEARCH_TABS, 'devlogs']

export function parseSearchType(raw: string | undefined): SearchType {
  return SEARCH_VALID_TYPES.includes(raw as SearchType) ? (raw as SearchType) : 'all'
}

export type SearchState = { q: string; type: SearchType; stage: string | null }
export type SearchOverride = { type?: SearchType; page?: number; stage?: string | null }

export function buildSearchHref(state: SearchState, over: SearchOverride = {}): string {
  const t = over.type ?? state.type
  const qs = new URLSearchParams()
  if (state.q) qs.set('q', state.q)
  if (t !== 'all') qs.set('type', t)
  const st = over.stage === undefined ? (t === 'projects' ? state.stage : null) : over.stage
  if (t === 'projects' && st) qs.set('stage', st)
  const pg = over.page ?? 1
  if (pg > 1) qs.set('page', String(pg))
  const s = qs.toString()
  return `/search${s ? `?${s}` : ''}`
}
