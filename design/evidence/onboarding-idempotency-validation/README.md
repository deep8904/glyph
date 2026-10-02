# Onboarding project idempotency — real-database validation evidence

This package is the complete, reviewable record of validating
[`design/onboarding-project-idempotency-proposal.md`](../onboarding-project-idempotency-proposal.md)
(revision 14) against a real, disposable, local PostgreSQL cluster. It contains validation
documentation and test artifacts only — no product implementation, and nothing under
`supabase/migrations/`. Nothing here was ever applied to any Supabase project, remote database, or
production system.

**P1 deadlock-order defect fixed and validated in this run (proposal §5b/§5c, revision 14):**
revision 13's single combined `before insert or update of slug` trigger locked the row's owner's
profile from both `INSERT` and `UPDATE` contexts and claimed one uniform, deadlock-free lock order.
That claim was false for the `UPDATE` branch: Postgres already locks an `UPDATE`'s target row
**before** firing that row's `BEFORE UPDATE` trigger, so the trigger's own profile-lock attempt on
the `UPDATE` side ran in the order project-row → profile-row — the reverse of every operator
function (profile-row → project-row) and a genuine deadlock precondition. §5b withdraws that single
trigger and splits it in two: `serialize_null_slug_project_insert()` (`BEFORE INSERT` only) still
locks the profile before a null-slug insert proceeds — safe, because `INSERT` has no pre-existing
row lock to fight over — and `reject_slug_removal_update()` (`BEFORE UPDATE OF slug`) takes **no
lock of any kind**, deterministically rejecting the one transition (`non-null → null`) that would
otherwise need a profile lock from the `UPDATE` side. This run's new gates prove, with real,
independently-launched OS processes and genuine forced overlap: the reject-on-update transition
takes zero locks even while another session holds the same owner's profile locked for 3 real
seconds (item in the §5c transition-matrix section); the corrected real-slug non-blocking gate now
holds a profile lock in one session and inserts a real-slug project in a genuinely separate session,
using millisecond (`clock_timestamp()`) timing, plus a broken-variant sub-test that proves the gate
actually discriminates; the enforced (not merely informational) trigger-less control shows the
*production acceptance assertions themselves* — not just a timing comparison — flip from a
conflicting two-project state to the correct single-project state depending on whether the
serialization trigger exists; a genuine two-session deadlock-order regression test shows the
corrected design produces no Postgres deadlock and no surviving locks when an ordinary slug `UPDATE`
and an operator reconciliation genuinely overlap; and, in a fully isolated throwaway database never
combined with any correctness claim, revision 13's withdrawn design is reproduced against the SAME
two-session pattern and does produce an actual Postgres `ERROR: deadlock detected` — a real, direct
proof of the defect this revision fixes, not an inference from timing.

**P1 rollout-safety fix validated in a prior round (proposal §5a, unaffected by this round):** the forward migration grants
`authenticated` `EXECUTE` on `finalize_onboarding_project` the instant it lands — the external
`onboarding_unresolved_candidates` hard-abort gate only protects the *rollout*, never a direct RPC
call made before operators finish reconciling legacy accounts. `finalize_onboarding_project` now
contains its own caller-scoped, fail-closed guard: after locking the caller's profile row and
passing the terminal check, it refuses to read/create a marker, insert a project, or touch
`is_onboarded` if that same profile is still an unresolved legacy candidate — raising a generic,
stable `errcode = '55000'` before touching anything else. This is now the RPC's actual security
boundary; the external gate is demoted to a rollout/operator-UX signal. Gates 2–6 and 17–33 in the
table below (`G1`–`G5`, plus the `EXECUTE`-privilege-timing checks) are new in this run and prove:
an unresolved single-candidate account is rejected with nothing created or changed; an ambiguous
account is rejected identically; a `confirmed_onboarding` reconciliation returns/reuses the
reconciled project; a `confirmed_not_onboarding` reconciliation proceeds through ordinary
Include/Skip; a genuinely new account is unaffected; no argument shape bypasses the operator
workflow; a genuinely concurrent reconciliation-and-RPC-call pair serializes safely on the same
profile row lock; the rejection error leaks no candidate/project detail; and `authenticated`'s
`EXECUTE` privilege is absent before the guarded function exists and present — on that exact
guarded definition — only afterward.

