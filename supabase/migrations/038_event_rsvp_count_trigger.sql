-- Phase J3: events.rsvp_count source-of-truth fix.
--
-- Root cause: rsvpToEvent() (app/actions/events.ts) computed the live "going" count
-- and tried to write it onto events.rsvp_count from the RSVPer's own client. The
-- events_update RLS policy only allows auth.uid() = host_id, so that write silently
-- affected 0 rows for every non-host RSVP (Postgres/PostgREST does not error on an
-- UPDATE that matches 0 rows under RLS). The column only ever moved when the host
-- RSVPed to their own event. The application-side workaround (lib/events.ts
-- goingCounts()) counted event_rsvps directly instead of trusting the column.
--
-- Fix: a SECURITY DEFINER trigger recomputes rsvp_count from event_rsvps on every
-- insert/update/delete, bypassing the events_update RLS restriction for this one
-- column exactly the way notify_event() already bypasses RLS for notifications.
-- This restores events.rsvp_count as the authoritative source: any actor's RSVP
-- (host, non-host, cancellation, re-RSVP) is now reflected correctly regardless of
-- who is signed in when it happens.

create or replace function public.recompute_event_rsvp_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  eid uuid;
begin
  eid := coalesce(new.event_id, old.event_id);
  update public.events
     set rsvp_count = (select count(*) from public.event_rsvps where event_id = eid and status = 'going')
   where id = eid;
  return null;
end;
$$;

revoke all on function public.recompute_event_rsvp_count() from public, anon, authenticated;

drop trigger if exists event_rsvps_recompute_count on public.event_rsvps;
create trigger event_rsvps_recompute_count
  after insert or update or delete on public.event_rsvps
  for each row execute function public.recompute_event_rsvp_count();

-- Backfill: bring every existing row's stored count in line with reality now,
-- rather than waiting for the next RSVP change on each event to correct it.
update public.events e
   set rsvp_count = (select count(*) from public.event_rsvps r where r.event_id = e.id and r.status = 'going')
 where rsvp_count <> (select count(*) from public.event_rsvps r where r.event_id = e.id and r.status = 'going');
