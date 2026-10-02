/**
 * Pure decision logic for onboarding: the initial auth/profile gate, and the profile+optional-project
 * submission. Kept separate from Supabase/React so the truth-sensitive branches — never claiming
 * success when a step was never confirmed, never re-running profile creation once it has succeeded,
 * never silently dropping a failed project insert, and surviving a reload mid-flow — are
 * unit-testable without a database.
 *
 * Durability, without a migration or privileged RPC: when a project is requested, the profile row is
 * written with `is_onboarded: false` first (still a normal insert under the existing RLS "insert own
 * profile" policy) and only flipped to `true` by a separate `finalize` update (the existing "update
 * own profile" policy) once the project has succeeded or been explicitly skipped. That row is real,
 * committed state — a reload or a fresh visit to /onboarding re-reads it (`classifyOnboardingGate`'s
 * `resume` branch) and resumes from there, never re-inserting the profile. Session-only React state is
 * never the sole record of an in-progress project decision; the DB row's `is_onboarded` flag is.
 */

// ── Init gate ────────────────────────────────────────────────────────────────

export type ExistingProfile = {
  username: string
  display_name: string | null
  bio: string | null
  location: string | null
  primary_role: string | null
  primary_engine: string | null
  experience_level: string | null
  github_url: string | null
  itchio_url: string | null
  twitter_url: string | null
  website_url: string | null
}

export type OnboardingGateState =
  | { kind: 'no-user' }
  | { kind: 'already-onboarded' }
  | { kind: 'ready' }
  | { kind: 'resume'; profile: ExistingProfile }
  | { kind: 'error' }

/** `profileError` must win over everything else — a failed lookup must never be read as "no profile
 * yet" (a different, false claim: it might already exist, onboarded or not, and we simply couldn't
 * tell). A profile row that exists but isn't onboarded is `resume`, never `ready` — `ready` means no
 * row exists yet, so it's the only state allowed to insert one. */
export function classifyOnboardingGate(
  user: unknown,
  profile: (ExistingProfile & { is_onboarded: boolean }) | null,
  profileError: unknown
): OnboardingGateState {
  if (!user) return { kind: 'no-user' }
  if (profileError) return { kind: 'error' }
  if (!profile) return { kind: 'ready' }
  if (profile.is_onboarded) return { kind: 'already-onboarded' }
  return { kind: 'resume', profile }
}

// ── Submission ───────────────────────────────────────────────────────────────

export type SubmitOutcome =
  | { kind: 'username-taken' }
  | { kind: 'profile-error' }
  | { kind: 'project-error' }
  | { kind: 'finalize-error' }
  | { kind: 'done' }

type ProfileInsertResult = { error: { code?: string } | null }
type MutationResult = { error: unknown }
/** A Supabase `update(...).select('id')` result — `.select()` after an update returns the affected
 * rows, so `data` lets the caller tell "updated, zero rows matched" apart from "actually updated,"
 * which a bare `{ error: null }` cannot. */
type FinalizeResult = { error: unknown; data: unknown[] | null }

/** 23505 = unique_violation — the username was taken between the availability check and submit
 * (the race the check alone can never fully close). Any other profile-insert error is generic. */
function classifyProfileInsertError(error: { code?: string } | null): 'ok' | 'username-taken' | 'error' {
  if (!error) return 'ok'
  return error.code === '23505' ? 'username-taken' : 'error'
}

/**
 * `profileExists` is `false` only on a genuinely fresh flow (`classifyOnboardingGate` returned
 * `ready`) — `insertProfile` is called exactly once, only then. On `resume`, the profile already
 * exists and is never re-inserted; only the project (if any) and the `finalize` step run.
 *
 * With no project requested on a fresh flow, `insertProfile` is expected to already write
 * `is_onboarded: true` directly (nothing durable-but-incomplete to track), so `finalize` isn't called
 * at all — matching the single-insert behavior for the simple case exactly. Every other path
 * (fresh + project, or any resume) always ends in an explicit `finalize` call, since either a durable
 * not-yet-onboarded row already exists or was just created.
 */
export async function runOnboardingSubmit(
  profileExists: boolean,
  insertProfile: () => PromiseLike<ProfileInsertResult>,
  hasProject: boolean,
  insertProject: () => PromiseLike<MutationResult>,
  finalize: () => PromiseLike<FinalizeResult>
): Promise<SubmitOutcome> {
  if (!profileExists) {
    let profileResult: ProfileInsertResult
    try {
      profileResult = await insertProfile()
    } catch {
      return { kind: 'profile-error' }
    }
    const outcome = classifyProfileInsertError(profileResult.error)
    if (outcome === 'username-taken') return { kind: 'username-taken' }
    if (outcome === 'error') return { kind: 'profile-error' }
  }

  if (!hasProject) {
    if (!profileExists) return { kind: 'done' } // fresh insert already set is_onboarded: true
    return runFinalize(finalize)
  }

  try {
    const { error } = await insertProject()
    if (error) return { kind: 'project-error' }
  } catch {
    return { kind: 'project-error' }
  }
  return runFinalize(finalize)
}

type FinalizeOutcome = { kind: 'finalize-error' } | { kind: 'done' }

/** `error: null` alone is not success — a Supabase update can return no error while matching zero
 * rows (wrong id, RLS silently excluding the row, a race with another write). Only a returned row
 * (via `.select()` on the update) proves the authenticated user's own profile was actually flipped to
 * onboarded; anything else — an error, a thrown rejection, or an empty affected-rows array — is
 * `finalize-error`, never `done`. */
async function runFinalize(finalize: () => PromiseLike<FinalizeResult>): Promise<FinalizeOutcome> {
  try {
    const { error, data } = await finalize()
    if (error) return { kind: 'finalize-error' }
    if (!data || data.length === 0) return { kind: 'finalize-error' }
    return { kind: 'done' }
  } catch {
    return { kind: 'finalize-error' }
  }
}

export type RetryOutcome = { kind: 'project-error' } | FinalizeOutcome

/** Retries only the project insert, then finalize — never the profile, which already succeeded. */
export async function retryProjectOnly(insertProject: () => PromiseLike<MutationResult>, finalize: () => PromiseLike<FinalizeResult>): Promise<RetryOutcome> {
  try {
    const { error } = await insertProject()
    if (error) return { kind: 'project-error' }
  } catch {
    return { kind: 'project-error' }
  }
  return runFinalize(finalize)
}

/** Skip finalizes the profile without ever attempting the project — used both for a fresh flow's
 * "skip for now" at the review step when resuming, and for the resume screen's own skip choice. */
export async function retryFinalizeOnly(finalize: () => PromiseLike<FinalizeResult>): Promise<FinalizeOutcome> {
  return runFinalize(finalize)
}
