-- V3 Feature 5: Notifications

create table if not exists public.notifications (
  id           uuid        default uuid_generate_v4() primary key,
  recipient_id uuid        references public.profiles(id) on delete cascade,
  actor_id     uuid        references public.profiles(id) on delete set null,
  type         text        check (type in ('follow', 'comment', 'reply', 'reaction', 'mention')),
  entity_type  text,
  entity_id    uuid,
  read_at      timestamptz,
  created_at   timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "Users can read their own notifications"
  on public.notifications for select
  using (auth.uid() = recipient_id);

create policy "Authenticated users can insert notifications"
  on public.notifications for insert
  with check (auth.uid() = actor_id);

create policy "Recipients can mark notifications read"
  on public.notifications for update
  using (auth.uid() = recipient_id);

create index if not exists notifications_recipient_idx
  on public.notifications(recipient_id, created_at desc);
