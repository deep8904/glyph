-- Fix for 034: invite_studio_member() used `actor_role not in ('owner','admin')`.
-- For a caller who is not a member of the studio actor_role is NULL, and
-- NULL NOT IN (...) is NULL (not true), so the permission check was skipped and
-- ANY signed-in user could invite people to ANY studio. Found by the Phase 9
-- authenticated-role test suite ("stranger invites someone" succeeded).
create or replace function public.invite_studio_member(p_studio uuid, p_username text, p_role text)
returns uuid language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); actor_role text; target uuid; inv uuid;
begin
  if uid is null then raise exception 'Sign in to continue.'; end if;
  select role into actor_role from public.studio_members where studio_id = p_studio and user_id = uid;
  if actor_role is null or actor_role not in ('owner', 'admin') then raise exception 'Only studio owners and admins can invite people.'; end if;
  if not exists (select 1 from public.studios where id = p_studio and status = 'active') then raise exception 'Studio not found.'; end if;
  if p_role not in ('admin', 'member') then raise exception 'Invalid role.'; end if;
  if p_role = 'admin' and actor_role <> 'owner' then raise exception 'Only an owner can invite an admin.'; end if;

  select id into target from public.profiles where lower(username) = lower(btrim(p_username)) and is_onboarded;
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
revoke all on function public.invite_studio_member(uuid, text, text) from public, anon;
grant execute on function public.invite_studio_member(uuid, text, text) to authenticated;
