-- V3 Feature 1: Project Pages and Devlogs

-- ── Extend projects table ────────────────────────────────────────────────────
alter table public.projects
  add column if not exists slug text,
  add column if not exists long_description text,
  add column if not exists tags text[] default '{}',
  add column if not exists cover_image_url text,
  add column if not exists screenshots jsonb default '[]',
  add column if not exists external_links jsonb default '{}',
  add column if not exists visibility text not null default 'public'
    check (visibility in ('public', 'unlisted', 'private'));

-- Unique slug per owner (partial so existing rows with null slug don't conflict)
create unique index if not exists projects_owner_slug_idx
  on public.projects(owner_id, slug)
  where slug is not null;

-- ── devlog_posts ─────────────────────────────────────────────────────────────
create table if not exists public.devlog_posts (
  id           uuid        default uuid_generate_v4() primary key,
  project_id   uuid        references public.projects(id) on delete cascade not null,
  author_id    uuid        references public.profiles(id) on delete cascade not null,
  slug         text        not null,
  title        text        not null,
  content      text        not null default '',
  published_at timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique(project_id, slug)
);

alter table public.devlog_posts enable row level security;

-- Published devlogs are readable by everyone
create policy "Anyone can read published devlogs"
  on public.devlog_posts for select
  using (published_at is not null and published_at <= now());

-- Authors can always read their own (drafts included)
create policy "Authors can read own devlogs"
  on public.devlog_posts for select
  using (auth.uid() = author_id);

create policy "Authors can insert devlogs"
  on public.devlog_posts for insert
  with check (auth.uid() = author_id);

create policy "Authors can update own devlogs"
  on public.devlog_posts for update
  using (auth.uid() = author_id);

create policy "Authors can delete own devlogs"
  on public.devlog_posts for delete
  using (auth.uid() = author_id);

create index if not exists devlog_posts_project_published_idx
  on public.devlog_posts(project_id, published_at desc);

create index if not exists devlog_posts_author_idx
  on public.devlog_posts(author_id);

create trigger devlog_posts_updated_at
  before update on public.devlog_posts
  for each row execute function public.handle_updated_at();
