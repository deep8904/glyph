-- Generic profile-row lock hold, no RPC/insert involved: locks the given owner's profile row `for
-- update` and holds it open for `:hold_seconds` real wall-clock seconds inside an explicit
-- transaction, then commits. Used by the corrected real-slug non-blocking gate (item 51) as
-- session A, and reusable anywhere a bare, isolated profile-row lock hold is needed.
begin;
select is_onboarded from public.profiles where id = :'owner_id' for update;
select pg_sleep(:hold_seconds);
commit;
