# Phase E — Collaboration and Playtesting workflows

Written before implementation. The lifecycles below already exist and are enforced by database triggers/RLS (migrations 032–033, Phase 8). **Phase E changes presentation and information architecture only**: no new states, no new tables, no policy changes. Facts come from the Phase 8 record in `docs/glyph-implementation-plan.md` and from reading the current code.

Two different products share a neighbourhood: **Collaborate** = people ↔ projects that need contributors (an opportunity/application board). **Playtests** = games ↔ testers (a two-sided access workflow: the developer runs sessions, the tester requests a place, gets a build, sends feedback). They keep separate names, headings, filters, empty states and mental models; they share only the row language, the token system and the status-text component.

## 1. COLLABORATION

### Post lifecycle
```
Post (author creates; seeking posts must name a project + role; expires in 60 days)
  └─ OPEN ── accepts applications (not the author, not blocked either way)
        │
        ├─ author: Mark as FILLED  (found someone)   → terminal, stops applications
        ├─ author: CLOSE           (stopped looking) → terminal, stops applications
        └─ time: EXPIRED (expires_at passed; shown as "Expired"; behaves like closed for applications)
  Closed/filled/expired: still readable by the author and by applicants; 404 for everyone else.
```
### Application lifecycle (one per post + applicant, unique)
```
(none) ── apply ──▶ PENDING ──┬─ author accepts ──▶ ACCEPTED   (terminal)
                              ├─ author rejects ──▶ REJECTED   (terminal)
                              └─ applicant withdraws ▶ WITHDRAWN (terminal; cannot reapply)
Post closes/fills while PENDING → application stays PENDING; the applicant is told the post closed before a decision (notification `collab_closed`).
```
Rules the DB enforces (UI never has to be the last line of defence): no self-accept, applicant cannot pre-accept or edit the message, owner cannot flip a decision, closed/expired/own/blocked posts reject applications.

### State → UI map
| State | Who sees it | UI (Phase E target) | Actions | Notification | Empty / error |
|---|---|---|---|---|---|
| Open post on board | anyone (viewer-relative: block/mute filtered) | `CollaborationListing`: eyebrow (Looking for / Offering) → role → project → excerpt → arrangement (contract · remote/location) → posted | open post | — | board empty: no filter = "No open posts" + how to post; filtered = no-results + clear; load error = `ErrorState` |
| Post detail, applicant view, signed out | anyone | facts + About + "Sign in to apply" | sign in | — | — |
| Post detail, no application yet, open | signed-in non-author | Apply panel: who reviews, that you'll be notified, message field | Send application | author: `collab_application` | validation inline; duplicate = "already applied" |
| Application PENDING | applicant | **Application status** stepper: Submitted → In review (current) → Decision; message echoed; what happens next | Withdraw (inline confirm) | — | post closed meanwhile → "Post closed before a decision" step |
| Application ACCEPTED | applicant | Stepper ends "Accepted"; link to the poster's profile to follow up (Glyph does not host the conversation) | — | applicant: `collab_accepted` | — |
| Application REJECTED | applicant | Stepper ends "Not selected" | — | applicant: `collab_rejected` | — |
| Application WITHDRAWN | applicant | Stepper ends "Withdrawn" | — | none | — |
| Post closed/filled/expired, no application | anyone allowed to read | "No longer accepting applications" | — | — | — |
| Owner view | author | **Manage** (state, Mark filled / Close with confirm that says how many pending applicants will be told) + **Applicants** queue (waiting first) | Accept / Reject (confirm) / view profile | see above; closing notifies still-pending applicants only | none yet = explains you will be notified |
| Board → Your applications | signed-in | rows: role · project · poster + status text + next-step hint | open | — | hidden when none |
| Board → Your posts | signed-in | rows: role · project + state + "N to review" | open | — | hidden when none |

Developer (poster) and applicant see **different pages of the same URL**: the applicant gets one application status panel; the poster gets a management panel and a review queue. Never the same panel with different buttons.
Deliberately not shown: compensation on the board (the `discoverable_collab_posts` view does not expose `compensation_range`/`time_commitment`; adding them means a view migration, which is not required for the UX). They appear on the post page. Backlog item.

## 2. PLAYTESTING

