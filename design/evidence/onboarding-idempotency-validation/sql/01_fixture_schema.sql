-- Per-database Supabase-like fixture. See README "Supabase-fidelity disclosure" for the exact
-- boundary between what this reproduces and what only a real Supabase project can prove.
create extension if not exists pgcrypto;

grant usage on schema public to anon, authenticated, service_role;

-- auth.uid() stand-in: real Supabase derives this from the verified JWT via PostgREST/GoTrue.
-- This reads a plain session GUC the test driver sets directly — it proves the SQL that CONSUMES
-- auth.uid() behaves correctly (RLS policies, the RPC's identity checks), but it does not exercise
-- JWT verification, PostgREST's request context wiring, or GoTrue at all. Labeled NOT TESTED in
-- README for that reason.
create schema if not exists auth;
create or replace function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

create table public.profiles (
  id uuid primary key,
  is_onboarded boolean not null default false
);
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select using (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  title text not null,
  slug text,
  short_description text,
  long_description text,
  tags text[],
  engine text,
  genre text,
  stage text,
  visibility text not null default 'private',
  lifecycle text not null default 'draft',
  cover_url text,
  screenshots text[],
  external_links jsonb,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.projects enable row level security;
create policy "projects viewable by everyone" on public.projects for select using (true);
create policy "manage own projects" on public.projects for all using (auth.uid() = owner_id);

create unique index projects_owner_slug_idx on public.projects(owner_id, slug) where slug is not null;

-- Stock Supabase-style default grants — the baseline this proposal's Guard expects to see on an
-- ordinary project before the migration runs.
grant select, insert, update, delete on public.projects to authenticated;
grant select on public.projects to anon;
grant select, insert, update, delete on public.profiles to authenticated;
