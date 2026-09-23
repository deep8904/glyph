-- Same bug class as 021_fix_studios_update_missing_with_check.sql, found
-- on a different table while building Phase 4's Featured-devlog action
-- (app/actions/devlogs.ts, which issues an UPDATE against devlog_posts).
--
-- "Authors can update own devlogs" (003_devlogs.sql) has USING
-- (auth.uid() = author_id) but no WITH CHECK. Confirmed exploitable via a
-- live authenticated-role SQL test: an author could UPDATE their own
-- devlog_posts row to change its project_id to a project they do NOT own,
-- effectively moving their content into someone else's project without
-- that project's owner's consent.
--
-- Note: a WITH CHECK identical to USING (auth.uid() = author_id) --
-- the pattern used in 021 for studios_update -- would NOT actually close
-- this hole, since author_id is not the column being abused; the exploit
-- reassigns project_id, which a same-author-id check does not constrain.
-- The correct WITH CHECK must also verify the *new* project_id still
-- belongs to a project the author owns.

drop policy if exists "Authors can update own devlogs" on public.devlog_posts;

create policy "Authors can update own devlogs" on public.devlog_posts
  for update
  using (auth.uid() = author_id)
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );
