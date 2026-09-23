# Glyph feature benchmark matrix

**Date:** 2026-09-23  
**Legend:** ● strong/core implementation; ◐ partial or narrower implementation; ○ absent/not central; — not applicable or not verified. Evidence tags are defined in `glyph-competitor-feature-research.md`.

This matrix benchmarks workflow structure, not feature-count parity. A ● does not mean Glyph should copy the product; it means the pattern is central and well evidenced there.

| Feature / workflow | LinkedIn / Wellfound / Contra | GitHub / GitLab | itch.io / Steam | Meetup / Luma / Eventbrite | Ludum Dare / Devpost | Linear / Slack / Discord | Glyph now | Importance / evidence |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Proof-led developer profile | ● | ● | ◐ | — | ◐ | — | Present; current work and projects are strong, curation/visibility incomplete | **CORE** · official docs + live UI |
| Structured availability | ● | ○ | ○ | — | ◐ | — | Present, but not detailed enough for matching | **CORE** · official docs |
| Featured/pinned work | ● | ● | ◐ | — | ◐ | — | Weak: current work exists; no deliberate ordered pins | **CORE** · official docs |
| Canonical project page | ◐ | ● | ● | — | ● | — | Present and structurally strong | **CORE** · live UI + official docs |
| Draft-first project creation | ◐ | ● | ● | — | ● | — | Private default approximates draft; readiness is weak | **CORE** · official docs |
| Media upload and ordering | ● | ◐ | ● | ● | ● | — | Weak: URL fields instead of robust asset workflow | **CORE** · live UI + official docs |
| Visibility distinct from discovery/indexing | ◐ | ● | ● | ◐ | ● | — | Visibility exists; indexing readiness is unclear | **CORE** · official docs |
| Project-scoped updates/devlogs | ◐ | ● | ● | — | ◐ | — | Implemented foundation; media/schedule/distribution preview missing | **CORE** · official docs |
| Structured collaboration opening | ● | ◐ | ◐ | — | ● | — | Present; skills, duration, questions, pause/reopen missing | **CORE** · official docs |
| Portfolio-first application | ● | ◐ | ○ | — | ● | — | Present in basic form; reviewer workflow is thin | **CORE** · official docs |
| Application lifecycle and shortlist | ● | ◐ | ○ | — | ● | — | Pending/accepted/rejected/withdrawn exists; shortlist/reviewer tools weak | **CORE** · official docs + code verified |
| Project-attached playtest | — | — | ● | — | ◐ | — | Present and well attached | **CORE** · official docs |
| Cohort/capacity/build access state | — | — | ● | — | ◐ | — | Capacity and requests exist; cohort/expiry/revoke granularity weak | **CORE** · official docs + code verified |
| Focused structured feedback | — | ◐ | ◐ | — | ● | — | Present; eligibility and reusable question schema weak | **CORE** · official docs + community feedback |
| Event draft → publish lifecycle | ◐ | — | ◐ | ● | ● | ◐ | Backend states exist; creation publishes immediately | **CORE** · official docs + code verified |
| Timezone and online/hybrid handling | — | — | — | ● | ● | ● | Missing or weak | **CORE** · official docs |
| Capacity, approval, waitlist | — | — | — | ● | ◐ | ◐ | Capacity exists; approval/waitlist UI incomplete | **CORE** · official docs + live UI |
| Host/cohost and attendee management | — | ● | — | ● | ● | ● | Organizer identity exists; cohost/check-in tools weak | **HIGH** · official docs |
| Recurrence and rescheduling semantics | — | — | — | ● | ◐ | ● | Missing | **HIGH** · official docs |
| Jam submission state machine | — | ● | ● | — | ● | — | Present but incomplete | **CORE** · official docs |
| Ranked/non-ranked, judging, criteria freeze | — | ◐ | ● | — | ● | — | Missing or weak | **CORE** · official docs |
| Late submission and moderation tools | — | ◐ | ● | — | ● | ● | Missing | **HIGH** · official docs |
| Studio public identity + private management | ● | ● | ◐ | ◐ | ● | ● | Implemented foundation; live quality not re-verified | **CORE** · official docs + code verified |
| Minimal roles and invitations | ● | ● | ◐ | ● | ● | ● | Owner/admin/member and invites exist | **CORE** · official docs + code verified |
| Publisher project shortlist | ◐ | ● | ◐ | — | ● | — | Present privately | **HIGH** · public forms + code verified |
| Project-anchored contact and status | ● | ● | ◐ | — | ● | — | Present; next action/history/notes are thin | **HIGH** · official/public form evidence |
| Typed Explore facets | ● | ● | ● | ● | ● | — | Present but needs surface-specific taxonomy | **CORE** · live UI |
| Universal search with type tabs | ● | ● | ● | ● | ◐ | ● | Present; scope/filter/result anatomy need strengthening | **CORE** · official docs + live UI |
| Work-anchored following feed | ◐ | ● | ● | ◐ | ◐ | ● | Present; keep chronological/project-led | **HIGH** · live UI + official docs |
| Action queue separate from activity | ◐ | ● | ○ | ◐ | ◐ | ● | Present on Dashboard and should remain distinct | **CORE** · official docs + code verified |
| Notification reason, grouping, Done/Saved | ● | ● | ◐ | ● | ◐ | ● | Day grouping exists; reason/Done/Saved/preferences incomplete | **HIGH** · official docs |
| Per-object notification preferences | ● | ● | ◐ | ● | ◐ | ● | Weak | **HIGH** · official docs |
| Visitor preview before publish | ● | ◐ | ● | ● | ● | — | Missing across authoring flows | **HIGH** · official docs |
| Calendar export/integration | — | — | — | ● | ● | ● | Missing | **HIGH** · official docs |

## Feature importance summary

### CORE / MUST HAVE

Canonical Project relationships; draft-first creation; explicit lifecycle states; safe visibility/discovery separation; structured collaboration and playtest workflows; timezone-safe Events; trustworthy Jam submission/judging; typed search; action queue distinct from activity; least-privilege management.

### IMPORTANT / HIGH VALUE

Pinned work, publish preview, reusable questions, cohort management, waitlist, cohosts/check-in, calendar integration, notification reason/preferences, publisher next-action history, saved filters.

### SUPPORTING / NICE TO HAVE

Clone event, late-submission links, private collections, calendar follow, reusable templates, completion reminders.

### POWER USER

Advanced query syntax, saved notification views, bulk attendee/applicant actions, judge assignment queues, recurring-series exception editing.

### OPTIONAL / FUTURE

Paid tickets, incentives, video research, imports, rating queues, public lists, richer analytics.

### AVOID / NOT FIT FOR GLYPH

Pay-to-rank discovery; generic engagement feed; ratings of people; bidding/escrow marketplace; full ATS/CRM; arbitrary page theming; enterprise roles before evidence; AI-generated submissions as the default.
