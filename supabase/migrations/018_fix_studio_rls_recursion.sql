-- The 017 fix corrected the correlated-subquery tautology bug, but exposed
-- a deeper, pre-existing problem: several policies check studio membership
-- via a raw `EXISTS (SELECT 1 FROM public.studio_members ...)` subquery.
-- Once that subquery's correlation was fixed to actually depend on real
-- data, evaluating it now re-triggers studio_members' OWN read policy
-- (which itself does the same kind of subquery on studio_members) —
-- infinite recursion ("infinite recursion detected in policy for
-- relation studio_members"). This affects every policy that references
-- studio_members in a subquery: studio_members_read/insert/delete,
-- studio_projects_insert/delete, subscriptions_read, and studios_update.
--
-- Fix: a SECURITY DEFINER helper function, matching the existing
-- public.is_admin() pattern in this codebase (015_admin.sql), which
-- bypasses RLS internally and breaks the recursion.

create or replace function public.is_studio_member(p_studio_id uuid, p_roles text[] default array['owner','admin','member'])
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.studio_members
    where studio_id = p_studio_id
      and user_id = auth.uid()
      and role = any(p_roles)
  )
$$;

drop policy if exists "studio_members_read" on public.studio_members;
create policy "studio_members_read" on public.studio_members
  for select using (
    auth.uid() = user_id
    or public.is_studio_member(studio_id)
  );

drop policy if exists "studio_members_insert" on public.studio_members;
create policy "studio_members_insert" on public.studio_members
  for insert with check (
    auth.uid() = user_id
    or public.is_studio_member(studio_id, array['owner','admin'])
  );

drop policy if exists "studio_members_delete" on public.studio_members;
create policy "studio_members_delete" on public.studio_members
  for delete using (
    auth.uid() = user_id
    or public.is_studio_member(studio_id, array['owner','admin'])
  );

drop policy if exists "studio_projects_insert" on public.studio_projects;
create policy "studio_projects_insert" on public.studio_projects
  for insert with check (public.is_studio_member(studio_id, array['owner','admin']));

drop policy if exists "studio_projects_delete" on public.studio_projects;
create policy "studio_projects_delete" on public.studio_projects
  for delete using (public.is_studio_member(studio_id, array['owner','admin']));

drop policy if exists "subscriptions_read" on public.subscriptions;
create policy "subscriptions_read" on public.subscriptions
  for select using (
    auth.uid() = user_id
    or public.is_studio_member(studio_id)
  );

drop policy if exists "studios_update" on public.studios;
create policy "studios_update" on public.studios
  for update using (public.is_studio_member(id, array['owner','admin']));
