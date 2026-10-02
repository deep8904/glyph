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
