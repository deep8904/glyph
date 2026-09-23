-- Follow-up to 032: trigger functions and the build-access RPC were created with
-- Supabase's default EXECUTE grants, which made them callable through
-- /rest/v1/rpc/* by anon and authenticated (flagged by the security advisor).
-- Trigger functions do not need EXECUTE to fire, so it is revoked outright.
-- get_playtest_build() is only meaningful signed in. is_collab_applicant() and
-- has_playtest_session() stay executable because RLS policies call them as the
-- querying role (same pattern as is_studio_member).

revoke all on function public.collab_applications_guard() from public, anon, authenticated;
revoke all on function public.collab_applications_notify() from public, anon, authenticated;
revoke all on function public.collab_posts_closed_notify() from public, anon, authenticated;
revoke all on function public.playtest_sessions_guard() from public, anon, authenticated;
revoke all on function public.playtest_sessions_after() from public, anon, authenticated;
revoke all on function public.playtest_requests_guard() from public, anon, authenticated;
revoke all on function public.playtest_feedback_guard() from public, anon, authenticated;
revoke all on function public.playtest_feedback_after() from public, anon, authenticated;
revoke all on function public.get_playtest_build(uuid) from public, anon;
grant execute on function public.get_playtest_build(uuid) to authenticated;
