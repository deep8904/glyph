-- Genuine deadlock-order regression test (item 55), session B: an operator function
-- (admin_reconcile_onboarding) that locks the owner's profile row FIRST, then updates the same
-- project row session A (27_deadlock_regression_session_a_slug_update.sql) is concurrently holding.
-- Launched to genuinely overlap with session A's hold. Under the corrected §5b design this can only
-- ever wait on session A's project-row lock — never a cycle, since session A never touches the
-- profile lock for this transition — so this session simply blocks and then completes once session
-- A commits. Millisecond-precision timestamps bracket the call for the evidence record.
select extract(epoch from clock_timestamp()) * 1000 as started_ms;
set role service_role;
select admin_reconcile_onboarding(:'owner_id', 'confirmed_onboarding', :'project_id', 'deadlock-order regression: reconciling while an ordinary slug UPDATE holds the project row');
reset role;
select extract(epoch from clock_timestamp()) * 1000 as finished_ms;
