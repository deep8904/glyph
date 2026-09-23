-- Companion fix to 023_fix_projects_visibility_rls.sql, discovered while
-- building Phase 4's Featured-devlog queries on the profile page.
--
-- devlog_posts' own "Anyone can read published devlogs" policy only checks
-- published_at -- it never checks the parent project's visibility. Before
-- 023, this didn't matter in practice for private projects specifically,
-- because the project row itself was also unconditionally readable. Now
-- that 023 correctly hides private projects, this policy still lets an
-- unauthenticated request read a devlog_posts row belonging to a private
-- project directly (confirmed via a live anon-role SQL test), even though
-- every page route that reaches a devlog through the project (the project
-- page, the devlog page) already independently checks project.visibility
-- in application code. Fix the data layer to match, rather than relying
-- solely on the app-level checks -- the same "defense in depth, not just
-- page-level gating" principle already established for every other RLS
-- fix in this project's history (017-021, 023).

drop policy if exists "Anyone can read published devlogs" on public.devlog_posts;

create policy "devlog_posts_read_published" on public.devlog_posts
  for select using (
    published_at is not null
    and published_at <= now()
    and exists (
      select 1 from public.projects p
      where p.id = devlog_posts.project_id
        and p.visibility in ('public', 'unlisted')
    )
  );

-- "Authors can read own devlogs" (auth.uid() = author_id) is untouched --
-- an author always sees their own devlogs regardless of project visibility.