**Harness correction (prior round, still in effect):** the previous version of the cross-account RLS test
wrapped a shell string comparison around `psql -Atc` output that mixed multiple statements (and
their `SET`/`UPDATE 1` status lines) into one `-c` invocation — the captured string never equaled
the expected literal regardless of whether RLS actually blocked the mutation, so the gate recorded
PASS either way. It is replaced with a positive scalar assertion (`WITH changed AS (UPDATE ...
RETURNING 1) SELECT count(*) FROM changed;` under `-q -t -A`), a before/after byte-for-byte value
check, and a harness self-test proving the same comparison logic correctly reports failure when fed
the insecure scalar (`1`) — using synthetic input, never by weakening or bypassing RLS. The final
summary now also fails the run if the recorded gate count, membership, or any non-PASS result
differs from an explicit expected list (`EXPECTED_GATE_DESCRIPTIONS` in `run-validation.sh`). See
`results/key_facts.json` → `cross_account_mutation_assertion_corrected` for the exact before/after
values from this run.

## Exact PostgreSQL version

`PostgreSQL 16.15 (Homebrew) on aarch64-apple-darwin27.0.0, compiled by Apple clang version
21.0.0` — see [`results/preflight.txt`](results/preflight.txt), captured live at the start of the
run this evidence package documents.

## Exact connection identity, and proof the cluster is disposable and unlinked

- **Socket only, no TCP**: the server is started with `-h ""` (no `listen_addresses`) and only a
  Unix-domain socket under a freshly created `/tmp/onb_val_sock.<random>` directory. `select
  inet_server_addr(), inet_server_port()` both return `NULL` (see `preflight.txt`) — this
  connection is not reachable over any network, local or remote. There is no host, port, or
  credential here that could ever resolve to a hosted Supabase project.
- **Fresh cluster every run**: `initdb` runs into a brand-new `$(mktemp -d)` data directory on every
  invocation of `run-validation.sh`. `preflight.txt` shows the database list immediately after
  start: only `postgres`, `template0`, `template1` — no pre-existing schemas, extensions, or data
  of any kind.
- **No credentials, no remote config**: `run-validation.sh` contains no hostname, API key, project
  ref, or connection string other than the local socket path and port it creates itself.
