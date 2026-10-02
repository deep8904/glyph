/**
 * The exact "notify once per current source, and only once per failure of that source" decision
 * `HonestImage` uses. Tracks which source is currently mounted independently from whether *that*
 * source has already notified — a source that changes away and successfully loads (never calling
 * `tryNotify`) must still be able to notify again if it's later re-mounted and fails, which a guard
 * keyed only on "the last src `tryNotify` was called with" cannot express (that scheme keeps
 * whatever `tryNotify` last saw as "already notified," even across an intervening source that never
 * failed at all).
 */
export function createNotifyOnceGuard() {
  let currentSrc: string | null = null
  let notifiedCurrent = false

  /** Syncs the guard to whatever source is now mounted. A genuinely different source resets its
   * notification flag; re-observing the same source (e.g. a redundant call before the broken-check)
   * leaves an existing notification untouched — it must not re-arm an already-reported failure. */
  function observeSource(src: string) {
    if (src !== currentSrc) {
      currentSrc = src
      notifiedCurrent = false
    }
  }

  return {
    observeSource,
    /** Syncs to `src` first (so this is safe to call without a preceding `observeSource`, preserving
     * the onError-before-effect ordering fix), then returns true — and records the notification —
     * only the first time this call is made for the currently mounted source. */
    tryNotify(src: string): boolean {
      observeSource(src)
      if (notifiedCurrent) return false
      notifiedCurrent = true
      return true
    },
  }
}
