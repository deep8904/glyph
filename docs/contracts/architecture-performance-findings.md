# Architecture & performance findings

- **Query discipline:** several well-targeted, per-table, `.limit()`-ed queries are preferred over one wide join — keeps RLS isolation and clarity. Don't combine unrelated tables just to cut query count; no measured latency problem at current row counts.
- **Feed:** keyset pagination (`?cursor=`), `feed_items` view (visibility/follow/block/mute in the view), read-only engagement counts, preview capped (≤5). `.in()` id lists capped ≤20.
- **Shared identity read** (`getOptionalIdentity`) kept minimal; per-page wider reads done separately (see auth doc).
- **Dashboard:** page maps queries → a plain-data view; query errors must be surfaced, not silent (legacy bug: silent errors on projects/attention/feedback).
- **No backend changes for presentation** work: migrations/RLS/server-actions unchanged when only UI is rebuilt; `lib/notifications/present.ts` is presentation-only.
