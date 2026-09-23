-- Phase 9 (Studios + Publisher) audit findings and fix.
--
-- All of these were reproduced with authenticated-role SQL in rolled-back
-- transactions before this migration:
--
--  STUDIOS
--   S1 A studio ADMIN could promote any member (or themselves) to owner.
--   S2 A studio ADMIN could remove the OWNER.
--   S3 "Invite" was a forced add: an owner/admin inserted any developer into the
--      studio, with any role, with no consent and no notification. No invitation
--      lifecycle existed at all.
--   S4 An admin could set studios.verified / plan on their own studio, and any
--      user could INSERT a studio that is already verified with plan 'team'.
--   S5 Any signed-in user could claim ownership of an EMPTY studio (the create
--      path relied on "insert yourself into a studio that has no members").
--   S6 The public Team list was always empty for visitors (membership was
--      readable only by members).
--   S7 studio_projects was publicly readable: private project ids leaked, and the
--      public studio page showed UNLISTED projects.
--   S8 The last-owner rule lived only in app code; a direct delete/update
--      bypassed it, and a project's own owner who is only a "member" could not
--      unlink their project.
--
--  PUBLISHER
--   P1 A user could self-register a publisher account already verified (or set
--      verified on their own row).
--   P2 The publisher directory could never show anyone: publisher_accounts was
--      readable only by its own user, and there was no admin path to verify a
--      publisher at all (verifyStudio also updated 0 rows for a non-member admin).
--   P3 Contacts carried no project, so "which game?" was lost; a publisher could
--      insert any status, contact a developer who had blocked them, and contact
--      the same developer unlimited times.
--   P4 A developer could rewrite the MESSAGE of a contact they received.
--   P5 Developers had no inbox for contacts and the notification was faked as
--      type 'mention' ("X mentioned you").
--   P6 Shortlists could hold non-uuid junk, duplicates and private project ids.
--
-- Design: lifecycle rules live in the database (guard triggers, definer RPCs for
-- create/invite/accept), privileged columns are not writable by clients, and
-- notifications are created by the same triggers. Migrations 017-033 unchanged.

-- ── notifications: real types for these events ──────────────────────────────

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type = any (array[
  'follow', 'comment', 'reply', 'reaction', 'mention',
  'collab_application', 'collab_accepted', 'collab_rejected', 'collab_closed',
  'playtest_signup', 'playtest_accepted', 'playtest_skipped', 'playtest_feedback',
  'studio_invitation', 'studio_invite_accepted', 'studio_role_changed', 'studio_removed',
  'publisher_contact'
]));

-- ── admin verification (server-only) ────────────────────────────────────────

create or replace function public.admin_set_verified(p_kind text, p_id uuid, p_verified boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not authorized.'; end if;
  if p_kind = 'studio' then
    update public.studios set verified = p_verified, verified_at = case when p_verified then now() else null end where id = p_id;
  elsif p_kind = 'publisher' then
    update public.publisher_accounts set verified = p_verified where id = p_id;
  else
    raise exception 'Unknown kind.';
  end if;
  if not found then raise exception 'Not found.'; end if;
end;
$$;

-- ══ STUDIOS ═════════════════════════════════════════════════════════════════

alter table public.studios add constraint studios_website_https check (website is null or website ~ '^https://[^[:space:]]+$') not valid;
alter table public.studios add constraint studios_logo_https check (logo_url is null or logo_url ~ '^https://[^[:space:]]+$') not valid;
alter table public.studios add constraint studios_banner_https check (banner_url is null or banner_url ~ '^https://[^[:space:]]+$') not valid;

-- Clients may edit identity fields only. verified/plan/status/stripe_* and slug
-- are never client-writable; creation goes through create_studio().
revoke insert, update on public.studios from anon, authenticated;
grant update (name, description, logo_url, banner_url, website, founded_year, location, size) on public.studios to authenticated;
drop policy if exists "studios_insert" on public.studios;

create or replace function public.create_studio(
  p_slug text, p_name text, p_description text, p_website text, p_location text, p_size text, p_founded_year int
) returns uuid language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); sid uuid;
begin
  if uid is null then raise exception 'Sign in to continue.'; end if;
  insert into public.studios (slug, name, description, website, location, size, founded_year)
  values (p_slug, p_name, nullif(p_description, ''), nullif(p_website, ''), nullif(p_location, ''), coalesce(p_size, 'solo'), p_founded_year)
  returning id into sid;
  insert into public.studio_members (studio_id, user_id, role) values (sid, uid, 'owner');
  return sid;
