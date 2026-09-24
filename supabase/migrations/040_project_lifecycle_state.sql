-- B4: Project state model. Design doc: docs/product/project-state-model.md (reviewed, §17).
--
-- Adds an explicit `lifecycle` axis (draft/published/archived), independent of the existing
-- `visibility` axis (public/unlisted/private) and the existing `stage` axis (development stage).
-- Discovery eligibility stays derived (view-layer), not a new mutable column, per the design
-- doc's §2 reasoning.
--
-- Also fixes two confirmed pre-existing RLS gaps found while designing this (same bug class as
-- 023_fix_projects_visibility_rls.sql): discoverable_collab_posts and jam_entries_read did not
-- couple to the linked project's visibility, so a private project's collaboration post or jam
-- entry was still discoverable (the project's own title/slug were protected by the join's own
-- RLS and came back null, but the post/entry row itself leaked). See design doc §1, §17.1.
--
-- Order matters (design doc §17.2): RLS is replaced before the views are updated, so there is no
-- deploy window where a draft project is more viewable than the target model intends.

-- ── 1. Schema: additive column ───────────────────────────────────────────────
alter table public.projects
  add column if not exists lifecycle text not null default 'published'
    check (lifecycle in ('draft', 'published', 'archived'));

-- ── 2. Backfill: the one deterministic exception ─────────────────────────────
-- Every existing row already defaulted to 'published' via the column default above. The one
-- correction: a null-slug project has never been reachable at a public URL, has never appeared
-- in discoverable_projects, and was never completed through ProjectForm's own required-slug
-- validation (only reachable via onboarding's direct insert, app/onboarding/page.tsx). This is a
-- code-verified fact, not a visibility-based heuristic — design doc §15.
update public.projects set lifecycle = 'draft' where slug is null;

-- ── 3. Constraint: structurally guarantee the discovery view's assumption ───
alter table public.projects
  add constraint slug_required_when_published
  check (lifecycle = 'draft' or slug is not null);

-- ── 4. RLS: close the direct-view gate first (design doc §17.2) ─────────────
-- Draft gates direct viewing the same way a devlog draft does (published_at is not null OR
-- author_id = auth.uid()) — the closest existing precedent in this codebase. Published/archived
-- continue to be gated by visibility alone, exactly as today.
drop policy if exists "projects_read" on public.projects;

create policy "projects_read" on public.projects for select using (
  (lifecycle != 'draft' and visibility in ('public', 'unlisted'))
  or auth.uid() = owner_id
);

-- ── 5a. Views: discoverable_projects gains the lifecycle condition ──────────
drop view if exists public.discoverable_projects;
create view public.discoverable_projects
with (security_invoker = true) as
select
  p.id,
  p.owner_id,
  p.title,
  p.short_description,
  p.slug,
  p.stage,
  p.tags,
  p.engine,
  p.genre,
  coalesce(p.cover_url, p.cover_image_url) as cover_url,
  pr.username,
  pr.display_name,
  greatest(p.created_at, dl.last_devlog_at) as last_activity_at,
  exists (
    select 1 from public.playtest_requests r
    where r.project_id = p.id and r.status = 'open'
  ) as has_open_playtest
from public.projects p
join public.profiles pr on pr.id = p.owner_id
left join lateral (
  select max(d.published_at) as last_devlog_at
  from public.devlog_posts d
  where d.project_id = p.id and d.published_at is not null and d.published_at <= now()
) dl on true
where p.visibility = 'public'
  and p.lifecycle = 'published'
  and p.slug is not null
  and not public.hidden_from_viewer(p.owner_id);

-- ── 5b. discoverable_developers: same "current project" eligibility rule ────
-- (mirrors the lateral subquery in 030_discovery_views_and_search_functions.sql, adding the
-- lifecycle condition to both the current-project pick and the last-devlog-activity lookup)
drop view if exists public.discoverable_developers;
create view public.discoverable_developers
with (security_invoker = true) as
select
  pr.id,
  pr.username,
  pr.display_name,
  pr.avatar_url,
  pr.bio,
  pr.primary_role,
  (pr.collaboration_status = 'open') as is_open_to_collab,
  cp.title as current_project_title,
  cp.slug  as current_project_slug,
  greatest(act.last_devlog_at, cp.newest_project_at) as last_activity_at
from public.profiles pr
left join lateral (
  select p.title, p.slug,
         (select max(p2.created_at) from public.projects p2
           where p2.owner_id = pr.id and p2.visibility = 'public' and p2.lifecycle = 'published' and p2.slug is not null) as newest_project_at
  from public.projects p
  where p.owner_id = pr.id and p.visibility = 'public' and p.lifecycle = 'published' and p.slug is not null
  order by p.is_primary desc, p.updated_at desc, p.id
  limit 1
) cp on true
left join lateral (
  select max(d.published_at) as last_devlog_at
  from public.devlog_posts d
  join public.projects p3 on p3.id = d.project_id
  where d.author_id = pr.id
    and d.published_at is not null and d.published_at <= now()
    and p3.visibility = 'public' and p3.lifecycle = 'published' and p3.slug is not null
) act on true;

-- ── 5c. discoverable_playtests: couple to lifecycle too (visibility already correct) ─
drop view if exists public.discoverable_playtests;
create view public.discoverable_playtests
with (security_invoker = true) as
select
  r.id, r.project_id, r.author_id, r.build_type, r.platforms, r.description, r.focus_areas,
  r.requested_testers, r.current_testers, r.created_at,
  pj.title as project_title, pj.slug as project_slug,
  pr.username, pr.display_name
from public.playtest_requests r
join public.projects pj on pj.id = r.project_id and pj.visibility = 'public' and pj.lifecycle = 'published'
join public.profiles pr on pr.id = r.author_id
where r.status = 'open'
  and not public.hidden_from_viewer(r.author_id);

-- ── 5d. discoverable_collab_posts: fix the confirmed leak (design doc §1) ───
-- Was a LEFT JOIN with no visibility condition, so a private project's collaboration post still
-- appeared (project title/slug came back null via the join's own RLS, but the post row leaked).
-- Now an inner join requiring public + published, except a post with no linked project at all
-- (project_id is null) stays visible — it was never gated on project state to begin with.
drop view if exists public.discoverable_collab_posts;
create view public.discoverable_collab_posts with (security_invoker = true) as
select
  c.id, c.project_id, c.author_id, c.post_type, c.role_needed, c.role_offered, c.contract_type,
  c.remote_allowed, c.location, c.description, c.expires_at, c.created_at,
  pj.title as project_title, pj.slug as project_slug,
  pr.username, pr.display_name
from public.collaboration_posts c
join public.profiles pr on pr.id = c.author_id
left join public.projects pj on pj.id = c.project_id and pj.visibility = 'public' and pj.lifecycle = 'published'
where c.status = 'open'
  and c.expires_at > now()
  and not public.hidden_from_viewer(c.author_id)
  and (c.project_id is null or pj.id is not null);

-- ── 5e0. discoverable_devlogs: gains the lifecycle condition too ────────────
-- Found while implementing (not in the reviewed design doc's explicit view list) — used by
-- Explore's "Recent devlogs" and search_devlogs. Without this, a devlog published while its
-- project was public+published keeps surfacing after the owner moves the project back to draft.
drop view if exists public.discoverable_devlogs;
create view public.discoverable_devlogs
with (security_invoker = true) as
select
  d.id,
  d.slug,
  d.title,
  left(d.content, 400) as content_preview,
  d.published_at,
  d.author_id,
  p.title as project_title,
  p.slug  as project_slug,
  pr.username,
  pr.display_name,
  pr.avatar_url
from public.devlog_posts d
join public.projects p  on p.id = d.project_id
join public.profiles pr on pr.id = d.author_id
where d.published_at is not null
  and d.published_at <= now()
  and p.visibility = 'public'
  and p.lifecycle = 'published'
  and p.slug is not null
  and not public.hidden_from_viewer(d.author_id);

-- ── 5e. jam_entries_read: fix the same bug class, found in review (§17.1) ───
-- Was `using (true)` — fully public regardless of the linked project's state. A jam entry's
-- submission_url/submission_notes/team_lead_id leaked for a private or draft project.
drop policy if exists "jam_entries_read" on public.jam_entries;
create policy "jam_entries_read" on public.jam_entries for select using (
  exists (
    select 1 from public.projects p
    where p.id = jam_entries.project_id
      and p.visibility = 'public'
      and p.lifecycle = 'published'
  )
  or auth.uid() = team_lead_id
);

-- ── 5f. feed_items: a devlog on a project its owner unpublished stops feeding ─
drop view if exists public.feed_items;
create view public.feed_items
with (security_invoker = true) as
select
  dp.id,
  dp.project_id,
  dp.author_id,
  dp.slug                  as devlog_slug,
  dp.title                 as devlog_title,
  left(dp.content, 400)    as content_preview,
  dp.published_at,
  p.title                  as project_title,
  p.slug                   as project_slug,
  pr.username,
  pr.display_name,
  pr.avatar_url,
  f.follower_id
from public.devlog_posts dp
  join public.projects p  on p.id = dp.project_id
  join public.profiles pr on pr.id = dp.author_id
  join public.follows f   on f.followed_id = dp.author_id
where f.follower_id = auth.uid()
  and dp.published_at is not null
  and dp.published_at <= now()
  and p.visibility = 'public'
  and p.lifecycle = 'published'
  and not exists (
    select 1 from public.user_blocks b
    where (b.blocker_id = f.follower_id and b.blocked_id = dp.author_id)
       or (b.blocker_id = dp.author_id and b.blocked_id = f.follower_id)
  )
  and not exists (
    select 1 from public.user_mutes m
    where m.muter_id = f.follower_id and m.muted_id = dp.author_id
  );

-- ── 6. Grants — DROP VIEW clears all grants, so every recreated view must be re-granted exactly
-- as its origin migration did (030, 032, 029). feed_items is authenticated-only, deliberately not
-- anon — verified against 029's own grant statement before writing this.
revoke all on public.discoverable_projects, public.discoverable_developers, public.discoverable_playtests, public.discoverable_collab_posts, public.discoverable_devlogs from anon, authenticated;
grant select on public.discoverable_projects, public.discoverable_developers, public.discoverable_playtests, public.discoverable_collab_posts, public.discoverable_devlogs to anon, authenticated;

revoke all on public.feed_items from anon, authenticated;
grant select on public.feed_items to authenticated;
