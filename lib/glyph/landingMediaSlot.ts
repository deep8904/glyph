/**
 * Pure state machine for the landing proof media slot's cover-attempt logic. Mirrors
 * `createNotifyOnceGuard`'s own semantics: the slot tracks which source it is *currently* observing
 * and whether that specific observation has already failed. A genuine transition — the `coverUrl`
 * prop becoming a different value, even one that failed before, even when the value in between was
 * `null` (no-cover) — always re-arms the new observation. Only a duplicate failure notification, or
 * a re-render, for the source that is *still currently tracked* stays suppressed.
 */

export type MediaTrackState = { src: string | null; failed: boolean }

export function initialMediaTrack(src: string | null): MediaTrackState {
  return { src, failed: false }
}

/** Call whenever the caller's `coverUrl` prop is observed — on mount, and on every render, via the
 * guarded `track.src !== coverUrl` check in the component's render body (React's own documented
 * pattern for adjusting state when a prop changes, not an effect) — a no-op if it's the same source
 * already being tracked. */
export function observeMediaSource(prev: MediaTrackState, nextSrc: string | null): MediaTrackState {
  return prev.src === nextSrc ? prev : { src: nextSrc, failed: false }
}

/** Call when `HonestImage` reports a failure for `failedSrc`. Only sticks if that source is still
 * the one currently tracked — a failure reported for a source the slot has since moved away from
 * must not corrupt the new source's fresh state. */
export function markMediaFailed(prev: MediaTrackState, failedSrc: string | null): MediaTrackState {
  return prev.src === failedSrc ? { src: prev.src, failed: true } : prev
}

/** Whether to attempt `coverUrl` right now, given the tracked state. `state.src !== coverUrl` means
 * the tracked state hasn't been synchronized to the latest prop yet — the component resolves this in
 * the same render, before returning JSX, so this branch is never actually reached by a mounted
 * component; it exists so this function stays correct (never a stale success) if called before that
 * synchronization, e.g. directly from a test. */
export function shouldShowImage(state: MediaTrackState, coverUrl: string | null): boolean {
  return !!coverUrl && state.src === coverUrl && !state.failed
}
