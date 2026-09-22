-- Phase J4: demo-slot visibility — deliberate product decision, not a silent RLS change.
--
-- docs/design/glyph-phase-f-architecture.md already modelled event demo slots as public
-- participation information, the same way a jam's entries and a studio's projects are public:
--   "Event ... demo slots (event_demo_slots -> an existing project + the demoer)" listed
--   alongside RSVPs as what an event page shows; "Being shown = accepted demo slots -> project
--   pages" as a named public section; "no demo slots (section omitted)" as its empty state.
-- Phase F built the "Being shown" section on that basis, then found demo_slots_read (migration
-- 009) restricted reads to the demoer and the host, so the section was empty for everyone else —
-- documented as a known gap rather than silently worked around.
--
-- Decision made here: an ACCEPTED demo slot (the host has confirmed the project will be shown)
-- is public — it is event-program information, not a private message. A PENDING or rejected
-- request stays visible only to the demoer who sent it and the event's host, same as before —
-- nobody's unreviewed pitch is exposed. This mirrors how a jam entry becomes visible once
-- submitted (public) versus a collaboration application (visible only to the two parties) —
-- accepted-ness is the same kind of "this became real" boundary jams use for entries.

drop policy if exists "demo_slots_read" on public.event_demo_slots;
create policy "demo_slots_read" on public.event_demo_slots
  for select using (
    accepted = true
    or auth.uid() = demoer_id
    or exists (select 1 from public.events e where e.id = event_id and e.host_id = auth.uid())
  );
