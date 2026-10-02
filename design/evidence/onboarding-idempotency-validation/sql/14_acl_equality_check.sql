-- Standalone form of the exact query embedded in the rollback script's own Step 5 assertion
-- (06_rollback.sql). Run this independently after rollback to re-confirm strict OID equality —
-- zero rows required, unconditionally, including grantor_oid.
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
select 'missing_from_current' as diff, * from baseline except select 'missing_from_current', * from current_grants
union all
select 'extra_in_current' as diff, * from current_grants except select 'extra_in_current', * from baseline;
