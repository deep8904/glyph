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
