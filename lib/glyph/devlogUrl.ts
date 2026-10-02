/**
 * The public devlog route, or null when it cannot be honestly constructed. A project without a
 * slug (not yet given a canonical route) or a devlog record without a usable slug must never
 * produce a guessed `/null/` URL — callers render the fact as plain text instead of a link.
 */
export function devlogUrl(username: string, projectSlug: string | null | undefined, devlogSlug: string | null | undefined): string | null {
  if (!projectSlug || !devlogSlug) return null
  return `/p/${username}/${projectSlug}/${devlogSlug}`
}
