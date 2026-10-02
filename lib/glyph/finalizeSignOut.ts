/**
 * Orchestrates "mutation, then forced sign-out" for the three flows where a security-sensitive
 * mutation (account creation, OTP verification, password update) must never leave the browser
 * holding a session afterward — but the mutation and the sign-out are two independent operations,
 * and either can succeed while the other fails. A sign-out failure (returned or thrown) must never
 * be reported as if the mutation itself failed; the mutation already happened and must not be
 * repeated on retry.
 */

export type FlowOutcome = { kind: 'mutation-failed' } | { kind: 'done' } | { kind: 'partial' }
export type RetryOutcome = { kind: 'done' } | { kind: 'partial' }

async function attemptSignOut(signOut: () => PromiseLike<{ error: unknown }>): Promise<RetryOutcome> {
  try {
    const { error } = await signOut()
    return error ? { kind: 'partial' } : { kind: 'done' }
  } catch {
    return { kind: 'partial' }
  }
}

/** Runs the mutation exactly once. If it fails (returned error or thrown rejection), sign-out is
 * never attempted. If it succeeds, sign-out is attempted once and its outcome — 'done' or 'partial'
 * — is what the caller acts on; the mutation's own success is never in question again after this. */
export async function runMutationThenSignOut(
  mutate: () => PromiseLike<{ error: unknown }>,
  signOut: () => PromiseLike<{ error: unknown }>
): Promise<FlowOutcome> {
  let mutation: { error: unknown }
  try {
    mutation = await mutate()
  } catch {
    return { kind: 'mutation-failed' }
  }
  if (mutation.error) return { kind: 'mutation-failed' }
  return attemptSignOut(signOut)
}

/** Retries only the sign-out — never the mutation, which already succeeded. */
export async function retrySignOut(signOut: () => PromiseLike<{ error: unknown }>): Promise<RetryOutcome> {
  return attemptSignOut(signOut)
}
