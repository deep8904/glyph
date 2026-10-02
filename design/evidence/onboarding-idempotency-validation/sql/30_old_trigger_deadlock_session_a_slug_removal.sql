-- Isolated reproduction of revision 13's withdrawn design (item 56), session A: an `authenticated`
-- UPDATE that sets slug back to null (non-null -> null). Postgres locks this project row as part of
-- executing the UPDATE BEFORE firing the BEFORE UPDATE trigger, and the OLD (withdrawn)
-- `serialize_null_slug_project_with_owner_profile` trigger then tries to lock the row's owner
-- profile — session B (31_old_trigger_deadlock_session_b_operator.sql) already holds that profile
-- lock and is itself waiting on this same project row, so this statement blocks inside the trigger,
-- while still holding the project-row lock session B needs. Never run against the corrected
-- migration (05_migration.sql) — only against 29_migration_with_OLD_combined_trigger_TESTONLY.sql,
-- in a throwaway database, to observe the actual deadlock this design produces.
set role authenticated;
set request.jwt.claim.sub = :'owner_id';
update public.projects set slug = null where id = :'project_id';
