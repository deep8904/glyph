-- Phase 10 (Settings, Privacy, Account lifecycle, Notification UX).
--
-- Findings this migration addresses (each verified against the live schema):
--  A1 "Delete account" only nulled a few profile columns and signed out. Every
--     table that references profiles(id) is ON DELETE CASCADE and profiles
--     cascades from auth.users, so a REAL deletion is well defined (it removes
--     the person's projects, devlogs, comments, reactions, posts, sessions,
--     memberships, publisher data, ...). The old flow left the auth user in
--     place, so the "deleted" account could simply sign in again.
--  A2 The service-role key is not configured, so app code cannot delete an auth
--     user. delete_my_account() does it as a SECURITY DEFINER function acting
--     only on auth.uid(), after refusing while the caller is the only owner of
--     a studio that still has other members.
--  N1 The notification preferences page listed toggles with "coming soon"; no
--     preference storage existed and no email is ever sent (lib/email has no
--     callers and no provider key is configured). In-product category
--     preferences are real and enforceable at the single choke point every
--     notification passes through (an INSERT trigger), so they are added here;
--     email preferences are deliberately NOT modelled.
--  N2 A recipient could UPDATE any column of their own notifications; only
--     read_at should be writable.
--  N3 Notifications from someone the recipient has blocked or muted (client
--     inserted: follow/comment/reply/reaction) were still delivered.

-- ── notification preferences (in-product only) ──────────────────────────────

create table if not exists public.notification_preferences (
  user_id       uuid primary key references public.profiles(id) on delete cascade,
  activity      boolean not null default true,  -- follow, comment, reply, reaction, mention
  collaboration boolean not null default true,  -- collab_*
  playtesting   boolean not null default true,  -- playtest_*
  studios       boolean not null default true,  -- studio_*
  publisher     boolean not null default true,  -- publisher_contact
  updated_at    timestamptz not null default now()
);
alter table public.notification_preferences enable row level security;
create policy "notification_preferences_read" on public.notification_preferences for select using (auth.uid() = user_id);
create policy "notification_preferences_insert" on public.notification_preferences for insert with check (auth.uid() = user_id);
create policy "notification_preferences_update" on public.notification_preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
revoke all on public.notification_preferences from anon, authenticated;
grant select on public.notification_preferences to authenticated;
grant insert (user_id, activity, collaboration, playtesting, studios, publisher) on public.notification_preferences to authenticated;
grant update (activity, collaboration, playtesting, studios, publisher, updated_at) on public.notification_preferences to authenticated;

create or replace function public.notification_category(t text)
returns text language sql immutable as $$
  select case
    when t like 'collab\_%' then 'collaboration'
    when t like 'playtest\_%' then 'playtesting'
    when t like 'studio\_%' then 'studios'
    when t = 'publisher_contact' then 'publisher'
    else 'activity'
  end;
$$;

-- Every notification, whoever inserts it (client or trigger), passes through here:
-- drop it silently if the recipient turned that category off, or if recipient and
-- actor have a block (either way) or the recipient muted the actor.
create or replace function public.notifications_gate()
returns trigger language plpgsql security definer set search_path = public as $$
declare cat text; allowed boolean;
begin
  if new.actor_id is not null and new.recipient_id is not null then
    if exists (select 1 from public.user_blocks b
               where (b.blocker_id = new.recipient_id and b.blocked_id = new.actor_id)
                  or (b.blocker_id = new.actor_id and b.blocked_id = new.recipient_id)) then
      return null;
    end if;
    if exists (select 1 from public.user_mutes m where m.muter_id = new.recipient_id and m.muted_id = new.actor_id) then
      return null;
    end if;
  end if;
  cat := public.notification_category(new.type);
  select case cat
           when 'activity' then p.activity when 'collaboration' then p.collaboration
           when 'playtesting' then p.playtesting when 'studios' then p.studios else p.publisher end
    into allowed
  from public.notification_preferences p where p.user_id = new.recipient_id;
  if allowed is false then return null; end if;
  return new;
