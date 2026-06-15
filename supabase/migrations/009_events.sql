-- V4: Local Events
-- events, event_rsvps, event_demo_slots

create table if not exists public.events (
  id              uuid primary key default gen_random_uuid(),
  host_id         uuid not null references public.profiles(id) on delete cascade,
  title           text not null check (length(title) between 1 and 200),
  description     text not null check (length(description) between 1 and 5000),
  city            text not null check (length(city) between 1 and 100),
  state           text check (length(state) <= 100),
  country         text not null check (length(country) between 1 and 100),
  lat             numeric(9,6),
  lng             numeric(9,6),
  venue           text check (length(venue) <= 200),
  start_at        timestamptz not null,
  end_at          timestamptz not null,
  capacity        int check (capacity > 0),
  rsvp_count      int not null default 0,
  cover_image_url text check (length(cover_image_url) <= 500),
  status          text not null default 'draft' check (status in ('draft', 'published', 'cancelled', 'completed')),
  type            text not null check (type in ('meetup', 'showcase', 'jam_meetup', 'talk', 'workshop')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint end_after_start check (end_at > start_at)
);

create table if not exists public.event_rsvps (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  status      text not null default 'going' check (status in ('going', 'maybe', 'cancelled')),
  created_at  timestamptz not null default now(),
  unique(event_id, user_id)
);

create table if not exists public.event_demo_slots (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  project_id  uuid not null references public.projects(id) on delete cascade,
  demoer_id   uuid not null references public.profiles(id) on delete cascade,
  slot_time   timestamptz,
  accepted    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Indexes
create index if not exists events_host_idx on public.events(host_id);
create index if not exists events_city_start_idx on public.events(city, start_at);
create index if not exists events_start_idx on public.events(start_at);
create index if not exists events_status_idx on public.events(status, start_at);
create index if not exists event_rsvps_event_idx on public.event_rsvps(event_id);
create index if not exists event_rsvps_user_idx on public.event_rsvps(user_id);
create index if not exists event_demo_slots_event_idx on public.event_demo_slots(event_id);

create trigger events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- RLS
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.event_demo_slots enable row level security;

-- events: published = public read; host full control
create policy "events_read" on public.events
  for select using (status = 'published' or status = 'completed' or auth.uid() = host_id);
create policy "events_insert" on public.events
  for insert with check (auth.uid() = host_id);
create policy "events_update" on public.events
  for update using (auth.uid() = host_id);
create policy "events_delete" on public.events
  for delete using (auth.uid() = host_id);

-- event_rsvps: public read; user manages own
create policy "event_rsvps_read" on public.event_rsvps
  for select using (true);
create policy "event_rsvps_insert" on public.event_rsvps
  for insert with check (auth.uid() = user_id);
create policy "event_rsvps_update" on public.event_rsvps
  for update using (auth.uid() = user_id);
create policy "event_rsvps_delete" on public.event_rsvps
  for delete using (auth.uid() = user_id);

-- demo slots: event host and demoer can read
create policy "demo_slots_read" on public.event_demo_slots
  for select using (
    auth.uid() = demoer_id
    or exists (select 1 from public.events e where e.id = event_id and e.host_id = auth.uid())
  );
create policy "demo_slots_insert" on public.event_demo_slots
  for insert with check (auth.uid() = demoer_id);
create policy "demo_slots_update" on public.event_demo_slots
  for update using (
    exists (select 1 from public.events e where e.id = event_id and e.host_id = auth.uid())
  );
create policy "demo_slots_delete" on public.event_demo_slots
  for delete using (auth.uid() = demoer_id);
