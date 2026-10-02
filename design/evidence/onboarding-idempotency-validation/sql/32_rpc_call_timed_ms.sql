-- Millisecond-precision variant of 20_rpc_call_timed.sql for item 54's enforced trigger-less
-- control: calls finalize_onboarding_project and brackets it with epoch-millisecond timestamps
-- (clock_timestamp(), not whole-second date +%s), so the RPC's own completion time can be compared
-- directly against another session's actual commit time.
set role authenticated;
set request.jwt.claim.sub = :'owner_id';
select extract(epoch from clock_timestamp()) * 1000 as started_ms;
select * from finalize_onboarding_project(:'rpc_title', null, null);
select extract(epoch from clock_timestamp()) * 1000 as finished_ms;
