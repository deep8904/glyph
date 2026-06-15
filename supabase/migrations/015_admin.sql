-- V5: Admin System

create table if not exists public.admin_users (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references public.profiles(id) on delete cascade,
  role        text not null default 'moderator' check (role in ('admin', 'moderator', 'support')),
  created_at  timestamptz not null default now()
);

create table if not exists public.moderation_queue (
  id            uuid primary key default gen_random_uuid(),
  entity_type   text not null check (entity_type in ('profile', 'project', 'devlog_post', 'comment', 'collaboration_post', 'event', 'studio')),
  entity_id     uuid not null,
  reason        text not null check (reason in ('spam', 'harassment', 'csam', 'copyright', 'scam', 'other')),
  reported_by   uuid references public.profiles(id) on delete set null,
  description   text check (length(description) <= 2000),
  status        text not null default 'pending' check (status in ('pending', 'reviewing', 'actioned', 'dismissed')),
  assigned_to   uuid references public.admin_users(id) on delete set null,
  resolved_at   timestamptz,
  resolution    text check (length(resolution) <= 1000),
  created_at    timestamptz not null default now()
);

create table if not exists public.audit_log (
  id            uuid primary key default gen_random_uuid(),
  admin_id      uuid not null references public.admin_users(id) on delete cascade,
  action        text not null check (length(action) <= 200),
  target_type   text check (length(target_type) <= 100),
  target_id     uuid,
  metadata      jsonb not null default '{}',
  created_at    timestamptz not null default now()
);

create table if not exists public.feature_flags (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique check (length(key) between 1 and 100),
  enabled     boolean not null default false,
  conditions  jsonb not null default '{}',
  description text check (length(description) <= 500),
  updated_at  timestamptz not null default now()
);

create table if not exists public.security_events (
  id          uuid primary key default gen_random_uuid(),
  event_type  text not null check (length(event_type) <= 100),
  user_id     uuid references public.profiles(id) on delete set null,
  ip_address  text check (length(ip_address) <= 45),
  user_agent  text check (length(user_agent) <= 500),
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

-- Indexes
create index if not exists admin_users_user_idx on public.admin_users(user_id);
create index if not exists moderation_queue_status_idx on public.moderation_queue(status, created_at desc);
create index if not exists audit_log_admin_idx on public.audit_log(admin_id, created_at desc);
create index if not exists audit_log_created_idx on public.audit_log(created_at desc);
create index if not exists security_events_created_idx on public.security_events(created_at desc);
create index if not exists security_events_type_idx on public.security_events(event_type, created_at desc);
create index if not exists feature_flags_key_idx on public.feature_flags(key);

create trigger feature_flags_updated_at before update on public.feature_flags for each row execute function public.set_updated_at();

-- Helper: check if caller is admin
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid())
$$;

-- RLS
alter table public.admin_users enable row level security;
alter table public.moderation_queue enable row level security;
alter table public.audit_log enable row level security;
alter table public.feature_flags enable row level security;
alter table public.security_events enable row level security;

-- admin_users: only admins read
create policy "admin_users_read" on public.admin_users for select using (public.is_admin());

-- moderation_queue: reporters insert; admins read/update
create policy "moderation_queue_insert" on public.moderation_queue for insert with check (auth.uid() = reported_by);
create policy "moderation_queue_read" on public.moderation_queue for select using (public.is_admin());
create policy "moderation_queue_update" on public.moderation_queue for update using (public.is_admin());

-- audit_log: admins read; system inserts (bypasses RLS via service role)
create policy "audit_log_read" on public.audit_log for select using (public.is_admin());

-- feature_flags: admins read/write; service role updates
create policy "feature_flags_read" on public.feature_flags for select using (public.is_admin());
create policy "feature_flags_update" on public.feature_flags for update using (public.is_admin());

-- security_events: admins read only; inserts via service role
create policy "security_events_read" on public.security_events for select using (public.is_admin());
