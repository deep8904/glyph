-- Phase 8 (Collaboration + Playtesting) audit findings and fix.
--
-- Every finding below was reproduced with authenticated-role SQL in rolled-back
-- transactions before this migration:
--
--  COLLABORATION
--   C1 An applicant could INSERT an application with status = 'accepted'
--      (self-accept); nothing constrained the initial status.
--   C2 RLS never checked the post was open/unexpired or not the applicant's own,
--      so the "closed post rejects applications" rule existed only in app code.
--   C3 An applicant could not read the post they applied to once it was closed
--      (404), so the final state of an application was invisible to them.
--   C4 There was no way for an applicant to withdraw an application.
--   C5 Post owners could rewrite any column of an application (message,
--      applicant, status history) — only the status should ever change.
--
--  PLAYTESTING
--   P1 A tester could INSERT a session already 'accepted' (self-accept) and
--      UPDATE their own session to any status, including flipping a session the
--      developer skipped back to 'accepted'.
--   P2 A tester could sign up directly to a 'full' or 'closed' request.
--   P3 playtest_requests.current_testers was maintained by the TESTER's client,
--      whom RLS does not allow to update the request (0 rows), so the counter
--      never moved, capacity was never enforced and "full" never happened.
--      Existing data had drifted (current_testers 4 vs 1 real session).
--   P4 Open playtest requests were world-readable, including requests on a
--      PRIVATE project and the build_url itself.
--   P5 A tester with a session lost read access to the request as soon as it was
--      no longer 'open' (full/closed) -> 404 on their own playtest.
--   P6 Feedback could be inserted for a session that was never accepted.
--   P7 build_url was never shown to testers anywhere (no way to reach the build).
--
--  NOTIFICATIONS
--   N1 notifications.type only allowed the five social types, so application and
--      playtest events were faked as type 'mention' ("X mentioned you").
--   N2 Any signed-in user could insert a notification of any type for anyone.
--
-- Design: the lifecycle rules live in the database as guard triggers (so a
-- direct API call cannot skip what the UI enforces), counters are derived by a
-- trigger (no read-modify-write from a client, no race), and workflow
-- notifications are created by the same triggers (atomic, no duplicates).
-- Migrations 017-031 are not modified.

-- ── helpers (SECURITY DEFINER only where a policy must read across RLS) ─────

