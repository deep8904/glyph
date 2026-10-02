import { test } from 'node:test'
import assert from 'node:assert/strict'
import { callFinalizeOnboardingProject } from './onboardingProjectRpc.ts'

/**
 * A faithful fake of the PROPOSED `finalize_onboarding_project` RPC's documented server-side
 * semantics, called as `supabase.rpc(...).single()` — always resolving to the single-object shape
 * `.single()` produces, never an array. It reuses `onboardingProjectId` once set, rather than
 * inserting again, and there is no `await` between the "does one already exist" check and the
 * "create it" write within one call — the same guarantee the real Postgres function gets for free
 * from running as one statement inside one row-locked transaction. This is what proves the *design*
 * is exactly-once, ahead of the migration being authorized and applied. A genuinely concurrent,
 * row-lock-waiting interleaving can only be proven against a real database (see the proposal's
 * required-verification list) — this fake is synchronous JS and does not simulate that wait; it is
 * kept here only as a client-wrapper unit test, not as evidence of database-level concurrency safety.
 *
 * Terminal-Skip contract: once `onboarded` flips true — by Skip (no title) or by Include (a
 * title) — every later call is a pure read of whatever completed it. It never inserts again and
 * never changes `onboarded`/`project_id`, no matter what a later call's `title` argument is. This
 * mirrors the real RPC's `if v_is_onboarded then return query select v_existing_id, true; return;
 * end if;` early-exit, which runs before the RPC ever looks at its own arguments.
 */
function makeFakeServer(seed?: { onboarded: boolean; onboardingProjectId?: string | null }) {
  let onboardingProjectId: string | null = seed?.onboardingProjectId ?? null
  let projectInsertCount = 0
  let onboarded = seed?.onboarded ?? false
  let callCount = 0

  const rpc = (title: string | null) => {
    callCount++
    if (onboarded) {
      // Terminal: onboarding already finished. Pure read — this call's `title` is ignored.
      return { data: { project_id: onboardingProjectId, onboarded: true }, error: null }
    }
    if (onboardingProjectId === null && title) {
      projectInsertCount++
      onboardingProjectId = `project-${projectInsertCount}`
    }
    onboarded = true
    return { data: { project_id: onboardingProjectId, onboarded: true }, error: null }
  }

  return {
    rpc,
    projectInsertCount: () => projectInsertCount,
    callCount: () => callCount,
    onboarded: () => onboarded,
  }
}

test('insert committed but the response is thrown away → client sees ok:false, server already committed', async () => {
  const server = makeFakeServer()
  let delivered = false
  const r = await callFinalizeOnboardingProject(async () => {
    server.rpc('Hollow Tide') // the server-side commit genuinely happens
    if (!delivered) { delivered = true; throw new TypeError('Failed to fetch') } // the response never arrives
    return { data: null, error: null }
  })
  assert.deepEqual(r, { ok: false })
  assert.equal(server.projectInsertCount(), 1) // committed, even though the client never learned that
})

test('retry after that ambiguous outcome reuses the already-committed project, never inserts a second one', async () => {
  const server = makeFakeServer()
  server.rpc('Hollow Tide') // simulates the prior call that committed but whose response was lost
  const r = await callFinalizeOnboardingProject(async () => server.rpc('Hollow Tide'))
  assert.deepEqual(r, { ok: true, projectId: 'project-1' })
  assert.equal(server.projectInsertCount(), 1)
})

test('reload after project success (a fresh client, same account) resumes onto the same project, no duplicate', async () => {
  const server = makeFakeServer()
  server.rpc('Hollow Tide')
  // A brand-new page load calls the same RPC again (it doesn't know a project was already made) —
  // still resolves to the one existing project, not a second.
  const r = await callFinalizeOnboardingProject(async () => server.rpc('Hollow Tide'))
  assert.deepEqual(r, { ok: true, projectId: 'project-1' })
  assert.equal(server.projectInsertCount(), 1)
})

test('two "simultaneous" retries still produce exactly one project (client-wrapper unit test only — not a database concurrency proof)', async () => {
  const server = makeFakeServer()
  const [a, b] = await Promise.all([
    callFinalizeOnboardingProject(async () => server.rpc('Hollow Tide')),
    callFinalizeOnboardingProject(async () => server.rpc('Hollow Tide')),
  ])
  assert.equal(server.projectInsertCount(), 1)
  assert.deepEqual(a, { ok: true, projectId: 'project-1' })
  assert.deepEqual(b, { ok: true, projectId: 'project-1' })
})

test('exactly one project survives a long, mixed retry sequence (thrown, returned error, success, repeats)', async () => {
  const server = makeFakeServer()
  const attempts = [
    () => { throw new TypeError('offline') },
    () => ({ data: null, error: { message: 'db down' } }),
    () => server.rpc('Hollow Tide'),
    () => server.rpc('Hollow Tide'),
    () => server.rpc('Hollow Tide'),
  ]
  for (const attempt of attempts) {
    await callFinalizeOnboardingProject(async () => attempt() as { data: { project_id: string | null; onboarded: boolean } | null; error: unknown })
  }
  assert.equal(server.projectInsertCount(), 1)
  assert.equal(server.onboarded(), true)
})

