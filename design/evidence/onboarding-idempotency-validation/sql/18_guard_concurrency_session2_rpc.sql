-- Session 2 of the reconciliation-vs-RPC concurrency proof: calls finalize_onboarding_project for
-- the SAME account while session 1 holds its profile row lock and is mid-reconciliation. Must
-- block, then, once session 1 commits, observe the now-reconciled state and return the reconciled
-- project id — never a duplicate, never a torn read of the guard's decisive facts.
set role authenticated;
set request.jwt.claim.sub = 'b5000000-0000-0000-0000-000000000005';
select clock_timestamp() as started;
select * from finalize_onboarding_project(null, null, null);
select clock_timestamp() as finished;
