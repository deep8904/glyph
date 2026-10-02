/**
 * Orchestrates the password-reset request. Supabase's `resetPasswordForEmail` returns *no* error
 * when the address simply has no account — that is the mechanism the neutral confirmation already
 * relies on. Any *returned* error (400, 429, 500, whatever) is a real failure of the request itself,
 * never a signal about whether the account exists, and must never be silently treated as success. A
 * thrown/rejected call (network failure) gets the identical generic, retryable outcome — this
 * function never rejects, and never exposes the underlying Supabase error text (which could itself
 * leak account-existence information depending on the failure).
 */

export type ResetRequestResult = { ok: true } | { ok: false; message: string }

const FAILURE_MESSAGE = 'Could not send a reset link right now. Try again.'

export async function runResetRequest(request: () => PromiseLike<{ error: unknown }>): Promise<ResetRequestResult> {
  try {
    const { error } = await request()
    if (error) return { ok: false, message: FAILURE_MESSAGE }
    return { ok: true }
  } catch {
    return { ok: false, message: FAILURE_MESSAGE }
  }
}
