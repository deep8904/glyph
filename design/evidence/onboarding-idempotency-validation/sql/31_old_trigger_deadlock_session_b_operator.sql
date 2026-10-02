-- Isolated reproduction of revision 13's withdrawn design (item 56), session B: locks the owner's
-- profile row FIRST (the same order every operator function uses), holds it for `:hold_seconds`
-- real seconds — long enough for session A (30_old_trigger_deadlock_session_a_slug_removal.sql) to
-- start its UPDATE, lock the project row, and block on this session's profile lock inside the OLD
-- trigger — then attempts to update the same project row, which session A is still holding. At that
-- point each session holds what the other needs: PostgreSQL's automatic deadlock detector (default
-- ~1s timeout) aborts one of the two with an actual `ERROR: deadlock detected`.
begin;
select is_onboarded from public.profiles where id = :'owner_id' for update;
select pg_sleep(:hold_seconds);
update public.projects set is_onboarding_project = is_onboarding_project where id = :'project_id';
commit;
