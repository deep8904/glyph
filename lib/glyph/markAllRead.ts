/**
 * Orchestrates the mark-all-read mutation. A returned Supabase error and a thrown/rejected network
 * failure (offline, DNS, aborted request) must produce the exact same visible, retryable outcome —
 * the caller never sees an unhandled rejection either way, because this function itself never
 * rejects: every path resolves to a MarkAllReadResult.
 */

export type MarkAllReadResult = { ok: true } | { ok: false; message: string }

const FAILURE_MESSAGE = 'Could not mark notifications as read. Try again.'

export async function runMarkAllRead(update: () => PromiseLike<{ error: unknown }>): Promise<MarkAllReadResult> {
  try {
    const { error } = await update()
    if (error) return { ok: false, message: FAILURE_MESSAGE }
    return { ok: true }
  } catch {
    return { ok: false, message: FAILURE_MESSAGE }
  }
}
