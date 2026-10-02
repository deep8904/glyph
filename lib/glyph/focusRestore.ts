/**
 * Pure gate for the failed-delete focus restoration in GlyphCommentThread. Extracted so the
 * *decision* of when it is safe to move focus is unit-testable in isolation from React's render
 * cycle and the DOM. This does not and cannot prove that a real `.focus()` call succeeds, moves
 * focus to the right element, or survives browser quirks — only that the four required conditions
 * (pending flag set, confirmation still open, not mid-request, an error present) are evaluated
 * correctly together with the button's own enabled/connected state.
 */
export function shouldRestoreFailureFocus(state: {
  pendingFailureFocus: boolean
  confirmDelete: boolean
  loading: boolean
  error: string
  buttonDisabled: boolean
  buttonConnected: boolean
}): boolean {
  return (
    state.pendingFailureFocus &&
    state.confirmDelete &&
    !state.loading &&
    state.error.length > 0 &&
    !state.buttonDisabled &&
    state.buttonConnected
  )
}
