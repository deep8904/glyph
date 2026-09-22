-- Phase 7 (Explore + Search) audit findings and fix.
--
-- Findings (reproduced with anon/authenticated SQL before this migration):
--  1. Explore's "Recent Devlogs" query had no project-visibility filter, so
--     devlogs from UNLISTED projects (reachable "by link only") were served to
--     anyone on the public Explore page. Search fetched the same rows and only
--     dropped them in application code after applying LIMIT 20.
--  2. Search matched whole stemmed words only: "ember" did not find "Emberfall"
--     and "dee" did not find "deep" (websearch_to_tsquery has no prefix match).
--  3. Search results had no ORDER BY at all (nondeterministic), no paging, and
--     no exact-match preference.
--  4. Neither Explore nor Search honoured block or mute (Phase 6 semantics).
--
-- Approach: put the visibility + block/mute rules in three security_invoker
-- views (so RLS of the caller still applies and the rules exist in exactly one
-- place), and expose ordered, paged search as three security_invoker SQL
-- functions over those views. No table or existing policy is changed.
--
-- Matching rule (documented in docs/glyph-implementation-plan.md):
--   * every whitespace-separated word must match as a PREFIX in the object's
--     indexed text (existing fts columns, english stemming), OR the raw query
--     appears as a substring of the object's name/title (ILIKE, so "fall" finds
--     "Emberfall" and "demo-nova" finds the username).
--   * order: match tier (0 exact name/title, 1 starts-with, 2 contains,
--     3 matched only in description/body/tags), then most recent activity,
--     then id. No popularity or engagement input of any kind.

-- True when the current viewer should not see content from `target`:
-- they blocked the target, the target blocked them, or they muted the target.
-- Under RLS the blocks/mutes visible to the caller are exactly those two
-- relationships. For anonymous callers auth.uid() is null so nothing is hidden.
create or replace function public.hidden_from_viewer(target uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.user_blocks b
    where (b.blocker_id = auth.uid() and b.blocked_id = target)
       or (b.blocker_id = target and b.blocked_id = auth.uid())
  ) or exists (
    select 1 from public.user_mutes m
    where m.muter_id = auth.uid() and m.muted_id = target
  );
$$;

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
           where p2.owner_id = pr.id and p2.visibility = 'public' and p2.slug is not null) as newest_project_at
  from public.projects p
  where p.owner_id = pr.id and p.visibility = 'public' and p.slug is not null
  order by p.is_primary desc, p.updated_at desc, p.id
  limit 1
) cp on true
left join lateral (
  select max(d.published_at) as last_devlog_at
  from public.devlog_posts d
  join public.projects p3 on p3.id = d.project_id
  where d.author_id = pr.id
    and d.published_at is not null and d.published_at <= now()
    and p3.visibility = 'public' and p3.slug is not null
) act on true
where pr.is_onboarded
  and not public.hidden_from_viewer(pr.id);

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
  and p.slug is not null
  and not public.hidden_from_viewer(p.owner_id);

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
  and p.slug is not null
  and not public.hidden_from_viewer(d.author_id);

-- ── Search functions ─────────────────────────────────────────────────────────
-- p_limit is clamped to 1..50 and p_offset to 0..5000. Empty/blank query
-- returns no rows. Sort is total (tier, recency, id), so pages neither overlap
-- nor skip while the data is unchanged.