end;
$$;
drop trigger if exists notifications_gate_trg on public.notifications;
create trigger notifications_gate_trg before insert on public.notifications
  for each row execute function public.notifications_gate();

-- Only read_at is writable by a recipient.
revoke update on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

-- ── account deletion ────────────────────────────────────────────────────────

create or replace function public.account_deletion_summary()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); blockers jsonb;
begin
  if uid is null then raise exception 'Sign in to continue.'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('slug', s.slug, 'name', s.name,
           'others', (select count(*) from public.studio_members o where o.studio_id = s.id and o.user_id <> uid))), '[]'::jsonb)
    into blockers
  from public.studio_members m join public.studios s on s.id = m.studio_id
  where m.user_id = uid and m.role = 'owner' and s.status = 'active'
    and not exists (select 1 from public.studio_members o where o.studio_id = s.id and o.role = 'owner' and o.user_id <> uid)
    and exists (select 1 from public.studio_members o where o.studio_id = s.id and o.user_id <> uid);

  return jsonb_build_object(
    'blockers', blockers,
    'projects', (select count(*) from public.projects where owner_id = uid),
    'devlogs', (select count(*) from public.devlog_posts where author_id = uid),
    'comments', (select count(*) from public.comments where author_id = uid),
    'reactions', (select count(*) from public.reactions where user_id = uid),
    'followers', (select count(*) from public.follows where followed_id = uid),
    'following', (select count(*) from public.follows where follower_id = uid),
    'collab_posts', (select count(*) from public.collaboration_posts where author_id = uid),
    'applications', (select count(*) from public.collaboration_applications where applicant_id = uid),
    'playtest_requests', (select count(*) from public.playtest_requests where author_id = uid),
    'playtest_sessions', (select count(*) from public.playtest_sessions where tester_id = uid),
    'studios_left', (select count(*) from public.studio_members where user_id = uid),
    'studios_closed', (select count(*) from public.studio_members m where m.user_id = uid
                       and not exists (select 1 from public.studio_members o where o.studio_id = m.studio_id and o.user_id <> uid)),
    'publisher_account', exists (select 1 from public.publisher_accounts where user_id = uid),
    'contacts_sent', (select count(*) from public.publisher_contacts c join public.publisher_accounts a on a.id = c.publisher_id where a.user_id = uid),
    'contacts_received', (select count(*) from public.publisher_contacts where developer_id = uid),
    'shortlists', (select count(*) from public.publisher_shortlists s join public.publisher_accounts a on a.id = s.publisher_id where a.user_id = uid),
    'notifications', (select count(*) from public.notifications where recipient_id = uid),
    'blocks', (select count(*) from public.user_blocks where blocker_id = uid),
    'mutes', (select count(*) from public.user_mutes where muter_id = uid)
  );
end;
$$;

-- Permanent deletion of the caller's own account. Acts only on auth.uid(); takes no
-- target argument, so one user can never delete another. Everything the schema
-- cascades from the profile is removed with the auth user.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); blocked text;
begin
  if uid is null then raise exception 'Sign in to continue.'; end if;
  select string_agg(s.name, ', ') into blocked
  from public.studio_members m join public.studios s on s.id = m.studio_id
  where m.user_id = uid and m.role = 'owner' and s.status = 'active'
    and not exists (select 1 from public.studio_members o where o.studio_id = s.id and o.role = 'owner' and o.user_id <> uid)
    and exists (select 1 from public.studio_members o where o.studio_id = s.id and o.user_id <> uid);
  if blocked is not null then
    raise exception 'You are the only owner of % and it still has other members. Make another member an owner, or remove the other members, first.', blocked;
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.notifications_gate() from public, anon, authenticated;
revoke all on function public.account_deletion_summary() from public, anon;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.account_deletion_summary() to authenticated;
grant execute on function public.delete_my_account() to authenticated;