- **Torn down every run**: `run-validation.sh`'s `trap cleanup EXIT` stops the server (`pg_ctl
  stop -m fast`) and `rm -rf`s the data directory and socket directory unconditionally, whether the
  run passed or failed. The log's final lines confirm `pgrep` finds no leftover process. The
  **evidence package itself** (this directory) is never touched by that cleanup — only the runtime
  data directory and socket, which live outside this directory (under the OS temp dir), are
  removed.

## Exact execution order

`run-validation.sh`, run top to bottom, does:

1. Start a fresh disposable cluster; print the safety preflight.
2. Create cluster-level roles (`sql/00_fixture_roles.sql`).
3. **DB `onboarding_val_main`**: fixture schema → `02_bootstrap.sql` → `03_capture.sql` →
   `04_guard.sql` (must pass on a stock baseline) → confirm `authenticated` has NO `EXECUTE` on
   `finalize_onboarding_project` yet → `05_migration.sql` → confirm `EXECUTE` is now present on the
   specific function definition that already contains the `55000` guard → functional RPC,
   reconciliation, correction, emergency-repair, deletion tests → **caller-scoped reconciliation
   guard tests (`16_guard_fixtures.sql`, G1–G5)**: unresolved single/ambiguous candidates rejected;
   `confirmed_onboarding`/`confirmed_not_onboarding` reconciliation proceeds correctly; no bypass;
   a genuine concurrent reconciliation-vs-RPC race (`17_`/`18_guard_concurrency_*.sql`) → **null-slug
   insert serialization trigger tests (`19`–`22_*.sql`)**: Ordering A (ordinary insert locks/commits
   first, RPC waits then rejects), Ordering B (RPC locks first, ordinary insert waits then resumes),
   a real-slug insert unaffected, an unrelated user's insert never blocking → genuine idempotency
   concurrency (forced lock-hold overlap, then an unforced real race) → `06_rollback.sql` → strict
   ACL equality, including the trigger/function being fully removed.
3a. **DB `onboarding_val_serialize_selftest`** (a separate, isolated throwaway database): applies a
   deliberately trigger-less migration variant (`23_migration_without_trigger_TESTONLY.sql`) and
   repeats Ordering A's timing — confirms the RPC does **not** wait without the trigger, proving the
   wait observed in the real DB main run actually came from the trigger.
4. **DB `onboarding_val_acl`**: seeds PUBLIC grants, a grant-option table-level grant, a genuine
   column-level grant, a quoted/mixed-case role, and a downstream (non-owner) grantor
   (`07_acl_edge_case_seed.sql`) → Bootstrap → Capture → Guard (must **reject**) → Migration →
   Rollback → strict ACL equality, with raw `relacl`/`attacl` captured before and after.
5. **DB `onboarding_val_missing`**: captures a role, drops it, confirms rollback fails *before* any
   destructive statement runs.
6. **DB `onboarding_val_setrole`**: confirms rollback run under a pre-existing `SET ROLE` is
   rejected at its Step 0 precondition, before touching anything.
7. **DB `onboarding_val_failclosed`**, owned and operated by `rollback_operator` (a genuine
   **non-superuser** role — `CREATEDB`, `NOSUPERUSER`): seeds two distinct grantors
   (`08_two_grantor_seed.sql`), then revokes `rollback_operator`'s membership in the second grantor
   and confirms the whole rollback transaction aborts, with every migration object still present
   and zero surviving locks afterward.
8. **DB `onboarding_val_dependent`**: confirms a downstream dependent grant blocks a plain
   (non-`CASCADE`) `REVOKE`, failing loudly.
9. Write `results/results.json` / `results/gates.tsv` (machine-readable PASS/FAIL for every
   recorded gate) and `results/key_facts.json` (project IDs, row counts, and other concrete values
   pulled from this specific run).
10. Cleanup: terminate lingering sessions, stop the server, remove the runtime directory, confirm no
    process remains.

## PASS / FAIL / NOT TESTED

Full machine-readable detail: [`results/gates.tsv`](results/gates.tsv) /
[`results/results.json`](results/results.json). This run: **75/75 PASS, 0 FAIL**. The final summary
in `run-validation.sh` fails the run outright if the recorded gate count, membership, or any
non-PASS result differs from the script's own `EXPECTED_GATE_DESCRIPTIONS` list — 75 is that
expected count, not merely this run's observed count.

| # | Item | Result | Evidence |
|---|---|---|---|
| 1 | Fresh Bootstrap → Capture → Guard → Migration order | PASS | `validation.log` §"DB main" |
| 2 | Ordinary stock ACL baseline passes the Guard | PASS | `gates.tsv`; `validation.log` |
| 3 | PUBLIC table + column grants captured and rejected by Guard | PASS | `acl_edge_case_captured_baseline.txt` (`grantee_oid=0` rows); `gates.tsv` |
| 4 | Table grants not converted into explicit column grants | PASS | `acl_edge_case_captured_baseline.txt` — `test_grantor_g` has exactly 1 table-level row, 0 column rows |
| 5 | Genuine explicit column grants remain distinct | PASS | same file — `test_grantee_h`/`title` is exactly 1 row |
| 6 | Grant option captured and restored | PASS | `acl_edge_case_after_rollback.txt` — `test_grantor_g=a*/postgres` (`*` = grantable) |
| 7 | Quoted/mixed-case role names replay correctly | PASS | `acl_edge_case_after_rollback.txt` — `"\"Weird Role Name\"=a/postgres"` restored at table and column level |
| 8 | Original grantor OID restored exactly | PASS | `acl_edge_case_after_rollback.txt` — `test_grantee_h=a/test_grantor_g` (not `postgres`) |
| 9 | Grantor with zero `private`-schema access replays from the preloaded plan | PASS | `test_grantor_g`/`"Weird Role Name"` were never granted anything on `private`; rollback still succeeded (`gates.tsv`) |
| 10 | No `private.*` query after role assumption | PASS (inferred) | a `private.*` read as a grantor with no privilege would fail with `permission denied`; it did not — see `validation.log` |
| 11 | Missing grantor/grantee fails before destructive work | PASS | `gates.tsv`; DB `onboarding_val_missing` |
| 12 | Pre-existing `SET ROLE` rejected before mutation | PASS | `gates.tsv`; DB `onboarding_val_setrole` |
| 13 | Failure on a later grantor rolls back earlier drops/revokes/grants | PASS | `gates.tsv`; DB `onboarding_val_failclosed`, real non-superuser `rollback_operator` |
| 14 | Dependent grants fail loudly, no CASCADE | PASS | `gates.tsv`; DB `onboarding_val_dependent` |
| 15 | Genuinely overlapping calls from separate sessions | PASS | `concurrency_locks_mid_hold.txt` (real `RowShareLock`), `concurrency_session2.log` (timing), `key_facts.json` |
| 16 | Exactly one project + identical returned ID after ambiguous retry / lost-response retry | PASS | `rpc_results.txt`, `key_facts.json.lost_response_retry_idempotency` |
| 17 | Reconciliation / correction / emergency repair / deletion / terminal Skip | PASS | `rpc_results.txt` (every sub-case, including emergency repair on an account with **zero** reconciliation rows) |
| 18 | anon/authenticated/operator-function denial | PASS | `gates.tsv` (3 separate denial gates) |
| 19 | Cross-account RLS isolation — unauthorized changed-row scalar equals 0 | PASS | `gates.tsv` ("cross-account: authenticated B's unauthorized update on A's profile affects zero rows"); `key_facts.json.cross_account_mutation_assertion_corrected` |
| 19b | Cross-account RLS isolation — target value byte-for-byte unchanged before/after | PASS | `gates.tsv` ("cross-account: user A's is_onboarded is byte-for-byte unchanged..."); before=`t`, after=`t` |
| 19c | Harness self-test: the changed-row assertion PASSES for a secure (0) scalar | PASS | `gates.tsv` |
| 19d | Harness self-test: the same assertion FAILS for an insecure (1) scalar — proves it isn't vacuous, RLS never weakened to manufacture this | PASS | `gates.tsv` |
| 20 | Strict raw OID ACL equality returns zero differences before commit | PASS | `gates.tsv` (both `onboarding_val_main` and `onboarding_val_acl`) |
| 21 | Revoking a restored table-level grant leaves no synthetic column access | PASS (implied) | `acl_after_rollback.txt` shows zero `attacl` rows post-rollback — nothing to leave behind |
| 22 | No surviving lock after failure cleanup | PASS | `locks_after_failure.txt` — `surviving_locks = 0` |
| 23 | `EXECUTE` absent before the guarded function exists | PASS | `gates.tsv` ("authenticated has NO EXECUTE...before migration") |
| 24 | `EXECUTE` present after migration, on the specific guarded definition | PASS | `gates.tsv` (two gates: privilege present; `pg_get_functiondef` contains `55000`) |
| 25 | Genuinely new account (zero candidates) never a member of `onboarding_unresolved_candidates` | PASS | `gates.tsv` (users A and B, both Include and Skip paths) |
| 26 | Unresolved single-candidate account calls RPC directly → rejected, nothing created/changed | PASS | `guard_results.txt`, `key_facts.json.caller_scoped_reconciliation_guard.G1_single_candidate_unresolved` |
| 27 | Unresolved ambiguous (multi-candidate) account → identical rejection | PASS | `guard_results.txt`; `gates.tsv` (G2) |
| 28 | Reconciled `confirmed_onboarding` account → RPC returns the reconciled project ID | PASS | `key_facts.json.caller_scoped_reconciliation_guard.G3_reconciled_confirmed_onboarding` |
| 29 | Reconciled `confirmed_not_onboarding` account → Include creates exactly one new marked project | PASS | `key_facts.json.caller_scoped_reconciliation_guard.G4_reconciled_confirmed_not_onboarding` |
| 30 | No argument shape to the RPC bypasses the operator reconciliation workflow | PASS | `gates.tsv` |
| 31 | Concurrent reconciliation and RPC invocation serialize safely (real separate sessions) | PASS | `guard_concurrency_locks_mid_hold.txt` (real `RowShareLock`), `guard_concurrency_session2.log` (timing + returned ID) |
| 32 | Failed guard exposes no candidate/project detail in the error | PASS | `guard_results.txt` (error text/CONTEXT contain no project id or title) |
| 33 | `authenticated`'s `EXECUTE` privilege correctness — absent before, present only after, on the guarded definition | PASS | see items 23–24 (same evidence, cross-referenced) |
| 34 | Ordering A: ordinary `createDraftProject`-shaped insert locks/commits first, RPC waits then rejects with `55000` | PASS | `serialize_orderingA_locks_before_rpc.txt` (real `RowShareLock`), timing in `validation.log` (~1.4s wait matching the 2s hold minus stagger) |
| 35 | Ordering A: no duplicate, exactly one (unmarked) project, `is_onboarded` stays `false` | PASS | `gates.tsv` (3 gates) |
| 36 | Ordering B: RPC locks first, ordinary insert waits, resumes only after finalization | PASS | `serialize_orderingB_locks_before_insert.txt`, `serialize_orderingB_session2.log` |
| 37 | Ordering B: exactly one marked project, the resumed ordinary draft stays unmarked, `is_onboarded` is `true` | PASS | `gates.tsv` (4 gates) |
| 38 | A real-slug insert is unaffected by the trigger (early-return path, no lock) — baseline sanity | PASS | `validation.log` §"baseline sanity" |
| 39 | An unrelated user's insert never blocks on another owner's held profile lock | PASS | `validation.log` — elapsed 0s while another owner's lock was held |
| 40 | Rollback removes BOTH §5b triggers/functions exactly; ACL equality is unaffected either way | PASS | `gates.tsv` (4 gates) |
| 41 | §5c: `UPDATE` non-null slug → null is rejected at the database boundary, errcode `23514` | PASS | `transition_matrix_results.txt`; `gates.tsv` |
| 42 | §5c: that rejection takes NO lock of any kind — fails in <1s even while another session holds the same owner's profile locked for 3s | PASS | `validation.log` — elapsed ms logged; `gates.tsv` |
| 43 | §5c: `UPDATE` null→non-null and non-null→different-non-null transitions are unaffected | PASS | `transition_matrix_results.txt`; `gates.tsv` |
| 44 | Item 51 (corrected): real-slug insert for the SAME owner completes (millisecond timing) strictly before session A releases that owner's profile lock; exactly one row results | PASS | `item51_sessionA.log` / `item51_sessionB.log`; `key_facts.json.item51_real_slug_gate` |
| 45 | Item 51 broken variant: removing the insert trigger's early return (isolated throwaway DB) makes this SAME gate correctly fail by blocking (≥1000ms vs <1000ms) | PASS | `item51_broken_sessionA.log` / `item51_broken_sessionB.log`; `key_facts.json.item51_real_slug_gate` |
| 46 | Item 54 (enforced control, not informational): WITHOUT the trigger, the RPC completes (millisecond timing) before the ordinary insert's ACTUAL commit, incorrectly reports `onboarded=true`+a project id, and the later insert produces a conflicting two-project state (one marked, one unmarked) | PASS | `item54_session1.log` / `item54_session2.log`; `key_facts.json.item54_enforced_control` |
| 47 | Item 54: the SAME production acceptance assertions (one marked project, none conflicting) DO pass under the real fixed migration, in the same run | PASS | reuses Ordering A's result (item 35); `gates.tsv` |
| 48 | Item 55: genuine deadlock-order regression — an ordinary `authenticated` slug `UPDATE` and an operator reconciliation genuinely overlap on the same project; both complete, no Postgres deadlock, no surviving locks, correct final slug/marker/reconciliation state | PASS | `item55_sessionA.log` / `item55_sessionB.log`; `item55_locks_after.txt`; `key_facts.json.item55_deadlock_regression` |
| 49 | Item 56: isolated reproduction of revision 13's withdrawn combined trigger, in a throwaway database never combined with any correctness claim, produces an ACTUAL Postgres `ERROR: deadlock detected` under the SAME two-session pattern | PASS | `item56_sessionA.log` / `item56_sessionB.log` (raw `DETAIL:` from Postgres); `key_facts.json.item56_old_trigger_deadlock_reproduction` |
| — | Supabase database/security advisors | **NOT TESTED** | see disclosure below |
| — | JWT verification / PostgREST request-context wiring / GoTrue | **NOT TESTED** | see disclosure below |

## Supabase-fidelity disclosure

This is a real PostgreSQL 16 cluster, not a hosted Supabase project. Some things a real Supabase
project provides are reproduced faithfully; others are **not tested here at all**, and are labeled
as such rather than assumed equivalent.

**Reproduced, and exercised for real:**
- `anon`, `authenticated`, `service_role` as actual Postgres roles with the same privilege shape
  (`NOLOGIN`, `service_role` with `BYPASSRLS`) the proposal's grants target.
- Row-Level Security: `profiles`/`projects` have the same `enable row level security` + policy shape
  the live schema uses (`auth.uid() = id` / `auth.uid() = owner_id`, public select on `projects`).
  Every RLS-dependent gate (cross-account isolation, anon/authenticated denial) is a live RLS
  decision made by this Postgres server, not a stub.
- `SECURITY DEFINER`/`SECURITY INVOKER`, `SET LOCAL ROLE`, `aclexplode`, `pg_locks`,
  `pg_stat_activity` — all real PostgreSQL 16 mechanisms, identical to what a Supabase project (also
  Postgres) runs on.
- Genuine multi-session concurrency: every "separate session" in this evidence is a real, separate
  OS process and a real, separate database connection — never a single-process JS fake.

**NOT reproduced — labeled NOT TESTED, not assumed:**
- `auth.uid()`: the real Supabase implementation reads a verified JWT claim that PostgREST placed
  into the request's GUC context after cryptographic verification against Supabase's auth service.
  This evidence's `auth.uid()` (`sql/01_fixture_schema.sql`) reads the **same-shaped** plain session
  GUC (`request.jwt.claim.sub`) but the test driver sets that GUC **directly**, with no JWT, no
  signature check, and no PostgREST in the path at all. This proves the SQL that *consumes*
  `auth.uid()` — every RLS policy, every identity check inside the RPC and operator functions —
  behaves correctly once handed a value. It proves nothing about JWT verification, token expiry,
  PostgREST's request-context wiring, or GoTrue. **Do not read "RLS/auth.uid() tests passed" as
  "Supabase's auth stack was tested" — it was not.**
- Supabase's database/security advisors: this cluster has no Supabase project, no Supabase CLI
  session, and no advisor tooling at all. **NOT TESTED**, and will remain NOT TESTED until run
  against an authorized disposable Supabase project (a local `supabase start` stack or a scratch
  cloud project explicitly created for this purpose) — never this proposal's actual production
  target.
- PostgREST itself: no HTTP layer exists in this evidence. The RPC and operator functions are called
  directly via `psql`, not through PostgREST's REST surface. `execute` grants and function
  signatures are proven correct at the SQL level; PostgREST's own request routing/parsing is out of
  scope here.

## File list

```
README.md                 — this file
run-validation.sh         — deterministic, fail-fast, self-cleaning validation script
sql/
  00_fixture_roles.sql              — cluster-level roles (idempotent)
  01_fixture_schema.sql             — per-database Supabase-like fixture (auth.uid, profiles, projects, RLS)
  02_bootstrap.sql                  — exact Bootstrap SQL from the proposal (§7 Step 1)
  03_capture.sql                    — exact Capture SQL (§7 Step 2)
  04_guard.sql                      — exact Guard SQL (§7 Step 3)
  05_migration.sql                  — exact forward migration candidate (§7 Step 4)
  06_rollback.sql                   — exact atomic rollback script (§8)
  07_acl_edge_case_seed.sql         — PUBLIC / grant-option / mixed-case / downstream-grantor seed
  08_two_grantor_seed.sql           — second distinct grantor, for the fail-closed multi-grantor test
  09_reconciliation_and_rpc_fixtures.sql — test profiles/projects for the functional RPC checklist
  10_concurrency_session1_hold_lock.sql  — forced-overlap session 1 (holds the profile row lock)
  11_concurrency_session2_include.sql    — forced-overlap session 2 (the racing Include call)
  12_concurrency_race_a.sql / 13_concurrency_race_b.sql — genuine unforced Include/Include race
  14_acl_equality_check.sql         — standalone strict OID ACL equality query
  15_pg_locks_check.sql             — parameterized post-failure lock-survival check
  16_guard_fixtures.sql             — test profiles/projects for the caller-scoped guard checklist (G1–G5)
  17_guard_concurrency_session1_reconcile.sql — reconciliation-vs-RPC race, session 1 (holds lock, reconciles)
  18_guard_concurrency_session2_rpc.sql       — reconciliation-vs-RPC race, session 2 (the racing RPC call)
  19_ordinary_insert_hold_then_commit.sql     — the exact createDraftProject SQL shape, held open to force overlap (Ordering A session 1; also the harness self-test)
  20_rpc_call_timed.sql                       — finalize_onboarding_project call with timestamps (Ordering A session 2; also the harness self-test)
  21_rpc_hold_then_finalize.sql               — pre-locks the profile row, then calls the RPC (Ordering B session 1)
  22_ordinary_insert_timed.sql                — the exact createDraftProject SQL shape with timestamps (Ordering B session 2)
  23_migration_without_trigger_TESTONLY.sql   — 05_migration.sql with BOTH §5b triggers mechanically stripped out, used ONLY by item 54's enforced trigger-less control
  24_profile_lock_hold_only.sql               — generic bare profile-row lock hold, no RPC/insert (item 51 session A; §5c no-lock proof)
  25_real_slug_insert_authenticated_timed.sql — real-slug insert as authenticated, millisecond `clock_timestamp()` timing (item 51 session B)
  26_break_insert_trigger_remove_early_return_TESTONLY.sql — patch applied AFTER 05_migration.sql: removes the insert trigger's early return, ONLY for item 51's broken-variant discrimination proof
  27_deadlock_regression_session_a_slug_update.sql — item 55 session A: an ordinary authenticated slug UPDATE, held open to force overlap
  28_deadlock_regression_session_b_operator.sql    — item 55 session B: admin_reconcile_onboarding (locks profile, then updates the same project), millisecond timed
  29_migration_with_OLD_combined_trigger_TESTONLY.sql — 05_migration.sql with revision 13's withdrawn single combined trigger substituted in, for item 56 ONLY — never combined with any correctness claim
  30_old_trigger_deadlock_session_a_slug_removal.sql  — item 56 session A: authenticated UPDATE clearing slug to null, firing the OLD trigger's profile-lock attempt
  31_old_trigger_deadlock_session_b_operator.sql      — item 56 session B: locks profile first, holds, then updates the same project row — completes the deadlock cycle
  32_rpc_call_timed_ms.sql                    — millisecond-precision variant of 20_rpc_call_timed.sql, used by item 54's enforced control
  33_ordinary_insert_hold_then_commit_timed_ms.sql — millisecond-precision variant of 19_..., capturing the ACTUAL commit timestamp, used by item 54's enforced control
