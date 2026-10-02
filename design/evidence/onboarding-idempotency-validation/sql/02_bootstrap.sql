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
