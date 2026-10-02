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