test('skip (no title) never creates a project, still finalizes', async () => {
  const server = makeFakeServer()
  const r = await callFinalizeOnboardingProject(async () => server.rpc(null))
  assert.deepEqual(r, { ok: true, projectId: null })
  assert.equal(server.projectInsertCount(), 0)
  assert.equal(server.onboarded(), true)
})

// ── Actual Supabase `.rpc(...).single()` response shape ──

test('a returned RPC-level error never reports ok:true', async () => {
  const r = await callFinalizeOnboardingProject(async () => ({ data: null, error: { message: 'not authenticated' } }))
  assert.deepEqual(r, { ok: false })
})

test('empty result (.single() found zero rows — PGRST116, a *returned* error, not an empty array) → ok:false', async () => {
  // PostgREST's .single() never resolves an empty match to `data: []` or `data: null, error: null` —
  // it is always a returned error. Modeled exactly as the real client would receive it.
  const r = await callFinalizeOnboardingProject(async () => ({ data: null, error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' } }))
  assert.deepEqual(r, { ok: false })
})

test('multiple-row result (.single() found more than one row — the same PGRST116 error as empty) → ok:false', async () => {
  const r = await callFinalizeOnboardingProject(async () => ({ data: null, error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' } }))
  assert.deepEqual(r, { ok: false })
})

test('malformed response (data present but missing/wrong-typed `onboarded`) → ok:false, never a false success', async () => {
  // @ts-expect-error deliberately malformed for the test
  const r = await callFinalizeOnboardingProject(async () => ({ data: { project_id: 'p1' }, error: null }))
  assert.deepEqual(r, { ok: false })
})

test('malformed response (onboarded present but not `true`) → ok:false', async () => {
  const r = await callFinalizeOnboardingProject(async () => ({ data: { project_id: 'p1', onboarded: false }, error: null }))
  assert.deepEqual(r, { ok: false })
})

test('thrown response (network failure before any Supabase response) → ok:false, never rejects', async () => {
  const r = await callFinalizeOnboardingProject(() => Promise.reject(new TypeError('Failed to fetch')))
  assert.deepEqual(r, { ok: false })
})

// ── Terminal Skip contract: once onboarding completes, no later call ever creates or mutates a
// second outcome — regardless of whether it completed by Skip or by Include. ──

test('Skip → identical Skip retry: both read the same terminal state, zero inserts', async () => {
  const server = makeFakeServer()
  const a = await callFinalizeOnboardingProject(async () => server.rpc(null))
  const b = await callFinalizeOnboardingProject(async () => server.rpc(null))
  assert.deepEqual(a, { ok: true, projectId: null })
  assert.deepEqual(b, { ok: true, projectId: null })
  assert.equal(server.projectInsertCount(), 0)
})

test('Skip → retry with a title: Skip is terminal, a later title never creates a project', async () => {
  const server = makeFakeServer()
  await callFinalizeOnboardingProject(async () => server.rpc(null))
  const r = await callFinalizeOnboardingProject(async () => server.rpc('Hollow Tide'))
  assert.deepEqual(r, { ok: true, projectId: null })
  assert.equal(server.projectInsertCount(), 0)
})

test('Skip → "concurrent" include attempt (sequential fake, not a database concurrency proof): still zero inserts', async () => {
  const server = makeFakeServer()
  const [a, b] = await Promise.all([
    callFinalizeOnboardingProject(async () => server.rpc(null)),
    callFinalizeOnboardingProject(async () => server.rpc('Hollow Tide')),
  ])
  assert.equal(server.projectInsertCount(), 0)
  assert.deepEqual(a, { ok: true, projectId: null })
  assert.deepEqual(b, { ok: true, projectId: null })
})

test('already-onboarded account calling the RPC directly never reaches the insert branch', async () => {
  const server = makeFakeServer({ onboarded: true, onboardingProjectId: null })
  const r = await callFinalizeOnboardingProject(async () => server.rpc('Hollow Tide'))
  assert.deepEqual(r, { ok: true, projectId: null })
  assert.equal(server.projectInsertCount(), 0)
})

test('completed Include → later Skip call: no-op read, original project untouched', async () => {
  const server = makeFakeServer()
  await callFinalizeOnboardingProject(async () => server.rpc('Hollow Tide'))
  const r = await callFinalizeOnboardingProject(async () => server.rpc(null))
  assert.deepEqual(r, { ok: true, projectId: 'project-1' })
  assert.equal(server.projectInsertCount(), 1)
})

test('completed Include → changed-title retry: original project id returned, no second project', async () => {
  const server = makeFakeServer()
  await callFinalizeOnboardingProject(async () => server.rpc('Hollow Tide'))
  const r = await callFinalizeOnboardingProject(async () => server.rpc('A Different Name'))
  assert.deepEqual(r, { ok: true, projectId: 'project-1' })
  assert.equal(server.projectInsertCount(), 1)
})
