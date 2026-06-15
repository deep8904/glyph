-- V5: Studios

create table if not exists public.studios (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique check (length(slug) between 2 and 80 and slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'),
  name                  text not null check (length(name) between 1 and 200),
  description           text check (length(description) <= 5000),
  logo_url              text check (length(logo_url) <= 500),
  banner_url            text check (length(banner_url) <= 500),
  website               text check (length(website) <= 500),
  founded_year          int check (founded_year between 1970 and 2100),
  location              text check (length(location) <= 100),
  size                  text not null default 'solo' check (size in ('solo', '2-10', '11-50', '50+')),
  verified              boolean not null default false,
  verified_at           timestamptz,
  plan                  text not null default 'free' check (plan in ('free', 'pro', 'team')),
  stripe_customer_id    text,
  stripe_subscription_id text,
  status                text not null default 'active' check (status in ('active', 'suspended', 'deleted')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table if not exists public.studio_members (
  id          uuid primary key default gen_random_uuid(),
  studio_id   uuid not null references public.studios(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at  timestamptz not null default now(),
  unique(studio_id, user_id)
);

create table if not exists public.studio_projects (
  id          uuid primary key default gen_random_uuid(),
  studio_id   uuid not null references public.studios(id) on delete cascade,
  project_id  uuid not null references public.projects(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique(studio_id, project_id)
);

-- Indexes
create index if not exists studios_slug_idx on public.studios(slug);
create index if not exists studio_members_user_idx on public.studio_members(user_id);
create index if not exists studio_members_studio_idx on public.studio_members(studio_id);
create index if not exists studio_projects_studio_idx on public.studio_projects(studio_id);

create trigger studios_updated_at
  before update on public.studios
  for each row execute function public.set_updated_at();

-- RLS
alter table public.studios enable row level security;
alter table public.studio_members enable row level security;
alter table public.studio_projects enable row level security;

-- studios: public read of active; members insert/update via members table
create policy "studios_read" on public.studios
  for select using (status = 'active');
create policy "studios_insert" on public.studios
  for insert with check (true); -- controlled via server action checking auth
create policy "studios_update" on public.studios
  for update using (
    exists (select 1 from public.studio_members m where m.studio_id = id and m.user_id = auth.uid() and m.role in ('owner', 'admin'))
  );

-- studio_members: members read their own studio; owner/admin manage
create policy "studio_members_read" on public.studio_members
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.studio_members m2 where m2.studio_id = studio_id and m2.user_id = auth.uid())
  );
create policy "studio_members_insert" on public.studio_members
  for insert with check (
    auth.uid() = user_id -- self-join or
    or exists (select 1 from public.studio_members m where m.studio_id = studio_id and m.user_id = auth.uid() and m.role in ('owner', 'admin'))
  );
create policy "studio_members_delete" on public.studio_members
  for delete using (
    auth.uid() = user_id
    or exists (select 1 from public.studio_members m where m.studio_id = studio_id and m.user_id = auth.uid() and m.role in ('owner', 'admin'))
  );

-- studio_projects: public read; studio owner/admin manage
create policy "studio_projects_read" on public.studio_projects
  for select using (true);
create policy "studio_projects_insert" on public.studio_projects
  for insert with check (
    exists (select 1 from public.studio_members m where m.studio_id = studio_id and m.user_id = auth.uid() and m.role in ('owner', 'admin'))
  );
create policy "studio_projects_delete" on public.studio_projects
  for delete using (
    exists (select 1 from public.studio_members m where m.studio_id = studio_id and m.user_id = auth.uid() and m.role in ('owner', 'admin'))
  );
