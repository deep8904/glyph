# Proposal: exactly-once onboarding project creation (revision 14)

**Status: proposal only. Not applied. No migration has been run against any database.** Revision
13's single combined `BEFORE INSERT OR UPDATE OF slug` trigger is **withdrawn**: it locked the
row's owner's profile from both `INSERT` and `UPDATE` contexts and claimed one uniform lock order,
but Postgres locks an `UPDATE`'s target row **before** firing that row's `BEFORE UPDATE` trigger —
so the trigger's own profile-lock attempt on the `UPDATE` branch ran in the order project-row →
profile-row, the reverse of `finalize_onboarding_project` and every operator function (profile-row →
project-row). That is the classic two-resource-opposite-order deadlock precondition. Revision 13's
"nothing ever holds a project lock while waiting on a profile lock" claim was true only for `INSERT`.
§5b now splits this into two triggers: `serialize_null_slug_project_insert()` (`BEFORE INSERT`)
still locks the profile before any null-slug insert proceeds — this remains safe because `INSERT` has
no pre-existing row lock for the trigger to fight over — and `reject_slug_removal_update()`
(`BEFORE UPDATE OF slug`) takes **no lock of any kind**; it only reads `OLD`/`NEW` and deterministically
rejects the one transition that would otherwise need a profile lock from the `UPDATE` side
(`non-null → null`), which no legitimate product workflow performs. §5c audits every remaining way
`onboarding_unresolved_candidates` membership can change and shows each either already locks
profile-before-project or takes no lock at all. Revision 11's OID-based ACL capture/replay/rollback
and revision 12's caller-scoped guard are otherwise unchanged. Nothing else changes: no edit to any
other application code, any page, or any migration file. Nothing in this document has been executed.

## Problem (unchanged)

`insertProject()` in onboarding is an unrestricted `insert`. A lost response after a committed
insert, followed by a client-side retry, creates a **second** project row.

---

## 1. Project-insert inventory (unchanged)

Three insert sites: `GlyphOnboardingFlow.tsx:180` (onboarding, no slug, `is_primary: true`),
`ProjectForm.tsx:250` (dashboard Save, always sets slug), `app/actions/projects.ts:22`
(`createDraftProject`, no slug, fired from media-upload before Save). No column reliably
distinguishes onboarding-origin from an abandoned dashboard draft.

## 2. Skip is terminal (unchanged)

Once `profiles.is_onboarded = true`, the RPC never inserts a project again for that user under any
arguments.

## 3. Atomic create-or-reuse RPC (unchanged from revision 5, approved in principle)

`finalize_onboarding_project` is `security definer`, locks the caller's own profile row before
checking onboarding state or touching any marker, and creates the project with its marker already
`true` in the same `insert` statement. No `unique_violation` recovery — any insert failure
propagates uncaught and aborts the whole call. Full body in §7.

---

## 4. The ACL baseline: private, identified, and captured outside the migration's transaction

### Why revision 5's baseline table was wrong

It lived in `public` with only a table-level `create table if not exists` and no RLS, no revoke,
and no identity — a second run of the capture step would silently append a second, indistinguishable
snapshot, and nothing stopped `anon`/`authenticated` from reading it if `public` schema privileges
ever changed. And because Step 0 (capture) and Step 0b (the abort guard) were presented as one
sequential block with no stated transaction boundary, if 0b's `raise exception` ran in the same
transaction as 0's inserts, Postgres would roll back *both* — destroying the exact diagnostic
record the capture exists to produce, at precisely the moment it would be needed to investigate the
abort.

### Corrected: a private schema, an identified single capture, enforced by a constraint

Revision 6 described this schema/table creation only inside the *migration* section (§7), while
also telling the operator to run a "preflight capture" against `private.onboarding_migration_acl_*`
*before* the migration — those objects would not exist yet on a fresh database at that point. This
revision splits it into three genuinely separate steps, in the only order that is executable:
**Bootstrap** (creates the objects, its own committed transaction) → **Capture** (writes into them,
its own committed transaction) → **Guard** (reads, a separate statement) → only then the migration
itself (§7).

**Bootstrap (its own transaction, run first — the very first thing that touches any of this):**

```sql
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

-- One row per migration, ever. A second capture attempt for the same migration_id fails on this
-- primary key rather than silently appending an indistinguishable second snapshot.
create table if not exists private.onboarding_migration_acl_capture (
  migration_id text primary key,
  captured_at timestamptz not null default now()
);

create table if not exists private.onboarding_migration_acl_baseline (
  id bigint generated always as identity primary key,
  migration_id text not null references private.onboarding_migration_acl_capture(migration_id),
  grantor_oid oid not null,
  grantee_oid oid not null, -- 0 = PUBLIC (aclexplode's own convention for the PUBLIC grantee)
  object_name text not null,
  column_name text,
  privilege_type text not null,
  is_grantable boolean not null default false
);

alter table private.onboarding_migration_acl_capture enable row level security;
alter table private.onboarding_migration_acl_baseline enable row level security;
revoke all on private.onboarding_migration_acl_capture from public, anon, authenticated;
revoke all on private.onboarding_migration_acl_baseline from public, anon, authenticated;
grant select on private.onboarding_migration_acl_capture to service_role;
grant select on private.onboarding_migration_acl_baseline to service_role;
```

`is_grantable` records whether a captured grant carried `WITH GRANT OPTION`. `grantor_oid`/
`grantee_oid` are stored as raw catalog OIDs, never as text — a role name is only ever derived from
`pg_roles.rolname` at the point it is actually needed for a SQL statement (replay, or a
human-readable diagnostic), and only ever passed through `%I` exactly once, directly on that raw
`rolname` (§ below explains why this matters). `column_name is null` marks a table-level row;
`column_name` set marks a genuine explicit column-level row — this discriminator is populated only
from a real `pg_attribute.attacl` entry, never synthesized from a table-level grant's effective
reach.

Confirm this committed (`select to_regclass('private.onboarding_migration_acl_baseline');` returns
non-null in a fresh session) before proceeding to Capture. The migration itself (§7) repeats this
exact block behind `if not exists`/`create or replace` guards purely as defense against running the
migration on a database where Bootstrap was, for some reason, skipped — it is not where this should
normally happen for the first time.

`private` is not a schema PostgREST exposes (Supabase's exposed-schema list is `public` and
whatever else is explicitly configured — `private` is never in it by default, and this proposal
does not add it), so these tables are unreachable through the REST API regardless of any grant.
The `revoke all ... from public, anon, authenticated` on both the schema and the tables is
defense-in-depth for a direct Postgres connection using those roles, not the primary control.

`migration_id` is the fixed literal `'onboarding_project_idempotency_v1'` — a stable identifier for
*this* migration, not a randomly generated value the operator would need to record and pass around.
Every row this migration ever captures carries it, and rollback (§8) filters by it explicitly,
guaranteeing it selects exactly this migration's one capture and never blends rows from an unrelated
earlier or later migration that might someday also write to this table.

### Capture and Guard are separate steps from the migration, on purpose

**Capture (its own transaction, run after Bootstrap has committed, and confirmed committed before
the migration below runs at all):**

```sql
-- Capture — run this as its own statement/transaction (do not wrap it together with Bootstrap, the
-- guard below, or the migration in one BEGIN/COMMIT or one migration-runner transaction). If this
-- INSERT succeeds and is allowed to commit on its own, the capture survives regardless of what
-- happens afterward — including if the guard immediately below it raises, or if the migration
-- itself is later aborted or rolled back for any reason.
insert into private.onboarding_migration_acl_capture (migration_id) values ('onboarding_project_idempotency_v1');

-- Neither information_schema.role_table_grants/role_column_grants NOR table_privileges/
-- column_privileges are used here. The role_* views silently omit PUBLIC grants (revision 8's
-- finding). table_privileges/column_privileges include PUBLIC, but column_privileges EXPANDS a
-- plain table-level grant into one synthetic row per column — indistinguishable, in that view,
-- from a genuine explicit per-column grant. Storing that expansion and later replaying it is
-- exactly the P1 defect this revision fixes: it would convert a table-wide grant into 15 real,
-- explicit column-level grants on rollback. The only source that reports the true, non-expanded
-- ACL is the catalog itself: pg_class.relacl for the table-level entries and pg_attribute.attacl
-- for column-level entries — exploded with aclexplode(), which returns one row per (grantor,
-- grantee, privilege, grant-option) tuple actually stored in that ACL array, nothing synthesized.

-- Table-level ACL entries. coalesce(..., acldefault('r', c.relowner)) only matters if relacl
-- itself is null (a table that has never had an explicit GRANT/REVOKE applied, still running on
-- Postgres's implicit owner-only default) — this is the standard, documented way to read a
-- table's effective ACL (the same expansion `\dp` performs), and is unrelated to the column-level
-- coalescing this revision explicitly avoids below.
--
-- x.grantor and x.grantee are aclexplode()'s own OID-typed output columns — stored as-is, never
-- cast to text. A ::regrole::text cast produces SQL DISPLAY form, which for a role name needing
-- quoting is already quoted; storing that and later re-quoting it with %I double-quotes it and
-- targets a nonexistent role. Resolving OID -> rolname happens only at replay/verification time,
-- against pg_roles, immediately before the one %I that uses it.
insert into private.onboarding_migration_acl_baseline
  (migration_id, grantor_oid, grantee_oid, object_name, column_name, privilege_type, is_grantable)
select
  'onboarding_project_idempotency_v1',
  x.grantor,
  x.grantee,
  c.relname,
  null,
  x.privilege_type,
  x.is_grantable
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) as x
where n.nspname = 'public' and c.relname = 'projects'
  and x.privilege_type in ('INSERT', 'UPDATE');

-- Explicit column-level ACL entries ONLY. A null pg_attribute.attacl means "no explicit
-- column-level grant exists for this column" and is deliberately NOT coalesced into anything —
-- aclexplode(NULL) is STRICT and simply contributes zero rows for that column, which is the
-- correct, honest outcome: a column with no attacl produces no baseline row at all.
insert into private.onboarding_migration_acl_baseline
  (migration_id, grantor_oid, grantee_oid, object_name, column_name, privilege_type, is_grantable)
select
  'onboarding_project_idempotency_v1',
  x.grantor,
  x.grantee,
  c.relname,
  a.attname,
  x.privilege_type,
  x.is_grantable
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
cross join lateral aclexplode(a.attacl) as x
where n.nspname = 'public' and c.relname = 'projects'
  and a.attacl is not null
  and x.privilege_type in ('INSERT', 'UPDATE');

-- Confirm the capture actually committed before proceeding to the guard below.
select count(*) from private.onboarding_migration_acl_baseline
where migration_id = 'onboarding_project_idempotency_v1';
```

**Then, as a separate statement (same session is fine — this part is read-only, so there is
nothing precious to lose if it raises). This is the effective-access Guard, and it deliberately
uses a *different* source than Capture above — see "Guard vs. Capture" below:**

```sql
do $$
declare
  v_unexpected_grantees integer;
  v_unexpected_membership integer;
begin
  select count(*) into v_unexpected_grantees
  from (
    select grantee, privilege_type from information_schema.table_privileges
    where table_schema = 'public' and table_name = 'projects' and privilege_type in ('INSERT', 'UPDATE')
    union all
    select grantee, privilege_type from information_schema.column_privileges
    where table_schema = 'public' and table_name = 'projects' and privilege_type in ('INSERT', 'UPDATE')
  ) g
  where g.grantee not in ('authenticated', 'postgres', 'supabase_admin')
    and g.grantee not like 'pg\_%';
  -- 'PUBLIC' is deliberately NOT in the allowed list — a PUBLIC-level INSERT/UPDATE grant on
  -- projects, table-level or column-level, is unexpected and must abort here, exactly like any
  -- other unrecognized grantee.

  if v_unexpected_grantees > 0 then
    raise exception
      'unexpected INSERT/UPDATE grantee(s) on public.projects — abort, inspect private.onboarding_migration_acl_baseline (migration_id = onboarding_project_idempotency_v1, already committed), and update this migration before proceeding';
  end if;

  select count(*) into v_unexpected_membership
  from pg_auth_members am
  join pg_roles m on m.oid = am.member
  join pg_roles r on r.oid = am.roleid
  where m.rolname in ('anon', 'authenticated')
    and r.rolname not in ('authenticated', 'anon');

  if v_unexpected_membership > 0 then
    raise exception 'anon/authenticated inherits membership in an unexpected role — abort and investigate before proceeding';
  end if;
end $$;
```

If this raises, **the capture from the step above still exists** — it was its own committed
transaction, not part of this DO block — so the exact ACL state that caused the abort is already
on record for investigation. Only once this guard passes does the actual migration (§7) run, as its
own separate transaction; if anything in the migration itself needs to abort, rolling back its own
DDL is correct and safe precisely because nothing new was captured inside it — the one durable
capture already happened, safely, before it started. The full four-step order is: Bootstrap →
Capture → Guard → Migration, each its own transaction (§7, §9).

### Guard vs. Capture: two different questions, two different sources, deliberately

