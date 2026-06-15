-- V6: User-level moderation (blocks, mutes, bans)

create table if not exists public.user_blocks (
  id            uuid primary key default gen_random_uuid(),
  blocker_id    uuid not null references public.profiles(id) on delete cascade,
  blocked_id    uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique(blocker_id, blocked_id),
  constraint no_self_block check (blocker_id <> blocked_id)
);

create table if not exists public.user_mutes (
  id          uuid primary key default gen_random_uuid(),
  muter_id    uuid not null references public.profiles(id) on delete cascade,
  muted_id    uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique(muter_id, muted_id),
  constraint no_self_mute check (muter_id <> muted_id)
);

create table if not exists public.user_bans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references public.profiles(id) on delete cascade,
  banned_by   uuid not null references public.admin_users(id) on delete cascade,
  reason      text not null check (length(reason) <= 1000),
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- Indexes
create index if not exists user_blocks_blocker_idx on public.user_blocks(blocker_id);
create index if not exists user_blocks_blocked_idx on public.user_blocks(blocked_id);
create index if not exists user_mutes_muter_idx on public.user_mutes(muter_id);
create index if not exists user_bans_user_idx on public.user_bans(user_id);

-- RLS
alter table public.user_blocks enable row level security;
alter table public.user_mutes enable row level security;
alter table public.user_bans enable row level security;

-- blocks: blocker reads/manages own; blocked can read (to know they're blocked)
create policy "blocks_read" on public.user_blocks
  for select using (auth.uid() = blocker_id or auth.uid() = blocked_id);
create policy "blocks_insert" on public.user_blocks
  for insert with check (auth.uid() = blocker_id);
create policy "blocks_delete" on public.user_blocks
  for delete using (auth.uid() = blocker_id);

-- mutes: muter manages own
create policy "mutes_read" on public.user_mutes
  for select using (auth.uid() = muter_id);
create policy "mutes_insert" on public.user_mutes
  for insert with check (auth.uid() = muter_id);
create policy "mutes_delete" on public.user_mutes
  for delete using (auth.uid() = muter_id);

-- bans: admin-only read; inserts via server action with admin check
create policy "bans_read" on public.user_bans
  for select using (public.is_admin() or auth.uid() = user_id);
create policy "bans_insert" on public.user_bans
  for insert with check (public.is_admin());
create policy "bans_delete" on public.user_bans
  for delete using (public.is_admin());
