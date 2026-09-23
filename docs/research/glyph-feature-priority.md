# Glyph feature priority

Priority reflects repeated competitor evidence, Glyph's project-centered thesis, current gaps, user harm if omitted, and implementation/security cost. Competitor prominence is not usage telemetry. “Must have” means required for Glyph's core loop or for a workflow once Glyph promotes it as complete—not that every domain ships in one release.

## FOUNDATION / MUST HAVE

| Rank | Capability | Evidence and rationale | Scope boundary |
|---:|---|---|---|
| 1 | Canonical Project context everywhere | GitHub, itch.io, Steam; protects provenance | No generic duplicate posts |
| 2 | Explicit lifecycle states and authorized transitions | Every mature workflow studied | State truth before visual polish |
| 3 | Private drafts, visibility, and discovery eligibility as separate concepts | itch.io, GitHub, Behance | Server-enforced, previewable |
| 4 | Project media/assets, ordering, readiness, visitor preview | itch.io, Behance, Product Hunt | Avoid custom page theming |
| 5 | Timezone-safe dates and deadlines for every existing timed object | Meetup, Luma, Eventbrite, Devpost | Store UTC + IANA zone |
| 6 | Studio/Project permission clarity and least privilege | GitHub Organizations, Figma | Owner/Admin/Member plus explicit Project access |
| 7 | Home action queue separate from Following/Notifications | Linear/GitLab pattern; current Glyph direction | Management queue remains source of truth |
| 8 | Safety and scoped private-data boundaries | Collaboration/playtest/community patterns | Report/block/rate limit; no private answers or links in public payloads |

## CORE LOOP / MUST HAVE

| Rank | Capability | Evidence and rationale | Scope boundary |
|---:|---|---|---|
| 1 | Proof-led Developer/Studio profile and current work | LinkedIn, GitHub, Contra | No resume-completeness treadmill |
| 2 | Fast Project-scoped Devlog with media and preview | itch.io, GitHub releases | Scheduling/distribution controls later |
| 3 | Structured collaboration terms, proof-led response, decision and handoff | LinkedIn, Wellfound, Contra, GitHub forms | No ATS, bidding, or auto-fit scoring |
| 4 | Separate playtest request, grant, playable window, short feedback and completion | Steam, PlaytestCloud, TestFlight | Quick path first; do not host binaries initially |
| 5 | Scoped communication or explicit external handoff | Repeated user-workflow need; review finding | No open-DM-first product |
| 6 | Basic retrieval for Projects, People/Studios, Opportunities | GitHub, LinkedIn, itch.io | Do not expose empty type tabs |

## EXPANSION — IMPORTANT ONCE VALIDATED

| Capability | Minimum credible scope | Defer until demand |
|---|---|---|
| Events | Draft/publish, timezone, online/in-person, RSVP/capacity, change notice, calendar link | Native questions, waitlist, check-in, recurrence, ticketing |
| Jams | Phase dates, rules/eligibility, Project entry snapshot, showcase result, moderation | Ranked judging, weighted criteria, late links, voting |
| Publisher workflow | Developer-side private contact tracker and stable Project snapshot | Publisher accounts, read receipts, two-sided pipeline |
| Search/Explore | Projects, People/Studios, Opportunities with honest filters/editorial labels | Every object tab, advanced ranking, saved views |
| Notifications | Reason, reliable deep link, unread/read, mute/preferences | Done/Saved/Snooze/bulk/custom views |

## IMPORTANT / HIGH VALUE

| Capability | Why now | Dependency |
|---|---|---|
| Ordered profile pins and structured availability | Converts identity into fast, trustworthy proof | Project identity and privacy model |
| Devlog media, type, schedule, and distribution preview | Makes updates useful without social-feed drift | Asset workflow and notification policy |
| Collaboration skills/duration/questions/shortlist/reviewer grant | Improves fit and review quality | Application privacy/RLS |
| Playtest eligibility, cohort/build expiry and granular revoke | Prevents ambiguous or stale access | Grant model and audit |
| Event cohosts, attendee tools, check-in, calendar export | Completes organizer lifecycle after demand | Registration state machine |
| Ranked Jam moderation, late links, criteria freeze, result preview | Required together if ranked mode ships | Versioned submissions and roles |
| Notification reasons, Actionable/Updates, preferences | Controls noise as workflows expand | Typed event model and observed volume |
| Publisher relationship history and next action | Useful developer-side tracking, not proof of publisher adoption | Private Project relationship record |
| Visitor/participant preview across publishing flows | Prevents permission and presentation mistakes | Audience-safe query shapes |

## SUPPORTING / NICE TO HAVE

- Event clone and reusable creation templates.
- Personal saved items and Project collections.
- Reminder to refresh stale availability.
- Reusable application/registration question templates.
- Safe duplicate/clone for Jam setup.
- Shareable filtered search URLs.
- Post-event follow-up/resources.

## POWER USER

- Saved Search/Explore/notification views.
- Bulk applicant/attendee/request actions with undo/audit.
- Recurring event series with instance exceptions.
- Judge assignment and minimum-review queues.
- Advanced query syntax after simple filters are complete.

## OPTIONAL / FUTURE

- Public collections/lists and editorial followable calendars.
- Verified metadata import from external work.
- Playtest incentives, recording, or research panels.
- Paid Events, ticketing, seating, tax/refund workflows.
- Jam theme suggestion/voting and richer analytics.
- Publisher pitch-package export from a Project snapshot.

## AVOID / NOT FIT FOR GLYPH

1. Generic engagement-ranked social feed.
2. Pay-to-rank projects, profiles, opportunities, or pitches.
3. Ratings/reputation scores for developers.
4. Gig bidding, proposal credits, escrow, payouts, or time tracking.
5. Full recruiter ATS and opaque AI fit scoring.
6. Full publisher CRM with forecasts, email sync, sequences, and deal automation.
7. Arbitrary custom CSS/page themes.
8. Public jam voting without eligibility, abuse controls, and an explicit host choice.
9. Open DMs as the primary professional contact model.
10. AI-generated project, pitch, application, or feedback text as the default workflow.

## Decision rule for scope

A competitor feature enters Glyph only if it strengthens at least one of: credible work identity, Project progress, safe collaboration, actionable feedback, time-bound participation, or trustworthy discovery. If it mainly monetizes attention, simulates enterprise administration, or creates an unrelated marketplace, reject it even when competitors market it prominently.
