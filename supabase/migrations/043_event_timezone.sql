-- Event timezone model. Prior fix (037-era display change) forced an honest UTC label because the
-- schema had no per-event timezone; this adds the real thing.
--
-- start_at/end_at stay timestamptz (correct — an absolute instant). The new `timezone` column is
-- the event's canonical IANA zone (e.g. 'Europe/Berlin'): it says how the host's wall-clock input
-- was interpreted and how the event should be displayed, so a Berlin meetup reads as Berlin time
-- everywhere, with DST handled by the IANA database rather than a frozen numeric offset.
--
-- Nullable, no backfill: existing events were created before a timezone was captured, so we cannot
-- know their intended local zone. A null timezone means "display in UTC" (exactly what the current
-- code already does) — honest, not a guess. New events always carry a real zone.

alter table public.events
  add column if not exists timezone text
    check (timezone is null or length(timezone) between 1 and 64);
