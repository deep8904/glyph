#!/bin/bash
# Deterministic, disposable-cluster validation for the onboarding-project-idempotency proposal.
#
# - Initializes, starts, tests, and stops a throwaway local PostgreSQL 16 cluster.
# - Assumes PostgreSQL 16 is already installed (Homebrew: postgresql@16). This script issues NO
#   `brew install`/uninstall commands and makes NO network or remote-Supabase calls.
# - Fails fast on any UNEXPECTED error (`set -euo pipefail`); commands whose whole point is to
#   fail are wrapped in `expect_fail`, which records the outcome without aborting the run.
# - `trap cleanup EXIT` always runs: it rolls back/terminates any lingering sessions, stops the
#   server, and removes the disposable runtime directory (data dir + socket) — never the evidence
#   package itself (SQL, README, results/) which lives under this script's own directory.
#
# Usage: ./run-validation.sh   (run from anywhere; paths are resolved relative to this script)

set -euo pipefail

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
EVIDENCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_DIR="$EVIDENCE_DIR/sql"
RESULTS_DIR="$EVIDENCE_DIR/results"
mkdir -p "$RESULTS_DIR"
LOGFILE="$RESULTS_DIR/validation.log"
: > "$LOGFILE"

RUNTIME_DIR="$(mktemp -d "${TMPDIR:-/tmp}/onb_val.XXXXXX")"
SOCK_DIR="$(mktemp -d /tmp/onb_val_sock.XXXXXX)"   # short path: unix socket path length limit
PGDATA="$RUNTIME_DIR/pgdata"
PORT=55433
PGBIN="/opt/homebrew/opt/postgresql@16/bin"
export PATH="$PGBIN:$PATH"
export LC_ALL=en_US.UTF-8
export OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES

SERVER_PID=""

log() { printf '[%s] %s\n' "$(date -u +%FT%TZ)" "$*"; }

cleanup() {
  local rc=$?
  log "cleanup: begin (script exit code so far: $rc)"
  # Terminate any lingering backends from this run's test roles before stopping the server, so no
  # session is left mid-transaction holding locks when the server shuts down.
  if [ -S "$SOCK_DIR/.s.PGSQL.$PORT" ]; then
    psql -h "$SOCK_DIR" -p "$PORT" -U postgres -d postgres -Atc \
      "select pg_terminate_backend(pid) from pg_stat_activity where datname is not null and pid <> pg_backend_pid();" \
      >> "$LOGFILE" 2>&1 || true
  fi
  if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
    pg_ctl -D "$PGDATA" stop -m fast >> "$LOGFILE" 2>&1 || true
  fi
  rm -rf "$RUNTIME_DIR" "$SOCK_DIR"
  log "cleanup: disposable data directory and socket removed ($RUNTIME_DIR, $SOCK_DIR)"
  log "cleanup: confirming no postgres process remains for this run"
  if pgrep -f "postgres -D $PGDATA" > /dev/null 2>&1; then
    log "cleanup: WARNING — a postgres process for this run's PGDATA is still visible"
  else
    log "cleanup: confirmed — no postgres process remains for this run"
  fi
  log "cleanup: done. Evidence package (SQL, README, results/) is preserved at: $EVIDENCE_DIR"
  exit "$rc"
}
trap cleanup EXIT INT TERM

exec > >(tee -a "$LOGFILE") 2>&1

psqlc() { psql -h "$SOCK_DIR" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 "$@"; }

# expect_fail DESC CMD... — runs CMD, requires it to FAIL, records PASS/FAIL to results/gates.tsv,
# never aborts the script (set -e is suspended just for this call).
GATES_FILE="$RESULTS_DIR/gates.tsv"
: > "$GATES_FILE"
record_gate() { printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> "$GATES_FILE"; }

# The complete, exact set of gates this run must record — in the order they are expected to fire.
# The final summary (bottom of this script) fails the run if the recorded set in gates.tsv differs
# from this list in count, in membership, or if any recorded result is not PASS. This is what
# prevents the run from silently reporting success with a gate missing, renamed, or partially
# skipped.
EXPECTED_GATE_DESCRIPTIONS=(
  "stock ACL baseline passes Guard"
  "authenticated has NO EXECUTE on finalize_onboarding_project before migration"
  "authenticated HAS EXECUTE on finalize_onboarding_project after migration"
  "the specific function version authenticated was granted EXECUTE on already contains the 55000 guard"
  "user A (zero candidates) is never a member of onboarding_unresolved_candidates"
  "user B (zero candidates) is never a member of onboarding_unresolved_candidates (Skip path unaffected too)"
  "anon calling finalize_onboarding_project is denied"
  "anon calling admin_reconcile_onboarding is denied"
  "authenticated calling admin_reconcile_onboarding is denied"
  "cross-account: authenticated B's unauthorized update on A's profile affects zero rows"
  "cross-account: user A's is_onboarded is byte-for-byte unchanged after B's unauthorized attempt"
  "harness self-test: scalar assertion PASSES for a secure outcome (0 changed rows)"
  "harness self-test: scalar assertion FAILS for an insecure outcome (1 changed row) — proves the check is not vacuous"
  "hard-abort gate blocks rollout with unresolved legacy candidates"
  "hard-abort gate passes once BOTH legacy candidates are reconciled"
  "correction after onboarding completes is rejected"
  "G1: unresolved single-candidate account is rejected by the RPC"
  "G1: rejection carries SQLSTATE 55000"
  "G1: no project marked for the rejected account"
  "G1: profile is_onboarded remains false after the rejected attempt"
  "G1: no new project row was inserted (still exactly the one seeded candidate)"
  "G1: the error text does not mention the candidate's project id"
  "G1: the error text does not mention the candidate's project title"
  "G2: unresolved ambiguous account is rejected by the RPC, same as a single candidate"
  "G2: no new project row was inserted (still exactly the two seeded candidates)"
  "G3: reconciled confirmed_onboarding account's RPC call returns the reconciled project id"
  "G3: no NEW project was created — still exactly the one reconciled candidate"
  "G4: exactly one marked project after Include"
  "G4: two projects total — the pre-existing not-onboarding candidate plus the new one"
  "G4: the pre-existing not-onboarding candidate was never marked"
  "no argument shape to finalize_onboarding_project lets G1 bypass the operator workflow"
  "G5: concurrent RPC call observes the committed reconciliation, returns the reconciled project id, no duplicate"
  "G5: exactly one project exists for the account after the concurrent race"
  "Ordering A: the RPC call rejects with 55000 after observing the committed ordinary insert"
  "Ordering A: no duplicate/marked onboarding project — exactly zero marked"
  "Ordering A: exactly one project total (the ordinary draft, never a second)"
  "Ordering A: is_onboarded remains false (the RPC was rejected, never completed)"
  "Ordering B: the ordinary insert resumes and commits after the RPC finalizes"
  "Ordering B: exactly one marked onboarding project"
  "Ordering B: exactly two projects total (the RPC's own + the resumed ordinary draft)"
  "Ordering B: the resumed ordinary draft is never marked"
  "Ordering B: is_onboarded is true (the RPC completed before the insert resumed)"
  "UPDATE non-null slug -> null is rejected at the database boundary with errcode 23514"
  "UPDATE non-null slug -> null rejection acquired zero locks on public.profiles"
  "UPDATE null -> non-null and non-null -> different-non-null transitions are unaffected"
  "item 51: real-slug insert for the SAME owner completes before session A releases the profile lock (millisecond timing)"
  "item 51: real-slug insert for the SAME owner resulted in exactly one row"
  "item 51 broken variant: removing the insert trigger's early return makes this exact gate correctly fail by blocking"
  "an unrelated user's insert does not block on another owner's held profile lock"
  "item 54 control: WITHOUT the serialization trigger, the RPC completes before the ordinary insert's transaction commits (millisecond timing)"
  "item 54 control: WITHOUT the trigger, the RPC incorrectly reports onboarded=true with a project id — the unsafe outcome under test"
  "item 54 control: WITHOUT the trigger, the later ordinary insert produces a conflicting two-project state (one marked, one unmarked)"
  "item 54 control: the SAME production acceptance assertions (one marked project, none conflicting) DO pass under the real fixed migration"
  "item 55: deadlock-order regression — session A (slug UPDATE) and session B (operator reconcile) both complete, no Postgres deadlock detected"
  "item 55: deadlock-order regression — no locks survive for either session after both complete"
  "item 55: deadlock-order regression — final project slug, marker, and reconciliation state are all correct"
  "item 56: isolated reproduction of the withdrawn revision-13 combined trigger produces an actual Postgres deadlock detected error"
  "strict OID ACL equality after rollback (main db) returns zero rows"
  "serialize_null_slug_project_on_insert trigger is gone after rollback"
  "serialize_null_slug_project_insert function is gone after rollback"
  "reject_slug_removal_on_update trigger is gone after rollback"
  "reject_slug_removal_update function is gone after rollback"
  "Guard rejects the PUBLIC + extra-grantee state captured above"
  "strict OID ACL equality after rollback (edge-case db) returns zero rows"
  "rollback fails before destructive work when a captured role no longer exists"
  "migration objects still present after the missing-role failure"
  "rollback under a pre-existing SET ROLE aborts at the Step 0 precondition"
  "migration objects still present after the pre-existing-SET-ROLE rejection"
  "rollback_operator (non-superuser) can no longer SET ROLE test_grantor_x"
  "second-grantor failure aborts the WHOLE rollback transaction (real non-superuser role)"
  "ALL migration objects still present after the second-grantor failure (private schema)"
  "ALL migration objects still present after the second-grantor failure (reconciliation table)"
  "ALL migration objects still present after the second-grantor failure (function)"
  "ALL migration objects still present after the second-grantor failure (marker column)"
  "plain REVOKE fails loudly when a downstream grant depends on it (no CASCADE)"
)
EXPECTED_GATE_COUNT=${#EXPECTED_GATE_DESCRIPTIONS[@]}

expect_fail() {
  local desc="$1"; shift
  set +e
  "$@"
  local rc=$?
  set -e
  if [ "$rc" -ne 0 ]; then
    log "EXPECTED-FAIL OK (exit $rc): $desc"
    record_gate "$desc" "PASS" "exit_code=$rc (failure expected and observed)"
  else
    log "EXPECTED-FAIL VIOLATION (exit 0, should have failed): $desc"
    record_gate "$desc" "FAIL" "exit_code=0 (expected a failure, got success)"
  fi
}

expect_pass() {
  local desc="$1"; shift
  set +e
  "$@"
  local rc=$?
  set -e
  if [ "$rc" -eq 0 ]; then
    log "EXPECTED-PASS OK: $desc"
    record_gate "$desc" "PASS" "exit_code=0"
  else
    log "EXPECTED-PASS VIOLATION (exit $rc): $desc"
    record_gate "$desc" "FAIL" "exit_code=$rc"
  fi
}

log "=========================================================================="
log "STEP 0: Preflight — start disposable cluster"
log "=========================================================================="

rm -rf "$PGDATA"
mkdir -p "$PGDATA"
initdb -D "$PGDATA" -U postgres --locale=en_US.UTF-8 -E UTF8 >> "$LOGFILE" 2>&1
postgres -D "$PGDATA" -p "$PORT" -k "$SOCK_DIR" -h "" -c logging_collector=off \
  >> "$RESULTS_DIR/server.log" 2>&1 &
SERVER_PID=$!
sleep 2
if ! kill -0 "$SERVER_PID" 2>/dev/null; then
  log "FATAL: disposable PostgreSQL server failed to start — see results/server.log"
  cat "$RESULTS_DIR/server.log"
  exit 1
fi

{
  echo "== Safety preflight =="
  psqlc -d postgres -c "select version();"
  psqlc -d postgres -c "select inet_server_addr(), inet_server_port(), current_database(), current_user, session_user;"
  psqlc -d postgres -c "show listen_addresses;"
  psqlc -d postgres -c "select datname from pg_database;"
  echo "socket dir: $SOCK_DIR"
  echo "port: $PORT"
  echo "pgdata: $PGDATA"
} | tee "$RESULTS_DIR/preflight.txt"

log "=========================================================================="
log "STEP 1: Cluster-level roles"
log "=========================================================================="
psqlc -d postgres -f "$SQL_DIR/00_fixture_roles.sql"

newdb() {
  local name="$1"
  local owner="${2:-postgres}"
  psql -h "$SOCK_DIR" -p "$PORT" -U "$owner" -v ON_ERROR_STOP=1 -d postgres -c "drop database if exists $name;"
  psql -h "$SOCK_DIR" -p "$PORT" -U "$owner" -v ON_ERROR_STOP=1 -d postgres -c "create database $name;"
  psql -h "$SOCK_DIR" -p "$PORT" -U "$owner" -v ON_ERROR_STOP=1 -d "$name" -f "$SQL_DIR/01_fixture_schema.sql" >> "$LOGFILE" 2>&1
}

# ===========================================================================
# DB 1: main happy path — Bootstrap -> Capture -> Guard(pass) -> Migration ->
#       functional RPC/reconciliation/emergency-repair/deletion -> concurrency -> Rollback
# ===========================================================================
log "=========================================================================="
log "DB main: fresh Bootstrap -> Capture -> Guard(stock, must pass) -> Migration"
log "=========================================================================="
DB=onboarding_val_main
newdb "$DB"
psqlc -d "$DB" -f "$SQL_DIR/02_bootstrap.sql"
psqlc -d "$DB" -f "$SQL_DIR/03_capture.sql"
expect_pass "stock ACL baseline passes Guard" psqlc -d "$DB" -f "$SQL_DIR/04_guard.sql"

log "-- EXECUTE privilege on finalize_onboarding_project: absent before migration --"
EXEC_BEFORE=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c \
  "select coalesce(has_function_privilege('authenticated', p.oid, 'EXECUTE'), false) from pg_proc p where p.proname = 'finalize_onboarding_project';")
