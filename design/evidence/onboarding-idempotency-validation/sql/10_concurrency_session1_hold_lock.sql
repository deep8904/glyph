-- Session 1 of the genuine-overlap proof: acquire and HOLD the exact row lock
-- finalize_onboarding_project itself takes internally (`select ... for update` on the caller's
-- profile row), for 3 real wall-clock seconds, inside an explicit transaction. Run this in the
-- background BEFORE session 2 (11_concurrency_session2_include.sql) so session 2's own internal
-- lock acquisition inside the RPC is forced to genuinely block on this session, not merely run
-- sequentially by coincidence.
begin;
select is_onboarded from public.profiles where id = '99999999-9999-9999-9999-999999999999' for update;
select pg_sleep(3);
commit;
