import type { SearchType } from './searchHref'

export type SearchCounts = { profiles: number; projects: number; studios: number; opportunities: number; devlogs: number }

/**
 * The total this scope actually has to show. Bug fixed here: All mode previously summed only
 * profiles+projects+studios+opportunities, so a query matching only devlogs (a real, secondary
 * All-mode section) produced a total of 0 and the page rendered "No results" even though the
 * "Also in devlogs" section had a real match to show. Scoped totals are unchanged — each scope
 * already had its own correct total before this fix and still does.
 */
export function computeSearchTotal(type: SearchType, counts: SearchCounts, scopedProjectsTotal: number): number {
  switch (type) {
    case 'all':
      return counts.profiles + counts.projects + counts.studios + counts.opportunities + counts.devlogs
    case 'profiles':
      return counts.profiles
    case 'projects':
      return scopedProjectsTotal
    case 'studios':
      return counts.studios
    case 'opportunities':
      return counts.opportunities
    case 'devlogs':
      return counts.devlogs
  }
}

export type SearchResultState = 'error' | 'no-results' | 'past-end' | 'results'

/**
 * Same branching the page renders from, extracted so it's testable without a database. An error
 * always wins — it suppresses both the no-results and past-end reads of `total`, which can be
 * stale/meaningless when the query itself failed.
 */
export function classifySearchResults(input: { anyError: boolean; page: number; offset: number; total: number }): SearchResultState {
  if (input.anyError) return 'error'
  if (input.page > 1 && input.total > 0 && input.offset >= input.total) return 'past-end'
  if (input.total === 0) return 'no-results'
  return 'results'
}