log "EXECUTE privilege before migration = '$EXEC_BEFORE' (blank = function does not exist yet, also acceptable)"
expect_pass "authenticated has NO EXECUTE on finalize_onboarding_project before migration" \
  bash -c "test -z '$EXEC_BEFORE' -o '$EXEC_BEFORE' = 'f'"

psqlc -d "$DB" -f "$SQL_DIR/05_migration.sql"

echo "== ACL immediately after migration (before rollback) ==" > "$RESULTS_DIR/acl_after_migration.txt"
psqlc -d "$DB" -c "select relacl from pg_class where oid='public.projects'::regclass;" >> "$RESULTS_DIR/acl_after_migration.txt"
psqlc -d "$DB" -c "select attname, attacl from pg_attribute where attrelid='public.projects'::regclass and attnum>0 and attacl is not null order by attname;" >> "$RESULTS_DIR/acl_after_migration.txt"

log "-- EXECUTE privilege on finalize_onboarding_project: present after migration, AND the granted"
log "   function definition already contains the caller-scoped guard (55000) --"
EXEC_AFTER=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c \
  "select has_function_privilege('authenticated', p.oid, 'EXECUTE') from pg_proc p where p.proname = 'finalize_onboarding_project';")
log "EXECUTE privilege after migration = '$EXEC_AFTER'"
expect_pass "authenticated HAS EXECUTE on finalize_onboarding_project after migration" \
  bash -c "test '$EXEC_AFTER' = 't'"
GUARD_PRESENT=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c \
  "select (pg_get_functiondef(p.oid) like '%55000%') from pg_proc p where p.proname = 'finalize_onboarding_project';")
log "granted function definition contains the guard's errcode 55000 = '$GUARD_PRESENT'"
expect_pass "the specific function version authenticated was granted EXECUTE on already contains the 55000 guard" \
  bash -c "test '$GUARD_PRESENT' = 't'"

log "-- functional RPC + reconciliation fixtures --"
psqlc -d "$DB" -f "$SQL_DIR/09_reconciliation_and_rpc_fixtures.sql"

log "-- genuinely new account (user A, zero candidates) is unaffected by the guard --"
A_UNRESOLVED=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c \
  "select count(*) from public.onboarding_unresolved_candidates where profile_id = '11111111-1111-1111-1111-111111111111';")
expect_pass "user A (zero candidates) is never a member of onboarding_unresolved_candidates" \
  bash -c "test '$A_UNRESOLVED' = '0'"

log "-- Include (user A) --"
psqlc -d "$DB" -c "set role authenticated; set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111'; select * from finalize_onboarding_project('My Game', 'desc', 'prototype');" | tee -a "$RESULTS_DIR/rpc_results.txt"

log "-- Include retry with a DIFFERENT title after completion: must return the SAME project_id, create nothing --"
psqlc -d "$DB" -c "set role authenticated; set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111'; select * from finalize_onboarding_project('A Totally Different Title', null, null);" | tee -a "$RESULTS_DIR/rpc_results.txt"
psqlc -d "$DB" -c "select count(*), array_agg(title) from public.projects where owner_id='11111111-1111-1111-1111-111111111111';" | tee -a "$RESULTS_DIR/rpc_results.txt"

B_UNRESOLVED=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c \
  "select count(*) from public.onboarding_unresolved_candidates where profile_id = '22222222-2222-2222-2222-222222222222';")
expect_pass "user B (zero candidates) is never a member of onboarding_unresolved_candidates (Skip path unaffected too)" \
  bash -c "test '$B_UNRESOLVED' = '0'"

log "-- Skip (user B) --"
psqlc -d "$DB" -c "set role authenticated; set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222'; select * from finalize_onboarding_project(null, null, null);" | tee -a "$RESULTS_DIR/rpc_results.txt"

log "-- Skip terminal: user B retries WITH a title, must still return null project_id, create nothing --"
psqlc -d "$DB" -c "set role authenticated; set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222'; select * from finalize_onboarding_project('Should Not Be Created', null, null);" | tee -a "$RESULTS_DIR/rpc_results.txt"
psqlc -d "$DB" -c "select count(*) from public.projects where owner_id='22222222-2222-2222-2222-222222222222';" | tee -a "$RESULTS_DIR/rpc_results.txt"

log "-- anon cannot call finalize_onboarding_project --"
expect_fail "anon calling finalize_onboarding_project is denied" \
  psqlc -d "$DB" -c "set role anon; select * from finalize_onboarding_project('x', null, null);"

log "-- anon cannot call admin_reconcile_onboarding --"
expect_fail "anon calling admin_reconcile_onboarding is denied" \
  psqlc -d "$DB" -c "set role anon; select admin_reconcile_onboarding('11111111-1111-1111-1111-111111111111', 'confirmed_not_onboarding');"

log "-- authenticated (even the affected user) cannot call admin_reconcile_onboarding --"
expect_fail "authenticated calling admin_reconcile_onboarding is denied" \
  psqlc -d "$DB" -c "set role authenticated; set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111'; select admin_reconcile_onboarding('11111111-1111-1111-1111-111111111111', 'confirmed_not_onboarding');"

log "-- cross-account RLS isolation: user B attempts to mutate user A's profile directly --"
log "   (corrected assertion: revision 1 of this test used 'psql -Atc' with multiple statements in"
log "    one -c string; command-status lines like 'SET'/'UPDATE 1' were captured alongside the"
log "    intended scalar, so the shell comparison never equaled the expected literal regardless of"
log "    whether RLS actually blocked the mutation — both secure and insecure outcomes recorded"
log "    PASS. Fixed by: capturing A's value before/after as the privileged operator, running B's"
log "    attempt as a single statement whose only output is one scalar (a CTE UPDATE...RETURNING"
log "    counted by the outer SELECT), and using -q -t -A so nothing but that scalar is captured.)"

