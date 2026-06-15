-- V4: Collaboration Board
-- collaboration_posts, collaboration_applications

create table if not exists public.collaboration_posts (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid references public.projects(id) on delete set null,
  author_id           uuid not null references public.profiles(id) on delete cascade,
  post_type           text not null check (post_type in ('seeking_collaborator', 'available_to_collaborate')),
  role_needed         text check (length(role_needed) <= 100),
  role_offered        text check (length(role_offered) <= 100),
  contract_type       text not null check (contract_type in ('full_time', 'part_time', 'freelance', 'rev_share', 'volunteer')),
  compensation_range  text check (length(compensation_range) <= 200),
  time_commitment     text check (length(time_commitment) <= 200),
  remote_allowed      boolean not null default true,
  location            text check (length(location) <= 100),
  description         text not null check (length(description) between 1 and 5000),
  status              text not null default 'open' check (status in ('open', 'filled', 'closed')),
  expires_at          timestamptz not null default (now() + interval '60 days'),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.collaboration_applications (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references public.collaboration_posts(id) on delete cascade,
  applicant_id  uuid not null references public.profiles(id) on delete cascade,
  message       text not null check (length(message) between 1 and 2000),
  status        text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at    timestamptz not null default now(),
  unique(post_id, applicant_id)
);

-- Indexes
create index if not exists collab_posts_author_idx on public.collaboration_posts(author_id);
create index if not exists collab_posts_status_idx on public.collaboration_posts(status, created_at desc);
create index if not exists collab_posts_type_idx on public.collaboration_posts(post_type, status);
create index if not exists collab_posts_expires_idx on public.collaboration_posts(expires_at);
create index if not exists collab_apps_post_idx on public.collaboration_applications(post_id);
create index if not exists collab_apps_applicant_idx on public.collaboration_applications(applicant_id);

create trigger collaboration_posts_updated_at
  before update on public.collaboration_posts
  for each row execute function public.set_updated_at();

-- RLS
alter table public.collaboration_posts enable row level security;
alter table public.collaboration_applications enable row level security;

-- collab posts: open/filled = public read; author full control
create policy "collab_posts_read" on public.collaboration_posts
  for select using (status in ('open', 'filled') or auth.uid() = author_id);
create policy "collab_posts_insert" on public.collaboration_posts
  for insert with check (auth.uid() = author_id);
create policy "collab_posts_update" on public.collaboration_posts
  for update using (auth.uid() = author_id);
create policy "collab_posts_delete" on public.collaboration_posts
  for delete using (auth.uid() = author_id);

-- applications: applicant reads own; post author reads all applications to their posts
create policy "collab_apps_read" on public.collaboration_applications
  for select using (
    auth.uid() = applicant_id
    or exists (select 1 from public.collaboration_posts p where p.id = post_id and p.author_id = auth.uid())
  );
create policy "collab_apps_insert" on public.collaboration_applications
  for insert with check (auth.uid() = applicant_id);
create policy "collab_apps_update" on public.collaboration_applications
  for update using (
    exists (select 1 from public.collaboration_posts p where p.id = post_id and p.author_id = auth.uid())
  );
