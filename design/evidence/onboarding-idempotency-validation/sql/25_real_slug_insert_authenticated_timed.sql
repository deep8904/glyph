-- Corrected real-slug non-blocking gate (item 51), session B: the exact production insert shape
-- (real, non-null slug) for the SAME owner whose profile row is locked by session A
-- (24_profile_lock_hold_only.sql), run as `authenticated` under real RLS and column grants.
-- serialize_null_slug_project_insert()'s `if new.slug is not null then return new;` early return
-- means this insert must never touch the profile lock at all, and so must complete well before
-- session A releases it. Millisecond-precision timestamps, not whole-second `date +%s` — the
-- harness differences clock_timestamp() readings captured here against session A's own start/end.
set role authenticated;
set request.jwt.claim.sub = :'owner_id';
select extract(epoch from clock_timestamp()) * 1000 as started_ms;
insert into public.projects (owner_id, title, slug, lifecycle, is_primary)
values (:'owner_id', :'title', :'slug', 'published', false)
returning id;
select extract(epoch from clock_timestamp()) * 1000 as finished_ms;