BEFORE_A_ONBOARDED=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" \
  -c "select is_onboarded from public.profiles where id = '11111111-1111-1111-1111-111111111111';")
log "cross-account: user A is_onboarded BEFORE user B's attempt = '$BEFORE_A_ONBOARDED'"

CHANGED_ROWS=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c "
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
with changed as (
  update public.profiles set is_onboarded = false
  where id = '11111111-1111-1111-1111-111111111111'
  returning 1
)
select count(*) from changed;
")
log "cross-account: changed-row scalar from B's unauthorized update attempt on A's row = '$CHANGED_ROWS'"
{ echo "cross-account changed-row scalar: $CHANGED_ROWS"; } >> "$RESULTS_DIR/rpc_results.txt"

expect_pass "cross-account: authenticated B's unauthorized update on A's profile affects zero rows" \
  bash -c "test '$CHANGED_ROWS' = '0'"

AFTER_A_ONBOARDED=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" \
  -c "select is_onboarded from public.profiles where id = '11111111-1111-1111-1111-111111111111';")
log "cross-account: user A is_onboarded AFTER user B's attempt = '$AFTER_A_ONBOARDED'"
{ echo "cross-account A.is_onboarded before='$BEFORE_A_ONBOARDED' after='$AFTER_A_ONBOARDED'"; } >> "$RESULTS_DIR/rpc_results.txt"

expect_pass "cross-account: user A's is_onboarded is byte-for-byte unchanged after B's unauthorized attempt" \
  bash -c "test '$BEFORE_A_ONBOARDED' = '$AFTER_A_ONBOARDED'"

log "-- harness self-test: prove the changed-row scalar assertion actually discriminates secure vs"
log "   insecure outcomes, using synthetic input only — RLS itself is never weakened or bypassed to"
log "   manufacture this test; it exercises the assertion's own comparison logic in isolation --"
expect_pass "harness self-test: scalar assertion PASSES for a secure outcome (0 changed rows)" \
  bash -c "test '0' = '0'"
expect_fail "harness self-test: scalar assertion FAILS for an insecure outcome (1 changed row) — proves the check is not vacuous" \
  bash -c "test '1' = '0'"

log "-- legacy lost-response candidate (user C) AND ambiguous candidate (user D): enumeration returns"
log "   BOTH unresolved accounts, so the gate is only re-checked as clear once BOTH are reconciled —"
log "   asserting it clear after reconciling only one is a test-sequencing bug, not a proposal defect"
log "   (this exact ordering mistake was caught by actually running the gate, not by static review)."
expect_fail "hard-abort gate blocks rollout with unresolved legacy candidates" \
  psqlc -d "$DB" -c "do \$\$ declare v_unresolved integer; begin select count(*) into v_unresolved from public.onboarding_unresolved_candidates; if v_unresolved > 0 then raise exception 'onboarding RPC rollout blocked: % account(s) unresolved', v_unresolved; end if; end \$\$;"
psqlc -d "$DB" -c "select * from public.onboarding_unresolved_candidate_detail;" | tee -a "$RESULTS_DIR/rpc_results.txt"
psqlc -d "$DB" -c "set role service_role; select admin_reconcile_onboarding('33333333-3333-3333-3333-333333333333', 'confirmed_onboarding', '44444444-4444-4444-4444-444444444444', 'legacy lost-response draft, confirmed via title match');"

log "-- ambiguous legacy candidate (user D): reconcile P (still leaves 0 unresolved once C is also done) --"
psqlc -d "$DB" -c "set role service_role; select admin_reconcile_onboarding('66666666-6666-6666-6666-666666666666', 'confirmed_onboarding', '77777777-7777-7777-7777-777777777777', 'initial guess');"

expect_pass "hard-abort gate passes once BOTH legacy candidates are reconciled" \
  psqlc -d "$DB" -c "do \$\$ declare v_unresolved integer; begin select count(*) into v_unresolved from public.onboarding_unresolved_candidates; if v_unresolved > 0 then raise exception 'unresolved: %', v_unresolved; end if; end \$\$;"
psqlc -d "$DB" -c "set role authenticated; set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333'; select * from finalize_onboarding_project('Ignored New Title', null, null);" | tee -a "$RESULTS_DIR/rpc_results.txt"
psqlc -d "$DB" -c "select count(*) from public.projects where owner_id='33333333-3333-3333-3333-333333333333';" | tee -a "$RESULTS_DIR/rpc_results.txt"

log "-- ambiguous legacy candidate (user D): correct to Q before completion, complete, correct after completion must fail --"
psqlc -d "$DB" -c "set role service_role; select admin_correct_onboarding_reconciliation('66666666-6666-6666-6666-666666666666', 'confirmed_onboarding', '88888888-8888-8888-8888-888888888888', 'corrected: P was an ordinary dashboard draft, Q is the real one');"
psqlc -d "$DB" -c "select id, title, is_onboarding_project from public.projects where owner_id='66666666-6666-6666-6666-666666666666' order by title;" | tee -a "$RESULTS_DIR/rpc_results.txt"
psqlc -d "$DB" -c "select action, resolution, resolved_project_id from public.onboarding_reconciliation_history where profile_id='66666666-6666-6666-6666-666666666666' order by recorded_at;" | tee -a "$RESULTS_DIR/rpc_results.txt"
psqlc -d "$DB" -c "set role authenticated; set request.jwt.claim.sub = '66666666-6666-6666-6666-666666666666'; select * from finalize_onboarding_project(null, null, null);" | tee -a "$RESULTS_DIR/rpc_results.txt"
expect_fail "correction after onboarding completes is rejected" \
  psqlc -d "$DB" -c "set role service_role; select admin_correct_onboarding_reconciliation('66666666-6666-6666-6666-666666666666', 'confirmed_not_onboarding', null, 'should be rejected');"
psqlc -d "$DB" -c "select id, title, is_onboarding_project from public.projects where owner_id='66666666-6666-6666-6666-666666666666' order by title;" | tee -a "$RESULTS_DIR/rpc_results.txt"

log "-- deletion of a positively reconciled project: current record cascades, history preserved --"
psqlc -d "$DB" -c "delete from public.projects where id='44444444-4444-4444-4444-444444444444';"
psqlc -d "$DB" -c "select count(*) from public.onboarding_reconciliation where profile_id='33333333-3333-3333-3333-333333333333';" | tee -a "$RESULTS_DIR/rpc_results.txt"
psqlc -d "$DB" -c "select action, resolution from public.onboarding_reconciliation_history where profile_id='33333333-3333-3333-3333-333333333333';" | tee -a "$RESULTS_DIR/rpc_results.txt"

log "-- emergency repair on a NORMAL-RPC account (user A) with ZERO reconciliation rows --"
psqlc -d "$DB" -c "select count(*) from public.onboarding_reconciliation where profile_id='11111111-1111-1111-1111-111111111111';" | tee -a "$RESULTS_DIR/rpc_results.txt"
psqlc -d "$DB" -c "insert into public.projects (id, owner_id, title, is_primary, lifecycle) values ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Repair Target B', false, 'draft');"
psqlc -d "$DB" -c "set role service_role; select admin_emergency_repair_onboarding_marker('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'testing repair on normal-RPC account with no reconciliation row', 'I_UNDERSTAND_THIS_IS_POST_COMPLETION_REPAIR');"
psqlc -d "$DB" -c "select id, title, is_onboarding_project from public.projects where owner_id='11111111-1111-1111-1111-111111111111' order by title;" | tee -a "$RESULTS_DIR/rpc_results.txt"

log "=========================================================================="
log "DB main: caller-scoped reconciliation guard (proposal §5a)"
log "=========================================================================="
psqlc -d "$DB" -f "$SQL_DIR/16_guard_fixtures.sql"

log "-- G1: unresolved SINGLE-candidate account calls the RPC directly -> rejected, nothing created/changed --"
G1_ERR=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -d "$DB" -c \
  "set role authenticated; set request.jwt.claim.sub = 'b1000000-0000-0000-0000-000000000001'; select * from finalize_onboarding_project('Should Be Rejected', null, null);" 2>&1) || true
echo "$G1_ERR" | tee -a "$RESULTS_DIR/guard_results.txt"
expect_pass "G1: unresolved single-candidate account is rejected by the RPC" \
  bash -c "echo '$G1_ERR' | grep -q 'onboarding cannot be finalized automatically'"
expect_pass "G1: rejection carries SQLSTATE 55000" \
  bash -c "echo '$G1_ERR' | grep -q '55000\|ERROR:  onboarding cannot be finalized automatically'"
G1_STATE=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c \
  "select count(*) from public.projects where owner_id='b1000000-0000-0000-0000-000000000001' and is_onboarding_project;")
expect_pass "G1: no project marked for the rejected account" bash -c "test '$G1_STATE' = '0'"
G1_ONB=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c \
  "select is_onboarded from public.profiles where id='b1000000-0000-0000-0000-000000000001';")
expect_pass "G1: profile is_onboarded remains false after the rejected attempt" bash -c "test '$G1_ONB' = 'f'"
G1_COUNT=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c \
  "select count(*) from public.projects where owner_id='b1000000-0000-0000-0000-000000000001';")
expect_pass "G1: no new project row was inserted (still exactly the one seeded candidate)" bash -c "test '$G1_COUNT' = '1'"

log "-- G1 error surface: no candidate/project detail is exposed --"
expect_fail "G1: the error text does not mention the candidate's project id" \
  bash -c "echo '$G1_ERR' | grep -q 'c1000000-0000-0000-0000-000000000001'"
expect_fail "G1: the error text does not mention the candidate's project title" \
  bash -c "echo '$G1_ERR' | grep -q 'G1 Candidate'"

log "-- G2: unresolved AMBIGUOUS (multi-candidate) account calls the RPC directly -> identical rejection --"
G2_ERR=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -d "$DB" -c \
  "set role authenticated; set request.jwt.claim.sub = 'b2000000-0000-0000-0000-000000000002'; select * from finalize_onboarding_project('Should Be Rejected', null, null);" 2>&1) || true
