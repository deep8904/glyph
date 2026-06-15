-- V5: Publisher Tools

create table if not exists public.publisher_accounts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references public.profiles(id) on delete cascade,
  company_name  text not null check (length(company_name) between 1 and 200),
  verified      boolean not null default false,
  plan          text not null default 'free' check (plan in ('free', 'pro')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.publisher_shortlists (
  id            uuid primary key default gen_random_uuid(),
  publisher_id  uuid not null references public.publisher_accounts(id) on delete cascade,
  name          text not null check (length(name) between 1 and 100),
  items         jsonb not null default '[]',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.publisher_contacts (
  id              uuid primary key default gen_random_uuid(),
  publisher_id    uuid not null references public.publisher_accounts(id) on delete cascade,
  developer_id    uuid not null references public.profiles(id) on delete cascade,
  message         text not null check (length(message) between 1 and 2000),
  status          text not null default 'sent' check (status in ('sent', 'read', 'replied', 'archived')),
  created_at      timestamptz not null default now()
);

-- Indexes
create index if not exists publisher_accounts_user_idx on public.publisher_accounts(user_id);
create index if not exists publisher_shortlists_publisher_idx on public.publisher_shortlists(publisher_id);
create index if not exists publisher_contacts_publisher_idx on public.publisher_contacts(publisher_id);
create index if not exists publisher_contacts_developer_idx on public.publisher_contacts(developer_id);

create trigger publisher_accounts_updated_at before update on public.publisher_accounts for each row execute function public.set_updated_at();
create trigger publisher_shortlists_updated_at before update on public.publisher_shortlists for each row execute function public.set_updated_at();

-- RLS
alter table public.publisher_accounts enable row level security;
alter table public.publisher_shortlists enable row level security;
alter table public.publisher_contacts enable row level security;

create policy "publisher_accounts_read" on public.publisher_accounts for select using (auth.uid() = user_id);
create policy "publisher_accounts_insert" on public.publisher_accounts for insert with check (auth.uid() = user_id);
create policy "publisher_accounts_update" on public.publisher_accounts for update using (auth.uid() = user_id);

create policy "publisher_shortlists_read" on public.publisher_shortlists for select using (exists (select 1 from public.publisher_accounts p where p.id = publisher_id and p.user_id = auth.uid()));
create policy "publisher_shortlists_insert" on public.publisher_shortlists for insert with check (exists (select 1 from public.publisher_accounts p where p.id = publisher_id and p.user_id = auth.uid()));
create policy "publisher_shortlists_update" on public.publisher_shortlists for update using (exists (select 1 from public.publisher_accounts p where p.id = publisher_id and p.user_id = auth.uid()));
create policy "publisher_shortlists_delete" on public.publisher_shortlists for delete using (exists (select 1 from public.publisher_accounts p where p.id = publisher_id and p.user_id = auth.uid()));

-- Contacts: publisher and developer read their own
create policy "publisher_contacts_publisher_read" on public.publisher_contacts for select using (exists (select 1 from public.publisher_accounts p where p.id = publisher_id and p.user_id = auth.uid()) or auth.uid() = developer_id);
create policy "publisher_contacts_insert" on public.publisher_contacts for insert with check (exists (select 1 from public.publisher_accounts p where p.id = publisher_id and p.user_id = auth.uid()));
create policy "publisher_contacts_update" on public.publisher_contacts for update using (auth.uid() = developer_id);
