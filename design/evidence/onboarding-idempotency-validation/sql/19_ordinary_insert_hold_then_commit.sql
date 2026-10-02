-- Ordering A, session 1 (item 43): the exact createDraftProject SQL shape (owner_id, title,
-- lifecycle, is_primary — no slug), run as `authenticated` under real RLS, held open in an explicit
-- transaction for 2 real seconds after the insert (and the serialization trigger's profile-row
-- lock) so a concurrently-launched RPC call is forced to genuinely wait on it.
set role authenticated;
set request.jwt.claim.sub = :'owner_id';
begin;
insert into public.projects (owner_id, title, lifecycle, is_primary)
values (:'owner_id', :'title', 'draft', false)
returning id;
select pg_sleep(2);
commit;
