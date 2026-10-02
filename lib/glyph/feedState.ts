/**
 * Pure decision logic for the Feed page's empty/error states. Extracted so the distinctions the
 * audit specifically requires — a failed following-count query must never render as "following 0",
 * an engagement/suggestion failure must never be silently absorbed into a normal-looking state, and
 * a malformed cursor must be distinguishable from "no cursor" — are unit-testable without a
 * database, and so the page component is a thin wiring layer around them.
 */

export type CountOutcome = { kind: 'ok'; count: number } | { kind: 'error' }

/** A `{ count, error }` Supabase result, turned into an honest outcome — `count` is only trusted
 * when there was no error. A failed count query must never be reported as "following 0". */
export function classifyCount(count: number | null, error: unknown): CountOutcome {
  if (error) return { kind: 'error' }
  return { kind: 'ok', count: count ?? 0 }
}

export type CursorParamState<C> = { kind: 'none' } | { kind: 'valid'; cursor: C } | { kind: 'malformed' }

/** Distinguishes "no ?cursor= at all" (a genuine first-page visit) from "a ?cursor= was present
 * but didn't parse" (a broken/tampered link) — the existing `parseCursor` collapses both to `null`,
 * which is fine for query behavior (both fall back to the first page) but not for what the page
 * tells the user about why they're seeing it. */
export function classifyCursorParam<C>(raw: string | undefined, parse: (raw: string) => C | null): CursorParamState<C> {
  if (raw === undefined) return { kind: 'none' }
  const cursor = parse(raw)
  return cursor ? { kind: 'valid', cursor } : { kind: 'malformed' }
}

export type FeedPageState =
  | { kind: 'error' }
  | { kind: 'results' }
  | { kind: 'past-end' }
  | { kind: 'empty-no-follows' }
  | { kind: 'empty-has-follows'; following: number }
  | { kind: 'empty-unknown-follows' }

/**
 * The one decision the empty/error branch of the page needs. `hasCursor` means "a valid cursor was
 * supplied" (a malformed one is handled by the caller as its own notice, then treated like no
 * cursor for this classification — same as the existing behavior). A following-count query failure
 * produces its own `empty-unknown-follows` state rather than silently defaulting to "0 follows",
 * which would tell the user something false.
 */
export function classifyFeedPage(input: {
  feedError: boolean
  rowsCount: number
  hasCursor: boolean
  following: CountOutcome
}): FeedPageState {
  if (input.feedError) return { kind: 'error' }
  if (input.rowsCount > 0) return { kind: 'results' }
  if (input.hasCursor) return { kind: 'past-end' }
  if (input.following.kind === 'error') return { kind: 'empty-unknown-follows' }
  if (input.following.count === 0) return { kind: 'empty-no-follows' }
  return { kind: 'empty-has-follows', following: input.following.count }
}
