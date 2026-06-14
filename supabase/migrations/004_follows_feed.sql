-- V3 Feature 2: Following System and Community Feed

create table if not exists public.follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  followed_id uuid references public.profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

alter table public.follows enable row level security;

create policy "Follows are publicly readable"
  on public.follows for select using (true);

create policy "Users can follow others"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "Users can unfollow"
  on public.follows for delete
  using (auth.uid() = follower_id);

create index if not exists follows_follower_idx on public.follows(follower_id);
create index if not exists follows_followed_idx on public.follows(followed_id);

-- Feed view: published devlog posts from followed developers, most recent first.
-- Callers filter by follower_id in application code to avoid exposing all follows.
create or replace view public.feed_items as
select
  dp.id,
  dp.project_id,
  dp.author_id,
  dp.slug          as devlog_slug,
  dp.title         as devlog_title,
  dp.content,
  dp.published_at,
  p.title          as project_title,
  p.slug           as project_slug,
  pr.username,
  pr.display_name,
  pr.avatar_url,
  f.follower_id
from public.devlog_posts dp
  join public.projects p    on p.id = dp.project_id
  join public.profiles pr   on pr.id = dp.author_id
  join public.follows f     on f.followed_id = dp.author_id
where dp.published_at is not null
  and dp.published_at <= now()
  and p.visibility = 'public';
