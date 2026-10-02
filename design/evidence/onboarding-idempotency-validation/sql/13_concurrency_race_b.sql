-- Genuine Include/Include race, side B. See 12_concurrency_race_a.sql.
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
select * from finalize_onboarding_project('Racer B', null, null);
