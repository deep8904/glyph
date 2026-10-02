-- Ordering B, session 1 (item 44): manually locks the owner's profile row (the same row
-- finalize_onboarding_project's own SECURITY DEFINER body will lock internally, as the function
-- owner, when called below), holds it for 2 real seconds, then calls the RPC (as `authenticated`,
-- via SET ROLE + the JWT-claim stand-in, so auth.uid() resolves) and commits. Mirrors the proven
-- reconcile-vs-RPC concurrency pattern (17_guard_concurrency_session1_reconcile.sql), substituting
-- finalize_onboarding_project for admin_reconcile_onboarding.
begin;
select is_onboarded from public.profiles where id = :'owner_id' for update;
select pg_sleep(2);
set role authenticated;
set request.jwt.claim.sub = :'owner_id';
select * from finalize_onboarding_project(:'rpc_title', null, null);
reset role;
commit;
