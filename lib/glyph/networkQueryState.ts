/**
 * Distinguishes "the query succeeded and found nothing" from "the query failed" — the two
 * network-page fixes both need this, and conflating them (a discarded Supabase error rendering as
 * a plain empty state, or worse, driving a real-404 decision) is exactly the bug being corrected.
 * Pure so the distinction is unit-testable without touching a database.
 */
export type QueryOutcome<T> =
  | { kind: 'error' }
  | { kind: 'empty' }
  | { kind: 'ok'; rows: T[] }

export function classifyQuery<T>(rows: T[] | null | undefined, error: unknown): QueryOutcome<T> {
  if (error) return { kind: 'error' }
  if (!rows || rows.length === 0) return { kind: 'empty' }
  return { kind: 'ok', rows }
}

/** The profile lookup specifically: a real 404 is only correct when the row genuinely doesn't
 * exist — a query failure must never be reported as "this profile doesn't exist." */
export type ProfileLookupOutcome<T> =
  | { kind: 'error' }
  | { kind: 'not-found' }
  | { kind: 'ok'; profile: T }

export function classifyProfileLookup<T>(profile: T | null | undefined, error: unknown): ProfileLookupOutcome<T> {
  if (error) return { kind: 'error' }
  if (!profile) return { kind: 'not-found' }
  return { kind: 'ok', profile }
}
