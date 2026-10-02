/**
 * Pure helpers extracted from the standalone Devlog page so its visibility gate and its
 * previous/next selection are unit-testable without a DB or a render harness.
 */

/** A devlog is unpublished (draft or scheduled) when it has no publish date, or that date is
 * still in the future relative to `now`. */
export function isUnpublished(publishedAt: string | null, now: Date = new Date()): boolean {
  return !publishedAt || new Date(publishedAt) > now
}

export type TimelineEntry = { slug: string; title: string }

/**
 * Previous/next within an already-published-only, publish-order-ascending timeline. Returns
 * {prev: null, next: null} for a slug not found in the timeline (e.g. the current post is a draft
 * and therefore never appears in it) — a draft must never expose sibling navigation.
 */
export function findSiblings(currentSlug: string, timelineAsc: TimelineEntry[]): { prev: TimelineEntry | null; next: TimelineEntry | null } {
  const idx = timelineAsc.findIndex((d) => d.slug === currentSlug)
  if (idx === -1) return { prev: null, next: null }
  return {
    prev: idx > 0 ? timelineAsc[idx - 1] : null,
    next: idx < timelineAsc.length - 1 ? timelineAsc[idx + 1] : null,
  }
}
