-- Verification of the 017/018 fixes surfaced a third, distinct bug in the
-- same authorization surface: studio_members_insert's `auth.uid() = user_id`
-- clause let ANY authenticated user self-insert into ANY studio's member
-- list, as ANY role (including 'owner'), with no check on which studio or
-- whether they belong there. Confirmed exploitable via a live cross-tenant
-- authorization test: Account A successfully inserted itself as 'owner' of
-- Account B's studio, then successfully updated that studio's name and
-- attached a project to it.
--
-- This clause exists to support the legitimate case: a freshly-created
-- studio (zero members yet) needs its creator to self-insert as owner.
-- Fix: restrict the self-insert clause to that exact bootstrapping case —
-- only when the target studio currently has no members at all — rather
-- than allowing it unconditionally for any studio at any time.

create or replace function public.studio_has_members(p_studio_id uuid)
returns boolean language sql security definer as $$
  select exists (select 1 from public.studio_members where studio_id = p_studio_id)
$$;

drop policy if exists "studio_members_insert" on public.studio_members;
create policy "studio_members_insert" on public.studio_members
  for insert with check (
    (auth.uid() = user_id and not public.studio_has_members(studio_id))
    or public.is_studio_member(studio_id, array['owner','admin'])
  );