end;
$$;

-- Membership is created only by create_studio() and invitation acceptance.
drop policy if exists "studio_members_insert" on public.studio_members;

-- Team is public for active studios (the public studio page), plus your own rows.
drop policy if exists "studio_members_read" on public.studio_members;
create policy "studio_members_read" on public.studio_members
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.studios s where s.id = studio_members.studio_id)
  );

create or replace function public.studio_members_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  actor_role text;
  owners int;
  others int;
begin
  if uid is null then return coalesce(new, old); end if;
  perform 1 from public.studios where id = old.studio_id for update;
  if not found then return coalesce(new, old); end if;
  select role into actor_role from public.studio_members where studio_id = old.studio_id and user_id = uid;

  if tg_op = 'UPDATE' then
    if new.studio_id <> old.studio_id or new.user_id <> old.user_id or new.created_at <> old.created_at then
      raise exception 'Only a member''s role can change.';
    end if;
    if new.role = old.role then return new; end if;
    if actor_role is distinct from 'owner' then raise exception 'Only a studio owner can change roles.'; end if;
    if old.role = 'owner' and new.role <> 'owner' then
      select count(*) into owners from public.studio_members where studio_id = old.studio_id and role = 'owner' and id <> old.id;
      if owners = 0 then raise exception 'A studio must have at least one owner. Promote another member to owner first.'; end if;
    end if;
    return new;
  end if;

  -- DELETE
  if uid = old.user_id then
    if old.role = 'owner' then
      select count(*) into owners from public.studio_members where studio_id = old.studio_id and role = 'owner' and id <> old.id;
      select count(*) into others from public.studio_members where studio_id = old.studio_id and id <> old.id;
      if owners = 0 and others > 0 then
        raise exception 'You are the last owner. Promote another member to owner before leaving.';
      end if;
    end if;
    return old;
  end if;
  if actor_role = 'owner' then return old; end if;
  if actor_role = 'admin' and old.role = 'member' then return old; end if;
  raise exception 'You do not have permission to remove this member.';
end;
$$;
drop trigger if exists studio_members_guard_trg on public.studio_members;
create trigger studio_members_guard_trg before update or delete on public.studio_members
  for each row execute function public.studio_members_guard();

create or replace function public.studio_members_after()
returns trigger language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if tg_op = 'UPDATE' then
    if old.role <> new.role then
      perform public.notify_event(new.user_id, uid, 'studio_role_changed', 'studio', new.studio_id);
    end if;
    return null;
  end if;
  if uid is not null and uid <> old.user_id then
    perform public.notify_event(old.user_id, uid, 'studio_removed', 'studio', old.studio_id);
  end if;
  -- A studio with nobody left is retired instead of being left claimable.
  if not exists (select 1 from public.studio_members where studio_id = old.studio_id) then
    update public.studios set status = 'deleted' where id = old.studio_id and status = 'active';
  end if;
  return null;
end;
$$;
drop trigger if exists studio_members_after_trg on public.studio_members;
create trigger studio_members_after_trg after update of role or delete on public.studio_members
  for each row execute function public.studio_members_after();