results/
  preflight.txt                     — version/host/port/database identity, printed live
  validation.log                    — complete timestamped command output, every command, no omissions
  server.log                        — raw PostgreSQL server log for the run
  gates.tsv / results.json          — machine-readable PASS/FAIL for every recorded gate
  key_facts.json                    — hand-extracted project IDs, row counts, timings for this run
  acl_after_migration.txt / acl_after_rollback.txt — raw relacl/attacl, main DB
  acl_edge_case_before_migration.txt / _captured_baseline.txt / _after_rollback.txt — raw ACL, edge-case DB
  rpc_results.txt                   — every functional RPC/reconciliation/correction/repair/deletion result
  guard_results.txt                 — every caller-scoped guard (G1–G4) call's raw output, including the exact error text/CONTEXT (proves no leaked detail)
  guard_concurrency_*.txt / *.log   — pg_locks output, timing, and final state for the reconciliation-vs-RPC race (G5)
  serialize_orderingA_*.txt / *.log — pg_locks + timing for Ordering A (ordinary insert first, RPC waits then rejects)
  serialize_orderingB_*.txt / *.log — pg_locks + timing for Ordering B (RPC first, ordinary insert waits then resumes)
  serialize_unrelated_*.log         — the unrelated-user non-blocking proof
  selftest_session*.log             — the harness self-test (trigger deliberately absent), same scenario as Ordering A
  concurrency_*.txt / *.log         — pg_locks output, timing, and final row state for the two idempotency concurrency tests
  failclosed_grantors.txt / locks_after_failure.txt — the fail-closed multi-grantor proof
```

## Remaining verification debt (explicit)

- Supabase database/security advisors — not run (no Supabase project exists in this evidence).
- Real JWT/PostgREST/GoTrue path — not run (direct SQL calls only; `auth.uid()` is a same-shaped
  local stand-in, not the real implementation — see disclosure above).
- This evidence validates the **proposal's own SQL** in isolation. It does not validate the actual
  Glyph production schema byte-for-byte (the fixture in `sql/01_fixture_schema.sql` reproduces the
  relevant shape of `profiles`/`projects` from the live migrations, not a full clone of every
  column/constraint/trigger in the real database) — a final pre-merge check against a real Supabase
  branch/preview environment running the actual schema is still warranted before this ships.
- Every random-looking value in `results/*.txt`/`key_facts.json` (UUIDs, winning racer) is specific
  to this one run; re-running `run-validation.sh` reproduces the same *gates* and *structural*
  outcomes but will generate different concrete IDs — this is expected and is itself part of the
  genuine-concurrency evidence (a fixed "winner" every time would suggest a fake).
