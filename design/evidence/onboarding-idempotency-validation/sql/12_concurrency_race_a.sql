-- Genuine Include/Include race, side A. Launched as a real, separate OS process/database
-- connection at (as close as the shell can manage) the same instant as race_b, with NO artificial
-- delay on either side — unlike 10/11, which force overlap deliberately via a held lock, this pair
-- exercises the natural, un-forced concurrent path.
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
select * from finalize_onboarding_project('Racer A', null, null);