-- Invitations
create table if not exists public.studio_invitations (
  id           uuid primary key default gen_random_uuid(),
  studio_id    uuid not null references public.studios(id) on delete cascade,
  invitee_id   uuid not null references public.profiles(id) on delete cascade,
  invited_by   uuid not null references public.profiles(id) on delete cascade,
  role         text not null check (role in ('admin', 'member')),
  status       text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'revoked')),
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default (now() + interval '14 days'),
  responded_at timestamptz
);
create unique index if not exists studio_invitations_one_pending on public.studio_invitations (studio_id, invitee_id) where status = 'pending';
create index if not exists studio_invitations_invitee_idx on public.studio_invitations (invitee_id, status);
alter table public.studio_invitations enable row level security;

create or replace function public.is_studio_manager(p_studio uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.studio_members where studio_id = p_studio and user_id = auth.uid() and role in ('owner', 'admin'));
$$;

create policy "studio_invitations_read" on public.studio_invitations
  for select using (auth.uid() = invitee_id or public.is_studio_manager(studio_id));
revoke all on public.studio_invitations from anon, authenticated;
grant select on public.studio_invitations to authenticated;

create or replace function public.invite_studio_member(p_studio uuid, p_username text, p_role text)
returns uuid language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); actor_role text; target uuid; inv uuid;
begin
  if uid is null then raise exception 'Sign in to continue.'; end if;
  select role into actor_role from public.studio_members where studio_id = p_studio and user_id = uid;
  if actor_role not in ('owner', 'admin') then raise exception 'Only studio owners and admins can invite people.'; end if;
  if not exists (select 1 from public.studios where id = p_studio and status = 'active') then raise exception 'Studio not found.'; end if;
  if p_role not in ('admin', 'member') then raise exception 'Invalid role.'; end if;
  if p_role = 'admin' and actor_role <> 'owner' then raise exception 'Only an owner can invite an admin.'; end if;

  select id into target from public.profiles where lower(username) = lower(btrim(p_username)) and is_onboarded;
  -- Same message whether the person does not exist or blocks/is blocked: no leak.
  if target is null or public.users_blocked(uid, target) then raise exception 'No developer found with that username.'; end if;
  if exists (select 1 from public.studio_members where studio_id = p_studio and user_id = target) then
    raise exception 'That developer is already a member of this studio.';
  end if;
  begin
    insert into public.studio_invitations (studio_id, invitee_id, invited_by, role) values (p_studio, target, uid, p_role) returning id into inv;
  exception when unique_violation then
    raise exception 'That developer already has a pending invitation.';
  end;
  perform public.notify_event(target, uid, 'studio_invitation', 'studio_invitation', inv);
  return inv;
end;
$$;

create or replace function public.respond_studio_invitation(p_invitation uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); inv record;
begin
  if uid is null then raise exception 'Sign in to continue.'; end if;
  select * into inv from public.studio_invitations where id = p_invitation and invitee_id = uid for update;
  if not found then raise exception 'Invitation not found.'; end if;
  if inv.status <> 'pending' then raise exception 'This invitation is no longer active.'; end if;
  if inv.expires_at <= now() then raise exception 'This invitation has expired. Ask the studio to invite you again.'; end if;
  if p_accept then
    if not exists (select 1 from public.studios where id = inv.studio_id and status = 'active') then raise exception 'This studio is no longer active.'; end if;
    insert into public.studio_members (studio_id, user_id, role) values (inv.studio_id, uid, inv.role) on conflict (studio_id, user_id) do nothing;
    update public.studio_invitations set status = 'accepted', responded_at = now() where id = inv.id;
    perform public.notify_event(inv.invited_by, uid, 'studio_invite_accepted', 'studio', inv.studio_id);
  else
    update public.studio_invitations set status = 'declined', responded_at = now() where id = inv.id;
  end if;
end;
$$;

create or replace function public.revoke_studio_invitation(p_invitation uuid)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); inv record;
begin
  if uid is null then raise exception 'Sign in to continue.'; end if;
  select * into inv from public.studio_invitations where id = p_invitation for update;
  if not found or not public.is_studio_manager(inv.studio_id) then raise exception 'Invitation not found.'; end if;
  if inv.status <> 'pending' then raise exception 'This invitation is no longer active.'; end if;
  update public.studio_invitations set status = 'revoked', responded_at = now() where id = inv.id;