The Guard's job is "does any unexpected role currently have *effective* `INSERT`/`UPDATE` access to
`projects`?" — for that question, `table_privileges`/`column_privileges`'s expansion of a
table-level grant into per-column rows is exactly correct: a table-level grant genuinely does give
effective access to every column, and the Guard should see that. Capture's job is the opposite
question — "what are the *actual, distinct* ACL entries, so they can be exactly reproduced later?"
— where that same expansion is exactly wrong, because replaying the expanded rows manufactures
grants that never existed. This revision keeps the Guard on
`table_privileges`/`column_privileges` unchanged (fail-closed for `PUBLIC` and any other unexpected
grantee is still correct there) and moves only Capture, Rollback replay, and the equality
verification onto the non-expanded catalog source. These are separate concerns and this revision
does not conflate them.

### What "exact ACL restoration" actually means — stated honestly, and how grantor is actually restored

Privilege, grantee, table-vs-column scope, column identity, and grant-option state (`is_grantable`)
are restored exactly — the replay in §8 reproduces the precise, non-expanded set of ACL entries
Capture recorded, verified by the raw-catalog equality query in §8.

**Grantor is restored exactly too, unconditionally — never approximated, never silently changed.**
Revision 9 assumed `GRANT ... GRANTED BY <role>` could attribute a new grant to a role other than
the one issuing it, as long as the issuing session could "act as" that role (membership, `INHERIT`,
or superuser). That is not how PostgreSQL's `GRANTED BY` clause works for table/column privileges:
the role named in `GRANTED BY` must **be** `current_user` — membership or superuser status does not
let a session attribute a grant to a *different* role via that clause. Revision 9's "attempt
`GRANTED BY`, fall back on any exception" therefore was not exercising a real best-effort mechanism;
it was masking the fact that the clause virtually never does what was intended, behind a bare
`EXCEPTION WHEN OTHERS` that could just as easily have swallowed an unrelated failure.

**The actual mechanism, and the policy this revision adopts (fail-closed, no fallback):** to issue a
grant that is genuinely attributed to role `X`, the session's `current_user` must actually be `X` —
achieved with `SET LOCAL ROLE X`, which itself requires the session's login role to hold real
membership in `X` (or be a superuser). §8's replay resolves every grantor's `rolname` from `pg_roles`
**before** any role switch happens — into an in-memory plan, not a live query — because `X` will not
have privilege to read `private.onboarding_migration_acl_baseline` once assumed (§8 explains the
executable defect this fixes). With the plan already in hand, the replay executes `SET LOCAL ROLE X`
for each grantor group and issues that group's grants as plain `GRANT` statements (no `GRANTED BY`
needed, since `current_user` already is the grantor). **If `SET LOCAL ROLE` fails for any captured
grantor — because the rollback-executing role cannot assume it — the exception propagates uncaught,
which (because §8 wraps the entire rollback in one explicit `BEGIN ... COMMIT` transaction, not a
sequence of independently auto-committing statements) aborts everything this rollback has done so
far, not just the replay step.** Nothing is partially replayed, no grantor identity is silently
substituted, and no earlier drop/revoke in the same rollback survives either. Grantor restoration is
part of the same unconditional guarantee as everything else — there is no "strict vs. core" split in
the equality query (§8): one query, run as an assertion that gates `COMMIT`, one guarantee.

**Preconditions this policy assumes, stated plainly:** the role executing this rollback must hold
genuine membership in (or superuser status over) every role that has ever been captured as a
grantor on `projects`'s `INSERT`/`UPDATE` ACL. In the ordinary case this is a single role — whichever
role Supabase's own bootstrap and this project's prior migrations used to grant `authenticated`
(commonly `postgres`, a superuser, which can `SET ROLE` to anything). If some other role was ever
the grantor and the rollback-executing session cannot assume it, rollback must not proceed
automatically — an operator resolves that (by running rollback as a role that can assume it, or by
first granting the rollback role membership in the missing grantor) before retrying, and this is a
correct, intended failure, not a defect to work around with a weaker fallback.

**Fail loudly if a captured role no longer exists.** Both replay and verification resolve
`grantor_oid`/`grantee_oid` against `pg_roles` by OID; if a previously captured non-PUBLIC role has
since been dropped, that lookup finds nothing, and the SQL explicitly raises an exception naming the
missing OID rather than silently skipping that row or producing a `null`-quoted, meaningless
identifier.

---

## 5. Durable reconciliation, immutable except through explicitly separate correction/repair paths

### Ordinary correction is blocked once onboarding is complete

Revision 5's `admin_correct_onboarding_reconciliation` could still rewrite the marker and the
record for an account whose `profiles.is_onboarded` had since become `true` — silently changing
what a completed, terminal `finalize_onboarding_project` call had already returned to that user.
This revision adds the same lock-and-check every other privileged writer performs, and refuses:

```sql
select is_onboarded into v_is_onboarded from public.profiles where id = p_profile_id for update;
...
if v_is_onboarded then
  raise exception
    'profile % has already completed onboarding — ordinary correction is not permitted; use admin_emergency_repair_onboarding_marker if repair is genuinely required',
    p_profile_id using errcode = '42501';
end if;
```

### A separate, explicitly named emergency path for the post-completion case

If a marker genuinely needs repair after `is_onboarded = true` (discovered corruption, a bug
elsewhere, whatever the reason), that is a different, higher-stakes operation and gets its own
function, its own audit requirements, and its own history `action` value:

### Fixed: derive the current marker from `projects` itself, not from the reconciliation table

Revision 6's version read `v_old.resolved_project_id` from `onboarding_reconciliation` to find "the
project currently marked" — wrong, because any account that completed onboarding entirely through
the normal `finalize_onboarding_project` RPC **never has a reconciliation row at all** (that table
is written only by the legacy-reconciliation and emergency-repair paths, never by the RPC). For
such an account, `v_old` would come back `NOT FOUND`, the function would conclude there is nothing
to unmark, and — if the account's real marked project differs from `p_new_project_id` — leave the
*actual* old marker sitting `true` forever, silently violating the one-marker-per-owner invariant
the very first time this function is used on the most common case (a normal completion needing
repair). This revision queries `projects.is_onboarding_project` directly, locks whatever row it
finds, and only afterward touches `onboarding_reconciliation` as a secondary, best-effort record:

```sql
create or replace function public.admin_emergency_repair_onboarding_marker(
  p_profile_id uuid,
  p_new_project_id uuid,
  p_reason text,
  p_confirm text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_onboarded boolean;
  v_current_marked_id uuid;
begin
  if p_confirm is distinct from 'I_UNDERSTAND_THIS_IS_POST_COMPLETION_REPAIR' then
    raise exception 'confirmation phrase mismatch — refusing emergency repair' using errcode = '42501';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'a non-empty reason is required for emergency repair' using errcode = '22023';
  end if;

  -- Lock the profile row first — the same serialization boundary every privileged writer uses.
  select is_onboarded into v_is_onboarded from public.profiles where id = p_profile_id for update;
  if not found then
    raise exception 'profile % not found', p_profile_id using errcode = 'P0002';
  end if;
  if not v_is_onboarded then
    raise exception
      'profile % has not completed onboarding — use admin_correct_onboarding_reconciliation instead',
      p_profile_id using errcode = '42501';
  end if;

  -- The actual current marker, queried directly from projects and locked — not derived from
  -- onboarding_reconciliation, which is empty for any account onboarded via the normal RPC.
  select id into v_current_marked_id
  from public.projects
  where owner_id = p_profile_id and is_onboarding_project
  for update;

  -- Validate the new target BEFORE mutating anything — a wrong-owner project must leave every
  -- piece of state (marker, current record, history) exactly as it was.
  if p_new_project_id is not null and not exists (
    select 1 from public.projects p where p.id = p_new_project_id and p.owner_id = p_profile_id
  ) then
    raise exception 'project % is not owned by profile %', p_new_project_id, p_profile_id using errcode = '42501';
  end if;

  -- Clear the real old marker (if any, and if different from the new target) and set the new one
  -- (if any, and if different from the old) — atomically, in this one function call. A→A is a
  -- true no-op on the marker (both conditions false); A→B clears A and sets B; A→none clears A;
  -- none→B sets B.
  if v_current_marked_id is not null and v_current_marked_id is distinct from p_new_project_id then
    update public.projects set is_onboarding_project = false where id = v_current_marked_id;
  end if;
  if p_new_project_id is not null and p_new_project_id is distinct from v_current_marked_id then
    update public.projects set is_onboarding_project = true where id = p_new_project_id;
  end if;

  insert into public.onboarding_reconciliation (profile_id, resolution, resolved_project_id, resolved_by, notes)
  values (
    p_profile_id,
    case when p_new_project_id is null then 'confirmed_not_onboarding' else 'confirmed_onboarding' end,
    p_new_project_id, auth.uid(), p_reason
  )
  on conflict (profile_id) do update
    set resolution = excluded.resolution,
        resolved_project_id = excluded.resolved_project_id,
        resolved_by = excluded.resolved_by,
        resolved_at = now(),
        notes = excluded.notes;

  insert into public.onboarding_reconciliation_history (profile_id, resolution, resolved_project_id, action, actor, notes)
  values (
    p_profile_id,
    case when p_new_project_id is null then 'confirmed_not_onboarding' else 'confirmed_onboarding' end,
    p_new_project_id, 'emergency_repair', auth.uid(), p_reason
  );
end;
$$;

revoke all on function public.admin_emergency_repair_onboarding_marker(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.admin_emergency_repair_onboarding_marker(uuid, uuid, text, text) to service_role;
```

This is the **only** function that may touch a completed account's marker, and it requires (a) a
literal confirmation phrase — a lightweight but real "type to confirm" guard against an accidental
call — and (b) a non-empty `p_reason`, both stronger requirements than either ordinary reconciliation
function has. `onboarding_reconciliation_history.action` gains a third value, `'emergency_repair'`
(§7), so this path is distinguishable from an ordinary correction in the permanent audit log, not
just by which function name happened to run.