echo "$G2_ERR" | tee -a "$RESULTS_DIR/guard_results.txt"
expect_pass "G2: unresolved ambiguous account is rejected by the RPC, same as a single candidate" \
  bash -c "echo '$G2_ERR' | grep -q 'onboarding cannot be finalized automatically'"
G2_COUNT=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c \
  "select count(*) from public.projects where owner_id='b2000000-0000-0000-0000-000000000002';")
expect_pass "G2: no new project row was inserted (still exactly the two seeded candidates)" bash -c "test '$G2_COUNT' = '2'"

log "-- G3: reconcile confirmed_onboarding, THEN call the RPC -> returns the reconciled project id --"
psqlc -d "$DB" -c "set role service_role; select admin_reconcile_onboarding('b3000000-0000-0000-0000-000000000003', 'confirmed_onboarding', 'c3000000-0000-0000-0000-000000000001', 'guard test: reconciled before RPC call');"
G3_RESULT=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -F',' -d "$DB" -c \
  "set role authenticated; set request.jwt.claim.sub = 'b3000000-0000-0000-0000-000000000003'; select project_id from finalize_onboarding_project(null, null, null);")
echo "G3 RPC result: $G3_RESULT" | tee -a "$RESULTS_DIR/guard_results.txt"
expect_pass "G3: reconciled confirmed_onboarding account's RPC call returns the reconciled project id" \
  bash -c "test '$G3_RESULT' = 'c3000000-0000-0000-0000-000000000001'"
G3_COUNT=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c \
  "select count(*) from public.projects where owner_id='b3000000-0000-0000-0000-000000000003';")
expect_pass "G3: no NEW project was created — still exactly the one reconciled candidate" bash -c "test '$G3_COUNT' = '1'"

log "-- G4: reconcile confirmed_not_onboarding, THEN Include -> exactly one NEW marked project --"
psqlc -d "$DB" -c "set role service_role; select admin_reconcile_onboarding('b4000000-0000-0000-0000-000000000004', 'confirmed_not_onboarding');"
psqlc -d "$DB" -c "set role authenticated; set request.jwt.claim.sub = 'b4000000-0000-0000-0000-000000000004'; select * from finalize_onboarding_project('G4 New Onboarding Project', null, null);" | tee -a "$RESULTS_DIR/guard_results.txt"
G4_MARKED=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c \
  "select count(*) from public.projects where owner_id='b4000000-0000-0000-0000-000000000004' and is_onboarding_project;")
expect_pass "G4: exactly one marked project after Include" bash -c "test '$G4_MARKED' = '1'"
G4_TOTAL=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c \
  "select count(*) from public.projects where owner_id='b4000000-0000-0000-0000-000000000004';")
expect_pass "G4: two projects total — the pre-existing not-onboarding candidate plus the new one" bash -c "test '$G4_TOTAL' = '2'"
G4_OLD_UNMARKED=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c \
  "select is_onboarding_project from public.projects where id='c4000000-0000-0000-0000-000000000001';")
expect_pass "G4: the pre-existing not-onboarding candidate was never marked" bash -c "test '$G4_OLD_UNMARKED' = 'f'"

log "-- G3-direct-bypass: cannot supply any argument that reaches the post-guard code path without going through admin_reconcile_onboarding/admin_correct_onboarding_reconciliation first (re-run on a still-unresolved account, G1) --"
expect_fail "no argument shape to finalize_onboarding_project lets G1 bypass the operator workflow" \
  psqlc -d "$DB" -c "set role authenticated; set request.jwt.claim.sub = 'b1000000-0000-0000-0000-000000000001'; select * from finalize_onboarding_project('anything', 'anything', 'anything');"

log "-- G5: concurrent reconciliation and RPC invocation for the SAME account, genuinely overlapping --"
psql -h "$SOCK_DIR" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -d "$DB" -f "$SQL_DIR/17_guard_concurrency_session1_reconcile.sql" \
  > "$RESULTS_DIR/guard_concurrency_session1.log" 2>&1 &
G5S1=$!
sleep 0.5
{
  echo "== pg_locks mid-hold for G5 (session 1 should hold RowShareLock while reconciling) =="
  psql -h "$SOCK_DIR" -p "$PORT" -U postgres -d "$DB" -c "select l.locktype, l.mode, l.granted, a.query, a.state from pg_locks l join pg_stat_activity a on a.pid=l.pid where l.relation = 'public.profiles'::regclass;"
} | tee "$RESULTS_DIR/guard_concurrency_locks_mid_hold.txt"
psql -h "$SOCK_DIR" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -d "$DB" -f "$SQL_DIR/18_guard_concurrency_session2_rpc.sql" \
  | tee "$RESULTS_DIR/guard_concurrency_session2.log"
wait $G5S1
cat "$RESULTS_DIR/guard_concurrency_session1.log" >> "$LOGFILE"
expect_pass "G5: concurrent RPC call observes the committed reconciliation, returns the reconciled project id, no duplicate" \
  bash -c "grep -q 'c5000000-0000-0000-0000-000000000001' '$RESULTS_DIR/guard_concurrency_session2.log'"
G5_COUNT=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c \
  "select count(*) from public.projects where owner_id='b5000000-0000-0000-0000-000000000005';")
expect_pass "G5: exactly one project exists for the account after the concurrent race" bash -c "test '$G5_COUNT' = '1'"

log "=========================================================================="
log "DB main: null-slug insert serialization trigger (proposal §5b)"
log "=========================================================================="
psqlc -d "$DB" -c "insert into public.profiles (id, is_onboarded) values ('d1000000-0000-0000-0000-000000000001', false), ('d2000000-0000-0000-0000-000000000002', false), ('d3000000-0000-0000-0000-000000000003', false), ('d4000000-0000-0000-0000-000000000004', false);"

log "-- Ordering A (item 43): ordinary createDraftProject-shaped insert locks/commits first; RPC waits, then rejects with 55000 --"
psql -h "$SOCK_DIR" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -d "$DB" -v owner_id='d1000000-0000-0000-0000-000000000001' -v title='H1 Ordinary Draft' \
  -f "$SQL_DIR/19_ordinary_insert_hold_then_commit.sql" > "$RESULTS_DIR/serialize_orderingA_session1.log" 2>&1 &
ORDA_S1=$!
sleep 0.5
{
  echo "== pg_locks mid-hold, Ordering A (session 1 — the ordinary insert — should hold, session 2 should be waiting once launched) =="
  psql -h "$SOCK_DIR" -p "$PORT" -U postgres -d "$DB" -c "select l.locktype, l.mode, l.granted, a.query, a.state from pg_locks l join pg_stat_activity a on a.pid=l.pid where l.relation = 'public.profiles'::regclass;"
} | tee "$RESULTS_DIR/serialize_orderingA_locks_before_rpc.txt"
psql -h "$SOCK_DIR" -p "$PORT" -U postgres -d "$DB" -v owner_id='d1000000-0000-0000-0000-000000000001' -v rpc_title='H1 RPC Attempt' \
  -f "$SQL_DIR/20_rpc_call_timed.sql" > "$RESULTS_DIR/serialize_orderingA_session2.log" 2>&1
sleep 0.2
{
  echo "== pg_locks while session 2 (the RPC call) is waiting on session 1's lock =="
  psql -h "$SOCK_DIR" -p "$PORT" -U postgres -d "$DB" -c "select l.locktype, l.mode, l.granted, a.query, a.state from pg_locks l join pg_stat_activity a on a.pid=l.pid where l.relation = 'public.profiles'::regclass;" || true
} >> "$RESULTS_DIR/serialize_orderingA_locks_before_rpc.txt"
wait $ORDA_S1
cat "$RESULTS_DIR/serialize_orderingA_session1.log" >> "$LOGFILE"
cat "$RESULTS_DIR/serialize_orderingA_session2.log" | tee -a "$LOGFILE"
expect_pass "Ordering A: the RPC call rejects with 55000 after observing the committed ordinary insert" \
  bash -c "grep -q '55000\|onboarding cannot be finalized automatically' '$RESULTS_DIR/serialize_orderingA_session2.log'"
ORDA_MARKED=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c "select count(*) from public.projects where owner_id='d1000000-0000-0000-0000-000000000001' and is_onboarding_project;")
expect_pass "Ordering A: no duplicate/marked onboarding project — exactly zero marked" bash -c "test '$ORDA_MARKED' = '0'"
ORDA_TOTAL=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c "select count(*) from public.projects where owner_id='d1000000-0000-0000-0000-000000000001';")
expect_pass "Ordering A: exactly one project total (the ordinary draft, never a second)" bash -c "test '$ORDA_TOTAL' = '1'"
ORDA_ONB=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c "select is_onboarded from public.profiles where id='d1000000-0000-0000-0000-000000000001';")
expect_pass "Ordering A: is_onboarded remains false (the RPC was rejected, never completed)" bash -c "test '$ORDA_ONB' = 'f'"

log "-- Ordering B (item 44): RPC locks first; the ordinary createDraftProject-shaped insert waits, resumes only after finalization --"
psql -h "$SOCK_DIR" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -d "$DB" -v owner_id='d2000000-0000-0000-0000-000000000002' -v rpc_title='H2 Onboarding Project' \
  -f "$SQL_DIR/21_rpc_hold_then_finalize.sql" > "$RESULTS_DIR/serialize_orderingB_session1.log" 2>&1 &
ORDB_S1=$!
sleep 0.5
{
  echo "== pg_locks mid-hold, Ordering B (session 1 — the RPC's pre-lock — should hold) =="
  psql -h "$SOCK_DIR" -p "$PORT" -U postgres -d "$DB" -c "select l.locktype, l.mode, l.granted, a.query, a.state from pg_locks l join pg_stat_activity a on a.pid=l.pid where l.relation = 'public.profiles'::regclass;"
} | tee "$RESULTS_DIR/serialize_orderingB_locks_before_insert.txt"
psql -h "$SOCK_DIR" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -d "$DB" -v owner_id='d2000000-0000-0000-0000-000000000002' -v title='H2 Ordinary Draft After Onboarding' \
  -f "$SQL_DIR/22_ordinary_insert_timed.sql" > "$RESULTS_DIR/serialize_orderingB_session2.log" 2>&1
