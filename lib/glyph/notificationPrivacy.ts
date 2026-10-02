/**
 * Pure privacy-gate and object-resolution decisions for Notifications. Extracted so the two
 * distinctions the audit specifically requires — a failed block/mute lookup must fail closed rather
 * than render as "no one is blocked", and a failed object-resolution query must not be reported the
 * same way as a genuinely deleted/RLS-hidden object — are unit-testable without a database.
 */

export type PrivacyGateOutcome =
  | { kind: 'error' }
  | { kind: 'ready'; hiddenActorIds: Set<string> }

/**
 * Fails closed: if either the block or mute lookup itself errored, the exclusion set built from
 * whatever partial data came back could be missing real blocks/mutes — rendering the notification
 * list at all in that state would be a privacy failure, not just a presentation one. The caller must
 * show a retry error state instead of the list.
 */
export function classifyPrivacyGate(input: {
  blocks: { blocker_id: string; blocked_id: string }[] | null
  blocksError: unknown
  mutes: { muted_id: string }[] | null
  mutesError: unknown
  viewerId: string
}): PrivacyGateOutcome {
  if (input.blocksError || input.mutesError) return { kind: 'error' }
  const hidden = new Set<string>()
  for (const b of input.blocks ?? []) { hidden.add(b.blocker_id); hidden.add(b.blocked_id) }
  for (const m of input.mutes ?? []) hidden.add(m.muted_id)
  hidden.delete(input.viewerId)
  return { kind: 'ready', hiddenActorIds: hidden }
}

export type ObjectResolution = 'found' | 'gone' | 'unknown'

/**
 * `unknown` (the query that would have resolved this object failed) is distinct from `gone` (the
 * query succeeded and the object genuinely doesn't exist or isn't visible to this viewer) — the
 * event still happened either way, but "we couldn't check" and "this was deleted, or you can no
 * longer see it" are different, true statements and must not collapse into one wording.
 */
export function classifyObjectResolution(found: boolean, queryFailed: boolean): ObjectResolution {
  if (queryFailed) return 'unknown'
  return found ? 'found' : 'gone'
}