end;
$$;

-- studio_projects: no private-project id leak; a project's own owner can unlink it.
drop policy if exists "studio_projects_read" on public.studio_projects;
create policy "studio_projects_read" on public.studio_projects
  for select using (
    exists (select 1 from public.projects p where p.id = studio_projects.project_id)
    or public.is_studio_manager(studio_id)
  );
drop policy if exists "studio_projects_delete" on public.studio_projects;
create policy "studio_projects_delete" on public.studio_projects
  for delete using (
    public.is_studio_manager(studio_id)
    or exists (select 1 from public.projects p where p.id = studio_projects.project_id and p.owner_id = auth.uid())
  );

-- Public team (viewer-relative: blocked/muted people are not shown to the viewer).
drop view if exists public.studio_team;
create view public.studio_team with (security_invoker = true) as
select m.studio_id, m.user_id, m.role, m.created_at as joined_at,
       pr.username, pr.display_name, pr.avatar_url, pr.primary_role
from public.studio_members m
join public.profiles pr on pr.id = m.user_id
where not public.hidden_from_viewer(m.user_id);
revoke all on public.studio_team from anon, authenticated;
grant select on public.studio_team to anon, authenticated;

-- ══ PUBLISHER ═══════════════════════════════════════════════════════════════

alter table public.publisher_accounts add column if not exists description text check (description is null or length(description) <= 2000);
alter table public.publisher_accounts add column if not exists website text check (website is null or (length(website) <= 500 and website ~ '^https://[^[:space:]]+$'));

revoke insert, update on public.publisher_accounts from anon, authenticated;
grant insert (user_id, company_name, description, website) on public.publisher_accounts to authenticated;
grant update (company_name, description, website) on public.publisher_accounts to authenticated;

-- Verified publishers are public (the directory); everyone else sees only their own.
drop policy if exists "publisher_accounts_read" on public.publisher_accounts;
create policy "publisher_accounts_read" on public.publisher_accounts
  for select using (verified or auth.uid() = user_id or public.is_admin());
drop policy if exists "publisher_accounts_update" on public.publisher_accounts;
create policy "publisher_accounts_update" on public.publisher_accounts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Contacts carry the project being discussed and one contact per publisher+developer+project.
alter table public.publisher_contacts add column if not exists project_id uuid references public.projects(id) on delete set null;
create unique index if not exists publisher_contacts_one_per_target
  on public.publisher_contacts (publisher_id, developer_id, coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid));

drop policy if exists "publisher_contacts_update" on public.publisher_contacts;
create policy "publisher_contacts_update" on public.publisher_contacts
  for update using (auth.uid() = developer_id) with check (auth.uid() = developer_id);

create or replace function public.publisher_contacts_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); pub record; proj record; recent int;
begin
  if uid is null then return new; end if;

  if tg_op = 'UPDATE' then
    if uid <> old.developer_id then raise exception 'Only the developer can update a contact.'; end if;
    if new.publisher_id <> old.publisher_id or new.developer_id <> old.developer_id or new.message <> old.message
       or new.project_id is distinct from old.project_id or new.created_at <> old.created_at then
      raise exception 'Only the status of a contact can change.';
    end if;
    if new.status = old.status then return new; end if;
    if old.status = 'archived' or new.status = 'sent' then raise exception 'That status change is not allowed.'; end if;
    return new;
  end if;

  select user_id, verified into pub from public.publisher_accounts where id = new.publisher_id;
  if not found or pub.user_id <> uid then raise exception 'That is not your publisher account.'; end if;
  if not pub.verified then raise exception 'Your publisher account must be verified before you can contact developers.'; end if;
  if new.status <> 'sent' then raise exception 'A new contact starts as sent.'; end if;
  if new.developer_id = uid then raise exception 'You cannot contact yourself.'; end if;
  if not exists (select 1 from public.profiles where id = new.developer_id and is_onboarded)
     or public.users_blocked(uid, new.developer_id) then
    raise exception 'This developer is not available to contact.';
  end if;
  if new.project_id is not null then
    select owner_id, visibility into proj from public.projects where id = new.project_id;
    if not found or proj.owner_id <> new.developer_id or proj.visibility <> 'public' then
      raise exception 'That project is not available.';
    end if;
  end if;
  select count(*) into recent from public.publisher_contacts where publisher_id = new.publisher_id and created_at > now() - interval '1 day';
  if recent >= 20 then raise exception 'Daily contact limit reached. Try again tomorrow.'; end if;
  return new;