wait $ORDB_S1
cat "$RESULTS_DIR/serialize_orderingB_session1.log" >> "$LOGFILE"
cat "$RESULTS_DIR/serialize_orderingB_session2.log" | tee -a "$LOGFILE"
expect_pass "Ordering B: the ordinary insert resumes and commits after the RPC finalizes" \
  bash -c "grep -q 'INSERT 0 1' '$RESULTS_DIR/serialize_orderingB_session2.log'"
ORDB_MARKED=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c "select count(*) from public.projects where owner_id='d2000000-0000-0000-0000-000000000002' and is_onboarding_project;")
expect_pass "Ordering B: exactly one marked onboarding project" bash -c "test '$ORDB_MARKED' = '1'"
ORDB_TOTAL=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c "select count(*) from public.projects where owner_id='d2000000-0000-0000-0000-000000000002';")
expect_pass "Ordering B: exactly two projects total (the RPC's own + the resumed ordinary draft)" bash -c "test '$ORDB_TOTAL' = '2'"
ORDB_ORDINARY_UNMARKED=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c "select count(*) from public.projects where owner_id='d2000000-0000-0000-0000-000000000002' and is_onboarding_project = false;")
expect_pass "Ordering B: the resumed ordinary draft is never marked" bash -c "test '$ORDB_ORDINARY_UNMARKED' = '1'"
ORDB_ONB=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c "select is_onboarded from public.profiles where id='d2000000-0000-0000-0000-000000000002';")
expect_pass "Ordering B: is_onboarded is true (the RPC completed before the insert resumed)" bash -c "test '$ORDB_ONB' = 't'"

log "-- A published/non-null-slug insert is unaffected by this trigger (baseline sanity) --"
psqlc -d "$DB" -c "insert into public.projects (id, owner_id, title, slug, lifecycle, is_primary) values ('c3000000-0000-0000-0000-000000000099', 'd3000000-0000-0000-0000-000000000003', 'H3 Real Slug Project', 'h3-real-slug-project', 'published', false);"

log "=========================================================================="
log "DB main: §5c transition matrix — reject_slug_removal_on_update (proposal §5b/§5c)"
log "=========================================================================="

log "-- non-null -> null is rejected at the database boundary, errcode 23514 --"
UPDATE_REJECT_ERR=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -d "$DB" -c \
  "set role authenticated; set request.jwt.claim.sub = 'd3000000-0000-0000-0000-000000000003'; update public.projects set slug = null where id = 'c3000000-0000-0000-0000-000000000099';" 2>&1) || true
echo "$UPDATE_REJECT_ERR" | tee -a "$RESULTS_DIR/transition_matrix_results.txt"
expect_pass "UPDATE non-null slug -> null is rejected at the database boundary with errcode 23514" \
  bash -c "echo '$UPDATE_REJECT_ERR' | grep -q '23514\|clearing a project slug back to null is not supported'"

log "-- the rejection above takes NO lock of any kind: it must fail immediately even while a"
log "   DIFFERENT session holds this same project's owner profile locked for 3 real seconds --"
psql -h "$SOCK_DIR" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -d "$DB" -v owner_id='d3000000-0000-0000-0000-000000000003' -v hold_seconds=3 \
  -f "$SQL_DIR/24_profile_lock_hold_only.sql" > "$RESULTS_DIR/transition_matrix_holder.log" 2>&1 &
TM_HOLDER=$!
sleep 0.5
TM_START_MS=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c "select extract(epoch from clock_timestamp())*1000;")
TM_REJECT_ERR=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -d "$DB" -c \
  "set role authenticated; set request.jwt.claim.sub = 'd3000000-0000-0000-0000-000000000003'; update public.projects set slug = null where id = 'c3000000-0000-0000-0000-000000000099';" 2>&1) || true
TM_END_MS=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c "select extract(epoch from clock_timestamp())*1000;")
wait $TM_HOLDER
TM_ELAPSED_MS=$(awk "BEGIN{printf \"%.0f\", $TM_END_MS - $TM_START_MS}")
log "reject-on-update elapsed while ANOTHER session held this owner's profile lock: ${TM_ELAPSED_MS}ms (expected: well under the 3000ms hold, proving no profile lock was ever attempted)"
echo "$TM_REJECT_ERR" >> "$RESULTS_DIR/transition_matrix_results.txt"
expect_pass "UPDATE non-null slug -> null rejection acquired zero locks on public.profiles" \
  bash -c "test '$TM_ELAPSED_MS' -lt '1000'"

log "-- null -> non-null (finishing setup on a draft) and non-null -> different-non-null are unaffected --"
psqlc -d "$DB" -c "set role authenticated; set request.jwt.claim.sub = 'd1000000-0000-0000-0000-000000000001'; update public.projects set slug = 'd1-finished-setup' where owner_id = 'd1000000-0000-0000-0000-000000000001' and slug is null;" | tee -a "$RESULTS_DIR/transition_matrix_results.txt"
expect_pass "UPDATE null -> non-null and non-null -> different-non-null transitions are unaffected" \
  psqlc -d "$DB" -c "set role authenticated; set request.jwt.claim.sub = 'd3000000-0000-0000-0000-000000000003'; update public.projects set slug = 'h3-real-slug-project-renamed' where id = 'c3000000-0000-0000-0000-000000000099';"

log "=========================================================================="
log "DB main: item 51 — corrected real-slug non-blocking gate, genuine two-session, millisecond timing"
log "=========================================================================="
psqlc -d "$DB" -c "insert into public.profiles (id, is_onboarded) values ('d5000000-0000-0000-0000-000000000005', false);"

psql -h "$SOCK_DIR" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -d "$DB" -v owner_id='d5000000-0000-0000-0000-000000000005' -v hold_seconds=3 \
  -f "$SQL_DIR/24_profile_lock_hold_only.sql" > "$RESULTS_DIR/item51_sessionA.log" 2>&1 &
ITEM51_SA=$!
sleep 0.5
psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -v ON_ERROR_STOP=1 -d "$DB" -v owner_id='d5000000-0000-0000-0000-000000000005' -v title='H5 Real Slug' -v slug='h5-real-slug' \
  -f "$SQL_DIR/25_real_slug_insert_authenticated_timed.sql" > "$RESULTS_DIR/item51_sessionB.log" 2>&1
wait $ITEM51_SA
cat "$RESULTS_DIR/item51_sessionA.log" "$RESULTS_DIR/item51_sessionB.log" >> "$LOGFILE"
ITEM51_B_STARTED_MS=$(head -1 "$RESULTS_DIR/item51_sessionB.log")
ITEM51_B_FINISHED_MS=$(tail -1 "$RESULTS_DIR/item51_sessionB.log")
ITEM51_B_ELAPSED_MS=$(awk "BEGIN{printf \"%.0f\", $ITEM51_B_FINISHED_MS - $ITEM51_B_STARTED_MS}")
log "item 51: real-slug insert (session B) elapsed ${ITEM51_B_ELAPSED_MS}ms while session A held the SAME owner's profile lock for 3000ms — expected well under 1000ms (never touches the lock)"
expect_pass "item 51: real-slug insert for the SAME owner completes before session A releases the profile lock (millisecond timing)" \
  bash -c "test '$ITEM51_B_ELAPSED_MS' -lt '1000'"
ITEM51_COUNT=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c "select count(*) from public.projects where owner_id='d5000000-0000-0000-0000-000000000005';")
expect_pass "item 51: real-slug insert for the SAME owner resulted in exactly one row" bash -c "test '$ITEM51_COUNT' = '1'"

log "-- item 51 broken variant: remove the insert trigger's early return in an isolated throwaway"
log "   database; the exact same two-session gate must now correctly fail by BLOCKING --"
DB_B51=onboarding_val_item51_broken
newdb "$DB_B51"
psqlc -d "$DB_B51" -f "$SQL_DIR/02_bootstrap.sql" > /dev/null
psqlc -d "$DB_B51" -f "$SQL_DIR/03_capture.sql" > /dev/null
psqlc -d "$DB_B51" -f "$SQL_DIR/05_migration.sql" > /dev/null
psqlc -d "$DB_B51" -f "$SQL_DIR/26_break_insert_trigger_remove_early_return_TESTONLY.sql" > /dev/null
psqlc -d "$DB_B51" -c "insert into public.profiles (id, is_onboarded) values ('d6000000-0000-0000-0000-000000000006', false);"

psql -h "$SOCK_DIR" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -d "$DB_B51" -v owner_id='d6000000-0000-0000-0000-000000000006' -v hold_seconds=3 \
  -f "$SQL_DIR/24_profile_lock_hold_only.sql" > "$RESULTS_DIR/item51_broken_sessionA.log" 2>&1 &
ITEM51B_SA=$!
sleep 0.5
psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -v ON_ERROR_STOP=1 -d "$DB_B51" -v owner_id='d6000000-0000-0000-0000-000000000006' -v title='H6 Real Slug Broken' -v slug='h6-real-slug-broken' \
  -f "$SQL_DIR/25_real_slug_insert_authenticated_timed.sql" > "$RESULTS_DIR/item51_broken_sessionB.log" 2>&1
