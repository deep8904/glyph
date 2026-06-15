-- V4: Game Jams
-- game_jams, jam_entries, jam_votes

create table if not exists public.game_jams (
  id                    uuid primary key default gen_random_uuid(),
  host_id               uuid not null references public.profiles(id) on delete cascade,
  title                 text not null check (length(title) between 1 and 200),
  slug                  text not null unique check (
    length(slug) between 2 and 80
    and slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
  ),
  description           text not null check (length(description) between 1 and 10000),
  theme                 text check (length(theme) <= 200),
  start_at              timestamptz not null,
  end_at                timestamptz not null,
  voting_start_at       timestamptz not null,
  voting_end_at         timestamptz not null,
  rules                 text check (length(rules) <= 20000),
  prizes                jsonb,
  max_team_size         int not null default 4 check (max_team_size between 1 and 20),
  allow_existing_assets boolean not null default false,
  status                text not null default 'upcoming' check (status in ('upcoming', 'running', 'voting', 'completed', 'cancelled')),
  admin_approved        boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint jam_end_after_start check (end_at > start_at),
  constraint jam_voting_after_end check (voting_start_at >= end_at),
  constraint jam_voting_end_after_start check (voting_end_at > voting_start_at)
);

create table if not exists public.jam_entries (
  id                uuid primary key default gen_random_uuid(),
  jam_id            uuid not null references public.game_jams(id) on delete cascade,
  project_id        uuid not null references public.projects(id) on delete cascade,
  team_lead_id      uuid not null references public.profiles(id) on delete cascade,
  submission_url    text check (length(submission_url) <= 500),
  submission_notes  text check (length(submission_notes) <= 2000),
  submitted_at      timestamptz not null default now(),
  ranking           int,
  votes_count       int not null default 0,
  unique(jam_id, project_id)
);

create table if not exists public.jam_votes (
  id          uuid primary key default gen_random_uuid(),
  entry_id    uuid not null references public.jam_entries(id) on delete cascade,
  voter_id    uuid not null references public.profiles(id) on delete cascade,
  category    text not null check (category in ('overall', 'innovation', 'fun', 'theme', 'visuals', 'audio')),
  score       int not null check (score between 1 and 5),
  created_at  timestamptz not null default now(),
  unique(entry_id, voter_id, category)
);

-- Indexes
create index if not exists game_jams_host_idx on public.game_jams(host_id);
create index if not exists game_jams_status_idx on public.game_jams(status, start_at desc);
create index if not exists game_jams_slug_idx on public.game_jams(slug);
create index if not exists jam_entries_jam_idx on public.jam_entries(jam_id);
create index if not exists jam_entries_team_lead_idx on public.jam_entries(team_lead_id);
create index if not exists jam_votes_entry_idx on public.jam_votes(entry_id);
create index if not exists jam_votes_voter_idx on public.jam_votes(voter_id);

create trigger game_jams_updated_at
  before update on public.game_jams
  for each row execute function public.set_updated_at();

-- RLS
alter table public.game_jams enable row level security;
alter table public.jam_entries enable row level security;
alter table public.jam_votes enable row level security;

-- game_jams: approved = public read; host can always read/edit their own
create policy "game_jams_read" on public.game_jams
  for select using (admin_approved = true or auth.uid() = host_id);
create policy "game_jams_insert" on public.game_jams
  for insert with check (auth.uid() = host_id);
create policy "game_jams_update" on public.game_jams
  for update using (auth.uid() = host_id);
create policy "game_jams_delete" on public.game_jams
  for delete using (auth.uid() = host_id);

-- jam_entries: public read; team_lead inserts/updates during submission window
create policy "jam_entries_read" on public.jam_entries
  for select using (true);
create policy "jam_entries_insert" on public.jam_entries
  for insert with check (auth.uid() = team_lead_id);
create policy "jam_entries_update" on public.jam_entries
  for update using (auth.uid() = team_lead_id);
create policy "jam_entries_delete" on public.jam_entries
  for delete using (auth.uid() = team_lead_id);

-- jam_votes: public read; voter inserts own votes (no own-entry enforcement here — handled in app)
create policy "jam_votes_read" on public.jam_votes
  for select using (true);
create policy "jam_votes_insert" on public.jam_votes
  for insert with check (auth.uid() = voter_id);
create policy "jam_votes_update" on public.jam_votes
  for update using (auth.uid() = voter_id);
