-- Genuine deadlock-order regression test (item 55), session A: an ordinary `authenticated` slug
-- transition (real -> different real, a legitimate lifecycle edit) on the seeded project, held open
-- in an explicit transaction for `:hold_seconds` real seconds. Under the corrected §5b design this
-- UPDATE only ever needs the project row's own lock — reject_slug_removal_on_update reads OLD/NEW
-- and takes no lock at all for this transition — so it can only ever contend with session B
-- (28_deadlock_regression_session_b_operator.sql) for the SAME project row, never for the profile
-- row, and never in the reverse order operator functions use.
set role authenticated;
set request.jwt.claim.sub = :'owner_id';
begin;
update public.projects set slug = :'new_slug' where id = :'project_id';
select pg_sleep(:hold_seconds);
commit;
