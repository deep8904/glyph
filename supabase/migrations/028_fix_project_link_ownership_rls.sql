-- Phase 5 (Project + Devlog) audit finding.
--
-- The project page now shows a project's studio and its open collaboration
-- posts, so anything that can attach itself to someone else's project_id can
-- deface that project's public record. Two policies allowed exactly that
-- (both confirmed exploitable with a live authenticated-role SQL test; the
-- server actions already checked ownership, RLS did not):
--
--   studio_projects_insert   only checked studio membership, so a studio
--                            admin could link ANY user's project to their studio.
--   collab_posts_insert /    only checked author_id, so any user could create
--   collab_posts_update      a post pointing at someone else's project_id; the
--                            update policy had no WITH CHECK so project_id
--                            could be re-pointed after creation too.
--
-- Fix: the linked project must be owned by the acting user (or be null for
-- collaboration posts not tied to a project).

drop policy if exists "studio_projects_insert" on public.studio_projects;
create policy "studio_projects_insert" on public.studio_projects
  for insert
  with check (
    public.is_studio_member(studio_id, array['owner', 'admin'])
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists "collab_posts_insert" on public.collaboration_posts;
create policy "collab_posts_insert" on public.collaboration_posts
  for insert
  with check (
    auth.uid() = author_id
    and (
      project_id is null
      or exists (
        select 1 from public.projects p
        where p.id = project_id and p.owner_id = auth.uid()
      )
    )
  );

drop policy if exists "collab_posts_update" on public.collaboration_posts;
create policy "collab_posts_update" on public.collaboration_posts
  for update
  using (auth.uid() = author_id)
  with check (
    auth.uid() = author_id
    and (
      project_id is null
      or exists (
        select 1 from public.projects p
        where p.id = project_id and p.owner_id = auth.uid()
      )
    )
  );