end;
$$;
drop trigger if exists publisher_contacts_guard_trg on public.publisher_contacts;
create trigger publisher_contacts_guard_trg before insert or update on public.publisher_contacts
  for each row execute function public.publisher_contacts_guard();

create or replace function public.publisher_contacts_after()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_event(new.developer_id, auth.uid(), 'publisher_contact', 'publisher_contact', new.id);
  return null;
end;
$$;
drop trigger if exists publisher_contacts_after_trg on public.publisher_contacts;
create trigger publisher_contacts_after_trg after insert on public.publisher_contacts
  for each row execute function public.publisher_contacts_after();

-- Shortlists: a JSON array of unique project ids, max 100, public projects only when added.
create or replace function public.publisher_shortlists_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare elem text;
begin
  if jsonb_typeof(new.items) <> 'array' then raise exception 'A shortlist must be a list of projects.'; end if;
  if jsonb_array_length(new.items) > 100 then raise exception 'Shortlist is full (max 100 projects).'; end if;
  if (select count(distinct x) from jsonb_array_elements_text(new.items) x) <> jsonb_array_length(new.items) then
    raise exception 'That project is already in this shortlist.';
  end if;
  for elem in select jsonb_array_elements_text(new.items) loop
    if elem !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'Invalid project.'; end if;
    if tg_op = 'INSERT' or not (old.items ? elem) then
      if not exists (select 1 from public.projects where id = elem::uuid and visibility = 'public') then
        raise exception 'Only public projects can be shortlisted.';
      end if;
    end if;
  end loop;
  return new;
end;
$$;
drop trigger if exists publisher_shortlists_guard_trg on public.publisher_shortlists;
create trigger publisher_shortlists_guard_trg before insert or update on public.publisher_shortlists
  for each row execute function public.publisher_shortlists_guard();

-- ── privileges for the new functions ────────────────────────────────────────

revoke all on function public.studio_members_guard() from public, anon, authenticated;
revoke all on function public.studio_members_after() from public, anon, authenticated;
revoke all on function public.publisher_contacts_guard() from public, anon, authenticated;
revoke all on function public.publisher_contacts_after() from public, anon, authenticated;
revoke all on function public.publisher_shortlists_guard() from public, anon, authenticated;
revoke all on function public.admin_set_verified(text, uuid, boolean) from public, anon;
revoke all on function public.create_studio(text, text, text, text, text, text, int) from public, anon;
revoke all on function public.invite_studio_member(uuid, text, text) from public, anon;
revoke all on function public.respond_studio_invitation(uuid, boolean) from public, anon;
revoke all on function public.revoke_studio_invitation(uuid) from public, anon;
revoke all on function public.is_studio_manager(uuid) from public;
grant execute on function public.admin_set_verified(text, uuid, boolean) to authenticated;
grant execute on function public.create_studio(text, text, text, text, text, text, int) to authenticated;
grant execute on function public.invite_studio_member(uuid, text, text) to authenticated;
grant execute on function public.respond_studio_invitation(uuid, boolean) to authenticated;
grant execute on function public.revoke_studio_invitation(uuid) to authenticated;
grant execute on function public.is_studio_manager(uuid) to anon, authenticated;
