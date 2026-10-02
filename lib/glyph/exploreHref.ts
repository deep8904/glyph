/**
 * URL builder for the Explore section lists. Every filter + page lives in the URL so lists are
 * shareable and back/forward work. Pure + framework-free so it is unit-testable; behavior/data
 * contracts (filter keys, page semantics) are unchanged.
 */
export type ExploreState = { stage: string | null; playtest: boolean; collab: boolean }
export type ExploreOverride = { stage?: string | null; playtest?: boolean; collab?: boolean; page?: number }

export function buildExploreHref(section: string, state: ExploreState, over: ExploreOverride = {}): string {
  const st = over.stage === undefined ? state.stage : over.stage
  const pt = over.playtest === undefined ? state.playtest : over.playtest
  const co = over.collab === undefined ? state.collab : over.collab
  const qs = new URLSearchParams()
  if (st) qs.set('stage', st)
  if (pt) qs.set('playtest', 'open')
  if (co) qs.set('collab', 'open')
  if ((over.page ?? 1) > 1) qs.set('page', String(over.page))
  const s = qs.toString()
  return `/explore/${section}${s ? `?${s}` : ''}`
}
