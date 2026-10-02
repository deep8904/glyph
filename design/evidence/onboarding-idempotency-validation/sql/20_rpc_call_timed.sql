-- Ordering A, session 2 (item 43): calls finalize_onboarding_project for the same owner while
-- session 1 (19_ordinary_insert_hold_then_commit.sql) still holds the profile row lock (taken by
-- the serialization trigger). Must block, then, once session 1 commits, observe the now-committed
-- null-slug candidate and raise the generic 55000 error.
set role authenticated;
set request.jwt.claim.sub = :'owner_id';
select clock_timestamp() as started;
select * from finalize_onboarding_project(:'rpc_title', null, null);
select clock_timestamp() as finished;
