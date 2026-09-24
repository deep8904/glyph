-- Performance advisor (run immediately after 040) flagged the two RLS policies written in that
-- migration: auth.uid() re-evaluates per row instead of once per query. Supabase's own documented
-- fix — wrap it in (select auth.uid()) so the planner can evaluate it once. Behaviour is
-- unchanged, this is a pure performance fix on the policies this session introduced. Not touching
-- jam_entries_insert/update/delete — those are pre-existing, untouched by 040, out of scope here.

drop policy if exists "projects_read" on public.projects;
create policy "projects_read" on public.projects for select using (
  (lifecycle != 'draft' and visibility in ('public', 'unlisted'))
  or (select auth.uid()) = owner_id
);

drop policy if exists "jam_entries_read" on public.jam_entries;
create policy "jam_entries_read" on public.jam_entries for select using (
  exists (
    select 1 from public.projects p
    where p.id = jam_entries.project_id
      and p.visibility = 'public'
      and p.lifecycle = 'published'
  )
  or (select auth.uid()) = team_lead_id
);
