-- Phase 5 (Project + Devlog) audit finding.
--
-- "Authors can insert devlogs" (003_devlogs.sql) only checked
-- auth.uid() = author_id. It never checked that the target project_id
-- belongs to the author. Confirmed exploitable via a live authenticated-role
-- SQL test: user B could insert a published devlog_posts row into user A's
-- project, and it would render on A's public project page (spam/defacement
-- of someone else's canonical project record).
--
-- Fix: the insert must also target a project the author owns. Same lesson as
-- 026 (UPDATE WITH CHECK must constrain the project_id column, not just
-- author_id).

drop policy if exists "Authors can insert devlogs" on public.devlog_posts;

create policy "Authors can insert devlogs" on public.devlog_posts
  for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );
