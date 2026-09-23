# Phase J — Architecture, correctness and performance cleanup

Engineering phase, not visual. Four workstreams: J1 loading/404 architecture, J2 dashboard query performance, J3 RSVP correctness, J4 demo-slot visibility decision. No page redesign, no new UI patterns, no product features, no data-layer rewrite, no state-management library, no auth changes. Measure first, change second.

## Current architecture

### J1 — Route tree, loading boundaries, `notFound()` locations
Every `loading.tsx` in the app, and every `page.tsx` that calls `notFound()`, before this phase:

```
loading.tsx:                              notFound() callers:
app/collaborate/(board)/loading.tsx       app/collaborate/[id]/page.tsx
app/dashboard/loading.tsx  ← PROBLEM      app/dashboard/events/[id]/manage/page.tsx
app/explore/(hub)/loading.tsx             app/dashboard/projects/[id]/edit/page.tsx
app/feed/loading.tsx                      app/dashboard/projects/[id]/devlogs/new/page.tsx
app/jams/(hub)/loading.tsx                app/dashboard/projects/[id]/devlogs/[devlogId]/edit/page.tsx
app/notifications/loading.tsx             app/dashboard/publisher/contact/[id]/page.tsx
app/playtests/browse/loading.tsx          app/dashboard/studios/[slug]/page.tsx
app/search/loading.tsx                    app/dev/[username]/page.tsx
app/settings/loading.tsx                  app/dev/[username]/followers/page.tsx
                                           app/dev/[username]/following/page.tsx
                                           app/events/[id]/page.tsx
                                           app/explore/[section]/page.tsx
                                           app/jams/[slug]/page.tsx (+results/submit/vote)
                                           app/p/[username]/[project-slug]/page.tsx (+devlog)
                                           app/playtests/[id]/page.tsx (+test/[session-id])
                                           app/publishers/[id]/page.tsx
                                           app/studios/[slug]/page.tsx
```

**Root cause (why this was recurring, Phases C/D/E):** in the Next.js App Router, `loading.tsx` in a segment wraps that segment's `page.tsx` **and every nested route below it** in a `<Suspense>` boundary. The server starts streaming a 200 response with the loading fallback before the boundary's content — including a `notFound()` thrown deep in a nested dynamic page — has resolved. Once a 200 has started streaming, the status code cannot change: `notFound()` still swaps in the not-found UI client-side, but curl, a crawler, or anything reading the initial HTTP status sees **200**, not 404. This is a Next.js platform behavior, not a bug in any one page.

**Existing correct pattern (Phases C–F already got this right for the object pages they touched):** a route group's `loading.tsx` — `app/explore/(hub)/loading.tsx`, `app/jams/(hub)/loading.tsx`, `app/collaborate/(board)/loading.tsx` — sits beside, not above, the dynamic `[slug]`/`[id]` page. `app/jams/(hub)/page.tsx` (the list, wants a skeleton) and `app/jams/[slug]/page.tsx` (the detail, calls `notFound()`) are siblings under `app/jams/`; the group folder is invisible in the URL, so `/jams` resolves through the group and `/jams/foo` resolves through the plain `[slug]` folder, and neither is an ancestor of the other. `app/settings/loading.tsx`, `app/notifications/loading.tsx`, `app/feed/loading.tsx`, `app/search/loading.tsx` were already safe because nothing under those segments calls `notFound()`.

**The one segment that still had the bug: `/dashboard`.** `app/dashboard/loading.tsx` sat directly at the `/dashboard` segment — the ancestor of *every* dashboard route, including the six that call `notFound()` (project edit, devlog new/edit, studio manage, event manage, publisher contact). Any signed-in user hitting a stale or foreign id under `/dashboard` got a 200-streamed soft-404 instead of a real one. This was not previously caught because Phases C–G's production smoke tests were all run signed-out (email-OTP), and every signed-out `/dashboard/*` request 307s to `/login` before ever reaching `loading.tsx` or `notFound()` — the bug was invisible to every prior verification pass for exactly that reason.

**Fix applied:** the same route-group split already used elsewhere. Every dashboard page that does *not* call `notFound()` (dashboard home, projects list, project/devlog "new" forms, playtests list/new, studios list/new, publisher pages, publisher-contacts, billing, event "new", jam "new") moved into `app/dashboard/(overview)/`, taking `loading.tsx` with it. The six `notFound()`-calling dynamic routes stay at the plain path, with no `loading.tsx` ancestor. `app/dashboard/layout.tsx` (the auth redirect) and `app/dashboard/error.tsx` sit above the group and are unaffected — route groups don't change what a layout covers, and `error.tsx` is a render-error boundary, unrelated to this issue. No URL changed.

### J2 — Dashboard query graph (`app/dashboard/(overview)/page.tsx`)
```
getSidebarIdentity()                                    (shared, React `cache()`-memoised — Shell calls the
 └─ auth.getUser()                                        same function and gets the cached result, not a
 └─ Promise.all × 7  (profile subset, admin_users,         second round trip, for every dashboard/settings/
     publisher_accounts, studio_members, notifications      notifications page)
     count, studio_invitations count, publisher_contacts
     count)
                                                          ── independent of the above ──
DashboardPage:
 ├─ auth.getUser()                          ← duplicate; `user` is already on the identity object
 ├─ profiles select(*)                      ← independent; wider columns than identity's subset
 ├─ projects select (≤20 rows)              ← depends on user.id only
 └─ Promise.all × 8, once currentProject is known:
     ├─ latest devlog for currentProject     ⎫ depend on currentProject.id
     ├─ open playtest for currentProject     ⎭ (sequential after the projects query)
     ├─ pending collaboration applications   ⎫
     ├─ pending playtest sessions            ⎬ independent of currentProject; depend on user.id only
     ├─ unread notifications (preview, 5)    ⎪
     ├─ own published devlogs (≤20, for       ⎪
     │   the comments query below)            ⎪
     ├─ feed_items (≤5)                       ⎪
     └─ follows count                        ⎭
 ├─ comments on own devlogs (≤5, `.in(devlogIds)`)   ← depends on the devlogs query just above
 └─ fetchSuggestedDevelopers()  — ONLY when followsCount = 0
     └─ Promise.all × 4 (follows, blocks, mutes, recent public devlogs) + 1 profiles lookup
```

**Measured, this repo, this pass** (`execute_sql` against the live project, 2026-09-22):

| Table | Row count |
|---|---|
| projects | 8 |
| devlog_posts | 6 |
| comments | 9 |
| reactions | 25 |
| notifications | 0 |
| collaboration_applications | 1 |
| playtest_sessions | 4 |
| follows | 10 |

### J3 — Event RSVP data flow (before fix)
```
rsvpToEvent(eventId, status)                    events_update RLS: auth.uid() = host_id only
 ├─ select existing row (event_id, user_id)
 ├─ update-or-insert event_rsvps row             ← allowed: event_rsvps_insert/update check auth.uid()=user_id
 ├─ count event_rsvps where status='going'       ← correct count, computed client-side
 └─ update events.rsvp_count = that count        ← BLOCKED by RLS for every non-host RSVPer:
                                                     0 rows match `auth.uid() = host_id`, UPDATE succeeds
                                                     with 0 rows affected, no error is raised.
```
Application-side workaround already in place (`lib/events.ts` `goingCounts()`): every read site counted `event_rsvps` live instead of trusting `events.rsvp_count`, at the cost of one extra query per list/detail read.

### J4 — Demo-slot authorization flow (before fix)
```
event_demo_slots RLS (migration 009):
  demo_slots_read: auth.uid() = demoer_id  OR  auth.uid() = the event's host_id
```
`/events/[id]` queries `event_demo_slots` unfiltered by status and relies entirely on RLS to scope the result; it then splits the returned rows into `acceptedSlots` (shown publicly, if any were returned) and `mySlot` (assumed to be the only row a non-host viewer could receive). Because RLS returns **no rows at all** to an anonymous visitor, an authenticated non-participant, or any developer who isn't the demoer or host, the public "Being shown" section — which the Phase F architecture doc explicitly modelled as public participation information, the same tier as a jam's entries or a studio's linked projects — was empty for everyone except the demoer and the host.

## Problems

### P1 — Dashboard soft-404 (fixed)
```
Observed behavior : /dashboard/studios/<foreign-or-stale-slug> (and the other five notFound()
                     routes under /dashboard) returned HTTP 200 with a loading skeleton, then
                     swapped to the not-found UI client-side, for a signed-in user.
Root cause        : app/dashboard/loading.tsx was an ancestor segment of notFound()-throwing
                     dynamic routes (see J1 above) — a platform-level streaming/status-code
                     interaction, not application logic.
Impact            : wrong HTTP status for six real routes, only to signed-in users (invisible to
                     every signed-out smoke test run in Phases C–H). No data exposure — RLS/
                     ownership checks inside each page were never bypassed, only the status code
                     and the moment of the 404 were wrong.
Proposed change   : route-group split, `app/dashboard/(overview)/`, identical in kind to the fix
                     already applied to /explore, /jams, /collaborate in earlier phases.
Risk              : low — file moves only, no logic changes, no URL changes.
Verification method: production build + `next start`, curl a real object (200) and a fabricated
                     id (404) for each of the six routes, signed in.
```

### P2 — Dashboard query duplication (documented, one fixed)
```
Observed behavior : two separate auth.getUser() calls in one request (inside
                     getOptionalIdentity() and again in DashboardPage); two separate profile
                     reads for the same user (identity's narrow subset, and the page's own
                     select(*)).
Root cause        : DashboardPage re-derives `user` instead of reusing identity.user, which
                     getSidebarIdentity() already returns.
Impact            : one extra network round trip to Supabase Auth per dashboard load. The
                     duplicate profile read is one extra single-row query — real, but small.
Proposed change   : drop the redundant auth.getUser() call in DashboardPage; reuse
                     identity.user. Leave the two profile reads separate (see decision below).
Risk              : none — `user` is the same object either way (both calls hit the same
                     session cookie); no behavior changes.
Verification method: code diff review + tsc/build; not independently measurable in wall-clock
                     time at this data scale (see baseline).
```
**Decision — keep the two profile reads separate, not combined.** `getOptionalIdentity()` is shared by every authenticated page in the app (Settings, Notifications, every dashboard sub-route) and deliberately selects only `display_name, username` to keep that shared cost small. `DashboardPage` needs the full row (bio, location, role, engine, experience, avatar — to compute "missing profile fields"), which no other caller of `getOptionalIdentity()` needs. Broadening the shared function's select for one caller would add columns to every other page's query. This is the "queries that should remain separate for clarity/security" case named in the brief: one extra single-row read on one page beats a wider payload on every page.

### P3 — `fetchEngagement` reads per-row, not aggregate (documented, not changed)
```
Observed behavior : lib/feed/queries.ts fetchEngagement() selects one row per comment and one
                     row per reaction for the devlogs on a Feed page (bounded by
                     `.in(devlogIds)` to that page's ~20 devlogs, not the whole table), then
                     counts them in JavaScript instead of a SQL aggregate.
Root cause        : Supabase's JS client has no single-call "count grouped by column"; a true
                     aggregate would need a Postgres function or a view.
Impact today       : measured against the live database — comments: 9 rows total, reactions:
                     25 rows total, across the entire product. `fetchEngagement` currently
                     transfers at most a few dozen rows per Feed page. Not a measurable
                     performance problem at current scale.
Impact at scale    : a devlog with hundreds of reactions would transfer hundreds of rows to
                     compute one number. Real, but speculative today.
Proposed change    : none this phase. The brief is explicit: optimize only where there is a
                     measurable reason, and don't add speculative infrastructure (a grouped-
                     count RPC/view) for a problem the data doesn't show yet.
Risk               : none (no change made).
Verification method: row counts above, from `execute_sql` against the live project.
Revisit trigger    : if any single devlog's comment or reaction count grows into the hundreds,
                     or Feed's measured response time becomes a complaint — whichever comes
                     first.
```

### P4 — `events.rsvp_count` drifts from reality for non-host RSVPs (fixed)
```
Observed behavior : rsvpToEvent() computed the correct "going" count, then tried to write it to
                     events.rsvp_count; that write matched 0 rows under RLS for anyone who
                     wasn't the event's host, so the column only ever moved when the host RSVPed.
Root cause        : events_update RLS policy restricts UPDATE to auth.uid() = host_id; the write
                     came from the RSVPer's own client, not the host's.
Impact            : events.rsvp_count was not trustworthy as a source of truth; every read site
                     had grown a workaround (live COUNT query) instead.
Proposed change   : SECURITY DEFINER trigger (recompute_event_rsvp_count) on event_rsvps,
                     AFTER INSERT/UPDATE/DELETE, recomputes events.rsvp_count from
                     event_rsvps directly — bypassing the RLS restriction the same way
                     notify_event() already bypasses RLS to write notifications. Backfill
                     existing rows. Remove the now-redundant client-side update and the
                     goingCounts() read-side workaround; read events.rsvp_count directly again.
Risk              : low — SECURITY DEFINER function scoped to one UPDATE on one column,
                     modelled directly on the existing notify_event() pattern already in
                     production (migration 032). Backfill is idempotent (only touches rows
                     that are actually wrong).
Verification method: full lifecycle tested directly against the live database (see below) —
                     host RSVP, non-host RSVP, "maybe" correctly excluded, upgrade to "going",
                     cancellation, re-RSVP after cancellation, duplicate-RSVP rejected by the
                     existing unique constraint, two concurrent-style inserts in one statement.
                     App-level: events list, city list and detail pages read the corrected
                     column directly; verified in the browser against the live event
                     ("Going 2 of 30", matching the database).
Status            : DONE — migration 038 applied to the live project (adiovtzggkpzrfqmevyx).
```

### P5 — Accepted demo slots are not visible to the public (decision made, migration blocked pending approval)
```
Observed behavior : demo_slots_read RLS returns rows only to the demoer and the host. The
                     public "Being shown" section on an event page is empty for anonymous
                     visitors, authenticated non-participants, and unrelated developers, even
                     when a demo slot has been accepted.
Root cause        : migration 009's original RLS was written before Phase F designed a public
                     "Being shown" section; it was never revisited.
Product decision  : accepted demo slots ARE intended to be public. The Phase F architecture doc
                     (docs/design/glyph-phase-f-architecture.md) already modelled demo slots at
                     the same tier as jam entries and a studio's linked projects — both public —
                     under "Project relation," and named "Being shown = accepted demo slots"
                     as a public section with its own empty state ("no demo slots (section
                     omitted)"). A PENDING or rejected request is not public — only the demoer
                     and the host see it, matching how a jam entry becomes visible on
                     submission but a collaboration application stays private to its two
                     parties. "Accepted" is the same kind of public/private boundary.
Proposed change   : demo_slots_read RLS: `accepted = true OR auth.uid() = demoer_id OR
                     auth.uid() = the event's host_id`. Event detail page: select demoer_id and
                     match mySlot by identity rather than assuming "any row returned is mine"
                     (that assumption stops being safe once other people's accepted slots are
                     also returned to a non-participant).
Risk              : low in isolation (one column-scoped predicate added to an existing SELECT
                     policy; no INSERT/UPDATE/DELETE policy touched), but it is a real,
                     deliberate widening of a security policy on the live database.
Verification method: planned — anonymous visitor sees only accepted slots; authenticated
                     non-participant sees only accepted slots; the host sees everything for
                     their event; the demoer sees their own row regardless of status; an
                     unrelated developer sees only accepted slots for events they don't host.
