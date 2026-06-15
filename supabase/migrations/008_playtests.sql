-- V4: Structured Playtesting
-- playtest_requests, playtest_sessions, playtest_feedback

create table if not exists public.playtest_requests (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  author_id       uuid not null references public.profiles(id) on delete cascade,
  build_url       text not null check (length(build_url) between 1 and 500),
  build_type      text not null check (build_type in ('browser', 'download', 'steam_key')),
  platforms       text[] not null default '{}',
  description     text not null check (length(description) between 1 and 5000),
  focus_areas     text[] not null default '{}',
  requested_testers int not null default 5 check (requested_testers between 1 and 50),
  current_testers   int not null default 0,
  status          text not null default 'open' check (status in ('open', 'closed', 'full')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.playtest_sessions (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references public.playtest_requests(id) on delete cascade,
  tester_id   uuid not null references public.profiles(id) on delete cascade,
  status      text not null default 'requested' check (status in ('requested', 'accepted', 'completed', 'skipped')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(request_id, tester_id)
);

create table if not exists public.playtest_feedback (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null unique references public.playtest_sessions(id) on delete cascade,
  ratings          jsonb not null default '{}',
  text_responses   jsonb not null default '{}',
  time_spent_minutes int,
  is_private       boolean not null default false,
  usefulness_rating int check (usefulness_rating between 1 and 5),
  created_at       timestamptz not null default now()
);

-- Indexes
create index if not exists playtest_requests_author_idx on public.playtest_requests(author_id);
create index if not exists playtest_requests_project_idx on public.playtest_requests(project_id);
create index if not exists playtest_requests_status_idx on public.playtest_requests(status, created_at desc);
create index if not exists playtest_sessions_request_idx on public.playtest_sessions(request_id);
create index if not exists playtest_sessions_tester_idx on public.playtest_sessions(tester_id);

-- updated_at triggers
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger playtest_requests_updated_at
  before update on public.playtest_requests
  for each row execute function public.set_updated_at();

create trigger playtest_sessions_updated_at
  before update on public.playtest_sessions
  for each row execute function public.set_updated_at();

-- RLS
alter table public.playtest_requests enable row level security;
alter table public.playtest_sessions enable row level security;
alter table public.playtest_feedback enable row level security;

-- playtest_requests: public read of open; author full control
create policy "playtest_requests_read" on public.playtest_requests
  for select using (status = 'open' or auth.uid() = author_id);
create policy "playtest_requests_insert" on public.playtest_requests
  for insert with check (auth.uid() = author_id);
create policy "playtest_requests_update" on public.playtest_requests
  for update using (auth.uid() = author_id);
create policy "playtest_requests_delete" on public.playtest_requests
  for delete using (auth.uid() = author_id);

-- playtest_sessions: tester reads own; author reads for their request; tester inserts
create policy "playtest_sessions_read" on public.playtest_sessions
  for select using (
    auth.uid() = tester_id
    or exists (select 1 from public.playtest_requests r where r.id = request_id and r.author_id = auth.uid())
  );
create policy "playtest_sessions_insert" on public.playtest_sessions
  for insert with check (auth.uid() = tester_id);
create policy "playtest_sessions_update" on public.playtest_sessions
  for update using (
    auth.uid() = tester_id
    or exists (select 1 from public.playtest_requests r where r.id = request_id and r.author_id = auth.uid())
  );

-- playtest_feedback: tester inserts; author reads non-private; tester reads own
create policy "playtest_feedback_tester_insert" on public.playtest_feedback
  for insert with check (
    exists (select 1 from public.playtest_sessions s where s.id = session_id and s.tester_id = auth.uid())
  );
create policy "playtest_feedback_read" on public.playtest_feedback
  for select using (
    not is_private
    or exists (select 1 from public.playtest_sessions s
      join public.playtest_requests r on r.id = s.request_id
      where s.id = session_id and (s.tester_id = auth.uid() or r.author_id = auth.uid()))
  );
create policy "playtest_feedback_update" on public.playtest_feedback
  for update using (
    exists (select 1 from public.playtest_sessions s where s.id = session_id and s.tester_id = auth.uid())
  );
