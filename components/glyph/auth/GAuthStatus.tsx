/** A form-level error (`role="alert"`) or success/notice (`role="status"`) line. Never both at once —
 * callers show one or the other. Ember is not used here: an error is signaled by the danger token and
 * the word itself, never by borrowing the action color. */
export function GAuthStatus({ error, notice }: { error?: string; notice?: string }) {
  if (error) return <p role="alert" className="text-small font-medium text-gdanger">{error}</p>
  if (notice) return <p role="status" className="text-small text-ink-2">{notice}</p>
  return null
}
