-- Session 2 of the genuine-overlap proof: calls finalize_onboarding_project for the SAME user
-- while session 1 (10_concurrency_session1_hold_lock.sql) still holds that user's profile row
-- lock. clock_timestamp() before/after lets the driver measure the real wall-clock block.
set role authenticated;
set request.jwt.claim.sub = '99999999-9999-9999-9999-999999999999';
select clock_timestamp() as started;
select * from finalize_onboarding_project('Include Wins The Race', null, null);
select clock_timestamp() as finished;
