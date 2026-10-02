-- Fixtures for the caller-scoped reconciliation guard (proposal §5a). Run AFTER 05_migration.sql
-- (the guarded finalize_onboarding_project must already exist).
insert into public.profiles (id, is_onboarded) values
  ('b1000000-0000-0000-0000-000000000001', false), -- G1: single unresolved candidate
  ('b2000000-0000-0000-0000-000000000002', false), -- G2: ambiguous unresolved candidates
  ('b3000000-0000-0000-0000-000000000003', false), -- G3: will be reconciled confirmed_onboarding
  ('b4000000-0000-0000-0000-000000000004', false), -- G4: will be reconciled confirmed_not_onboarding
  ('b5000000-0000-0000-0000-000000000005', false); -- G5: concurrent reconciliation-vs-RPC race

insert into public.projects (id, owner_id, title, slug) values
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'G1 Candidate', null),
  ('c2000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000002', 'G2 Candidate One', null),
  ('c2000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000002', 'G2 Candidate Two', null),
  ('c3000000-0000-0000-0000-000000000001', 'b3000000-0000-0000-0000-000000000003', 'G3 Candidate', null),
  ('c4000000-0000-0000-0000-000000000001', 'b4000000-0000-0000-0000-000000000004', 'G4 Candidate (not onboarding)', null),
  ('c5000000-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000005', 'G5 Candidate', null);