**Audit identity, stated honestly (finding #4):** `resolved_by`/`actor` are populated from
`auth.uid()`, which is `null` under a typical `service_role` invocation with no user JWT present —
this is expected, not a bug, and this table does **not**, by itself, identify which human ran a
given reconciliation or repair. What the row records durably is *what was decided, for which
project, and when* (`resolution`, `resolved_project_id`, `resolved_at`) and *what reason was given*
(`notes`/`p_reason`). Identifying *who* ran it requires cross-referencing Supabase/Postgres's own
connection and query logs for the `service_role` session at that timestamp — this proposal does not
add a self-reported "operator name" argument, since a caller-supplied identity string would be
strictly less trustworthy than the database's own session logs and would invite treating it as
authoritative when it is not.

### Retry-note semantics: notes are part of idempotence, not silently discarded

Revision 5's "byte-for-byte identical" check compared `resolution` and `resolved_project_id` but
never `notes` — so a retry with different notes text was silently accepted as identical, and the
new notes were discarded (the original row was never touched). That is exactly the silent
discarding the instruction prohibits. This revision defines idempotence as **all three fields
matching** — `resolution`, `resolved_project_id`, and `notes` — and gives a distinguishing error
when only `notes` differs, directing the operator to the correction path rather than accepting a
partial match:

```sql
if found then
  if v_existing.resolution = p_resolution
     and v_existing.resolved_project_id is not distinct from p_project_id
     and v_existing.notes is not distinct from p_notes then
    return; -- fully identical retry — a true no-op, nothing discarded
  end if;
  if v_existing.resolution = p_resolution
     and v_existing.resolved_project_id is not distinct from p_project_id then
    raise exception
      'profile % already has a recorded resolution (%, project %) with different notes — a retry never updates notes; use admin_correct_onboarding_reconciliation to change the record',
      p_profile_id, v_existing.resolution, v_existing.resolved_project_id
      using errcode = '42501';
  end if;
  raise exception
    'profile % already has a recorded resolution (%, project %) — use admin_correct_onboarding_reconciliation to change it',
    p_profile_id, v_existing.resolution, v_existing.resolved_project_id
    using errcode = '42501';
end if;
```

---

## 5a. The RPC must refuse unresolved legacy accounts itself — the rollout gate is not a security boundary

### The gap

Every prior revision's protection against an unresolved legacy account calling the RPC was the
**external** `onboarding_unresolved_candidates` hard-abort gate (§9) — a check an *operator* runs
before flipping the client over. That is a rollout convenience, not an access control: nothing
stops an authenticated client from calling `finalize_onboarding_project` directly the moment the
migration grants `authenticated` `EXECUTE` on it — which the forward migration (§7) does
immediately, in the same transaction that creates the function. Between "migration applied" and
"operators finish reconciling every legacy account," an unresolved account's owner could call the
RPC directly and get a **second** project created for them — exactly the bug this whole proposal
exists to eliminate, reachable again through the very fix that closes it, for exactly the accounts
most at risk. Relying on deployment timing (as revision 11 implicitly did) is not a defense.

### The fix: a caller-scoped, fail-closed guard inside the function itself

After the function locks the caller's own profile row and passes the terminal (`is_onboarded =
true`) check, it now checks — for that same profile, under that same lock — whether it is a member
of `onboarding_unresolved_candidates`. If it is, the function raises a generic, stable error
(`errcode = '55000'`, a fixed message) and returns **before** reading or creating a marker,
inserting a project, or touching `is_onboarded` at all. See the full body in §7.

- **A `confirmed_onboarding` reconciliation** clears this: `onboarding_unresolved_candidates`
  requires "no row in `onboarding_reconciliation` for this profile," so once
  `admin_reconcile_onboarding`/`admin_correct_onboarding_reconciliation` records one, the guard no
  longer fires — and the existing marker-lookup immediately after it correctly finds and returns
  the reconciled project, exactly as an ordinary retry would.
- **A `confirmed_not_onboarding` reconciliation** also clears the guard (same reason — a
  reconciliation row now exists), and since no marker was ever set for that verdict, the account
  proceeds through the completely ordinary Include/Skip path.
- **A genuinely new profile** (no candidate project at all) was never a member of
  `onboarding_unresolved_candidates` in the first place — unaffected, no behavior change.

### Why the two writers of `is_onboarded`/`onboarding_reconciliation` can't race the guard

The guard reads three facts, via `onboarding_unresolved_candidates`: `profiles.is_onboarded`, the
existence of a row in `onboarding_reconciliation` for this `profile_id`, and the existence of a
`projects` row for this owner with `slug is null`. Every function that can write either of the
first two — `finalize_onboarding_project` itself, `admin_reconcile_onboarding`,
`admin_correct_onboarding_reconciliation`, and `admin_emergency_repair_onboarding_marker` — already
locks this exact profile row (`for update`) before writing, per their existing bodies (§5, §7). Two
such callers can never disagree about either fact mid-decision.

**Revision 12 claimed the third fact needed no locking. That claim is withdrawn — it was wrong.**
Revision 12 asserted that ordinary project inserts producing a null-slug row (`createDraftProject`,
the direct dashboard insert) were "orthogonal" to the guard because they touch neither `profiles`
nor `onboarding_reconciliation`. That reasoning addressed the wrong direction of the race. The
guard's actual failure mode is: it checks "does a null-slug project already exist for this owner,"
finds none, and proceeds — and an ordinary insert that commits a **new** null-slug row for that same
owner, concurrently, after the guard's check but before `finalize_onboarding_project`'s own
transaction ends, makes that check stale. `createDraftProject` takes no profile-row lock at all, so
nothing stops it from doing exactly this. §5b closes this with a database-enforced serialization
boundary that every null-slug-producing insert — including this proposal's own RPC insert — now
participates in.

---

## 5b. Ordinary project inserts must serialize on the same profile lock

### Every insert that can produce a `slug is null` row, re-audited

| Site | Produces `slug is null`? | Locks the owner's profile row today? |
|---|---|---|
| `GlyphOnboardingFlow.tsx:180` (current onboarding insert, to be retired once the client is wired to this RPC) | Always | No |
| `ProjectForm.tsx:250` (dashboard Save, no prior media upload) | Never — `slug` is a required form field | N/A |
| `app/actions/projects.ts:22` (`createDraftProject`, fired from media-upload before Save) | Always | **No — this is the gap** |
| `finalize_onboarding_project`'s own insert (§7) | Always (by design) | Yes — inside the function's own already-held lock |

`ProjectForm.tsx`'s direct insert always carries a non-empty `slug` (§1) and is unaffected by
anything in this section. `createDraftProject` and the (soon-to-be-retired) onboarding insert are
the two production paths that can create a new `onboarding_unresolved_candidates` member without
ever taking the profile-row lock this guard depends on.

### Revision 13's single combined trigger is withdrawn: `UPDATE` triggers lock in the wrong order

Revision 13 used one trigger, `before insert or update of slug`, that locked the owner's profile row
whenever the resulting `slug` was `null` — for both `INSERT` and `UPDATE`. That is wrong for
`UPDATE`, and the error is a real Postgres mechanic, not a style preference: for `UPDATE public.
projects SET slug = ...`, Postgres identifies and **locks the target project row as part of
executing the `UPDATE`**, before it ever fires that row's `BEFORE UPDATE` trigger. A trigger that
then tries to lock the profile row is therefore acquiring locks in the order **project row → profile
row** — the exact opposite of `finalize_onboarding_project` and every operator function, which all
lock **profile row → project row**. Two transactions taking locks in opposite orders on the same two
resources is the textbook precondition for a deadlock. Revision 13's claim that "nothing ever holds
a project-row lock while waiting on a profile-row lock" was true for `INSERT` and false for
`UPDATE`, and the proposal did not distinguish the two. `INSERT` has no such problem — a newly
inserted row has no pre-existing lock for the executor to take before the trigger runs, so a
`BEFORE INSERT` trigger locking the profile row first is still profile-then-project, consistently.

### The fix: two separate triggers, each doing only what its lock order can safely do

**`BEFORE INSERT`** keeps the exact serialization from revision 13, scoped to `INSERT` only — this
is the only place the profile lock may still be taken from a row-level project trigger:

```sql
create or replace function public.serialize_null_slug_project_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Only an insert that results in slug is null needs to participate in this serialization — see
  -- §5a/§5b for why. A real slug returns immediately, no lock taken.
  if new.slug is not null then
    return new;
  end if;

  -- Safe order: INSERT has no pre-existing project row for the executor to lock before this
  -- trigger runs, so locking the profile row here is still profile-then-project, consistently
  -- with finalize_onboarding_project and every operator function. If no profile row exists yet
  -- for this owner (e.g. a signup race), there is nothing to serialize against — proceed without
  -- locking; this is the explicit, safe handling for a missing profile row, not an error.
  perform 1 from public.profiles where id = new.owner_id for update;

  return new;
end;
$$;

revoke all on function public.serialize_null_slug_project_insert() from public, anon, authenticated;

create trigger serialize_null_slug_project_on_insert
  before insert on public.projects
  for each row
  execute function public.serialize_null_slug_project_insert();
```

**`BEFORE UPDATE OF slug` never locks anything.** The only `UPDATE` transition that could grow
`onboarding_unresolved_candidates` is `slug` going from non-null to null — and auditing every real
call site that can reach this trigger (§5c) finds **no legitimate product workflow that does this**:
`ProjectForm.tsx`'s edit-mode update always carries a non-empty `slug` (it is a required form
field), `persistMedia` never includes `slug` in its `SET` list at all (so this trigger, scoped `OF
slug`, does not even fire for it), and archive/restore/publish only ever touch `lifecycle`. With no
legitimate consumer, this revision rejects the transition outright, at the database boundary, with a
deterministic error — never by acquiring a lock after the project row is already locked:

```sql
create or replace function public.reject_slug_removal_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.slug is not null and new.slug is null then
    raise exception 'clearing a project slug back to null is not supported' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.reject_slug_removal_update() from public, anon, authenticated;

create trigger reject_slug_removal_on_update
  before update of slug on public.projects
  for each row
  execute function public.reject_slug_removal_update();
```

This function takes **no lock of any kind** — it only ever reads `old`/`new` (already in memory, no
query) and either returns or raises. There is no statement inside it that could acquire a lock in
any order, so it cannot participate in a deadlock regardless of what else is happening concurrently.
Every other transition — `null → non-null` (publishing/finishing setup), `non-null → different
non-null` (an ordinary slug edit), and `null → null` (any update that doesn't touch `slug`, or
explicitly sets it to the same `null` it already was) — returns immediately, unaffected. If a
genuine product need for `non-null → null` ever arises, the correct design is a dedicated RPC that
locks the profile first and performs the project update second (the same pattern
`finalize_onboarding_project` and the operator functions already use) — **not** a row-level `UPDATE`
trigger reaching backward for a lock the executor already ordered against it. This revision does not
implement that RPC, since no current workflow needs it.

### §5c. Every way candidate membership can change — audited

| Transition | Adds/removes `onboarding_unresolved_candidates` membership? | Who can invoke it | Lock order |
|---|---|---|---|
| `INSERT` with `slug is null` | **Adds** | `authenticated` (`createDraftProject`, current onboarding insert); `finalize_onboarding_project` itself | profile → project (`serialize_null_slug_project_on_insert`) |
| `INSERT` with a real `slug` | No effect | `authenticated` (`ProjectForm.tsx` save) | none (trigger returns immediately) |
| `UPDATE` `null → non-null` | **Removes** (safe direction — never creates a stale "no candidate" decision) | `authenticated` (finishing setup on a draft) | none needed; `reject_slug_removal_on_update` does not fire this branch (only checks the opposite direction) |
| `UPDATE` `non-null → non-null` | No effect | `authenticated` (`ProjectForm.tsx` edit) | none |
| `UPDATE` `non-null → null` | Would add, if permitted | **No path — rejected at the database boundary** (`reject_slug_removal_on_update`, `errcode 23514`) | N/A — raises before any lock |
| `UPDATE` `null → null` (e.g. `persistMedia`, or any update that never lists `slug`) | No effect | `authenticated` | none — the trigger is scoped `OF slug`, so it does not even fire unless `slug` is in the `SET` list; if it is and both values are `null`, the reject condition (`old is not null and new is null`) is false, so it passes through |
| Owner reassignment (`UPDATE ... SET owner_id = ...`) | Would affect two profiles' membership simultaneously | **Not possible today** — `owner_id` is deliberately absent from the `authenticated` column-level `UPDATE` grant (§3/§7); this is enforced at the grant layer, independent of RLS, and predates this revision | N/A |
| Project deletion | **Removes** (safe direction, same reasoning as `null → non-null`) | `authenticated` (`deleteProject`, own row via RLS) | none needed |
| `profiles.is_onboarded` changes | Removes (once `true`) / is a precondition, not itself membership | `finalize_onboarding_project`, `admin_reconcile_onboarding`, `admin_correct_onboarding_reconciliation`, `admin_emergency_repair_onboarding_marker` — all already lock the profile row first (§5, §7) | profile → (profile only, or profile → project) |
| `onboarding_reconciliation` row created/corrected | Removes (a row's mere existence is what the view checks) | `admin_reconcile_onboarding` (create), `admin_correct_onboarding_reconciliation` (change) — both lock the profile row first | profile → (reconciliation row, and project if `confirmed_onboarding`) |
| `onboarding_reconciliation` row deleted | Would re-add membership, if it happened | **No path exists** — no function in this design ever deletes a row from this table directly; the only removal is the `on delete cascade` from a `profiles` row being deleted entirely (out of scope: account deletion is not covered by this proposal and would need its own audit if implemented) | N/A |

"Who can invoke it" is checked against the actual grants `authenticated` holds (§3/§7's explicit
column-level `INSERT`/`UPDATE` lists), not against what the current UI happens to expose — owner
reassignment, for example, is impossible for `authenticated` regardless of what any client code
does or doesn't send, because the column privilege for `owner_id` on `UPDATE` was never granted.

### Ordering, both directions, and why no deadlock is possible

Every path that can **add** a candidate now either locks the profile row first and only then
touches a project row (`serialize_null_slug_project_on_insert`, `finalize_onboarding_project`, the
three operator functions), or takes no lock at all (`reject_slug_removal_on_update`, which only
rejects). No path takes a project-row lock and then reaches for the profile lock — the specific
defect this revision removes. Two transactions each waiting on a lock the other already holds — the
precondition for a deadlock — cannot arise, because nothing on the "adds a candidate" side ever
holds a project-row lock while waiting on a profile-row lock, and nothing on the `UPDATE` side ever
waits on the profile lock at all.

- **Ordinary insert first:** `serialize_null_slug_project_on_insert` acquires the profile lock, the
  insert commits (releasing it). A `finalize_onboarding_project` call for the same owner that
  started waiting on that lock then proceeds, sees the now-committed candidate, and raises `55000`.
- **RPC first:** `finalize_onboarding_project` holds the profile lock for its entire duration. A
  concurrent ordinary insert's trigger blocks waiting for that same lock, then proceeds against the
  now-committed, onboarded state once the RPC commits.
- **An authenticated slug-transition update racing an operator function on the same project:** the
  update never touches the profile lock, so it can only ever contend with the operator function for
  the *project* row itself (an ordinary, single-resource row lock, not a two-resource cycle) — see
  §11's genuine deadlock-order regression test for the executed proof.

### The rollout gate's role is now explicitly demoted, not removed

`onboarding_unresolved_candidates` and its hard-abort check (§9) remain valuable — they tell
operators exactly which accounts to reconcile, and give a clean signal for "is legacy cleanup
done" — but they are no longer what keeps a legacy account safe from duplication. That is now the
in-function guard (§5a) plus the insert-side trigger (§5b) together, active as soon as the migration
commits — `authenticated` never has `EXECUTE` on a version of `finalize_onboarding_project` that
lacks the guard, and no null-slug-producing path exists that these two triggers do not also cover.

---

## 6. Durable reconciliation schema (unchanged shape from revision 5, `history.action` extended)

```sql
create table if not exists public.onboarding_reconciliation (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  resolution text not null check (resolution in ('confirmed_onboarding', 'confirmed_not_onboarding')),
  resolved_project_id uuid references public.projects(id) on delete cascade,
  resolved_by uuid,
  resolved_at timestamptz not null default now(),
  notes text,
  constraint onboarding_reconciliation_project_matches_resolution check (
    (resolution = 'confirmed_onboarding' and resolved_project_id is not null)
    or (resolution = 'confirmed_not_onboarding' and resolved_project_id is null)
  )
);

create table if not exists public.onboarding_reconciliation_history (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  resolution text not null check (resolution in ('confirmed_onboarding', 'confirmed_not_onboarding')),
  resolved_project_id uuid, -- no FK: history survives the referenced project's later deletion
  action text not null check (action in ('created', 'corrected', 'emergency_repair')),
  actor uuid,
  notes text,
  recorded_at timestamptz not null default now()
);
```

`resolved_project_id ... on delete cascade` on the current-record table (unchanged from revision 5,
approved): deleting a reconciled project deletes its current-record row (safe — nothing left to
duplicate; the candidate views require an existing null-slug project), while the history row
(no FK) survives permanently. The enumeration/gate views (`onboarding_unresolved_candidates`,
`onboarding_unresolved_candidate_detail`) are unchanged from revision 5.

---

## 7. Complete forward SQL, in executable order

### Step 1 — Bootstrap (separate transaction, runs first on any database — see §4)

```sql
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table if not exists private.onboarding_migration_acl_capture (
  migration_id text primary key,
  captured_at timestamptz not null default now()
);

create table if not exists private.onboarding_migration_acl_baseline (
  id bigint generated always as identity primary key,
  migration_id text not null references private.onboarding_migration_acl_capture(migration_id),
  grantor_oid oid not null,
  grantee_oid oid not null, -- 0 = PUBLIC (aclexplode's own convention for the PUBLIC grantee)
  object_name text not null,
  column_name text,
  privilege_type text not null,
  is_grantable boolean not null default false
);

alter table private.onboarding_migration_acl_capture enable row level security;
alter table private.onboarding_migration_acl_baseline enable row level security;
revoke all on private.onboarding_migration_acl_capture from public, anon, authenticated;
revoke all on private.onboarding_migration_acl_baseline from public, anon, authenticated;
grant select on private.onboarding_migration_acl_capture to service_role;
grant select on private.onboarding_migration_acl_baseline to service_role;

-- Confirm before proceeding to Step 2.
select to_regclass('private.onboarding_migration_acl_baseline');
```

### Step 2 — Capture (separate transaction, runs only after Step 1 has committed — see §4)

```sql
insert into private.onboarding_migration_acl_capture (migration_id) values ('onboarding_project_idempotency_v1');

-- Catalog-native, non-expanded, OID-preserving extraction — see §4 for why information_schema
-- (role_* views omit PUBLIC; table_privileges/column_privileges expand table-level grants into
-- synthetic per-column rows) is not used, and why grantor/grantee are stored as raw OIDs rather
-- than a ::regrole::text cast (which is display-quoted and unsafe to re-quote with %I).
insert into private.onboarding_migration_acl_baseline
  (migration_id, grantor_oid, grantee_oid, object_name, column_name, privilege_type, is_grantable)
select
  'onboarding_project_idempotency_v1',
  x.grantor,
  x.grantee,
  c.relname,
  null,
  x.privilege_type,
  x.is_grantable
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) as x
where n.nspname = 'public' and c.relname = 'projects'
  and x.privilege_type in ('INSERT', 'UPDATE');

insert into private.onboarding_migration_acl_baseline
  (migration_id, grantor_oid, grantee_oid, object_name, column_name, privilege_type, is_grantable)
select
  'onboarding_project_idempotency_v1',
  x.grantor,
  x.grantee,
  c.relname,
  a.attname,
  x.privilege_type,
  x.is_grantable
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
cross join lateral aclexplode(a.attacl) as x
where n.nspname = 'public' and c.relname = 'projects'
  and a.attacl is not null
  and x.privilege_type in ('INSERT', 'UPDATE');

select count(*) from private.onboarding_migration_acl_baseline
where migration_id = 'onboarding_project_idempotency_v1';
-- Confirm this returns > 0 and the transaction has committed before proceeding.
```

### Step 3 — Guard (separate statement — see §4)

Effective-access check, intentionally on the expanded `table_privileges`/`column_privileges`
source — see "Guard vs. Capture" in §4. Unchanged from revision 8.

```sql
do $$
declare
  v_unexpected_grantees integer;
  v_unexpected_membership integer;
begin
  select count(*) into v_unexpected_grantees
  from (
    select grantee, privilege_type from information_schema.table_privileges
    where table_schema = 'public' and table_name = 'projects' and privilege_type in ('INSERT', 'UPDATE')
    union all
    select grantee, privilege_type from information_schema.column_privileges
    where table_schema = 'public' and table_name = 'projects' and privilege_type in ('INSERT', 'UPDATE')
  ) g
  where g.grantee not in ('authenticated', 'postgres', 'supabase_admin')
    and g.grantee not like 'pg\_%';
  -- 'PUBLIC' is deliberately not allowed — a PUBLIC-level grant aborts here.
  if v_unexpected_grantees > 0 then
    raise exception 'unexpected INSERT/UPDATE grantee(s) (possibly PUBLIC) on public.projects — abort, inspect private.onboarding_migration_acl_baseline';
  end if;

  select count(*) into v_unexpected_membership
  from pg_auth_members am
  join pg_roles m on m.oid = am.member
  join pg_roles r on r.oid = am.roleid
  where m.rolname in ('anon', 'authenticated')
    and r.rolname not in ('authenticated', 'anon');
  if v_unexpected_membership > 0 then
    raise exception 'anon/authenticated inherits membership in an unexpected role — abort and investigate';
  end if;
end $$;
```

### Step 4 — Migration (its own transaction, runs only after the guard above passes)

```sql
-- ============================================================================
-- 1. Private schema + baseline tables — idempotent no-op here (Step 1/Bootstrap already created
--    these on any database this proposal's own procedure was followed on); kept as a defensive
--    IF NOT EXISTS guard only, not as where this normally happens for the first time.
-- ============================================================================

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table if not exists private.onboarding_migration_acl_capture (
  migration_id text primary key,
  captured_at timestamptz not null default now()
);

create table if not exists private.onboarding_migration_acl_baseline (
  id bigint generated always as identity primary key,
  migration_id text not null references private.onboarding_migration_acl_capture(migration_id),
  grantor_oid oid not null,
  grantee_oid oid not null, -- 0 = PUBLIC (aclexplode's own convention for the PUBLIC grantee)
  object_name text not null,
  column_name text,
  privilege_type text not null,
  is_grantable boolean not null default false
);

alter table private.onboarding_migration_acl_capture enable row level security;
alter table private.onboarding_migration_acl_baseline enable row level security;
revoke all on private.onboarding_migration_acl_capture from public, anon, authenticated;
revoke all on private.onboarding_migration_acl_baseline from public, anon, authenticated;
grant select on private.onboarding_migration_acl_capture to service_role;
grant select on private.onboarding_migration_acl_baseline to service_role;

-- ============================================================================
-- 2. Schema addition
-- ============================================================================

alter table public.projects
  add column if not exists is_onboarding_project boolean not null default false;

create unique index if not exists projects_one_onboarding_marker_per_owner
  on public.projects (owner_id)
  where is_onboarding_project;

-- ============================================================================
-- 2a. Null-slug INSERT serialization (§5b) — profile-then-project order, safe only for INSERT.
-- ============================================================================

create or replace function public.serialize_null_slug_project_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.slug is not null then
    return new;
  end if;

  perform 1 from public.profiles where id = new.owner_id for update;

  return new;
end;
$$;

revoke all on function public.serialize_null_slug_project_insert() from public, anon, authenticated;

drop trigger if exists serialize_null_slug_project_on_insert on public.projects;
create trigger serialize_null_slug_project_on_insert
  before insert on public.projects
  for each row
  execute function public.serialize_null_slug_project_insert();

-- ============================================================================
-- 2b. Reject non-null -> null slug UPDATE at the database boundary (§5b) — no lock of any kind,
--     since the executor already locked the project row before this trigger runs, and no legitimate
--     workflow needs this transition (§5c).
-- ============================================================================

create or replace function public.reject_slug_removal_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.slug is not null and new.slug is null then
    raise exception 'clearing a project slug back to null is not supported' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.reject_slug_removal_update() from public, anon, authenticated;

drop trigger if exists reject_slug_removal_on_update on public.projects;
create trigger reject_slug_removal_on_update
  before update of slug on public.projects
  for each row
  execute function public.reject_slug_removal_update();

-- ============================================================================
-- 3. Privilege boundary
-- ============================================================================

revoke insert, update on public.projects from authenticated;

grant insert (
  owner_id, title, short_description, long_description, tags, engine, genre, stage,
  visibility, lifecycle, cover_url, screenshots, external_links, slug, is_primary
) on public.projects to authenticated;

grant update (
  title, short_description, long_description, tags, engine, genre, stage,
  visibility, lifecycle, cover_url, screenshots, external_links, slug
) on public.projects to authenticated;

-- ============================================================================
-- 4. Durable reconciliation record + history
-- ============================================================================

create table if not exists public.onboarding_reconciliation (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  resolution text not null check (resolution in ('confirmed_onboarding', 'confirmed_not_onboarding')),
  resolved_project_id uuid references public.projects(id) on delete cascade,
  resolved_by uuid,
  resolved_at timestamptz not null default now(),
  notes text,
  constraint onboarding_reconciliation_project_matches_resolution check (
    (resolution = 'confirmed_onboarding' and resolved_project_id is not null)
    or (resolution = 'confirmed_not_onboarding' and resolved_project_id is null)
  )
);
alter table public.onboarding_reconciliation enable row level security;
revoke all on public.onboarding_reconciliation from public, anon, authenticated;
grant select on public.onboarding_reconciliation to service_role;

create table if not exists public.onboarding_reconciliation_history (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  resolution text not null check (resolution in ('confirmed_onboarding', 'confirmed_not_onboarding')),
  resolved_project_id uuid,
  action text not null check (action in ('created', 'corrected', 'emergency_repair')),
  actor uuid,
  notes text,
  recorded_at timestamptz not null default now()
);
alter table public.onboarding_reconciliation_history enable row level security;
revoke all on public.onboarding_reconciliation_history from public, anon, authenticated;
grant select on public.onboarding_reconciliation_history to service_role;

-- ============================================================================
-- 5. Enumeration/gate views — one predicate, two consumers
-- ============================================================================

create or replace view public.onboarding_unresolved_candidates as
select distinct pr.id as profile_id
from public.profiles pr
join public.projects p on p.owner_id = pr.id and p.slug is null
where pr.is_onboarded = false
  and not exists (
    select 1 from public.onboarding_reconciliation r where r.profile_id = pr.id
  );

create or replace view public.onboarding_unresolved_candidate_detail as
select pr.id as profile_id, p.id as candidate_project_id, p.title, p.created_at
from public.profiles pr
join public.projects p on p.owner_id = pr.id and p.slug is null
where pr.id in (select profile_id from public.onboarding_unresolved_candidates)
order by pr.id, p.created_at;

revoke all on public.onboarding_unresolved_candidates from public, anon, authenticated;
revoke all on public.onboarding_unresolved_candidate_detail from public, anon, authenticated;
grant select on public.onboarding_unresolved_candidates to service_role;
grant select on public.onboarding_unresolved_candidate_detail to service_role;

-- ============================================================================
-- 6. Operator functions
-- ============================================================================

create or replace function public.admin_reconcile_onboarding(
  p_profile_id uuid,
  p_resolution text,
  p_project_id uuid default null,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_onboarded boolean;
  v_existing record;
begin
  if p_resolution not in ('confirmed_onboarding', 'confirmed_not_onboarding') then
    raise exception 'invalid resolution: %', p_resolution using errcode = '22023';
  end if;

  select is_onboarded into v_is_onboarded from public.profiles where id = p_profile_id for update;
  if not found then
    raise exception 'profile % not found', p_profile_id using errcode = 'P0002';
  end if;
  if v_is_onboarded then
    raise exception 'profile % has already completed onboarding — reconciliation does not apply', p_profile_id using errcode = '42501';
  end if;

  select * into v_existing from public.onboarding_reconciliation where profile_id = p_profile_id;

  if found then
    if v_existing.resolution = p_resolution
       and v_existing.resolved_project_id is not distinct from p_project_id
       and v_existing.notes is not distinct from p_notes then
      return;
    end if;
    if v_existing.resolution = p_resolution
       and v_existing.resolved_project_id is not distinct from p_project_id then
      raise exception
        'profile % already has a recorded resolution (%, project %) with different notes — a retry never updates notes; use admin_correct_onboarding_reconciliation',
        p_profile_id, v_existing.resolution, v_existing.resolved_project_id using errcode = '42501';
    end if;
    raise exception
      'profile % already has a recorded resolution (%, project %) — use admin_correct_onboarding_reconciliation to change it',
      p_profile_id, v_existing.resolution, v_existing.resolved_project_id using errcode = '42501';
  end if;

  if p_resolution = 'confirmed_onboarding' then
    if p_project_id is null then
      raise exception 'confirmed_onboarding requires p_project_id' using errcode = '22023';
    end if;
    if not exists (
      select 1 from public.projects p where p.id = p_project_id and p.owner_id = p_profile_id
    ) then
      raise exception 'project % is not owned by profile %', p_project_id, p_profile_id using errcode = '42501';
    end if;
    update public.projects set is_onboarding_project = true where id = p_project_id;
  elsif p_project_id is not null then
    raise exception 'confirmed_not_onboarding must not supply p_project_id' using errcode = '22023';
  end if;

  insert into public.onboarding_reconciliation (profile_id, resolution, resolved_project_id, resolved_by, notes)
  values (p_profile_id, p_resolution, p_project_id, auth.uid(), p_notes);

  insert into public.onboarding_reconciliation_history (profile_id, resolution, resolved_project_id, action, actor, notes)
  values (p_profile_id, p_resolution, p_project_id, 'created', auth.uid(), p_notes);
end;
$$;

revoke all on function public.admin_reconcile_onboarding(uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function public.admin_reconcile_onboarding(uuid, text, uuid, text) to service_role;

create or replace function public.admin_correct_onboarding_reconciliation(
  p_profile_id uuid,
  p_new_resolution text,
  p_new_project_id uuid default null,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old record;
  v_is_onboarded boolean;
begin
  if p_new_resolution not in ('confirmed_onboarding', 'confirmed_not_onboarding') then
    raise exception 'invalid resolution: %', p_new_resolution using errcode = '22023';
  end if;
  if p_new_resolution = 'confirmed_onboarding' and p_new_project_id is null then
    raise exception 'confirmed_onboarding requires p_new_project_id' using errcode = '22023';
  end if;
  if p_new_resolution = 'confirmed_not_onboarding' and p_new_project_id is not null then
    raise exception 'confirmed_not_onboarding must not supply p_new_project_id' using errcode = '22023';
  end if;

  select is_onboarded into v_is_onboarded from public.profiles where id = p_profile_id for update;
  if not found then
    raise exception 'profile % not found', p_profile_id using errcode = 'P0002';
  end if;
  if v_is_onboarded then
    raise exception
      'profile % has already completed onboarding — ordinary correction is not permitted; use admin_emergency_repair_onboarding_marker if repair is genuinely required',
      p_profile_id using errcode = '42501';
  end if;

  select * into v_old from public.onboarding_reconciliation where profile_id = p_profile_id for update;
  if not found then
    raise exception 'profile % has no existing resolution to correct — use admin_reconcile_onboarding', p_profile_id using errcode = 'P0002';
  end if;

  if p_new_project_id is not null and not exists (
    select 1 from public.projects p where p.id = p_new_project_id and p.owner_id = p_profile_id
  ) then
    raise exception 'project % is not owned by profile %', p_new_project_id, p_profile_id using errcode = '42501';
  end if;

  if v_old.resolved_project_id is not null then
    update public.projects set is_onboarding_project = false where id = v_old.resolved_project_id;
  end if;
  if p_new_resolution = 'confirmed_onboarding' then
    update public.projects set is_onboarding_project = true where id = p_new_project_id;
  end if;

  update public.onboarding_reconciliation
  set resolution = p_new_resolution,
      resolved_project_id = p_new_project_id,
      resolved_by = auth.uid(),
      resolved_at = now(),
      notes = p_reason
  where profile_id = p_profile_id;

  insert into public.onboarding_reconciliation_history (profile_id, resolution, resolved_project_id, action, actor, notes)
  values (p_profile_id, p_new_resolution, p_new_project_id, 'corrected', auth.uid(), p_reason);
end;
$$;

revoke all on function public.admin_correct_onboarding_reconciliation(uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function public.admin_correct_onboarding_reconciliation(uuid, text, uuid, text) to service_role;

create or replace function public.admin_emergency_repair_onboarding_marker(
  p_profile_id uuid,
  p_new_project_id uuid,
  p_reason text,
  p_confirm text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_onboarded boolean;
  v_current_marked_id uuid;
begin
  if p_confirm is distinct from 'I_UNDERSTAND_THIS_IS_POST_COMPLETION_REPAIR' then
    raise exception 'confirmation phrase mismatch — refusing emergency repair' using errcode = '42501';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'a non-empty reason is required for emergency repair' using errcode = '22023';
  end if;

  select is_onboarded into v_is_onboarded from public.profiles where id = p_profile_id for update;
  if not found then
    raise exception 'profile % not found', p_profile_id using errcode = 'P0002';
  end if;
  if not v_is_onboarded then
    raise exception
      'profile % has not completed onboarding — use admin_correct_onboarding_reconciliation instead',
      p_profile_id using errcode = '42501';
  end if;

  select id into v_current_marked_id
  from public.projects
  where owner_id = p_profile_id and is_onboarding_project
  for update;

  if p_new_project_id is not null and not exists (
    select 1 from public.projects p where p.id = p_new_project_id and p.owner_id = p_profile_id
  ) then
    raise exception 'project % is not owned by profile %', p_new_project_id, p_profile_id using errcode = '42501';
  end if;

  if v_current_marked_id is not null and v_current_marked_id is distinct from p_new_project_id then
    update public.projects set is_onboarding_project = false where id = v_current_marked_id;
  end if;
  if p_new_project_id is not null and p_new_project_id is distinct from v_current_marked_id then
    update public.projects set is_onboarding_project = true where id = p_new_project_id;
  end if;

  insert into public.onboarding_reconciliation (profile_id, resolution, resolved_project_id, resolved_by, notes)
  values (
    p_profile_id,
    case when p_new_project_id is null then 'confirmed_not_onboarding' else 'confirmed_onboarding' end,
    p_new_project_id, auth.uid(), p_reason
  )
  on conflict (profile_id) do update
    set resolution = excluded.resolution,
        resolved_project_id = excluded.resolved_project_id,
        resolved_by = excluded.resolved_by,
        resolved_at = now(),
        notes = excluded.notes;

  insert into public.onboarding_reconciliation_history (profile_id, resolution, resolved_project_id, action, actor, notes)
  values (
    p_profile_id,
    case when p_new_project_id is null then 'confirmed_not_onboarding' else 'confirmed_onboarding' end,
    p_new_project_id, 'emergency_repair', auth.uid(), p_reason
  );
end;
$$;

revoke all on function public.admin_emergency_repair_onboarding_marker(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.admin_emergency_repair_onboarding_marker(uuid, uuid, text, text) to service_role;

-- ============================================================================
-- 7. User-facing RPC
-- ============================================================================

create or replace function public.finalize_onboarding_project(
  p_title text,
  p_short_description text,
  p_stage text
)
returns table (project_id uuid, onboarded boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_is_onboarded boolean;
  v_existing_id uuid;
  v_new_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select p.is_onboarded into v_is_onboarded
  from public.profiles p
  where p.id = v_uid
  for update;

  if not found then
    raise exception 'profile row not found for authenticated user' using errcode = 'P0002';
  end if;

  if v_is_onboarded then
    select id into v_existing_id
    from public.projects
    where owner_id = v_uid and is_onboarding_project
    limit 1;
    return query select v_existing_id, true;
    return;
  end if;

  -- Caller-scoped reconciliation guard (fail-closed) — see §5a. This is the RPC's own security
  -- boundary for an unresolved legacy account, not the external rollout gate (§9): before this
  -- account's own row lock, held above, is ever released, refuse to read or create a marker,
  -- insert a project, or flip is_onboarded, if this specific profile still has an unresolved
  -- legacy candidate. A generic, stable error is raised — never the candidate's existence, count,
  -- or any project detail.
  if exists (
    select 1 from public.onboarding_unresolved_candidates u where u.profile_id = v_uid
  ) then
    raise exception 'onboarding cannot be finalized automatically for this account yet — please try again shortly or contact support'
      using errcode = '55000';
  end if;

  select id into v_existing_id
  from public.projects
  where owner_id = v_uid and is_onboarding_project
  limit 1;

  if v_existing_id is not null then
    v_new_id := v_existing_id;
  elsif p_title is not null and btrim(p_title) <> '' then
    insert into public.projects (
      owner_id, title, short_description, stage, is_primary, lifecycle, is_onboarding_project
    )
    values (
      v_uid,
      btrim(p_title),
      nullif(btrim(coalesce(p_short_description, '')), ''),
      nullif(btrim(coalesce(p_stage, '')), ''),
      true,
      'draft',
      true
    )
    returning id into v_new_id;
  end if;

  update public.profiles set is_onboarded = true where id = v_uid;

  return query select v_new_id, true;
end;
$$;

revoke all on function public.finalize_onboarding_project(text, text, text) from public, anon, authenticated;
grant execute on function public.finalize_onboarding_project(text, text, text) to authenticated;

-- ============================================================================
-- 8. Verification
-- ============================================================================

select proname, prosecdef
from pg_proc
where proname in (
  'finalize_onboarding_project', 'admin_reconcile_onboarding',
  'admin_correct_onboarding_reconciliation', 'admin_emergency_repair_onboarding_marker'
);
-- prosecdef must be true for all four.

select count(*) from public.projects where is_onboarding_project;
-- Expected: 0, immediately after this migration, before any reconciliation.

select has_table_privilege('authenticated', 'public.projects', 'INSERT') as table_insert,
       has_table_privilege('authenticated', 'public.projects', 'UPDATE') as table_update;
-- Both false.

select has_column_privilege('authenticated', 'public.projects', 'is_onboarding_project', 'INSERT') as marker_insert,
       has_column_privilege('authenticated', 'public.projects', 'is_onboarding_project', 'UPDATE') as marker_update;
-- Both false.

select column_name,
       has_column_privilege('authenticated', 'public.projects', column_name, 'INSERT') as can_insert,
       has_column_privilege('authenticated', 'public.projects', column_name, 'UPDATE') as can_update
from unnest(array[
  'owner_id','title','short_description','long_description','tags','engine','genre','stage',
  'visibility','lifecycle','cover_url','screenshots','external_links','slug','is_primary'
]) as column_name
order by column_name;
-- can_insert true for all 15; can_update true for all except owner_id and is_primary.
```

---

## 8. Rollback — exact, complete, no leftover grants

### Two executable defects in revision 10, and why they mattered

**Defect A — reading `private.*` after `SET LOCAL ROLE`.** Revision 10's replay switched to each
grantor via `SET LOCAL ROLE`, then queried `private.onboarding_migration_acl_baseline` *for that
grantor's rows* from inside the loop. Original grantors intentionally have no privilege on `private`
(it is revoked from everyone but `service_role`) — so that query fails the instant the role switches,
before a single grant is replayed. This was never exercised end-to-end in the prior revisions.

**Defect B — no real transaction.** Revision 10 presented "drop objects → revoke → replay" as
consecutive statements with no `BEGIN`/`COMMIT` wrapping. Run through `psql` in ordinary autocommit
mode, each top-level statement commits on its own — so a failure partway through the replay (a
missing grantor, say) would leave the drops and revokes already committed, with the ACL replay only
partially done. That directly contradicts "the whole transaction is unchanged on failure."

### The fix: preload a permission-independent plan, then one real transaction

The complete baseline is read, validated, and turned into an in-memory `jsonb` plan **once**, at the
very start, while still running as the privileged rollback role. Every grantor and non-PUBLIC
grantee OID is resolved to a `pg_roles.rolname` at that same moment. Nothing after that point ever
queries `private.*` again — the replay loop below iterates the already-materialized `v_plan` value
only, so it has nothing to fail to read once a grantor role is active. The whole script — preflight,
drops, revokes, replay, role restoration, and a final equality **assertion** that raises rather than
returning a result set an operator could overlook — is one literal `BEGIN ... COMMIT` transaction:

```sql
begin;

do $$
declare
  v_session_user text := session_user;
  v_initial_role text := current_user;
  v_row_count integer;
  v_missing_role_count integer;
  v_plan jsonb;
  grp jsonb;
  gr jsonb;
  r record;
  v_col_grantee_name text;
  v_grantor_name text;
  v_grantee_sql text;
  v_grant_sql text;
  v_diff_count integer;
begin
  -- Step 0: reject execution under a pre-existing SET ROLE rather than guess what "restore" should
  -- mean in that case. current_user must equal session_user before this script does anything.
  if v_initial_role <> v_session_user then
    raise exception
      'rollback refused: current_user (%) differs from session_user (%) — run this rollback from a fresh connection with no prior SET ROLE in effect',
      v_initial_role, v_session_user;
  end if;

  -- ==========================================================================
  -- Step 1 (preflight): read and fully validate the baseline, and materialize a complete,
  -- permission-independent replay plan — ALL while still running as the privileged role. No read
  -- of private.* happens anywhere below this block.
  -- ==========================================================================
  select count(*) into v_row_count
  from private.onboarding_migration_acl_baseline
  where migration_id = 'onboarding_project_idempotency_v1';
  if v_row_count = 0 then
    raise exception 'no captured baseline found for migration_id = onboarding_project_idempotency_v1 — cannot roll back the ACL safely without it';
  end if;

  -- Fail before any destructive work if any captured role — grantor or non-PUBLIC grantee — no
  -- longer exists.
  select count(*) into v_missing_role_count
  from (
    select distinct grantor_oid as oid from private.onboarding_migration_acl_baseline
    where migration_id = 'onboarding_project_idempotency_v1' and privilege_type in ('INSERT', 'UPDATE')
    union
    select distinct grantee_oid as oid from private.onboarding_migration_acl_baseline
    where migration_id = 'onboarding_project_idempotency_v1' and privilege_type in ('INSERT', 'UPDATE')
      and grantee_oid <> 0
  ) needed
  left join pg_roles pr on pr.oid = needed.oid
  where pr.oid is null;
  if v_missing_role_count > 0 then
    raise exception 'one or more captured roles (grantor or grantee) no longer exist — resolve manually before rollback';
  end if;

  -- Materialize the plan: one JSON object per grantor, each carrying its resolved rolname and the
  -- full list of grants it must reissue, every grantee already resolved to a rolname (or the
  -- literal 'PUBLIC'). This is the ONLY read of private.onboarding_migration_acl_baseline in this
  -- entire script.
  select jsonb_agg(
    jsonb_build_object('grantor_oid', g.grantor_oid, 'grantor_name', gr_role.rolname, 'grants', g.grants)
  )
  into v_plan
  from (
    select
      b.grantor_oid,
      jsonb_agg(jsonb_build_object(
        'grantee_oid', b.grantee_oid,
        'grantee_name', case when b.grantee_oid = 0 then 'PUBLIC' else ge_role.rolname end,
        'column_name', b.column_name,
        'privilege_type', b.privilege_type,
        'is_grantable', b.is_grantable
      )) as grants
    from private.onboarding_migration_acl_baseline b
    left join pg_roles ge_role on ge_role.oid = b.grantee_oid and b.grantee_oid <> 0
    where b.migration_id = 'onboarding_project_idempotency_v1'
      and b.privilege_type in ('INSERT', 'UPDATE')
    group by b.grantor_oid
  ) g
  join pg_roles gr_role on gr_role.oid = g.grantor_oid;

  if v_plan is null then
    raise exception 'replay plan materialization produced no data — aborting before any destructive work';
  end if;

  -- ==========================================================================
  -- Step 2: drop migration objects and remove introduced ACLs — still running as the privileged
  -- role, no role switch has happened yet.
  -- ==========================================================================
  execute 'revoke all on function public.finalize_onboarding_project(text, text, text) from authenticated';
  execute 'drop function if exists public.finalize_onboarding_project(text, text, text)';
  execute 'revoke all on function public.admin_emergency_repair_onboarding_marker(uuid, uuid, text, text) from service_role';
  execute 'drop function if exists public.admin_emergency_repair_onboarding_marker(uuid, uuid, text, text)';
  execute 'revoke all on function public.admin_correct_onboarding_reconciliation(uuid, text, uuid, text) from service_role';
  execute 'drop function if exists public.admin_correct_onboarding_reconciliation(uuid, text, uuid, text)';
  execute 'revoke all on function public.admin_reconcile_onboarding(uuid, text, uuid, text) from service_role';
  execute 'drop function if exists public.admin_reconcile_onboarding(uuid, text, uuid, text)';
  execute 'drop view if exists public.onboarding_unresolved_candidate_detail';
  execute 'drop view if exists public.onboarding_unresolved_candidates';
  execute 'drop trigger if exists reject_slug_removal_on_update on public.projects';
  execute 'drop function if exists public.reject_slug_removal_update()';
  execute 'drop trigger if exists serialize_null_slug_project_on_insert on public.projects';
  execute 'drop function if exists public.serialize_null_slug_project_insert()';
  execute 'drop index if exists public.projects_one_onboarding_marker_per_owner';
  execute 'alter table public.projects drop column if exists is_onboarding_project';
  execute 'drop table if exists public.onboarding_reconciliation_history';
  execute 'drop table if exists public.onboarding_reconciliation';
  execute 'revoke insert, update on public.projects from public, anon, authenticated';

  -- Column-level cleanup — still privileged, still reading only pg_catalog (never private.*),
  -- oid-based, %I exactly once, unchanged in substance from revision 10.
  for r in
    select x.grantee as grantee_oid, a.attname as column_name, x.privilege_type
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
    cross join lateral aclexplode(a.attacl) as x
    where n.nspname = 'public' and c.relname = 'projects'
      and a.attacl is not null
      and x.privilege_type in ('INSERT', 'UPDATE')
  loop
    if r.grantee_oid = 0 then
      execute format('revoke %s (%I) on public.projects from public', r.privilege_type, r.column_name);
      continue;
    end if;
    select rolname into v_col_grantee_name from pg_roles where oid = r.grantee_oid;
    if v_col_grantee_name is null or v_col_grantee_name not in ('anon', 'authenticated') then
      continue;
    end if;
    execute format('revoke %s (%I) on public.projects from %I', r.privilege_type, r.column_name, v_col_grantee_name);
  end loop;

  -- ==========================================================================
  -- Step 3: replay under each original grantor — iterating ONLY the already-materialized v_plan.
  -- No read of private.* happens anywhere in this loop or after it.
  -- ==========================================================================
  for grp in select * from jsonb_array_elements(v_plan)
  loop
    v_grantor_name := grp ->> 'grantor_name';

    -- Reset to the privileged role before every SET LOCAL ROLE, including the first — keeps the
    -- membership check for each grantor evaluated consistently against the privileged session
    -- role, and is the correct pattern if any privileged work were ever added between groups.
    execute 'reset role';
    -- Fail loudly, no fallback: if this role cannot become v_grantor_name, this raises uncaught
    -- and the whole transaction aborts — the fail-closed policy, no GRANTED BY, no exception
    -- handler reinterpreting the failure as anything else.
    execute format('set local role %I', v_grantor_name);

    for gr in select * from jsonb_array_elements(grp -> 'grants')
    loop
      if (gr ->> 'grantee_oid')::oid = 0 then
        v_grantee_sql := 'public';
      else
        v_grantee_sql := format('%I', gr ->> 'grantee_name');
      end if;

      if gr ->> 'column_name' is null then
        v_grant_sql := format('grant %s on public.projects to %s', gr ->> 'privilege_type', v_grantee_sql);
      else
        v_grant_sql := format('grant %s (%I) on public.projects to %s', gr ->> 'privilege_type', gr ->> 'column_name', v_grantee_sql);
      end if;
      if (gr ->> 'is_grantable')::boolean then
        v_grant_sql := v_grant_sql || ' with grant option';
      end if;

      execute v_grant_sql;
    end loop;
  end loop;

  -- ==========================================================================
  -- Step 4: restore and verify the initial role.
  -- ==========================================================================
  execute 'reset role';
  if current_user <> v_initial_role then
    raise exception 'rollback role restoration failed: expected % after RESET ROLE, got %', v_initial_role, current_user;
  end if;

  -- ==========================================================================
  -- Step 5: raw OID equality assertion — RAISES on any difference, in either direction, rather
  -- than returning a result set an operator could fail to check. This is the gate on COMMIT below.
  -- ==========================================================================
  select count(*) into v_diff_count
  from (
    with baseline as (
      select grantor_oid, grantee_oid, column_name, privilege_type, is_grantable
      from private.onboarding_migration_acl_baseline
      where migration_id = 'onboarding_project_idempotency_v1'
        and privilege_type in ('INSERT', 'UPDATE')
    ),
    current_table as (
      select x.grantor as grantor_oid, x.grantee as grantee_oid,
             null::text as column_name, x.privilege_type, x.is_grantable
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) as x
      where n.nspname = 'public' and c.relname = 'projects'
        and x.privilege_type in ('INSERT', 'UPDATE')
    ),
    current_column as (
      select x.grantor as grantor_oid, x.grantee as grantee_oid,
             a.attname as column_name, x.privilege_type, x.is_grantable
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
      cross join lateral aclexplode(a.attacl) as x
      where n.nspname = 'public' and c.relname = 'projects'
        and a.attacl is not null
        and x.privilege_type in ('INSERT', 'UPDATE')
    ),
    current_grants as (select * from current_table union all select * from current_column)
    select * from baseline except select * from current_grants
    union all
    select * from current_grants except select * from baseline
  ) diff;

  if v_diff_count > 0 then
    raise exception 'rollback ACL verification failed: % row(s) differ from the captured baseline — aborting, nothing will be committed', v_diff_count;
  end if;
end $$;

-- Step 6: reached only if the DO block above did not raise.
commit;
```

**Correction: the trailing `COMMIT` is not guaranteed to execute, and that is the safe outcome.** A
`raise exception` inside the `DO` block does not merely "mark" the transaction — it makes the entire
transaction **uncommittable**: Postgres aborts it immediately, and every statement issued against
that aborted transaction (including a literal `commit;`) either performs an implicit rollback or is
rejected outright, depending on the client/driver. Neither this proposal nor its operator should
assume the trailing `commit;` line is reliably what discards the partial work — some clients (a
`psql` session with `ON_ERROR_STOP` unset, a driver that swallows the error and keeps the connection
open) can simply **stop issuing statements after the error**, leaving the session sitting in an
aborted transaction with every lock it acquired (including, potentially, the row lock this script's
own privileged statements or the RPC's own `for update` clauses took) still held until something
ends that transaction. **This is a requirement on how the script is run, not an automatic property
of the SQL:**

- The runner must issue an explicit `ROLLBACK` (not rely on `COMMIT`) upon any error from this
  script, or
- The runner must guarantee the session is terminated (connection closed) if it cannot confirm a
  clean `ROLLBACK`/`COMMIT` outcome — Postgres releases all locks and discards the aborted
  transaction when the backend session ends, regardless of what the last statement was.
- `psql -v ON_ERROR_STOP=1 -f rollback.sql` is the minimum needed for `psql` to actually stop and
  report failure at the first error rather than continuing to the (equally aborted) `commit;` line
  and reporting a misleadingly generic "ROLLBACK" notice as if that were the intended outcome.

Every one of the failure points above (missing role, `SET LOCAL ROLE` failure, a grant failing to
apply, role-restoration mismatch, or the final equality assertion) is safe **only** in combination
with this runner-level guarantee — the SQL alone establishes that nothing can be committed after such
a failure; it does not by itself guarantee the session cleans up after itself promptly.

**Every `EXECUTE` above is deliberate, including for static text** (`'drop view if exists ...'`,
`'reset role'`): PL/pgSQL can run some static SQL directly without `EXECUTE`, but this script uses
`EXECUTE` uniformly for every statement inside the `DO` block, static or dynamically built, so there
is no question about which specific statement forms plpgsql permits inline — one consistent, always-
correct pattern throughout.

`private.onboarding_migration_acl_capture`/`_baseline` are **not** dropped by this rollback — they
remain the permanent audit record of the pre-migration ACL and of exactly what this rollback
restored, in the schema that was never exposed to begin with.

**Data on rollback:** `onboarding_reconciliation`/`_history` are dropped, discarding the
positive/negative verdicts and their audit trail (including any `emergency_repair` entries).
Capture first if ever needed:

```sql
select * from public.onboarding_reconciliation;
select * from public.onboarding_reconciliation_history order by profile_id, recorded_at;
```

No project row is ever deleted by this rollback, under any circumstance.

---

## 9. Rollout sequence

The function's own caller-scoped guard (§5a), together with the null-slug serialization trigger
(§5b), is now the security boundary against an unresolved legacy account duplicating its project —
both are active the instant the migration commits, regardless of how much of the sequence below has
run. Steps 5–8 remain valuable (they are what turns a generic "try again shortly" error into an
actually-working onboarding completion for every legacy account, and give operators a clean "is
cleanup done" signal), but none of them are load-bearing for safety the way they were in revision 11
— this sequence is now an *operator UX rollout*, not a security prerequisite.

1. **Bootstrap** (§4/§7 Step 1, its own transaction): create `private` and the two ACL tables.
   Confirm they exist before proceeding.
2. **Capture** (§4/§7 Step 2, its own transaction): write the current ACL state into them. Confirm
   it committed before proceeding.
3. **Guard** (§4/§7 Step 3, a separate statement): abort here if it raises — the capture from step 2
   survives regardless, since it was its own already-committed transaction.
4. **Migration** (§7 Step 4, its own transaction): apply once the ACL guard has passed. The
   function's `grant execute ... to authenticated` in this same step is now safe to run
   unconditionally — see §5a — precisely because the function it targets already contains the
   caller-scoped reconciliation guard by the time that grant executes; `authenticated` is never
   granted `EXECUTE` on a version of this function that lacks it.
5. Enumerate: `select * from public.onboarding_unresolved_candidate_detail;`
6. For every row, a human calls `admin_reconcile_onboarding` (`confirmed_onboarding` naming the
   project, or `confirmed_not_onboarding` naming none). Use `admin_correct_onboarding_reconciliation`
   to change a decision already recorded, while `is_onboarded` is still `false`. Any legacy account
   not yet reconciled by this point simply receives the generic `55000` error from §5a/§10 if it
   calls the RPC in the meantime — safe, if not yet a good user experience for that one account.
7. Re-run `select count(*) from public.onboarding_unresolved_candidates;` until it is `0` — this is
   now a completeness/UX signal ("every legacy account can now complete onboarding normally"), not a
   safety gate.
8. Run the hard-abort check as a final rollout-completeness confirmation (unchanged SQL from
   revision 11, kept for continuity and operator tooling):

   ```sql
   do $$
   declare
     v_unresolved integer;
   begin
     select count(*) into v_unresolved from public.onboarding_unresolved_candidates;
     if v_unresolved > 0 then
       raise exception 'onboarding reconciliation incomplete: % legacy account(s) would still see a generic retry error from the RPC — % account(s) unresolved', v_unresolved, v_unresolved;
     end if;
   end $$;
   ```

9. Enable the client's call to `finalize_onboarding_project`. (Doing this before step 6–8 finish is
   no longer unsafe — it only means some legacy accounts see the generic error a little longer.)
10. Re-run the check once more after rollout, since new signups continue during rollout.

---

## 10. Client contract

`supabase.rpc('finalize_onboarding_project', { p_title, p_short_description, p_stage }).single()`.
`lib/glyph/onboardingProjectRpc.ts` is unchanged by this revision — **new in this revision**: the
RPC can now also return a stable, generic error with `errcode = '55000'` for an account that still
has an unresolved legacy candidate (§5a). This is documented here for the eventual client-wrapper
update; no client code is changed by this revision. The wrapper's existing `try { ... } catch { ok:
false }` shape already treats every RPC-level error as `{ ok: false }` uniformly, so no wrapper
change is *required* for this new error to be handled safely — a future revision may choose to
surface `55000` distinctly to show the user a "we're still processing your account" message instead
of a generic failure, but that is a UX improvement, not a correctness requirement, and is explicitly
out of scope for this proposal-only revision.

## Unit-test results (client-wrapper, `lib/glyph/onboardingProjectRpc.test.ts`)

Unchanged and still passing: 18/18. None of this revision's changes have a client-visible branch —
all are real-database-only concerns, covered below.

---

## 11. Real-database verification checklist

1. **Exact ACL equality after rollback**, including grantor and absence of leftover column grants:
   capture the baseline, apply the migration, confirm the effective-privilege queries (§7's
   verification block) show the expected restricted state, run §8's literal `BEGIN ... COMMIT`
   rollback script end to end, and confirm it commits (the built-in equality assertion inside it did
   not raise) — then independently re-run the same OID-based raw-catalog equality query standalone
   and confirm it also returns zero rows, including the `grantor_oid` column (no longer a
   hedged/best-effort comparison, per §4's fail-closed policy).
2. **Repeated migration/preflight execution selects only one baseline**: run the preflight capture
   twice for the same `migration_id` — confirm the second attempt fails on the
   `onboarding_migration_acl_capture` primary key, and that `onboarding_migration_acl_baseline`
   still contains only the first attempt's rows.
3. **Baseline table inaccessible to anon/authenticated**: attempt to `select` from
   `private.onboarding_migration_acl_capture`/`_baseline` as `anon` and as an ordinary
   `authenticated` session — both fail (schema not exposed via PostgREST, and, for a direct
   Postgres connection under those roles, `revoke all` denies it independently).
4. **Abort behavior and whether the captured baseline persists**: run the preflight capture, then
   force the guard to raise (seed an unexpected grantee first) — confirm the guard's exception does
   not remove the already-committed capture rows, by querying
   `private.onboarding_migration_acl_baseline` immediately afterward in a fresh session.
5. **Correction before onboarding succeeds**: with `is_onboarded = false`, call
   `admin_correct_onboarding_reconciliation` and confirm it changes the marker, the current record,
   and appends a `'corrected'` history row.
6. **Correction after onboarding completes fails without changing anything**: set
   `is_onboarded = true` for the same profile, call `admin_correct_onboarding_reconciliation` again
   — confirm it errors (42501) and the marker, the current record, and the history table are all
   byte-for-byte unchanged from immediately before the call.
7. **Identical retry versus changed-notes retry**: call `admin_reconcile_onboarding` twice with
   identical arguments including `notes` — confirm the second call is a true no-op (no history row
   added); then call a third time with the same resolution/project but different `notes` — confirm
   it is rejected with the notes-specific error, and the original `notes` value is unchanged.
8. **All previously listed concurrency, deletion, reconciliation, access-control, and advisor
   checks** (carried over, unaffected by this revision's changes): genuinely overlapping
   `finalize_onboarding_project` calls (Include/Include, Skip/Include) serialize on the profile row
   lock; deleting a positively reconciled project succeeds and cascades the current record while
   preserving history; `admin_reconcile_onboarding`/`admin_correct_onboarding_reconciliation`/
   `admin_emergency_repair_onboarding_marker` all succeed under `service_role` and fail for `anon`
   and ordinary `authenticated`; an anonymous client calling `finalize_onboarding_project` fails; a
   second, different authenticated user cannot read, reuse, or affect the first user's marker,
   project, profile, or reconciliation rows; an unrelated unique-constraint failure inside
   `finalize_onboarding_project`'s insert rolls back the whole call; Supabase's database/security
   advisors run and reviewed before and after applying.
9. **Bootstrap-then-capture-then-guard-then-migration executes in order on a fresh database**: on a
   database that has never seen this proposal before, run Bootstrap, confirm
   `private.onboarding_migration_acl_baseline` exists and is queryable, then Capture, then the
   Guard, then the migration — confirm none of the four steps references an object the prior step
   did not already create, and that running Capture before Bootstrap (deliberately, to reproduce
   revision 6's defect) fails with an undefined-table error rather than silently succeeding.
10. **Emergency repair operates on the actual marker for a normal-RPC account (no reconciliation
    row)**: complete onboarding for an account entirely through `finalize_onboarding_project` (no
    `onboarding_reconciliation` row ever created for it), then exercise
    `admin_emergency_repair_onboarding_marker` through all five required transitions — marked A →
    marked B (A's marker cleared, B's set, exactly one project marked throughout); marked A → no
    marker (A cleared, none set); no current marker → marked B (B set, no prior marker to clear);
    same project A → A (a true no-op on the marker — no unnecessary write, confirmed via no change
    to `projects.updated_at` if such a column/trigger exists, or by row-version inspection
    otherwise); and a wrong-owner project B rejected — confirm the call errors (42501) and that the
    marker, the reconciliation current record, and the history table are all byte-for-byte
    unchanged from immediately before the call, for every one of the five cases where rejection is
    expected.
11. **A temporary PUBLIC grant is captured and trips the guard**: before running Bootstrap/Capture,
    `grant insert on public.projects to public;` (or a column-level equivalent) — confirm Capture's
    `table_privileges`/`column_privileges`-based query records that row (with `grantee = 'PUBLIC'`),
    and confirm the Guard raises specifically because of it, not because of an unrelated condition.
    Revoke it and confirm the Guard then passes.
12. **Rollback restores a captured PUBLIC grant exactly**: with a PUBLIC grant present at capture
    time and the guard *not* blocking it (a controlled test scenario, since production rollout
    would never proceed past item 11's guard with such a grant present), apply the migration,
    apply the rollback, and confirm the PUBLIC grant is back — including its `column_name` (or lack
    of one) — via §8's normalized equality query returning zero rows.
13. **A table-level grant with grant option is restored with grant option**: capture a baseline
    where `authenticated` (or another test role) holds `INSERT ... WITH GRANT OPTION` at the table
    level, apply and roll back, and confirm `has_table_privilege(role, 'public.projects', 'INSERT
    WITH GRANT OPTION')` is `true` afterward.
14. **A column-level grant with grant option is restored with grant option**: same as item 13, for
    a specific column via `has_column_privilege(role, 'public.projects', column, 'INSERT WITH GRANT
    OPTION')`.
15. **Removing or adding grant option is detected as a difference**: after a correct rollback,
    manually revoke just the grant option on one restored grant (`revoke grant option for insert on
    public.projects from <role>;`, leaving the bare privilege) or manually add one that was not
    captured — confirm §8's equality query now returns exactly one row identifying that mismatch,
    proving `is_grantable` is actually part of the compared tuple and not decorative.
16. **The normal stock Supabase baseline still passes the guard**: on an unmodified project (no
    injected PUBLIC grant), confirm Capture + Guard succeed with zero exceptions, exactly as in
    every prior revision's expected case — this proposal's stricter capture source must not turn a
    legitimate, ordinary baseline into a false-positive abort.
17. **A table-level grant is not captured as explicit column grants**: with `authenticated` holding
    only a plain table-level `INSERT`/`UPDATE` grant (no column-level ACL anywhere — confirm via
    `select attacl from pg_attribute where attrelid = 'public.projects'::regclass and attnum > 0`
    showing all `null`), run Capture and confirm `onboarding_migration_acl_baseline` contains
    exactly the table-level rows (`column_name is null`) and **zero** column-level rows for that
    grantee — reproducing revision 8's defect (running the old `column_privileges`-based capture
    side by side) would show 15 phantom column rows here; this revision's capture must show none.
18. **A genuine column-level grant is captured once**: `grant insert (title) on public.projects to
    authenticated;` (in addition to whatever table-level grants exist) — confirm exactly one new
    baseline row appears, for `column_name = 'title'`, not one per column.
19. **Table-level and explicit column-level grants coexist and both restore correctly**: seed a
    role with table-level `UPDATE` and a separate, narrower explicit column-level `INSERT` grant on
    two specific columns; capture, migrate, roll back; confirm both the table-level `UPDATE` row and
    exactly the two explicit column-level `INSERT` rows are restored, with no extra rows for any
    other column.
20. **PUBLIC and WITH GRANT OPTION survive** using the corrected capture: repeat checklist items 11
    and 13/14 against this revision's catalog-native Capture/replay and confirm they still pass
    (this revision changes *how* PUBLIC and grant-option are captured, not *whether* they are).
21. **Revoking the restored table-level grant leaves no column access unless an explicit column
    grant existed in the baseline**: after a correct rollback, `revoke insert on public.projects
    from authenticated;` and confirm `has_column_privilege('authenticated', 'public.projects',
    column, 'INSERT')` is `false` for every column **except** any that had a genuine explicit
    column-level grant in the baseline (per item 17/18/19's setup) — this is the definitive proof
    that rollback never created phantom explicit column grants riding along with the table-level
    one.
22. **Raw table and column ACL state matches the captured baseline**: after rollback, run
    `select relacl from pg_class where oid = 'public.projects'::regclass` and, for each column,
    `select attacl from pg_attribute where attrelid = 'public.projects'::regclass and attname =
    '<col>'`, and confirm the exploded contents of each (via `aclexplode`) match §8's core equality
    query's zero-row result — i.e., the raw catalog itself agrees, not just the query built on top
    of it.
23. **Cleanup and replay do not force away grant dependencies**: with a role holding `INSERT ...
    WITH GRANT OPTION` on `projects` and that grantee having in turn granted `INSERT` on `projects`
    to a third role, attempt rollback and confirm the plain (non-`CASCADE`) `revoke` in §8 step 2
    either succeeds cleanly (no such dependency existed for `INSERT`/`UPDATE` in the actual test
    setup) or fails loudly with a dependency error that the operator must resolve manually — confirm
    it never silently cascades away the third role's independently-granted privilege.
24. **A quoted/mixed-case role name proves there is no double quoting**: create a role literally
    named e.g. `"Weird Role Name"` (requires quoting — mixed case, a space), grant it `INSERT` on
    `projects` (table-level and, separately, column-level), capture, migrate, roll back — confirm
    the restored grant actually targets that exact role (verify via `has_table_privilege('"Weird
    Role Name"', ...)`/`has_column_privilege(...)`, and via `\dp`/`aclexplode` showing the correct
    role OID), not a nonexistent role produced by double-quoting a `regrole::text` display form.
25. **An original non-owner grantor with grant option and a downstream dependent grant**: as a
    non-superuser role `G` that itself holds `INSERT ... WITH GRANT OPTION` on `projects` (granted
    by the table owner), have `G` grant `INSERT` on `projects` to role `H`. Capture (grantor for
    `H`'s row is `G`, not the table owner), migrate, then roll back running as a role that **can**
    `SET LOCAL ROLE G` — confirm `H`'s restored grant shows `G` as its grantor (via the equality
    query, and via a fresh `aclexplode` of the post-rollback ACL), not the rollback-executing role
    or the table owner.
26. **Strict raw-catalog equality including grantor, when exact restoration is supported**: with
    item 25's setup (rollback role can assume every captured grantor), confirm §8's single equality
    query returns zero rows — the unconditional, no-longer-hedged guarantee.
27. **Rollback leaves the entire transaction unchanged when a grantor cannot be restored, when run
    with the required runner guarantee**: repeat item 25 but run §8's script (via `psql -v
    ON_ERROR_STOP=1`, or the exact equivalent guarantee for whatever runner is actually used — record
    it) as a role that **cannot** `SET LOCAL ROLE G` (no membership, not a superuser) — confirm the
    `SET LOCAL ROLE` statement raises inside the `DO` block, the runner issues an explicit `ROLLBACK`
    (or terminates the session) rather than relying on the trailing `commit;` to clean up, and every
    object this rollback would otherwise have dropped/changed (functions, views, the marker column,
    the reconciliation tables, and every ACL entry on `projects`) is still present and unchanged
    afterward — a failed rollback due to an unassumable grantor is a true no-op, not a partial one.
    Separately, confirm with `pg_locks`/`pg_stat_activity` that no lock from this attempt survives
    once the runner has finished handling the error.
    Also confirm `current_user` immediately after the failed attempt (in a new session/transaction)
    is unaffected — `SET LOCAL ROLE`'s scope never outlives the aborted transaction that attempted
    it.
28. **A grantor with no `private`-schema access can still replay from the preloaded plan**: with a
    grantor role that holds zero privileges on the `private` schema or its tables (the ordinary,
    expected case — confirm this via `has_schema_privilege(grantor, 'private', 'USAGE')` returning
    `false` beforehand), run §8's script and confirm the replay for that grantor's group succeeds —
    proving the plan really is read before the role switch and never re-queried after it. This is
    the direct regression test for revision 10's defect.
29. **No `private` relation is queried after role assumption**: instrument or trace the session
    (e.g., `pg_stat_statements`, a temporary `log_statement = 'all'` capture, or an audit extension)
    during a rollback run and confirm zero statements referencing
    `private.onboarding_migration_acl_baseline` or `private.onboarding_migration_acl_capture` are
    issued after the first `set local role` in the script — everything the replay loop needs comes
    from `v_plan` alone.
30. **Failure on the second of multiple grantors rolls back the first grantor's replay and every
    earlier destructive statement**: seed a baseline with at least two distinct grantors, make the
    second one unassumable by the rollback role, run §8's script, and confirm: (a) it raises; (b) in
    a fresh session afterward, the first grantor's grants were never actually applied (still absent);
    (c) the functions/views/marker column/reconciliation tables §8 step 2 would have dropped are
    still present; (d) the ACL is byte-for-byte identical to its pre-rollback state. This is the
    direct test that autocommit-per-statement is no longer possible — the whole script is one
    transaction.
31. **An ACL mismatch assertion prevents `COMMIT`**: after the replay loop completes successfully,
    but before running §8's script for real, manually introduce a difference between the baseline
    and the live catalog that the replay itself would not produce (e.g., an out-of-band `grant` on
    an unrelated role made concurrently) — or, more directly, temporarily alter the equality query's
    expected baseline in a test harness to force a mismatch — and confirm the `raise exception` in
    step 5 fires and the transaction never commits (verified by the drop/revoke work from step 2
    also being absent afterward, not just the mismatched grant).
32. **Successful rollback commits only after strict OID equality**: run §8's script under normal,
    fully-satisfiable conditions and confirm (via query logging or a breakpoint/trace) that the
    equality assertion's `select count(*)` runs and returns `0` strictly before the `commit;`
    statement executes — the assertion is not bypassed or reordered.
33. **Execution starting under a pre-existing `SET ROLE` is explicitly rejected before mutation**:
    open a session, run `set role <some_role>;` (a persistent, non-`LOCAL` role change), then attempt
    §8's script — confirm it raises the `current_user <> session_user` precondition error at Step 0,
    before Step 1's preflight even reads the baseline, and that nothing in `public.projects` or the
    reconciliation objects changes.
34. **Unresolved single-candidate account calls the RPC directly → rejected, nothing created or
    changed**: seed a not-yet-onboarded profile with exactly one null-slug candidate project and no
    reconciliation row, call `finalize_onboarding_project` as that account — confirm it errors with
    `errcode = '55000'`, no project row is inserted, `is_onboarding_project` is not set on the
    existing candidate, and `profiles.is_onboarded` remains `false`.
35. **Unresolved ambiguous account (multiple candidates) → same rejection**: same as item 34 with
    two or more candidate projects for the account — confirm the identical outcome (the guard does
    not distinguish "how many," only "any unresolved").
36. **Reconciled `confirmed_onboarding` account → RPC returns the reconciled project ID**: reconcile
    the account from item 34/35 via `admin_reconcile_onboarding`, then call the RPC — confirm it
    succeeds, returns the exact `project_id` `admin_reconcile_onboarding` recorded, and creates no
    new project.
37. **Reconciled `confirmed_not_onboarding` account → Include creates exactly one marked project**:
    reconcile an account `confirmed_not_onboarding`, then call the RPC with a title — confirm it
    succeeds, creates exactly one new project, marks it, and does not touch the pre-existing
    (deliberately-not-onboarding) candidate(s).
38. **Genuinely new account is unaffected**: an account with zero candidate projects calls the RPC
    for both Include and Skip — confirm both behave exactly as in every prior revision's tests (§11
    items already covering this), proving the new guard introduces no regression for the common
    case.
39. **A direct authenticated RPC call before reconciliation cannot bypass the operator workflow**:
    repeat item 34 explicitly as a raw authenticated PostgREST-shaped call (not through
    `admin_reconcile_onboarding` or any other privileged path) — confirm there is no argument,
    header, or call shape that lets the caller supply its own resolution, mark its own project, or
    otherwise reach the post-guard code path without an operator or the account itself having gone
    through `admin_reconcile_onboarding`/`admin_correct_onboarding_reconciliation` first.
40. **Concurrent reconciliation and RPC invocation serialize safely**: two real, separate sessions —
    one calling `admin_reconcile_onboarding` for an account, the other calling
    `finalize_onboarding_project` for the *same* account, genuinely overlapping — confirm (via
    `pg_locks`, as in the existing concurrency proofs) that they serialize on the same profile row
    lock, and that the RPC call, whichever side of the reconciliation it lands on, produces a
    result consistent with whichever state actually committed first (either the generic `55000`
    error if the RPC's lock is granted first and reconciliation hasn't landed yet, or the reconciled
    project id if reconciliation committed first) — never a duplicate project, never a torn read.
41. **A failed guard exposes no candidate/project details in the error**: capture the exact error
    text and all fields (`SQLSTATE`, message, detail, hint) from item 34/35's rejection — confirm
    none of them contain a project id, a project title, a candidate count, or any other
    account-specific detail beyond the fixed generic message and `errcode`.
42. **`EXECUTE` privilege is absent before the guarded function exists, present only after**: before
    running the migration, confirm `has_function_privilege('authenticated', 'finalize_onboarding_project(...)', 'EXECUTE')`
    is either `false` or the function does not yet exist; after the migration, confirm it is `true`
    **and** that `pg_get_functiondef` of the now-granted function contains the guard's fixed error
    text/`errcode` — proving the specific function version `authenticated` was granted access to is
    the guarded one, not merely that some version of the function exists.
43. **Ordinary null-slug insert locks/commits first; the RPC waits, then rejects with `55000`**: two
    real, separate sessions — session 1 runs the exact `createDraftProject` SQL shape (owner_id,
    title, lifecycle, is_primary; no slug) and commits; session 2 (a different, later transaction)
    calls `finalize_onboarding_project` for the same owner — confirm it observes the now-committed
    candidate and raises `55000`, exactly as if that candidate had existed all along.
44. **RPC locks first; the ordinary insert waits and resumes only after finalization**: two real,
    separate sessions, reversed — session 1 calls `finalize_onboarding_project` and holds the profile
    lock for its duration (observe via `pg_locks`); session 2 attempts the `createDraftProject`
    insert shape for the same owner concurrently — confirm session 2 blocks until session 1 commits,
    then proceeds against the now-onboarded state (an ordinary, unmarked, post-onboarding draft).
45. **`pg_locks` shows the actual wait relationship** for both orderings in items 43–44 — a `granted
    = true` row for the lock holder and a `granted = false` row for the waiter on `public.profiles`,
    captured mid-wait, not inferred from timing alone.
46. **No duplicate onboarding project** results from either ordering in items 43–44 — exactly one row
    with `is_onboarding_project = true` for that owner in both cases.
47. **Exactly one marked onboarding project** — restated as its own explicit check on the final state
    of both item 43 and item 44's owner, independent of item 46's per-scenario assertion.
48. **The ordinary project remains unmarked**: in item 43 (ordinary insert first), confirm the
    ordinary draft's `is_onboarding_project` is `false` both immediately after it commits and after
    the RPC's later rejection; in item 44 (RPC first), confirm the ordinary draft that resumes after
    the RPC commits is also never marked.
49. **`is_onboarded` has the expected terminal value** after each ordering: `false` in item 43 (the
    RPC was rejected, never completed), `true` in item 44 (the RPC completed before the ordinary
    insert resumed).
50. **The exact SQL shape and privileges `createDraftProject` uses, not a privileged surrogate**:
    items 43–44 issue the literal `insert into public.projects (owner_id, title, lifecycle,
    is_primary) values (...)` shape as the `authenticated` role under RLS — never as `postgres` or
    `service_role` standing in for it — so the trigger and lock behavior are proven under the actual
    privilege boundary the real action operates under.
51. **A real-slug project insert for the SAME owner whose profile lock is held is never delayed**:
    session A locks profile X and holds it; session B, as `authenticated` under the production RLS
    and column privileges (not a privileged surrogate), inserts a project for X with a real `slug`
    — confirm session B completes, using millisecond-precision timestamps (`clock_timestamp()`, not
    whole-second `date +%s`), strictly before session A releases the lock, and that exactly one row
    was inserted. A test-only broken variant that removes `serialize_null_slug_project_insert`'s
    `if new.slug is not null then return new;` early return must make this same gate fail by
    blocking — proving it is discriminating, not passing regardless of the trigger's behavior.
52. **An unrelated user's project insert does not block**: while one owner's profile lock is held
    (by either the RPC or a null-slug insert), a *different* owner's `createDraftProject`-shaped
    insert (real or null slug) proceeds without waiting — confirm via `pg_locks`/timing that only
    same-owner work is serialized, never cross-owner.
53. **Rollback restores every new trigger/function/privilege exactly**: after applying and rolling
    back, confirm `serialize_null_slug_project_on_insert`/`serialize_null_slug_project_insert()` and
    `reject_slug_removal_on_update`/`reject_slug_removal_update()` are all four gone, and that their
    existence/absence has no effect on the raw OID ACL equality check (§8) — neither introduces any
    table-level or column-level grant on `projects` for `authenticated` to begin with, so rollback's
    existing ACL replay is unaffected by them either way; this item confirms that assumption directly
    rather than leaving it implicit.
54. **The trigger-less control is an enforced gate, not informational, and uses precise timing**: in
    an isolated throwaway database, apply the migration with `serialize_null_slug_project_insert`'s
    trigger omitted, and reproduce item 43's scenario with millisecond-precision timestamps. This
    must assert, as hard PASS/FAIL gates: the RPC call completes (returns `onboarded: true` and a
    project id) **before** the ordinary insert's transaction commits; the RPC's success is itself the
    unsafe outcome under test, asserted explicitly (not merely "it didn't wait ~2s"); the later
    ordinary insert then commits its own separate row, producing **two** project rows for that owner
    (one marked, one not) — the conflicting state item 46 requires to be impossible under the real
    migration; and this exact scenario, run again against the real migration (with the trigger
    present) in the same run, produces the opposite, correct result (item 43's single-row,
    `is_onboarded = false` outcome) — proving the control's assertions genuinely flip when the
    mechanism is removed, not merely that one shell timing comparison returns a different exit code.
55. **A genuine deadlock-order regression test, with no project→profile lock path**: seed a project
    `X` owned by profile `P`. Session A, as `authenticated`, performs a legitimate slug transition on
    `X` (`null → non-null` or `non-null → non-null`) inside an explicit transaction it holds open
    briefly. Session B calls an operator function that locks `P` first and then updates `X` (e.g.
    `admin_correct_onboarding_reconciliation` reconciling `P` onto `X`), launched to genuinely
    overlap with session A. Confirm: both sessions complete successfully (or, for a deliberately
    invalid slug transition, the update fails with `reject_slug_removal_on_update`'s deterministic
    error) — **never** a Postgres `deadlock detected` error; no lock from either session survives
    once both have finished; and afterward, `X`'s marker, `slug`, the reconciliation history, and
    `P`'s `is_onboarded` all reflect exactly what the two operations should have produced.
56. **A test-only reproduction of revision 13's withdrawn `BEFORE UPDATE OF slug` design, isolated
    from the candidate migration**, demonstrating the reverse lock order for real: in a separate
    throwaway database, apply a migration variant carrying revision 13's single combined trigger
    (locking the profile row from both `INSERT` and `UPDATE`) instead of §5b's two corrected
    triggers. Construct session A (an authenticated update that sets `slug` to `null`, triggering the
    old design's profile-lock attempt while the executor already holds `X`'s row lock) and session B
    (an operator function that has already locked `P` and is now waiting on `X`'s row, held by
    session A) so that each session ends up waiting on a resource the other holds. Confirm this
    reproduces an actual Postgres `deadlock detected` error (captured verbatim in the evidence, not
    inferred from timing) — the concrete proof that revision 13's design was genuinely vulnerable,
    not just theoretically so.
