-- Seeds a second distinct grantor (test_grantor_x, granted onward to test_grantee_h) so the
-- captured baseline has two grantor groups — required to prove a failure on the second grantor
-- rolls back replay work already issued for the first.
grant insert on public.projects to test_grantor_x with grant option;
set role test_grantor_x;
grant insert on public.projects to test_grantee_h;
reset role;
