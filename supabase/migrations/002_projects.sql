-- Projects table (minimal V1 schema, expanded in later features)
create table if not exists public.projects (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  short_description text,
  engine text,
  genre text,
  stage text,                   -- 'concept', 'prototype', 'alpha', 'beta', 'released'
  cover_url text,
  is_primary boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.projects enable row level security;

create policy "Projects are viewable by everyone"
  on public.projects for select using (true);

create policy "Users can manage their own projects"
  on public.projects for all
  using (auth.uid() = owner_id);

create index if not exists projects_owner_idx on public.projects(owner_id);

-- Keep updated_at fresh (reuses handle_updated_at from 001_profiles.sql)
create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.handle_updated_at();