### Playtest (request) lifecycle
```
Create playtest (project, description, focus, platforms, build type + build URL, requested_testers)
  └─ OPEN ⇄ FULL   (derived: FULL when confirmed testers ≥ requested; frees when a place opens or the limit is raised)
        └─ CLOSED   (developer stops sign-ups; can reopen; accepted testers keep access)
```
`current_testers` = confirmed testers (accepted + completed). Pending sign-ups are a queue and do not use places. Cap: 3 active sessions per tester. Sign-up to full/closed/private-project/blocked is rejected by the DB.
### Session lifecycle (one per tester + playtest)
```
REQUESTED ──┬─ developer accepts ──▶ ACCEPTED ──▶ build access ──▶ testing ──▶ feedback submitted ──▶ COMPLETED (terminal)
            ├─ developer skips ────▶ SKIPPED   (terminal; also possible from ACCEPTED)
            └─ tester withdraws ───▶ WITHDRAWN (from REQUESTED or ACCEPTED; may sign up again while the playtest is open)
```
Only ACCEPTED (and later COMPLETED) testers and the developer can read the build URL, and only through `get_playtest_build()`; the `build_url` column is not selectable. Feedback: one per session, only for the tester's own ACCEPTED session; inserting it completes the session atomically.

### Two mental models
| | **Developer** ("I need people to test my game") | **Tester** ("I want a game I can test and help") |
|---|---|---|
| Entry | Dashboard → Playtests → "Your playtests" | Playtests board → "Your sign-ups" |
| Flow | Create session → capacity/focus/build → requests arrive → accept/skip → tester plays → feedback arrives | Discover → request a place → wait → access build → play → submit feedback |
| Primary surface | `/dashboard/playtests` (developer tab): each playtest as a management block with capacity and testers **grouped by stage** (Waiting for you · Testing · Feedback received · Closed out) | `/playtests/[id]` tester journey panel and `/dashboard/playtests?as=tester` |
| Verbs | Accept, Skip, Close/Reopen sign-ups, Read feedback | Request a place, Withdraw, Open the build, Submit feedback |
| Never shown to | testers: other testers, capacity controls | developers: their own tester-side panel (they see a summary + link to management) |

### State → UI map
| State | Who | UI (Phase E target) | Actions | Notification | Empty / error |
|---|---|---|---|---|---|
| Open playtest on board | anyone (public projects only; block/mute filtered) | `PlaytestListing`: game → developer · posted → "What to test" excerpt → build type · platforms · places left → focus | open | — | none open = tester-oriented empty ("No playtests are open"; developers: how to request testers); error = `ErrorState` |
| Detail, signed out | anyone | facts + What to test + "Sign in to request a place" | sign in | — | — |
| Detail, no session, OPEN | signed-in tester | **Journey**: 1 Request · 2 Developer decides · 3 Get the build · 4 Play · 5 Send feedback (step 1 current) + what-happens-next copy | Request a place | developer: `playtest_signup` | 3-active-sessions / blocked / full messages from the DB shown inline |
| Detail, no session, FULL / CLOSED | tester | "Full — all places taken" / "Sign-ups closed" (no action) | — | — | — |
| REQUESTED | tester | Journey step 2 current: "Waiting for <dev>… you will be notified" | Withdraw (confirm) | — | — |
| ACCEPTED | tester | Journey step 3–5: **Access the build** (browser link / download / Steam key) + Submit feedback | Open build, Submit feedback, Withdraw | tester: `playtest_accepted` | build URL missing → explained |
| COMPLETED | tester | Journey done: "Feedback sent"; build still accessible | — | developer: `playtest_feedback` | — |
| SKIPPED | tester | Journey ends: "The developer is not proceeding with your sign-up" | — | tester: `playtest_skipped` | — |
| WITHDRAWN | tester | Journey ends; "Sign up again" if OPEN | Sign up again | — | — |
| Developer at `/playtests/[id]` | developer | Summary (capacity, waiting count), what accepted testers receive, Close/Reopen, link to management | Close / Reopen | — | — |
| `/dashboard/playtests` developer tab | developer | per playtest: header (game, state, "3 of 10 places · 2 waiting · 1 feedback"), stage groups, tester rows | Accept / Skip (Accept disabled at capacity, DB refuses too), Close/Reopen, View feedback | — | none requested = first-use; error = `ErrorState` |
| `/dashboard/playtests?as=tester` | tester | sign-ups grouped by what you owe next: "Feedback due" (accepted) · "Waiting" (requested) · "Finished" | Open, Submit feedback | — | none = first-use with link to the board |
| Feedback form | ACCEPTED tester only (server-checked) | labelled fields, 1–10 ranges, notes, time, private toggle | Submit | developer: `playtest_feedback` | other states explain why it is unavailable |

### Capacity
Unchanged: enforced in the database (accept beyond capacity refused; sign-up to full refused; counter is trigger-derived and cannot be written by clients). The UI shows "N of M places taken" and, for testers, places left; it never computes state itself.

