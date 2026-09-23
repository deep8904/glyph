-- Discovered while building Phase 4 (Profile): the "Current Project" /
-- Featured surfacing on a developer's profile reads directly from
-- public.projects, which turned out to have NO real RLS enforcement of the
-- visibility column at all.
--
-- 002_projects.sql's original SELECT policy ("Projects are viewable by
-- everyone") was `using (true)` -- unconditional. 003_devlogs.sql later
-- added the `visibility` column (public/unlisted/private) and every
-- application-level query (the project page, explore, search, and now the
-- profile) checks it in TypeScript, but nothing in the migration history
-- ever updated the underlying RLS policy to match. Confirmed exploitable
-- via a live anon-role SQL test: a `visibility = 'private'` project's full
-- row is readable by an unauthenticated request, bypassing every app-level
-- check simply by querying the table directly (e.g. via the REST API).
--
-- Fix: replace the unconditional SELECT policy with one matching the
-- app's own existing semantics -- 'public' and 'unlisted' are readable by
-- anyone (unlisted means "not surfaced in listings", not "access
-- controlled" -- the app's own explore/search queries already separately
-- filter to 'public' wherever they list many projects), 'private' is
-- owner-only. The existing "Users can manage their own projects" ALL
-- policy (insert/update/delete) is untouched.

drop policy if exists "Projects are viewable by everyone" on public.projects;

create policy "projects_read" on public.projects
  for select using (
    visibility in ('public', 'unlisted')
    or auth.uid() = owner_id
  );
