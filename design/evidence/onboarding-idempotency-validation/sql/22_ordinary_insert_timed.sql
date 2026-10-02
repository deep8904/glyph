-- Ordering B, session 2 (item 44): the exact createDraftProject SQL shape, run as `authenticated`
-- under real RLS, while session 1 (21_rpc_hold_then_finalize.sql) still holds the profile lock.
-- Must block on the serialization trigger, then resume only once session 1 commits — at which
-- point the account is already onboarded, and this insert becomes an ordinary post-onboarding draft.
set role authenticated;
set request.jwt.claim.sub = :'owner_id';
select clock_timestamp() as started;
insert into public.projects (owner_id, title, lifecycle, is_primary)
values (:'owner_id', :'title', 'draft', false)
returning id;
select clock_timestamp() as finished;