create or replace function public.search_developers(p_q text, p_limit int default 20, p_offset int default 0)
returns table (
  id uuid, username text, display_name text, avatar_url text, bio text, primary_role text,
  is_open_to_collab boolean, current_project_title text, current_project_slug text,
  last_activity_at timestamptz, match_tier int, total_count bigint
)
language sql stable security invoker set search_path = public
as $$
  with q as (
    select left(btrim(lower(coalesce(p_q, ''))), 100) as raw,
           left(btrim(regexp_replace(lower(coalesce(p_q, '')), '[^[:alnum:]]+', ' ', 'g')), 100) as qn
  ), p as (
    select raw,
           replace(replace(replace(raw, E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_') as esc,
           case when qn = '' then null else to_tsquery('english',
             (select string_agg(t || ':*', ' & ') from (select t from unnest(string_to_array(qn, ' ')) t where t <> '' limit 8) s)) end as tsq
    from q where raw <> ''
  )
  select dv.id, dv.username, dv.display_name, dv.avatar_url, dv.bio, dv.primary_role,
         dv.is_open_to_collab, dv.current_project_title, dv.current_project_slug, dv.last_activity_at,
         case
           when lower(dv.username) = p.raw or lower(coalesce(dv.display_name, '')) = p.raw then 0
           when lower(dv.username) like p.esc || '%' escape E'\\' or lower(coalesce(dv.display_name, '')) like p.esc || '%' escape E'\\' then 1
           when lower(dv.username) like '%' || p.esc || '%' escape E'\\' or lower(coalesce(dv.display_name, '')) like '%' || p.esc || '%' escape E'\\' then 2
           else 3
         end as match_tier,
         count(*) over() as total_count
  from p
  cross join public.discoverable_developers dv
  join public.profiles pf on pf.id = dv.id
  where lower(dv.username) like '%' || p.esc || '%' escape E'\\'
     or lower(coalesce(dv.display_name, '')) like '%' || p.esc || '%' escape E'\\'
     or (p.tsq is not null and pf.fts @@ p.tsq)
  order by match_tier, dv.last_activity_at desc nulls last, dv.id
  limit least(greatest(p_limit, 1), 50)
  offset least(greatest(p_offset, 0), 5000);
$$;

create or replace function public.search_projects(p_q text, p_stage text default null, p_limit int default 20, p_offset int default 0)
returns table (
  id uuid, title text, short_description text, slug text, stage text, tags text[], engine text, genre text,
  cover_url text, username text, display_name text, last_activity_at timestamptz, has_open_playtest boolean,
  match_tier int, total_count bigint
)
language sql stable security invoker set search_path = public
as $$
  with q as (
    select left(btrim(lower(coalesce(p_q, ''))), 100) as raw,
           left(btrim(regexp_replace(lower(coalesce(p_q, '')), '[^[:alnum:]]+', ' ', 'g')), 100) as qn
  ), p as (
    select raw,
           replace(replace(replace(raw, E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_') as esc,
           case when qn = '' then null else to_tsquery('english',
             (select string_agg(t || ':*', ' & ') from (select t from unnest(string_to_array(qn, ' ')) t where t <> '' limit 8) s)) end as tsq
    from q where raw <> ''
  )
  select dp.id, dp.title, dp.short_description, dp.slug, dp.stage, dp.tags, dp.engine, dp.genre,
         dp.cover_url, dp.username, dp.display_name, dp.last_activity_at, dp.has_open_playtest,
         case
           when lower(dp.title) = p.raw then 0
           when lower(dp.title) like p.esc || '%' escape E'\\' then 1
           when lower(dp.title) like '%' || p.esc || '%' escape E'\\' then 2
           else 3
         end as match_tier,
         count(*) over() as total_count
  from p
  cross join public.discoverable_projects dp
  join public.projects pf on pf.id = dp.id
  where (p_stage is null or dp.stage = p_stage)
    and (lower(dp.title) like '%' || p.esc || '%' escape E'\\'
         or (p.tsq is not null and pf.fts @@ p.tsq))
  order by match_tier, dp.last_activity_at desc, dp.id
  limit least(greatest(p_limit, 1), 50)
  offset least(greatest(p_offset, 0), 5000);
$$;

create or replace function public.search_devlogs(p_q text, p_limit int default 20, p_offset int default 0)
returns table (
  id uuid, slug text, title text, content_preview text, published_at timestamptz,
  project_title text, project_slug text, username text, display_name text, avatar_url text,
  match_tier int, total_count bigint
)
language sql stable security invoker set search_path = public
as $$
  with q as (
    select left(btrim(lower(coalesce(p_q, ''))), 100) as raw,
           left(btrim(regexp_replace(lower(coalesce(p_q, '')), '[^[:alnum:]]+', ' ', 'g')), 100) as qn
  ), p as (
    select raw,
           replace(replace(replace(raw, E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_') as esc,
           case when qn = '' then null else to_tsquery('english',
             (select string_agg(t || ':*', ' & ') from (select t from unnest(string_to_array(qn, ' ')) t where t <> '' limit 8) s)) end as tsq
    from q where raw <> ''
  )
  select dd.id, dd.slug, dd.title, dd.content_preview, dd.published_at,
         dd.project_title, dd.project_slug, dd.username, dd.display_name, dd.avatar_url,
         case
           when lower(dd.title) = p.raw then 0
           when lower(dd.title) like p.esc || '%' escape E'\\' then 1
           when lower(dd.title) like '%' || p.esc || '%' escape E'\\' then 2
           else 3
         end as match_tier,
         count(*) over() as total_count
  from p
  cross join public.discoverable_devlogs dd
  join public.devlog_posts pf on pf.id = dd.id
  where lower(dd.title) like '%' || p.esc || '%' escape E'\\'
     or (p.tsq is not null and pf.fts @@ p.tsq)
  order by match_tier, dd.published_at desc, dd.id
  limit least(greatest(p_limit, 1), 50)
  offset least(greatest(p_offset, 0), 5000);
$$;

-- Public discovery: readable by everyone (visibility is enforced inside the views).
revoke all on public.discoverable_developers, public.discoverable_projects, public.discoverable_devlogs from anon, authenticated;
grant select on public.discoverable_developers, public.discoverable_projects, public.discoverable_devlogs to anon, authenticated;
revoke all on function public.hidden_from_viewer(uuid) from public;
revoke all on function public.search_developers(text, int, int) from public;
revoke all on function public.search_projects(text, text, int, int) from public;
revoke all on function public.search_devlogs(text, int, int) from public;
grant execute on function public.hidden_from_viewer(uuid) to anon, authenticated;
grant execute on function public.search_developers(text, int, int) to anon, authenticated;
grant execute on function public.search_projects(text, text, int, int) to anon, authenticated;
grant execute on function public.search_devlogs(text, int, int) to anon, authenticated;
