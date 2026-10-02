/**
 * Pure classification of the `/api/profile/check-username` response — and the orchestration around
 * calling it — so a failed lookup can never be read as "available." Both HTTP status and payload
 * shape are inspected: a non-2xx status, a malformed/non-JSON body, or a body missing a boolean
 * `available` field are all the same honest "we couldn't check" outcome as a thrown network failure.
 */

export type UsernameCheckOutcome = { outcome: 'available' } | { outcome: 'taken' } | { outcome: 'error' }

export function classifyUsernameCheckResponse(ok: boolean, body: unknown): UsernameCheckOutcome {
  if (!ok) return { outcome: 'error' }
  if (typeof body !== 'object' || body === null) return { outcome: 'error' }
  const record = body as Record<string, unknown>
  if (typeof record.error === 'string') return { outcome: 'error' }
  if (typeof record.available !== 'boolean') return { outcome: 'error' }
  return { outcome: record.available ? 'available' : 'taken' }
}

export type FetchLike = { ok: boolean; json: () => Promise<unknown> }

/** Never rejects — a thrown fetch, or a response whose body can't even be parsed as JSON, resolves
 * to the same `{ outcome: 'error' }` as a returned lookup failure. */
export async function runUsernameCheck(fetcher: () => Promise<FetchLike>): Promise<UsernameCheckOutcome> {
  try {
    const res = await fetcher()
    let body: unknown = null
    try {
      body = await res.json()
    } catch {
      body = null
    }
    return classifyUsernameCheckResponse(res.ok, body)
  } catch {
    return { outcome: 'error' }
  }
}
