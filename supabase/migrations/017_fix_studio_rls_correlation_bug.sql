-- Fix: several RLS policies used a correlated EXISTS subquery where the
-- inner subquery aliases the SAME table/column name as the column being
-- compared (e.g. `m.studio_id = studio_id` inside `... from studio_members m
-- where ...`). Postgres resolves the unqualified bare `studio_id` to the
-- innermost matching scope — the subquery's own `m.studio_id` — not the
-- outer row, producing an always-true tautology (`m.studio_id = m.studio_id`).
-- This broke multi-tenant isolation: any user who is owner/admin of ANY
-- studio satisfied the check for EVERY studio. Fix: qualify the outer
-- reference with the table's own name (distinct from the inner alias).

drop policy if exists "studio_members_read" on public.studio_members;
create policy "studio_members_read" on public.studio_members
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.studio_members m2 where m2.studio_id = studio_members.studio_id and m2.user_id = auth.uid())
  );

drop policy if exists "studio_members_insert" on public.studio_members;
create policy "studio_members_insert" on public.studio_members
  for insert with check (
    auth.uid() = user_id
    or exists (select 1 from public.studio_members m where m.studio_id = studio_members.studio_id and m.user_id = auth.uid() and m.role in ('owner', 'admin'))
  );

drop policy if exists "studio_members_delete" on public.studio_members;
create policy "studio_members_delete" on public.studio_members
  for delete using (
    auth.uid() = user_id
    or exists (select 1 from public.studio_members m where m.studio_id = studio_members.studio_id and m.user_id = auth.uid() and m.role in ('owner', 'admin'))
  );

drop policy if exists "studio_projects_insert" on public.studio_projects;
create policy "studio_projects_insert" on public.studio_projects
  for insert with check (
    exists (select 1 from public.studio_members m where m.studio_id = studio_projects.studio_id and m.user_id = auth.uid() and m.role in ('owner', 'admin'))
  );

drop policy if exists "studio_projects_delete" on public.studio_projects;
create policy "studio_projects_delete" on public.studio_projects
  for delete using (
    exists (select 1 from public.studio_members m where m.studio_id = studio_projects.studio_id and m.user_id = auth.uid() and m.role in ('owner', 'admin'))
  );

drop policy if exists "subscriptions_read" on public.subscriptions;
create policy "subscriptions_read" on public.subscriptions
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.studio_members m where m.studio_id = subscriptions.studio_id and m.user_id = auth.uid())
  );

-- Defense in depth: studios_insert previously allowed unauthenticated
-- inserts at the RLS layer (`with check (true)`), relying entirely on the
-- calling server action to gate auth. Require a signed-in session.
drop policy if exists "studios_insert" on public.studios;
create policy "studios_insert" on public.studios
  for insert with check (auth.uid() is not null);
