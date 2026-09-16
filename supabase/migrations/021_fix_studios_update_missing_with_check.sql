-- Bug discovered while verifying a studio-management feature: the
-- studios_update policy created in 018 only specified USING, no WITH
-- CHECK. With WITH CHECK omitted/null, Postgres imposes no restriction at
-- all on the new row values — any owner/admin could set any column to
-- anything, which is looser than intended. Add the explicit WITH CHECK,
-- identical to USING (the authorization condition doesn't depend on which
-- columns changed, only on who is making the change).

drop policy if exists "studios_update" on public.studios;
create policy "studios_update" on public.studios
  for update
  using (public.is_studio_member(id, array['owner','admin']))
  with check (public.is_studio_member(id, array['owner','admin']));
