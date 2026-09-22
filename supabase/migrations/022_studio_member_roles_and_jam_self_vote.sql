-- Phase 1 core-loop completion: two independent, additive security fixes.
--
-- 1. studio_members has no UPDATE policy at all (012/018/019/021 only ever
--    touched SELECT/INSERT/DELETE) — so role changes ("promote to admin",
--    "demote to member") have no server-side authorization path. Add one,
--    reusing the existing is_studio_member() helper, and — learning
--    directly from the exact bug fixed in 021 (an UPDATE policy with USING
--    but no WITH CHECK imposes no restriction on the new row) — include an
--    explicit WITH CHECK identical to USING from the start.
--
-- 2. jam_votes_insert/update have never actually enforced "you can't vote
--    for your own entry" — the check was deferred to application code
--    (see the 011 migration's own comment: "no own-entry enforcement here
--    — handled in app"), and the app-side enforcement in
--    app/jams/[slug]/vote/page.tsx was dead code that always evaluated to
--    an empty set. The schema's only concept of entry ownership is
--    jam_entries.team_lead_id (there is no team/studio-member linkage to
--    an entry) — so "self vote" is scoped exactly to that: a jam entry's
--    own team_lead_id may not cast a vote for that entry. Enforced here at
--    the RLS layer rather than relying solely on client-side filtering,
--    per this codebase's own established lesson (017-019) that
--    app-only checks in this exact feature area have failed silently
--    before.

create policy "studio_members_update" on public.studio_members
  for update
  using (public.is_studio_member(studio_id, array['owner','admin']))
  with check (public.is_studio_member(studio_id, array['owner','admin']));

drop policy if exists "jam_votes_insert" on public.jam_votes;
create policy "jam_votes_insert" on public.jam_votes
  for insert with check (
    auth.uid() = voter_id
    and not exists (
      select 1 from public.jam_entries e
      where e.id = jam_votes.entry_id and e.team_lead_id = auth.uid()
    )
  );

drop policy if exists "jam_votes_update" on public.jam_votes;
create policy "jam_votes_update" on public.jam_votes
  for update using (
    auth.uid() = voter_id
    and not exists (
      select 1 from public.jam_entries e
      where e.id = jam_votes.entry_id and e.team_lead_id = auth.uid()
    )
  );