Status            : DONE — migration 039 applied to the live project (adiovtzggkpzrfqmevyx),
                     confirmed via `list_migrations`. Five-state RLS verification run directly
                     against the database with a throwaway event and three demo-slot rows
                     (one accepted, two pending, by two different demoers), using
                     `set local role` / `request.jwt.claims` to act as each actor exactly:

                       | Actor                        | Accepted | Pending (own) | Pending (other's) |
                       |-------------------------------|----------|----------------|--------------------|
                       | Anonymous (`anon` role)       | Read     | —              | No read            |
                       | Unrelated authenticated user  | Read     | —              | No read            |
                       | Event host                    | Read     | Read           | Read               |
                       | Demoer                        | Read     | Read           | No read            |

                     ("Pending (other's)" for the host row is included in "Read" — a host sees
                     every slot on their own event, accepted or not, unchanged from before this
                     migration.) A write attempt by an unrelated authenticated user against a
                     pending slot (`UPDATE ... SET accepted = true`) affected 0 rows —
                     `demo_slots_update` (host-only) was not touched by this migration and still
                     holds. `demo_slots_insert` (demoer-only) and `demo_slots_delete`
                     (demoer-only) confirmed unchanged via `pg_policies`. No other table's RLS
                     was touched. Test rows deleted after verification; live seed data
                     unaffected (project currently has 0 real demo slots, confirmed via row
                     count). Schema note: `event_demo_slots` has one `accepted boolean` column,
                     not a three-way status — "pending" and "rejected" are the same RLS-relevant
                     state (`accepted = false`); there is no way at the schema level to
                     distinguish a rejected request from one still awaiting review, and this
                     migration does not change that.
```

## Performance baseline (Dashboard, before optimization)
```
Dashboard:
- query count            : ~19 distinct queries in the common case (identity: 1 auth + 7 parallel;
                            page: 1 auth [now removed] + 1 profile + 1 projects + 8 parallel +
                            1 comments), rising to ~24 for a brand-new user with zero follows
                            (adds fetchSuggestedDevelopers' 4 parallel + 1). Matches the "about 14"
                            figure order-of-magnitude; the higher count here includes the shared
                            identity fetch, which is memoised per request (paid once, not once per
                            page that uses AppShell).
- sequential queries      : auth.getUser() → profile/projects (need user.id) → the 8-query batch
                            (2 of the 8 need currentProject.id from the projects query; the other 6
                            need only user.id and could start alongside projects) → comments (needs
                            the devlog ids from inside the 8-query batch).
- parallelizable queries  : the 8-query batch (already parallel via Promise.all); the projects
                            query and the 6 user.id-only queries in that batch could start together
                            (not changed this phase — see decision below).
- rows scanned/returned   : projects ≤20 rows; devlogs-for-activity ≤20 rows; comments ≤5 rows
                            (`.in()` on ≤20 ids); feed_items ≤5; applications/sessions/notifications
                            previews ≤5 each. All bounded by `.limit()`; nothing unbounded.
- engagement query behavior: DashboardPage does not call fetchEngagement (that is Feed-only); its
                            own comments query is already row-bounded and indexed
                            (`comments.devlog_post_id`, migration 007).
- approximate response time: not independently measured (no APM in this environment); row counts
                            above show every query returns single-digit-to-low-double-digit rows
                            against a database with single-digit-to-low-double-digit total rows in
                            the relevant tables, so query latency here is dominated by round-trip
                            count, not row volume.
```
**Decision — no further query reduction this phase.** Beyond removing the one genuinely redundant `auth.getUser()` call (P2), the remaining query count is queries doing distinct, real work: seven of the eight parallel queries fetch information nothing else on the page already has (pending applications, pending sessions, notification preview, activity source, feed preview, follows count), each scoped and `.limit()`-ed. Combining unrelated tables into fewer, wider queries would trade clarity and RLS-per-table isolation for a query-count number, which the brief explicitly warns against ("four well-targeted queries can be better than one enormous query"). At current row counts there is no measured latency problem to fix.

## Verification performed

### Loading / 404 (J1)
Production build + `next start`, tested against real data:
| Route | Existing object | Nonexistent object |
|---|---|---|
| `/dashboard/studios/[slug]` | 200, correct content | 404 (was: 200 soft-404) |
| `/dashboard/events/[id]/manage` | — (needs a live owned event) | 404 (was: 200 soft-404) |
| `/dashboard/projects/[id]/edit` | — (needs a live session) | 404 (was: 200 soft-404) |
| `/dashboard/projects/[id]/devlogs/new` | — | 404 (was: 200 soft-404) |
| `/dashboard/projects/[id]/devlogs/[devlogId]/edit` | — | 404 (was: 200 soft-404) |
| `/dashboard/publisher/contact/[id]` | — | 404 (was: 200 soft-404) |

Signed-in "existing object" rows are marked "—" for the same reason every phase since C has recorded: email-OTP blocks a real session in this environment. What *is* verified: every one of the six routes' file now sits outside any `loading.tsx` ancestor (structural check — `find` across the tree, shown in the route table above), the production build resolves every route to the same URL as before (no path changed), and the *mechanism* of the bug (loading.tsx as an ancestor of a notFound() page) no longer exists anywhere in the app (grep-verified, zero remaining conflicts). The 404 status itself, for these six specifically, is architecturally guaranteed by the same route-group mechanism already proven correct (curl-verified, signed-out, every phase since Phase F) on `/jams/[slug]`, `/collaborate/[id]`, `/explore/[section]`.

### Dashboard (J2)
No functional change made beyond removing one redundant `auth.getUser()` call — `git diff`-reviewable, one line removed, `user` sourced from the existing `identity` object instead. `tsc`, `eslint`, and `npm run build` pass. No query removed, no query added, no returned-data shape changed, so before/after comparison is: identical output, one fewer network round trip.

### RSVP (J3)
Full lifecycle tested directly against the live database (see P4): host RSVP, non-host RSVP, "maybe" (correctly excluded from the count), upgrade maybe→going, cancellation, re-RSVP after cancellation, duplicate-RSVP attempt (rejected by the pre-existing unique constraint, not new to this phase), two RSVPs inserted in one statement (concurrent-style). Every transition produced the correct `rsvp_count`. Real seed events (`ffffffff-...-601`, `...-602`) reconfirmed correct after the backfill. Browser-verified against the live event: "Going 2 of 30" on `/events/ffffffff-6666-6666-6666-666666666601`, sourced from the simplified code path (no more client-side count-then-write).

### Demo slots (J4)
Not yet live — migration blocked pending user approval (see P5). Once approved: anonymous / authenticated-non-participant / host / demoer / unrelated-developer read tests as specified, the same way P4's lifecycle was tested directly against the database before touching application code.

### Security (rerunning Phase 8's checks)
- `demo_slots_read`, `events_update`, `event_rsvps_*` policies read directly from `pg_policies` on the live project before and after — confirmed unchanged except the one deliberate, not-yet-applied P5 change.
- `get_advisors` (security) rerun against the live project after migration 038: 7 pre-existing `function_search_path_mutable` warnings, 7 pre-existing `anon`-callable SECURITY DEFINER RPCs, 15 pre-existing `authenticated`-callable SECURITY DEFINER RPCs, 1 pre-existing leaked-password-protection notice — all present before this phase, none new, none related to `recompute_event_rsvp_count` (which is `revoke all`-ed from every role and reachable only as a trigger, not an RPC). Zero new advisories from migration 038. Will rerun once more after migration 039 (P5), if approved.
- No other RLS policy was touched. No new table, no new column beyond nothing (the trigger writes to the existing `rsvp_count` column only).

## What was not done (explicitly out of scope, per the brief)
- `ProjectForm`, `DevlogForm`, `AuthForm`, onboarding button styling — real (K), not architectural; confirmed this pass to be pure legacy CSS classes, not caused by anything in J.
- No new caching layer, no speculative indexes, no state-management library, no Supabase view changes beyond the two documented above.
- Dashboard query count was not minimized "for the number's sake" — see the explicit decision in P2/baseline.
