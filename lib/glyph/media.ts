/** Centralized seeded/sample-media classification — one definition, reused by every surface that
 * labels placeholder imagery, so the rule never drifts between duplicated regexes. */
export function isSampleMedia(url: string | null | undefined): boolean {
  return !!url && /picsum\.photos|placehold|unsplash/i.test(url)
}
