-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text,
  bio text,
  location text,
  avatar_url text,

  -- Developer identity fields
  primary_role text,            -- 'programmer', 'artist', 'designer', 'composer', 'writer', 'generalist'
  primary_engine text,          -- 'unity', 'unreal', 'godot', 'gamemaker', 'custom', 'other'
  experience_level text,        -- 'student', 'hobbyist', 'indie', 'professional'
  collaboration_status text default 'open', -- 'open', 'closed', 'selective'

  -- Social links
  github_url text,
  itchio_url text,
  twitter_url text,
  website_url text,

  -- Meta
  is_onboarded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Username validation: lowercase, alphanumeric + hyphens, 3-30 chars
alter table public.profiles
  add constraint username_format
  check (username ~ '^[a-z0-9][a-z0-9\-]{1,28}[a-z0-9]$');

-- Row Level Security
alter table public.profiles enable row level security;

-- Public profiles are readable by everyone
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- Users can only manage their own profile
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Index for username lookup
create index if not exists profiles_username_idx on public.profiles(username);
