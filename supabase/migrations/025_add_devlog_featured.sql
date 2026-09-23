-- Phase 4 (Profile): "Featured" work, per the product-model research
-- (docs/glyph-product-model.md §3, cross-validated by both LinkedIn's
-- Featured section and GitHub's Pinned repos in
-- docs/glyph-platform-pattern-library.md §2).
--
-- Smallest justified addition: a single boolean on the existing
-- devlog_posts table, not a new content type or join table. Devlogs are
-- Glyph's atomic core-loop object (per every product doc in this
-- engagement), so "feature a devlog" is the natural unit -- an owner
-- marking a small number of their best updates as worth a visitor's first
-- look, distinct from the chronological "recent devlogs" list.
--
-- No new RLS policy is needed: "Authors can update own devlogs"
-- (auth.uid() = author_id, from 003_devlogs.sql) already covers writing
-- this column, and the read-side fix in 024 already correctly restricts
-- who can see a featured devlog at all. The max-3-featured cap is
-- enforced at the application layer (app/actions/devlogs.ts), the same
-- pattern already used for other soft caps in this codebase (e.g. the
-- 5-open-playtest-requests cap in app/actions/playtests.ts) -- not a
-- database constraint, since "at most N" is a product rule, not a data
-- integrity rule.

alter table public.devlog_posts
  add column if not exists is_featured boolean not null default false;

create index if not exists devlog_posts_featured_idx
  on public.devlog_posts(project_id, is_featured)
  where is_featured = true;