create or replace function public.users_blocked(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

create or replace function public.is_collab_applicant(p_post uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.collaboration_applications where post_id = p_post and applicant_id = auth.uid());
$$;

create or replace function public.has_playtest_session(p_request uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.playtest_sessions where request_id = p_request and tester_id = auth.uid());
$$;

create or replace function public.notify_event(p_recipient uuid, p_actor uuid, p_type text, p_entity_type text, p_entity_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_recipient is null or p_actor is null or p_recipient = p_actor then return; end if;
  if public.users_blocked(p_recipient, p_actor) then return; end if;
  insert into public.notifications (recipient_id, actor_id, type, entity_type, entity_id)
  values (p_recipient, p_actor, p_type, p_entity_type, p_entity_id);
end;
$$;

revoke all on function public.users_blocked(uuid, uuid) from public, anon, authenticated;
revoke all on function public.notify_event(uuid, uuid, text, text, uuid) from public, anon, authenticated;
revoke all on function public.is_collab_applicant(uuid) from public;
revoke all on function public.has_playtest_session(uuid) from public;
grant execute on function public.is_collab_applicant(uuid) to anon, authenticated;
grant execute on function public.has_playtest_session(uuid) to anon, authenticated;

-- ── notifications ────────────────────────────────────────────────────────────

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type = any (array[
  'follow', 'comment', 'reply', 'reaction', 'mention',
  'collab_application', 'collab_accepted', 'collab_rejected', 'collab_closed',
  'playtest_signup', 'playtest_accepted', 'playtest_skipped', 'playtest_feedback'
]));

-- Clients may only create the social notification types; workflow types are
-- created by the triggers below, so they cannot be forged.
drop policy if exists "Authenticated users can insert notifications" on public.notifications;
create policy "Authenticated users can insert notifications" on public.notifications
  for insert with check (
    auth.uid() = actor_id
    and type in ('follow', 'comment', 'reply', 'reaction', 'mention')
  );

-- ══ COLLABORATION ═══════════════════════════════════════════════════════════

alter table public.collaboration_applications drop constraint if exists collaboration_applications_status_check;
alter table public.collaboration_applications add constraint collaboration_applications_status_check
  check (status = any (array['pending', 'accepted', 'rejected', 'withdrawn']));

-- Applicants can read the post they applied to, whatever its status.
drop policy if exists "collab_posts_read" on public.collaboration_posts;
create policy "collab_posts_read" on public.collaboration_posts
  for select using (
    status in ('open', 'filled')
    or auth.uid() = author_id
    or public.is_collab_applicant(id)
  );

-- Post owner decides; applicant may withdraw. What may change is enforced by
-- the guard trigger; the policies pin who may touch which rows.
drop policy if exists "collab_apps_update" on public.collaboration_applications;
create policy "collab_apps_update_owner" on public.collaboration_applications
  for update
  using (exists (select 1 from public.collaboration_posts p where p.id = collaboration_applications.post_id and p.author_id = auth.uid()))
  with check (exists (select 1 from public.collaboration_posts p where p.id = collaboration_applications.post_id and p.author_id = auth.uid()));
create policy "collab_apps_update_applicant" on public.collaboration_applications
  for update
  using (auth.uid() = applicant_id)
  with check (auth.uid() = applicant_id);

create or replace function public.collab_applications_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  post record;
begin
  if uid is null then return new; end if; -- system / service contexts

  select p.author_id, p.status, p.expires_at into post
  from public.collaboration_posts p where p.id = coalesce(new.post_id, old.post_id);
  if not found then raise exception 'Post not found.'; end if;

  if tg_op = 'INSERT' then
    if new.applicant_id <> uid then raise exception 'You can only apply as yourself.'; end if;
    if new.status <> 'pending' then raise exception 'Applications start as pending.'; end if;
    if post.author_id = uid then raise exception 'You cannot apply to your own post.'; end if;
    if post.status <> 'open' or post.expires_at <= now() then raise exception 'This post is no longer open.'; end if;
    if public.users_blocked(uid, post.author_id) then raise exception 'You cannot apply to this post.'; end if;
    return new;
  end if;

  -- UPDATE: everything except status is immutable
  if new.post_id <> old.post_id or new.applicant_id <> old.applicant_id
     or new.message <> old.message or new.created_at <> old.created_at then
    raise exception 'Only the status of an application can change.';
  end if;
  if new.status = old.status then return new; end if;

  if uid = post.author_id and old.status = 'pending' and new.status in ('accepted', 'rejected') then
    return new;
  elsif uid = old.applicant_id and old.status = 'pending' and new.status = 'withdrawn' then
    return new;
  end if;
  raise exception 'That status change is not allowed.';
end;
$$;

drop trigger if exists collab_applications_guard_trg on public.collaboration_applications;
create trigger collab_applications_guard_trg
  before insert or update on public.collaboration_applications
  for each row execute function public.collab_applications_guard();

create or replace function public.collab_applications_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare post_author uuid;
begin
  select author_id into post_author from public.collaboration_posts where id = new.post_id;
  if tg_op = 'INSERT' then
    perform public.notify_event(post_author, new.applicant_id, 'collab_application', 'collaboration_post', new.post_id);
  elsif old.status = 'pending' and new.status = 'accepted' then
    perform public.notify_event(new.applicant_id, post_author, 'collab_accepted', 'collaboration_post', new.post_id);
  elsif old.status = 'pending' and new.status = 'rejected' then
    perform public.notify_event(new.applicant_id, post_author, 'collab_rejected', 'collaboration_post', new.post_id);
  end if;
  return null;
end;
$$;
drop trigger if exists collab_applications_notify_trg on public.collaboration_applications;
create trigger collab_applications_notify_trg
  after insert or update of status on public.collaboration_applications
  for each row execute function public.collab_applications_notify();

-- When a post stops being open (closed or filled), tell applicants still waiting.
create or replace function public.collab_posts_closed_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if old.status = 'open' and new.status in ('closed', 'filled') then
    for r in select applicant_id from public.collaboration_applications where post_id = new.id and status = 'pending' loop
      perform public.notify_event(r.applicant_id, new.author_id, 'collab_closed', 'collaboration_post', new.id);
    end loop;
  end if;
  return null;
end;
$$;
drop trigger if exists collab_posts_closed_notify_trg on public.collaboration_posts;
create trigger collab_posts_closed_notify_trg
  after update of status on public.collaboration_posts
  for each row execute function public.collab_posts_closed_notify();

-- ══ PLAYTESTING ═════════════════════════════════════════════════════════════
--
-- Session states: requested -> accepted -> completed (by feedback)
--                 requested|accepted -> skipped   (developer's decision, terminal)
--                 requested|accepted -> withdrawn (tester's decision; may re-request)
-- Request states: open <-> full (derived from capacity), closed (developer's choice).
-- current_testers = sessions that are accepted or completed ("confirmed testers");
-- requested sessions wait in a queue and do not occupy capacity.

alter table public.playtest_sessions drop constraint if exists playtest_sessions_status_check;
alter table public.playtest_sessions add constraint playtest_sessions_status_check
  check (status = any (array['requested', 'accepted', 'completed', 'skipped', 'withdrawn']));

-- P4/P5: hide requests on private projects from strangers; testers keep access
-- to a request they have a session on even after it fills or closes.
drop policy if exists "playtest_requests_read" on public.playtest_requests;
create policy "playtest_requests_read" on public.playtest_requests
  for select using (
    auth.uid() = author_id
    or public.has_playtest_session(id)
    or (
      status in ('open', 'full')
      and exists (select 1 from public.projects p where p.id = project_id and p.visibility in ('public', 'unlisted'))
    )
  );

-- P7/P4: build_url is only for the developer and testers they accepted. It is no
-- longer selectable directly; get_playtest_build() releases it to those people.
revoke select on public.playtest_requests from anon, authenticated;
grant select (id, project_id, author_id, build_type, platforms, description, focus_areas,
              requested_testers, current_testers, status, created_at, updated_at)
  on public.playtest_requests to anon, authenticated;

create or replace function public.get_playtest_build(p_request uuid)
returns table (build_url text, build_type text)
language sql stable security definer set search_path = public as $$
  select r.build_url, r.build_type
  from public.playtest_requests r
  where r.id = p_request
    and auth.uid() is not null
    and (
      r.author_id = auth.uid()
      or exists (select 1 from public.playtest_sessions s
                 where s.request_id = r.id and s.tester_id = auth.uid() and s.status in ('accepted', 'completed'))
    );
$$;
revoke all on function public.get_playtest_build(uuid) from public;
grant execute on function public.get_playtest_build(uuid) to authenticated;

-- Session policies: pin who may touch which rows (the guard enforces transitions).
drop policy if exists "playtest_sessions_update" on public.playtest_sessions;
create policy "playtest_sessions_update" on public.playtest_sessions
  for update
  using (auth.uid() = tester_id or exists (select 1 from public.playtest_requests r where r.id = playtest_sessions.request_id and r.author_id = auth.uid()))
  with check (auth.uid() = tester_id or exists (select 1 from public.playtest_requests r where r.id = playtest_sessions.request_id and r.author_id = auth.uid()));

create or replace function public.playtest_sessions_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  req record;
  confirmed int;
  active int;
  tester uuid := coalesce(new.tester_id, old.tester_id);
  signing_up boolean;
begin
  if uid is null then return new; end if; -- system / service contexts

  select r.id, r.author_id, r.status, r.requested_testers, p.visibility into req
  from public.playtest_requests r join public.projects p on p.id = r.project_id
  where r.id = new.request_id
  for update of r;
  if not found then raise exception 'Playtest not found.'; end if;

  signing_up := (tg_op = 'INSERT') or (old.status = 'withdrawn' and new.status = 'requested' and uid = old.tester_id);

  if tg_op = 'UPDATE' and (new.request_id <> old.request_id or new.tester_id <> old.tester_id) then
    raise exception 'A session cannot be moved.';
  end if;
  if tg_op = 'UPDATE' and new.status = old.status then return new; end if;

  if signing_up then
    if tester <> uid then raise exception 'You can only sign up as yourself.'; end if;
    if tg_op = 'INSERT' and new.status <> 'requested' then raise exception 'Sign-ups start as requested.'; end if;
    if req.author_id = uid then raise exception 'You cannot test your own game.'; end if;
    if req.status = 'full' then raise exception 'This playtest is full.'; end if;
    if req.status <> 'open' then raise exception 'This playtest is not accepting testers.'; end if;
    if req.visibility = 'private' then raise exception 'Playtest not found.'; end if;
    if public.users_blocked(uid, req.author_id) then raise exception 'This playtest is not available to you.'; end if;
    select count(*) into active from public.playtest_sessions
      where tester_id = uid and status in ('requested', 'accepted') and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000');
    if active >= 3 then raise exception 'You can have at most 3 active sessions at a time.'; end if;
    return new;
  end if;

  -- transitions on an existing session
  if uid = req.author_id and old.status = 'requested' and new.status = 'accepted' then
    select count(*) into confirmed from public.playtest_sessions where request_id = req.id and status in ('accepted', 'completed');
    if confirmed >= req.requested_testers then raise exception 'This playtest is at capacity.'; end if;
    return new;
  elsif uid = req.author_id and old.status in ('requested', 'accepted') and new.status = 'skipped' then
    return new;
  elsif uid = old.tester_id and old.status in ('requested', 'accepted') and new.status = 'withdrawn' then
    return new;
  elsif old.status = 'accepted' and new.status = 'completed' and pg_trigger_depth() > 1 then
    return new; -- only via the feedback trigger
  end if;
  raise exception 'That session status change is not allowed.';
end;
$$;

drop trigger if exists playtest_sessions_guard_trg on public.playtest_sessions;
create trigger playtest_sessions_guard_trg
  before insert or update on public.playtest_sessions
  for each row execute function public.playtest_sessions_guard();

-- Derived counter + workflow notifications.
create or replace function public.playtest_sessions_after()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  rid uuid := coalesce(new.request_id, old.request_id);
  author uuid;
begin
  update public.playtest_requests r
     set current_testers = (select count(*) from public.playtest_sessions s where s.request_id = rid and s.status in ('accepted', 'completed'))
   where r.id = rid;

  select author_id into author from public.playtest_requests where id = rid;
  if tg_op = 'INSERT' then
    perform public.notify_event(author, new.tester_id, 'playtest_signup', 'playtest_request', rid);
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    if new.status = 'requested' and old.status = 'withdrawn' then
      perform public.notify_event(author, new.tester_id, 'playtest_signup', 'playtest_request', rid);
    elsif new.status = 'accepted' then
      perform public.notify_event(new.tester_id, author, 'playtest_accepted', 'playtest_request', rid);
    elsif new.status = 'skipped' then
      perform public.notify_event(new.tester_id, author, 'playtest_skipped', 'playtest_request', rid);
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists playtest_sessions_after_trg on public.playtest_sessions;
create trigger playtest_sessions_after_trg
  after insert or update or delete on public.playtest_sessions
  for each row execute function public.playtest_sessions_after();

-- Requests: clients cannot write the counter or move a request; status is
-- normalised (open <-> full follows capacity; closed is the developer's call).
create or replace function public.playtest_requests_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    if new.project_id <> old.project_id or new.author_id <> old.author_id then
      raise exception 'A playtest cannot be moved.';
    end if;
    if new.current_testers is distinct from old.current_testers and pg_trigger_depth() = 1 then
      raise exception 'The tester count is maintained automatically.';
    end if;
  end if;
  if new.status in ('open', 'full') then
    new.status := case when new.current_testers >= new.requested_testers then 'full' else 'open' end;
  end if;
  return new;
end;
$$;
drop trigger if exists playtest_requests_guard_trg on public.playtest_requests;
create trigger playtest_requests_guard_trg
  before update on public.playtest_requests
  for each row execute function public.playtest_requests_guard();

-- Feedback: only for the tester's own ACCEPTED session; completes the session
-- and tells the developer; the session it belongs to can never change.
create or replace function public.playtest_feedback_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare s record;
begin
  if tg_op = 'UPDATE' then
    if new.session_id <> old.session_id then raise exception 'Feedback cannot be moved to another session.'; end if;
    return new;
  end if;
  if auth.uid() is null then return new; end if;
  select tester_id, status into s from public.playtest_sessions where id = new.session_id;
  if not found or s.tester_id <> auth.uid() then raise exception 'Session not found.'; end if;
  if s.status <> 'accepted' then raise exception 'Feedback can only be submitted for an accepted session.'; end if;
  return new;
end;
$$;
drop trigger if exists playtest_feedback_guard_trg on public.playtest_feedback;
create trigger playtest_feedback_guard_trg
  before insert or update on public.playtest_feedback
  for each row execute function public.playtest_feedback_guard();

create or replace function public.playtest_feedback_after()
returns trigger language plpgsql security definer set search_path = public as $$
declare s record;
begin
  select ps.tester_id, ps.request_id, r.author_id into s
  from public.playtest_sessions ps join public.playtest_requests r on r.id = ps.request_id
  where ps.id = new.session_id;
  update public.playtest_sessions set status = 'completed' where id = new.session_id and status = 'accepted';
  perform public.notify_event(s.author_id, s.tester_id, 'playtest_feedback', 'playtest_request', s.request_id);
  return null;
end;
$$;
drop trigger if exists playtest_feedback_after_trg on public.playtest_feedback;
create trigger playtest_feedback_after_trg
  after insert on public.playtest_feedback
  for each row execute function public.playtest_feedback_after();

drop policy if exists "playtest_feedback_update" on public.playtest_feedback;
create policy "playtest_feedback_update" on public.playtest_feedback
  for update
  using (exists (select 1 from public.playtest_sessions s where s.id = playtest_feedback.session_id and s.tester_id = auth.uid()))
  with check (exists (select 1 from public.playtest_sessions s where s.id = playtest_feedback.session_id and s.tester_id = auth.uid()));

-- Backfill the derived counter (also normalises status through the guard).
update public.playtest_requests r
   set current_testers = (select count(*) from public.playtest_sessions s where s.request_id = r.id and s.status in ('accepted', 'completed'));

-- ── browse views (viewer-relative block/mute; no build_url) ─────────────────

drop view if exists public.discoverable_collab_posts;
create view public.discoverable_collab_posts with (security_invoker = true) as
select
  c.id, c.project_id, c.author_id, c.post_type, c.role_needed, c.role_offered, c.contract_type,
  c.remote_allowed, c.location, c.description, c.expires_at, c.created_at,
  pj.title as project_title, pj.slug as project_slug,
  pr.username, pr.display_name
from public.collaboration_posts c
join public.profiles pr on pr.id = c.author_id
left join public.projects pj on pj.id = c.project_id
where c.status = 'open'
  and c.expires_at > now()
  and not public.hidden_from_viewer(c.author_id);

drop view if exists public.discoverable_playtests;
create view public.discoverable_playtests with (security_invoker = true) as
select
  r.id, r.project_id, r.author_id, r.build_type, r.platforms, r.description, r.focus_areas,
  r.requested_testers, r.current_testers, r.created_at,
  pj.title as project_title, pj.slug as project_slug,
  pr.username, pr.display_name
from public.playtest_requests r
join public.projects pj on pj.id = r.project_id and pj.visibility = 'public'
join public.profiles pr on pr.id = r.author_id
where r.status = 'open'
  and not public.hidden_from_viewer(r.author_id);

revoke all on public.discoverable_collab_posts, public.discoverable_playtests from anon, authenticated;
grant select on public.discoverable_collab_posts, public.discoverable_playtests to anon, authenticated;
