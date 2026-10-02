-- Seeds every ACL edge case the checklist requires BEFORE Bootstrap/Capture run, so Capture must
-- observe and correctly classify all of them in one pass: a PUBLIC grant (table + column), a
-- table-level grant with WITH GRANT OPTION, a genuine explicit column-level grant to a role with
-- no table-level grant, a mixed-case/quoted role name (table + column), and a downstream grant
-- issued by a non-owner grantor using its own grant option (SET ROLE test_grantor_g).
grant insert on public.projects to public;
grant update (slug) on public.projects to public;
grant insert on public.projects to test_grantor_g with grant option;
grant insert (title) on public.projects to test_grantee_h;
grant insert on public.projects to "Weird Role Name";
grant update (title) on public.projects to "Weird Role Name";
set role test_grantor_g;
grant insert on public.projects to test_grantee_h;
reset role;
