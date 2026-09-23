-- Phase 6 (Feed + Activity) audit findings on public.feed_items (004_follows_feed.sql).
--
-- 1. Block/mute were ignored. A blocked (or muted) developer's devlogs kept
--    appearing in the follower's feed because the view only joined follows.
--    The view now hides an author from a follower when the follower blocked
--    them, they blocked the follower, or the follower muted them. This is done
--    in the view (not in app code) so every caller, every page of a paginated
--    read, and the dashboard preview all get the same rule.
-- 2. The view ran with its owner's privileges and relied on callers adding
--    `.eq('follower_id', ...)`. Any client, including anon, could read any
--    user's assembled feed by passing another follower_id. It is now
--    security_invoker and scoped to `follower_id = auth.uid()`, so a caller can
--    only ever read their own feed, and the underlying RLS (devlog visibility,
--    blocks visible to the blocker/blocked party, mutes visible to the muter)
--    applies to the caller.
-- 3. The view returned the full devlog body (up to 50,000 chars) for every
--    row, although the feed only shows a short excerpt. It now returns
--    `content_preview` (first 400 characters) instead of `content`.
--
-- Unchanged: only published, non-future devlogs on projects whose visibility
-- is 'public' appear (unlisted and private stay out of the feed), ordering is
-- left to callers, and a user never follows themselves (CHECK on follows) so
-- their own devlogs are not in their own feed.

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
  and not exists (
    select 1 from public.user_blocks b
    where (b.blocker_id = f.follower_id and b.blocked_id = dp.author_id)
       or (b.blocker_id = dp.author_id and b.blocked_id = f.follower_id)
  )
  and not exists (
    select 1 from public.user_mutes m
    where m.muter_id = f.follower_id and m.muted_id = dp.author_id
  );

-- Read-only, signed-in only.
revoke all on public.feed_items from anon, authenticated;
grant select on public.feed_items to authenticated;
