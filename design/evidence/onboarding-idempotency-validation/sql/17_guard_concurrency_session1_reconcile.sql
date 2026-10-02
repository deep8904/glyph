-- Session 1 of the reconciliation-vs-RPC concurrency proof: holds the profile row lock for 2 real
-- seconds (forcing genuine overlap with session 2, 18_guard_concurrency_session2_rpc.sql), then
-- reconciles the account confirmed_onboarding, all inside one transaction.
begin;
select is_onboarded from public.profiles where id = 'b5000000-0000-0000-0000-000000000005' for update;
select pg_sleep(2);
set role service_role;
select admin_reconcile_onboarding('b5000000-0000-0000-0000-000000000005', 'confirmed_onboarding', 'c5000000-0000-0000-0000-000000000001', 'concurrency test: reconciled while an RPC call was blocked on the same profile row');
reset role;
commit;
