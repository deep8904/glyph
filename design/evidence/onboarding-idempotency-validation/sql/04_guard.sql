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