## 3. Cross-cutting rules for the UI
- One status vocabulary in `components/workflow/StatusLabel.tsx`; **text is the state**, colour only reinforces. Lists use quiet `StatusText` (dot + word); only page headers use the badge form. No progress rings, scores, streaks or tester points.
- Rows, not cards: hairline dividers, one metadata line, right-aligned status where useful.
- Application/journey progress is a plain ordered list with `aria-current="step"`; not a graphic.
- Irreversible actions keep an inline labelled confirmation (now via `Dialog`); errors `role="alert"`; outcomes `role="status"`.
- Mobile: listing rows stack (meta under title), primary action full-width in the panel, tabs scroll horizontally, targets ≥ 44px.
- Backend untouched. Observed, not changed: compensation missing from board views; boards capped at 50 without paging; non-private feedback readable by anyone (existing design).

---

# Implementation record (what shipped)

**New components:** `CollaborationListing` (`board`, `mine`), `PlaytestListing` (`board`, `mine`), `StatusText` (quiet dot + word for list rows; `StatusLabel` badge kept for page headers), `StatusSteps` (ordered list; `aria-current="step"`; sr-only "done / current step / not reached / ended here"), `PlaytestsViews` (`DeveloperPlaytests`, `TesterPlaytests`).
**Rewritten on primitives (logic and server actions unchanged):** `ApplicationPanel`, `ApplicationActions`, `ClosePostButton`, `TesterPanel`, `PlaytestStatusControl`, `SessionActions`, `FeedbackDetail`, `FeedbackForm`, `NewCollabForm`, `NewPlaytestForm`. Confirmations use `Dialog` (focus trap, Escape, focus return). Deleted: unreferenced `ApplyToPostButton`.
**Pages:** `/collaborate` (kind tabs, Remote OK filter, listing rows, "Your applications" / "Your posts" beside the board with state + next step), `/collaborate/[id]` (facts via `MetadataBar`; applicant = application status panel; poster = manage panel + applicants queue, waiting first), `/collaborate/new`, `/playtests/browse` (tester's board, "You are testing" with next steps), `/playtests/[id]` (tester = five-step journey; developer = summary, build recipients, close/reopen), `/playtests/[id]/test/[session-id]`, `/dashboard/playtests` (tabs by side: `Your playtests` grouped by stage / `Testing others` grouped by what you owe next; URL `?as=tester`), `/dashboard/playtests/new`.
**Vocabulary:** Collaborate says "opportunity", "Looking for help / Offering help", "application"; Playtests says "request a place", "places left", "Taking requests". The two pages cross-link in one sentence and share no filter or heading language. Playtest status label changed from "Open for sign-ups" to "Taking requests".
**Loading:** `(board)` route group so `/collaborate/[id]` and `/collaborate/new` keep their own status (404 stays 404); `app/playtests/browse/loading.tsx` (leaf); `/dashboard/playtests` uses the shared dashboard skeleton.

## Verified
- Production build smoke (`next start`): `/collaborate` (+ filter URLs) 200; an open post 200; nonexistent post **404**; `/playtests/browse` 200; an open playtest 200; nonexistent playtest **404**; `/collaborate/new`, `/dashboard/playtests` (+ `?as=tester`, `/new`) and `/playtests/x/test/y` redirect signed-out users to `/login`; the public playtest HTML contains no `build_url`.
- Browser signed-out at desktop and 375px: board tabs/filter URLs and `aria-current`; post page; playtest page showing the request journey with a single primary action; filtered empty state.
- `/design/workflows` (dev only, 404 in production) renders, from labelled fake data: every collaboration row type; application pending / accepted / rejected / withdrawn / pending-but-post-closed / apply / signed-out; tester journey for none (open, full, closed), requested, accepted (browser link and Steam key), completed, skipped, withdrawn, signed out; developer side (waiting, testing, feedback, closed out; empty and failed); tester side; feedback, new-playtest and new-collaboration forms. At 375px: no horizontal overflow, no unlabelled controls, one `h1`, no button under 44px (inline name links in sentences are 16–25px).
## Not verified (email-OTP; no real session)
Every write and role check in a browser: apply, withdraw, accept/reject, mark filled/close, request, accept/skip, withdraw, build access for an accepted tester, feedback submit, developer close/reopen, notification delivery, block/mute effects on the boards, capacity refusal messages. These paths run through the unchanged server actions and the Phase 8 triggers/RLS (SQL-verified in Phase 8); this phase did not re-run that SQL.
## Backlog / observations (not changed)
Compensation and time commitment are not on the board (view does not expose them); boards capped at 50 without paging; non-private feedback readable by anyone (existing design); `fetchEngagement` and dashboard query count; `loading.tsx`/404 architecture cleanup.