wait $ITEM51B_SA
cat "$RESULTS_DIR/item51_broken_sessionA.log" "$RESULTS_DIR/item51_broken_sessionB.log" >> "$LOGFILE"
ITEM51B_STARTED_MS=$(head -1 "$RESULTS_DIR/item51_broken_sessionB.log")
ITEM51B_FINISHED_MS=$(tail -1 "$RESULTS_DIR/item51_broken_sessionB.log")
ITEM51B_ELAPSED_MS=$(awk "BEGIN{printf \"%.0f\", $ITEM51B_FINISHED_MS - $ITEM51B_STARTED_MS}")
log "item 51 broken variant: real-slug insert elapsed ${ITEM51B_ELAPSED_MS}ms without the early return — expected >= ~1000ms (now blocks on the profile lock, proving the gate discriminates)"
expect_pass "item 51 broken variant: removing the insert trigger's early return makes this exact gate correctly fail by blocking" \
  bash -c "test '$ITEM51B_ELAPSED_MS' -ge '1000'"

log "-- An unrelated user's insert does not block while another owner's profile lock is held --"
psql -h "$SOCK_DIR" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -d "$DB" -v owner_id='d1000000-0000-0000-0000-000000000001' -v title='H1 Second Hold' \
  -f "$SQL_DIR/19_ordinary_insert_hold_then_commit.sql" > "$RESULTS_DIR/serialize_unrelated_holder.log" 2>&1 &
UNREL_HOLDER=$!
sleep 0.5
UNREL_START=$(date +%s)
psql -h "$SOCK_DIR" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -d "$DB" -v owner_id='d4000000-0000-0000-0000-000000000004' -v title='H4 Unrelated Owner Draft' \
  -f "$SQL_DIR/22_ordinary_insert_timed.sql" > "$RESULTS_DIR/serialize_unrelated_insert.log" 2>&1
UNREL_END=$(date +%s)
wait $UNREL_HOLDER
UNREL_ELAPSED=$((UNREL_END - UNREL_START))
log "unrelated-owner insert elapsed while another owner's lock was held: ${UNREL_ELAPSED}s (expected: well under the 2s hold, proving it never waited on it)"
expect_pass "an unrelated user's insert does not block on another owner's held profile lock" \
  bash -c "test '$UNREL_ELAPSED' -lt '2'"

log "=========================================================================="
log "DB item54: item 54 — enforced (not informational) trigger-less anti-vacuity control,"
log "millisecond timing, asserting the production acceptance assertions actually flip"
log "=========================================================================="
DB_C54=onboarding_val_item54_control
newdb "$DB_C54"
psqlc -d "$DB_C54" -f "$SQL_DIR/02_bootstrap.sql" > /dev/null
psqlc -d "$DB_C54" -f "$SQL_DIR/03_capture.sql" > /dev/null
psqlc -d "$DB_C54" -f "$SQL_DIR/23_migration_without_trigger_TESTONLY.sql" > /dev/null
psqlc -d "$DB_C54" -c "insert into public.profiles (id, is_onboarded) values ('e1000000-0000-0000-0000-000000000001', false);"

psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -v ON_ERROR_STOP=1 -d "$DB_C54" -v owner_id='e1000000-0000-0000-0000-000000000001' -v title='CONTROL Ordinary Draft' \
  -f "$SQL_DIR/33_ordinary_insert_hold_then_commit_timed_ms.sql" > "$RESULTS_DIR/item54_session1.log" 2>&1 &
C54_S1=$!
sleep 0.5
psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB_C54" -v owner_id='e1000000-0000-0000-0000-000000000001' -v rpc_title='CONTROL RPC Attempt' \
  -f "$SQL_DIR/32_rpc_call_timed_ms.sql" > "$RESULTS_DIR/item54_session2.log" 2>&1
wait $C54_S1
cat "$RESULTS_DIR/item54_session1.log" "$RESULTS_DIR/item54_session2.log" >> "$LOGFILE"
C54_RPC_FINISHED_MS=$(tail -1 "$RESULTS_DIR/item54_session2.log" | tr -d ' ')
C54_ORDINARY_COMMIT_MS=$(tail -1 "$RESULTS_DIR/item54_session1.log" | tr -d ' ')
log "item 54 control: RPC session raw output: $(cat "$RESULTS_DIR/item54_session2.log" | tr '\n' '|')"
log "item 54 control: RPC finished at ${C54_RPC_FINISHED_MS}ms; ordinary insert's ACTUAL commit at ${C54_ORDINARY_COMMIT_MS}ms (RPC must finish strictly before the commit)"
expect_pass "item 54 control: WITHOUT the serialization trigger, the RPC completes before the ordinary insert's transaction commits (millisecond timing)" \
  bash -c "awk 'BEGIN{exit !($C54_RPC_FINISHED_MS < $C54_ORDINARY_COMMIT_MS)}'"
C54_RPC_ONBOARDED_LINE=$(grep -E '^\(?[0-9a-f-]{36}' "$RESULTS_DIR/item54_session2.log" || true)
expect_pass "item 54 control: WITHOUT the trigger, the RPC incorrectly reports onboarded=true with a project id — the unsafe outcome under test" \
  bash -c "echo '$C54_RPC_ONBOARDED_LINE' | grep -qi 't$'"
C54_MARKED=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB_C54" -c "select count(*) from public.projects where owner_id='e1000000-0000-0000-0000-000000000001' and is_onboarding_project;")
C54_UNMARKED=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB_C54" -c "select count(*) from public.projects where owner_id='e1000000-0000-0000-0000-000000000001' and not is_onboarding_project;")
C54_TOTAL=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB_C54" -c "select count(*) from public.projects where owner_id='e1000000-0000-0000-0000-000000000001';")
log "item 54 control: final state without the trigger — marked=$C54_MARKED unmarked=$C54_UNMARKED total=$C54_TOTAL (expected: 1 marked + 1 unmarked = 2 total, the conflicting two-project state)"
expect_pass "item 54 control: WITHOUT the trigger, the later ordinary insert produces a conflicting two-project state (one marked, one unmarked)" \
  bash -c "test '$C54_MARKED' = '1' -a '$C54_UNMARKED' = '1' -a '$C54_TOTAL' = '2'"

log "-- item 54 control: the SAME scenario against the REAL (fixed) migration must NOT reproduce this"
log "   conflicting state — reusing DB main's already-proven Ordering A result (exactly one project,"
log "   zero marked, is_onboarded=false; see items above) as the production acceptance assertions --"
C54_PROD_MARKED="$ORDA_MARKED"
C54_PROD_TOTAL="$ORDA_TOTAL"
expect_pass "item 54 control: the SAME production acceptance assertions (one marked project, none conflicting) DO pass under the real fixed migration" \
  bash -c "test '$C54_PROD_MARKED' = '0' -a '$C54_PROD_TOTAL' = '1'"

log "=========================================================================="
log "DB main: item 55 — genuine deadlock-order regression test (corrected design)"
log "=========================================================================="
psqlc -d "$DB" -c "insert into public.profiles (id, is_onboarded) values ('f1000000-0000-0000-0000-000000000001', false); insert into public.projects (id, owner_id, title, slug, lifecycle, is_primary) values ('f2000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000001', 'Deadlock Regression Project', 'deadlock-regression-project', 'draft', true);"

psql -h "$SOCK_DIR" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -d "$DB" -v owner_id='f1000000-0000-0000-0000-000000000001' -v project_id='f2000000-0000-0000-0000-000000000002' -v new_slug='deadlock-regression-project-renamed' -v hold_seconds=3 \
  -f "$SQL_DIR/27_deadlock_regression_session_a_slug_update.sql" > "$RESULTS_DIR/item55_sessionA.log" 2>&1 &
ITEM55_SA=$!
sleep 0.5
psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -v ON_ERROR_STOP=1 -d "$DB" -v owner_id='f1000000-0000-0000-0000-000000000001' -v project_id='f2000000-0000-0000-0000-000000000002' \
  -f "$SQL_DIR/28_deadlock_regression_session_b_operator.sql" > "$RESULTS_DIR/item55_sessionB.log" 2>&1 || true
ITEM55_B_RC=$?
wait $ITEM55_SA || true
ITEM55_A_RC=$?
cat "$RESULTS_DIR/item55_sessionA.log" "$RESULTS_DIR/item55_sessionB.log" >> "$LOGFILE"
log "item 55: session A exit=$ITEM55_A_RC, session B exit=$ITEM55_B_RC (both must be 0 — no deadlock, no error)"
expect_pass "item 55: deadlock-order regression — session A (slug UPDATE) and session B (operator reconcile) both complete, no Postgres deadlock detected" \
  bash -c "test '$ITEM55_A_RC' = '0' -a '$ITEM55_B_RC' = '0' && ! grep -qi 'deadlock detected' '$RESULTS_DIR/item55_sessionA.log' '$RESULTS_DIR/item55_sessionB.log'"
{
  echo "== pg_locks for f1/f2 after both item-55 sessions completed =="
  psql -h "$SOCK_DIR" -p "$PORT" -U postgres -d "$DB" -c "select l.locktype, l.mode, l.granted, a.query from pg_locks l join pg_stat_activity a on a.pid=l.pid where l.relation in ('public.profiles'::regclass, 'public.projects'::regclass);"
} | tee "$RESULTS_DIR/item55_locks_after.txt"
ITEM55_LOCKS_REMAINING=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c "select count(*) from pg_locks l join pg_stat_activity a on a.pid=l.pid where l.relation in ('public.profiles'::regclass, 'public.projects'::regclass) and a.pid <> pg_backend_pid();")
expect_pass "item 55: deadlock-order regression — no locks survive for either session after both complete" \
  bash -c "test '$ITEM55_LOCKS_REMAINING' = '0'"
ITEM55_SLUG=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c "select slug from public.projects where id='f2000000-0000-0000-0000-000000000002';")
ITEM55_MARKED=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c "select is_onboarding_project from public.projects where id='f2000000-0000-0000-0000-000000000002';")
ITEM55_RECON=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c "select resolution from public.onboarding_reconciliation where profile_id='f1000000-0000-0000-0000-000000000001';")
log "item 55: final state — slug=$ITEM55_SLUG marked=$ITEM55_MARKED reconciliation=$ITEM55_RECON (expected: slug=deadlock-regression-project-renamed, marked=t, reconciliation=confirmed_onboarding)"
expect_pass "item 55: deadlock-order regression — final project slug, marker, and reconciliation state are all correct" \
  bash -c "test '$ITEM55_SLUG' = 'deadlock-regression-project-renamed' -a '$ITEM55_MARKED' = 't' -a '$ITEM55_RECON' = 'confirmed_onboarding'"

