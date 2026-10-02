-- Millisecond-precision variant of 19_ordinary_insert_hold_then_commit.sql for item 54's enforced
-- trigger-less control: the exact createDraftProject SQL shape, held open for 2 real seconds, with
-- the ACTUAL commit time captured as an epoch-millisecond timestamp immediately after `commit` —
-- not inferred from an external, later-captured clock reading.
set role authenticated;
set request.jwt.claim.sub = :'owner_id';
begin;
insert into public.projects (owner_id, title, lifecycle, is_primary)
values (:'owner_id', :'title', 'draft', false)
returning id;
select pg_sleep(2);
commit;
select extract(epoch from clock_timestamp()) * 1000 as committed_at_ms;
