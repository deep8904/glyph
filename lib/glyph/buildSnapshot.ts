/**
 * Pure decision logic for the Build Snapshot object, extracted so the "no canonical route → no
 * fake link" branch and the cadence sentence are unit-testable without a DOM/React render harness.
 */

/** Canonical project href, or null when the project has no slug yet (e.g. a brand-new draft).
 * Callers must not fall back to `href ?? '#'` — a null here means "not a link." */
export function projectHref(username: string, slug: string | null): string | null {
  return slug ? `/p/${username}/${slug}` : null
}

/**
 * A factual, count-and-span cadence sentence from the project's own published-devlog dates (any
 * order) — e.g. "3 build notes across 12 days." Deliberately not a recurring "every ~Nd" claim:
 * two data points cannot support a recurrence claim, and this phrasing never implies one no matter
 * how many dates are given. Invalid dates are dropped; needs at least two valid, distinct-enough
 * dates (a positive span) to say anything — otherwise returns null so the caller falls back to a
 * plain "updated" timestamp instead of inventing activity evidence.
 */
export function cadenceLabel(publishedDates: string[]): string | null {
  const times = publishedDates.map((d) => new Date(d).getTime()).filter((t) => Number.isFinite(t))
  if (times.length < 2) return null
  const sorted = [...times].sort((a, b) => a - b)
  const spanDays = Math.round((sorted[sorted.length - 1] - sorted[0]) / 86_400_000)
  if (spanDays <= 0) return null
  return `${times.length} build note${times.length === 1 ? '' : 's'} across ${spanDays} day${spanDays === 1 ? '' : 's'}`
}
