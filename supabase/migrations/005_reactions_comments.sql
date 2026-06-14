-- V3 Feature 3: Reactions and Comments on Devlogs

-- ── Reactions ────────────────────────────────────────────────────────────────
create table if not exists public.reactions (
  id              uuid        default uuid_generate_v4() primary key,
  user_id         uuid        references public.profiles(id) on delete cascade,
  devlog_post_id  uuid        references public.devlog_posts(id) on delete cascade,
  reaction_type   text        check (reaction_type in ('like', 'helpful', 'inspiring', 'question')),
  created_at      timestamptz default now(),
  unique(user_id, devlog_post_id, reaction_type)
);

alter table public.reactions enable row level security;

create policy "Reactions are publicly readable"
  on public.reactions for select using (true);

create policy "Authenticated users can react"
  on public.reactions for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their own reactions"
  on public.reactions for delete
  using (auth.uid() = user_id);

create index if not exists reactions_devlog_idx on public.reactions(devlog_post_id);

-- ── Comments ─────────────────────────────────────────────────────────────────
create table if not exists public.comments (
  id                uuid        default uuid_generate_v4() primary key,
  author_id         uuid        references public.profiles(id) on delete cascade,
  devlog_post_id    uuid        references public.devlog_posts(id) on delete cascade,
  parent_comment_id uuid        references public.comments(id) on delete cascade,
  content           text        not null check (length(content) > 0 and length(content) <= 5000),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

alter table public.comments enable row level security;

create policy "Comments are publicly readable"
  on public.comments for select using (true);

create policy "Authenticated users can comment"
  on public.comments for insert
  with check (auth.uid() = author_id);

create policy "Authors can update their own comments"
  on public.comments for update
  using (auth.uid() = author_id);

create policy "Authors can delete their own comments"
  on public.comments for delete
  using (auth.uid() = author_id);

create index if not exists comments_devlog_idx on public.comments(devlog_post_id, created_at);
create index if not exists comments_parent_idx on public.comments(parent_comment_id);

create trigger comments_updated_at
  before update on public.comments
  for each row execute function public.handle_updated_at();
