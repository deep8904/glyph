-- V5: Payments & Featured Listings

create table if not exists public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid references public.profiles(id) on delete cascade,
  studio_id               uuid references public.studios(id) on delete cascade,
  stripe_subscription_id  text not null unique,
  plan                    text not null check (plan in ('pro', 'team')),
  status                  text not null check (status in ('active', 'past_due', 'canceled', 'trialing')),
  current_period_end      timestamptz not null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint subscription_owner check (user_id is not null or studio_id is not null)
);

create table if not exists public.featured_listings (
  id                        uuid primary key default gen_random_uuid(),
  entity_type               text not null check (entity_type in ('project', 'collab_post')),
  entity_id                 uuid not null,
  payer_id                  uuid not null references public.profiles(id) on delete cascade,
  starts_at                 timestamptz not null default now(),
  ends_at                   timestamptz not null,
  position_rank             int not null default 0,
  amount_cents              int not null check (amount_cents > 0),
  stripe_payment_intent_id  text not null unique,
  created_at                timestamptz not null default now()
);

-- Indexes
create index if not exists subscriptions_user_idx on public.subscriptions(user_id);
create index if not exists subscriptions_studio_idx on public.subscriptions(studio_id);
create index if not exists featured_listings_entity_idx on public.featured_listings(entity_type, entity_id);
-- Plain index, not partial on `ends_at > now()` — Postgres requires a
-- partial index predicate to be IMMUTABLE, and now() is only STABLE.
create index if not exists featured_listings_ends_at_idx on public.featured_listings(ends_at);

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- RLS
alter table public.subscriptions enable row level security;
alter table public.featured_listings enable row level security;

-- subscriptions: owner reads own
create policy "subscriptions_read" on public.subscriptions
  for select using (auth.uid() = user_id or exists (select 1 from public.studio_members m where m.studio_id = studio_id and m.user_id = auth.uid()));
create policy "subscriptions_insert" on public.subscriptions
  for insert with check (auth.uid() = user_id);
create policy "subscriptions_update" on public.subscriptions
  for update using (auth.uid() = user_id);

-- featured_listings: public read; payer inserts
create policy "featured_listings_read" on public.featured_listings
  for select using (true);
create policy "featured_listings_insert" on public.featured_listings
  for insert with check (auth.uid() = payer_id);
