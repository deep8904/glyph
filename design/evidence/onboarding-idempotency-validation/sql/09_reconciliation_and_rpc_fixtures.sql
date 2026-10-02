-- Seeds test profiles/projects for the functional RPC + reconciliation checklist items. Run this
-- AFTER 05_migration.sql has applied (the RPC and operator functions must already exist).
insert into public.profiles (id, is_onboarded) values
  ('11111111-1111-1111-1111-111111111111', false), -- user A: plain Include via the RPC
  ('22222222-2222-2222-2222-222222222222', false), -- user B: plain Skip via the RPC
  ('33333333-3333-3333-3333-333333333333', false), -- user C: legacy lost-response candidate
  ('66666666-6666-6666-6666-666666666666', false), -- user D: ambiguous legacy candidate (2 drafts)
  ('99999999-9999-9999-9999-999999999999', false), -- user E: lock-hold concurrency test
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', false);  -- user F: genuine Include/Include race

-- User C: an unmarked null-slug project predating this migration (the "lost response" scenario).
insert into public.projects (id, owner_id, title, slug, is_primary, lifecycle) values
  ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'Legacy Lost-Response Draft', null, true, 'draft');

-- User D: two ambiguous candidates, to exercise admin_correct_onboarding_reconciliation.
insert into public.projects (id, owner_id, title, slug) values
  ('77777777-7777-7777-7777-777777777777', '66666666-6666-6666-6666-666666666666', 'Candidate P', null),
  ('88888888-8888-8888-8888-888888888888', '66666666-6666-6666-6666-666666666666', 'Candidate Q', null);
