-- Cluster-level roles. Idempotent: guarded so re-running this script against an already-seeded
-- cluster does not error. These are NOT Supabase-hosted roles — see README "Supabase-fidelity
-- disclosure" for exactly what is and is not reproduced.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;

  -- Test-only roles used exclusively by the ACL edge-case scenarios (07_acl_edge_case_fixtures.sql,
  -- 12_acl_lock_assertions.sql) — not part of the proposal itself.
  if not exists (select 1 from pg_roles where rolname = 'test_grantor_g') then
    create role test_grantor_g nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'test_grantor_x') then
    create role test_grantor_x nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'test_grantee_h') then
    create role test_grantee_h nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'Weird Role Name') then
    create role "Weird Role Name" nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'rollback_operator') then
    create role rollback_operator login createdb nosuperuser;
  end if;

  -- The cluster superuser (postgres, whoever runs this script) must be able to SET ROLE to every
  -- grantor role used in the ACL scenarios, in order to exercise the ordinary (superuser-executed)
  -- rollback path. rollback_operator deliberately does NOT get blanket membership here — its
  -- membership is granted/revoked explicitly, per test, in the scenario scripts that need it, to
  -- exercise the fail-closed path faithfully.
  execute format('grant test_grantor_g to %I', current_user);
  execute format('grant test_grantor_x to %I', current_user);
end $$;