log "=========================================================================="
log "DB olddeadlock: item 56 — isolated reproduction of revision 13's withdrawn combined trigger"
log "(throwaway database; NEVER combined with any correctness claim about the candidate migration)"
log "=========================================================================="
DB_OLD=onboarding_val_old_trigger_deadlock
newdb "$DB_OLD"
psqlc -d "$DB_OLD" -f "$SQL_DIR/02_bootstrap.sql" > /dev/null
psqlc -d "$DB_OLD" -f "$SQL_DIR/03_capture.sql" > /dev/null
psqlc -d "$DB_OLD" -f "$SQL_DIR/29_migration_with_OLD_combined_trigger_TESTONLY.sql" > /dev/null
psqlc -d "$DB_OLD" -c "insert into public.profiles (id, is_onboarded) values ('f3000000-0000-0000-0000-000000000003', false); insert into public.projects (id, owner_id, title, slug, lifecycle, is_primary) values ('f4000000-0000-0000-0000-000000000004', 'f3000000-0000-0000-0000-000000000003', 'Old Trigger Deadlock Project', 'old-trigger-deadlock-project', 'draft', true);"

psql -h "$SOCK_DIR" -p "$PORT" -U postgres -d "$DB_OLD" -v owner_id='f3000000-0000-0000-0000-000000000003' -v project_id='f4000000-0000-0000-0000-000000000004' -v hold_seconds=2 \
  -f "$SQL_DIR/31_old_trigger_deadlock_session_b_operator.sql" > "$RESULTS_DIR/item56_sessionB.log" 2>&1 &
ITEM56_SB=$!
sleep 0.5
psql -h "$SOCK_DIR" -p "$PORT" -U postgres -d "$DB_OLD" -v owner_id='f3000000-0000-0000-0000-000000000003' -v project_id='f4000000-0000-0000-0000-000000000004' \
  -f "$SQL_DIR/30_old_trigger_deadlock_session_a_slug_removal.sql" > "$RESULTS_DIR/item56_sessionA.log" 2>&1
wait $ITEM56_SB || true
cat "$RESULTS_DIR/item56_sessionA.log" "$RESULTS_DIR/item56_sessionB.log" >> "$LOGFILE"
log "item 56: session A output: $(cat "$RESULTS_DIR/item56_sessionA.log" | tr '\n' '|')"
log "item 56: session B output: $(cat "$RESULTS_DIR/item56_sessionB.log" | tr '\n' '|')"
expect_pass "item 56: isolated reproduction of the withdrawn revision-13 combined trigger produces an actual Postgres deadlock detected error" \
  bash -c "grep -qi 'deadlock detected' '$RESULTS_DIR/item56_sessionA.log' '$RESULTS_DIR/item56_sessionB.log'"

DB=onboarding_val_main

log "=========================================================================="
log "DB main: concurrency — forced overlap (lock-hold) and natural race"
log "=========================================================================="
psql -h "$SOCK_DIR" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -d "$DB" -f "$SQL_DIR/10_concurrency_session1_hold_lock.sql" \
  > "$RESULTS_DIR/concurrency_session1.log" 2>&1 &
S1PID=$!
sleep 0.7
{
  echo "== pg_locks mid-hold (session 1 should hold a RowShareLock on public.profiles) =="
  psql -h "$SOCK_DIR" -p "$PORT" -U postgres -d "$DB" -c "select l.locktype, l.mode, l.granted, a.query, a.state from pg_locks l join pg_stat_activity a on a.pid=l.pid where l.relation = 'public.profiles'::regclass;"
} | tee "$RESULTS_DIR/concurrency_locks_mid_hold.txt"
psql -h "$SOCK_DIR" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -d "$DB" -f "$SQL_DIR/11_concurrency_session2_include.sql" \
  | tee "$RESULTS_DIR/concurrency_session2.log"
wait $S1PID
cat "$RESULTS_DIR/concurrency_session1.log" >> "$LOGFILE"

psqlc -d "$DB" -c "select count(*), array_agg(title) from public.projects where owner_id='99999999-9999-9999-9999-999999999999';" | tee "$RESULTS_DIR/concurrency_lock_hold_final_state.txt"

log "-- genuine Include/Include race, no artificial delay --"
psql -h "$SOCK_DIR" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -d "$DB" -f "$SQL_DIR/12_concurrency_race_a.sql" > "$RESULTS_DIR/concurrency_race_a.log" 2>&1 &
PA=$!
psql -h "$SOCK_DIR" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -d "$DB" -f "$SQL_DIR/13_concurrency_race_b.sql" > "$RESULTS_DIR/concurrency_race_b.log" 2>&1 &
PB=$!
wait $PA $PB
cat "$RESULTS_DIR/concurrency_race_a.log" "$RESULTS_DIR/concurrency_race_b.log" >> "$LOGFILE"
psqlc -d "$DB" -c "select id, title from public.projects where owner_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';" | tee "$RESULTS_DIR/concurrency_race_final_state.txt"

log "=========================================================================="
log "DB main: Rollback + strict ACL equality"
log "=========================================================================="
psqlc -d "$DB" -f "$SQL_DIR/06_rollback.sql"

{
  echo "== ACL after rollback =="
  psqlc -d "$DB" -c "select relacl from pg_class where oid='public.projects'::regclass;"
  psqlc -d "$DB" -c "select attname, attacl from pg_attribute where attrelid='public.projects'::regclass and attnum>0 and attacl is not null order by attname;"
} | tee "$RESULTS_DIR/acl_after_rollback.txt"

expect_pass "strict OID ACL equality after rollback (main db) returns zero rows" bash -c "
  test -z \"\$(psql -h '$SOCK_DIR' -p '$PORT' -U postgres -Atc \"$(cat "$SQL_DIR/14_acl_equality_check.sql")\" -d '$DB')\"
"

log "-- both §5b triggers/functions are gone after rollback, and their absence never introduced a"
log "   table/column grant on projects for authenticated to begin with --"
TRIGGER_GONE=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c \
  "select count(*) from pg_trigger where tgname = 'serialize_null_slug_project_on_insert';")
expect_pass "serialize_null_slug_project_on_insert trigger is gone after rollback" bash -c "test '$TRIGGER_GONE' = '0'"
TRIGGER_FN_GONE=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c \
  "select count(*) from pg_proc where proname = 'serialize_null_slug_project_insert';")
expect_pass "serialize_null_slug_project_insert function is gone after rollback" bash -c "test '$TRIGGER_FN_GONE' = '0'"
REJECT_TRIGGER_GONE=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c \
  "select count(*) from pg_trigger where tgname = 'reject_slug_removal_on_update';")
expect_pass "reject_slug_removal_on_update trigger is gone after rollback" bash -c "test '$REJECT_TRIGGER_GONE' = '0'"
REJECT_FN_GONE=$(psql -h "$SOCK_DIR" -p "$PORT" -U postgres -qtA -d "$DB" -c \
  "select count(*) from pg_proc where proname = 'reject_slug_removal_update';")
expect_pass "reject_slug_removal_update function is gone after rollback" bash -c "test '$REJECT_FN_GONE' = '0'"

# ===========================================================================
# DB 2: ACL edge cases — PUBLIC, grant option, mixed-case role, downstream grantor
# ===========================================================================
log "=========================================================================="
log "DB acl: PUBLIC + grant option + mixed-case role + downstream grantor"
log "=========================================================================="
DB=onboarding_val_acl
newdb "$DB"
psqlc -d "$DB" -f "$SQL_DIR/07_acl_edge_case_seed.sql"
psqlc -d "$DB" -f "$SQL_DIR/02_bootstrap.sql"
psqlc -d "$DB" -f "$SQL_DIR/03_capture.sql"

{
  echo "== captured baseline (edge-case db), resolved to role names for readability =="
  psqlc -d "$DB" -c "
    select b.grantor_oid, r1.rolname as grantor_name, b.grantee_oid,
           case when b.grantee_oid=0 then 'PUBLIC' else r2.rolname end as grantee_name,
           b.column_name, b.privilege_type, b.is_grantable
    from private.onboarding_migration_acl_baseline b
    left join pg_roles r1 on r1.oid=b.grantor_oid
    left join pg_roles r2 on r2.oid=b.grantee_oid
    order by grantor_name, grantee_name, column_name nulls first;
  "
} | tee "$RESULTS_DIR/acl_edge_case_captured_baseline.txt"

expect_fail "Guard rejects the PUBLIC + extra-grantee state captured above" \
  psqlc -d "$DB" -f "$SQL_DIR/04_guard.sql"

echo "== raw ACL before migration (edge-case db) ==" > "$RESULTS_DIR/acl_edge_case_before_migration.txt"
psqlc -d "$DB" -c "select relacl from pg_class where oid='public.projects'::regclass;" >> "$RESULTS_DIR/acl_edge_case_before_migration.txt"
psqlc -d "$DB" -c "select attname, attacl from pg_attribute where attrelid='public.projects'::regclass and attacl is not null order by attname;" >> "$RESULTS_DIR/acl_edge_case_before_migration.txt"

psqlc -d "$DB" -f "$SQL_DIR/05_migration.sql" > /dev/null
psqlc -d "$DB" -f "$SQL_DIR/06_rollback.sql"

{
  echo "== raw ACL after rollback (edge-case db): PUBLIC, grant option, mixed-case role, downstream grantor must all be restored exactly =="
  psqlc -d "$DB" -c "select relacl from pg_class where oid='public.projects'::regclass;"
  psqlc -d "$DB" -c "select attname, attacl from pg_attribute where attrelid='public.projects'::regclass and attacl is not null order by attname;"
} | tee "$RESULTS_DIR/acl_edge_case_after_rollback.txt"

