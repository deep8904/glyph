/**
 * Client-side wrapper around the PROPOSED `finalize_onboarding_project` RPC — NOT YET APPLIED. See
 * `design/onboarding-project-idempotency-proposal.md` for the exact SQL and security analysis. This
 * file exists so the intended exactly-once contract is testable now, against a faithful fake of the
 * RPC's documented server-side behavior, before the migration is authorized.
 *
 * Exact runtime contract: the RPC is declared `returns table (project_id uuid, onboarded boolean)` —
 * a set, not a scalar. The client calls it as `supabase.rpc('finalize_onboarding_project', {...}).single()`.
 * PostgREST's `.single()` asserts exactly one row: zero rows or more than one row both come back as a
 * *returned* `error` (PGRST116), never as an empty/array `data` value — so this wrapper never needs to
 * branch on "how many rows," only on whether `error` is set and whether `data` has the expected shape.
 * `data`, when present, is therefore always the single object `{ project_id: string | null; onboarded:
 * boolean }` — never an array.
 */

export type RpcOutcome = { ok: true; projectId: string | null } | { ok: false }

export type RpcResponse = { data: { project_id: string | null; onboarded: boolean } | null; error: unknown }

function hasValidShape(data: unknown): data is { project_id: string | null; onboarded: boolean } {
  if (typeof data !== 'object' || data === null) return false
  const record = data as Record<string, unknown>
  return typeof record.onboarded === 'boolean' && (record.project_id === null || typeof record.project_id === 'string')
}

export async function callFinalizeOnboardingProject(rpc: () => PromiseLike<RpcResponse>): Promise<RpcOutcome> {
  try {
    const { data, error } = await rpc()
    if (error) return { ok: false }
    if (!hasValidShape(data) || data.onboarded !== true) return { ok: false }
    return { ok: true, projectId: data.project_id }
  } catch {
    return { ok: false }
  }
}