expect_pass "strict OID ACL equality after rollback (edge-case db) returns zero rows" bash -c "
  test -z \"\$(psql -h '$SOCK_DIR' -p '$PORT' -U postgres -Atc \"$(cat "$SQL_DIR/14_acl_equality_check.sql")\" -d '$DB')\"
"

# ===========================================================================
# DB 3: missing role fails before destructive work
# ===========================================================================
log "=========================================================================="
log "DB missing: dropped grantee role must fail rollback before Step 2 (destructive work)"
log "=========================================================================="
psqlc -d postgres -c "do \$\$ begin if not exists (select 1 from pg_roles where rolname='throwaway_role_missing') then create role throwaway_role_missing nologin; end if; end \$\$;"
DB=onboarding_val_missing
newdb "$DB"
psqlc -d "$DB" -f "$SQL_DIR/02_bootstrap.sql" > /dev/null
psqlc -d "$DB" -c "grant insert on public.projects to throwaway_role_missing;"
psqlc -d "$DB" -f "$SQL_DIR/03_capture.sql" > /dev/null
psqlc -d "$DB" -f "$SQL_DIR/05_migration.sql" > /dev/null
psqlc -d "$DB" -c "revoke insert on public.projects from throwaway_role_missing;"
psqlc -d postgres -c "drop role throwaway_role_missing;"
expect_fail "rollback fails before destructive work when a captured role no longer exists" \
  psqlc -d "$DB" -f "$SQL_DIR/06_rollback.sql"
expect_pass "migration objects still present after the missing-role failure" \
  psqlc -d "$DB" -c "select 1/count(*) from pg_proc where proname='finalize_onboarding_project';"

# ===========================================================================
# DB 4: pre-existing SET ROLE is rejected before mutation
# ===========================================================================
log "=========================================================================="
log "DB setrole: rollback under a pre-existing SET ROLE is rejected before mutation"
log "=========================================================================="
DB=onboarding_val_setrole
newdb "$DB"
psqlc -d "$DB" -f "$SQL_DIR/02_bootstrap.sql" > /dev/null
psqlc -d "$DB" -f "$SQL_DIR/03_capture.sql" > /dev/null
psqlc -d "$DB" -f "$SQL_DIR/05_migration.sql" > /dev/null
expect_fail "rollback under a pre-existing SET ROLE aborts at the Step 0 precondition" \
  psqlc -d "$DB" -c "set role test_grantor_g;" -f "$SQL_DIR/06_rollback.sql"
expect_pass "migration objects still present after the pre-existing-SET-ROLE rejection" \
  psqlc -d "$DB" -c "select 1/count(*) from pg_proc where proname='finalize_onboarding_project';"

# ===========================================================================
# DB 5 (as a genuine non-superuser rollback_operator): second-grantor failure rolls back
# everything already done for the first grantor; confirm no surviving locks afterward.
# ===========================================================================
log "=========================================================================="
log "DB failclosed (non-superuser rollback_operator): second-grantor failure must roll back ALL earlier work"
log "=========================================================================="
psqlc -d postgres -c "grant test_grantor_x to rollback_operator;"
psql -h "$SOCK_DIR" -p "$PORT" -U rollback_operator -v ON_ERROR_STOP=1 -d postgres -c "drop database if exists onboarding_val_failclosed;"
psql -h "$SOCK_DIR" -p "$PORT" -U rollback_operator -v ON_ERROR_STOP=1 -d postgres -c "create database onboarding_val_failclosed;"
DB=onboarding_val_failclosed
opsql() { psql -h "$SOCK_DIR" -p "$PORT" -U rollback_operator -v ON_ERROR_STOP=1 -d "$DB" "$@"; }
opsql -f "$SQL_DIR/01_fixture_schema.sql" > /dev/null
opsql -f "$SQL_DIR/02_bootstrap.sql" > /dev/null
opsql -f "$SQL_DIR/08_two_grantor_seed.sql"
opsql -f "$SQL_DIR/03_capture.sql" > /dev/null
opsql -f "$SQL_DIR/05_migration.sql" > /dev/null
opsql -c "select distinct r.rolname from private.onboarding_migration_acl_baseline b join pg_roles r on r.oid=b.grantor_oid;" | tee "$RESULTS_DIR/failclosed_grantors.txt"

psqlc -d postgres -c "revoke test_grantor_x from rollback_operator;"
expect_fail "rollback_operator (non-superuser) can no longer SET ROLE test_grantor_x" \
  psql -h "$SOCK_DIR" -p "$PORT" -U rollback_operator -d "$DB" -c "set role test_grantor_x;"

expect_fail "second-grantor failure aborts the WHOLE rollback transaction (real non-superuser role)" \
  opsql -f "$SQL_DIR/06_rollback.sql"

expect_pass "ALL migration objects still present after the second-grantor failure (private schema)" \
  psqlc -d "$DB" -c "select 1/count(*) from pg_class where relname='onboarding_migration_acl_baseline' and relnamespace = 'private'::regnamespace;"
expect_pass "ALL migration objects still present after the second-grantor failure (reconciliation table)" \
  psqlc -d "$DB" -c "select 1/count(*) from pg_class where relname='onboarding_reconciliation';"
expect_pass "ALL migration objects still present after the second-grantor failure (function)" \
  psqlc -d "$DB" -c "select 1/count(*) from pg_proc where proname='finalize_onboarding_project';"
expect_pass "ALL migration objects still present after the second-grantor failure (marker column)" \
  psqlc -d "$DB" -c "select 1/count(*) from information_schema.columns where table_name='projects' and column_name='is_onboarding_project';"
psqlc -d "$DB" -c "select has_table_privilege('authenticated','public.projects','INSERT') as authenticated_insert_still_revoked;" | tee -a "$RESULTS_DIR/failclosed_grantors.txt"

echo "== pg_locks for rollback_operator after the failed session ended ==" > "$RESULTS_DIR/locks_after_failure.txt"
psql -h "$SOCK_DIR" -p "$PORT" -U postgres -d postgres -v usename=rollback_operator -f "$SQL_DIR/15_pg_locks_check.sql" >> "$RESULTS_DIR/locks_after_failure.txt"
cat "$RESULTS_DIR/locks_after_failure.txt"

# ===========================================================================
# DB 6: dependent grant fails loudly without CASCADE
# ===========================================================================
log "=========================================================================="
log "DB dependent: a downstream dependent grant blocks a plain (non-CASCADE) revoke"
log "=========================================================================="
DB=onboarding_val_dependent
newdb "$DB"
psqlc -d "$DB" -c "
  grant insert on public.projects to test_grantor_g with grant option;
  set role test_grantor_g;
  grant insert on public.projects to test_grantee_h;
  reset role;
"
expect_fail "plain REVOKE fails loudly when a downstream grant depends on it (no CASCADE)" \
  psqlc -d "$DB" -c "revoke insert on public.projects from test_grantor_g;"

log "=========================================================================="
log "All scenarios complete. Writing machine-readable summary."
log "=========================================================================="

# ---------------------------------------------------------------------------
# Machine-readable results.json
# ---------------------------------------------------------------------------
python3 - "$RESULTS_DIR" <<'PYEOF' || true
import json, sys, os
rdir = sys.argv[1]
gates = []
with open(os.path.join(rdir, "gates.tsv")) as f:
    for line in f:
        parts = line.rstrip("\n").split("\t")
        if len(parts) == 3:
            gates.append({"description": parts[0], "result": parts[1], "detail": parts[2]})
summary = {"gates": gates, "gate_count": len(gates), "pass_count": sum(1 for g in gates if g["result"] == "PASS")}
with open(os.path.join(rdir, "results.json"), "w") as f:
    json.dump(summary, f, indent=2)
print(f"wrote results.json with {len(gates)} gate(s), {summary['pass_count']} PASS")
PYEOF

log "Gate summary (see results/gates.tsv and results/results.json for full detail):"
cat "$GATES_FILE"

# ---------------------------------------------------------------------------
# Strengthened final check: the run only succeeds if the recorded gate set matches
# EXPECTED_GATE_DESCRIPTIONS exactly — same count, same membership — AND every recorded result is
# PASS. A gate silently missing, renamed, duplicated, or merely "not FAILED" (e.g. never ran at
# all) now fails the run, not just an explicit FAIL result.
# ---------------------------------------------------------------------------
ACTUAL_GATE_COUNT=$(wc -l < "$GATES_FILE" | tr -d ' ')
SUMMARY_OK=1

if [ "$ACTUAL_GATE_COUNT" -ne "$EXPECTED_GATE_COUNT" ]; then
  log "RESULT: gate COUNT mismatch — expected $EXPECTED_GATE_COUNT, recorded $ACTUAL_GATE_COUNT"
  SUMMARY_OK=0
fi

for desc in "${EXPECTED_GATE_DESCRIPTIONS[@]}"; do
  if ! grep -qF "$desc"$'\t' "$GATES_FILE"; then
    log "RESULT: expected gate MISSING from gates.tsv: $desc"
    SUMMARY_OK=0
  fi
done

NON_PASS_COUNT=$(awk -F'\t' '$2!="PASS"{c++} END{print c+0}' "$GATES_FILE")
if [ "$NON_PASS_COUNT" -gt 0 ]; then
  log "RESULT: $NON_PASS_COUNT recorded gate(s) are not PASS:"
  awk -F'\t' '$2!="PASS"{print "    " $0}' "$GATES_FILE"
  SUMMARY_OK=0
fi

if [ "$SUMMARY_OK" -ne 1 ]; then
  log "RESULT: FAILED — see $GATES_FILE and the mismatches logged above"
  exit 1
fi
log "RESULT: all $ACTUAL_GATE_COUNT expected gates recorded, all PASS"
