# Glyph recommended product architecture

## Product thesis

Glyph should be the professional work graph for indie game creation: identity is earned through visible Projects and Devlogs; collaboration and playtesting are structured operations attached to Projects; Studios organize responsibility; Jams and Events create time-bound participation; Publishers relate privately to canonical Projects.

It should not become a generic professional network, storefront, gig marketplace, event ticketing company, or CRM.

## Product modes

| Mode | User question | Primary surfaces |
|---|---|---|
| Operate | What needs my attention, and what am I running? | Dashboard, Project/Studio/Event/Jam manage views |
| Discover | What unfamiliar work, people, and opportunities are worth exploring? | Explore, Jams, Events, Opportunities |
| Retrieve | Where is the specific person/project/object I need? | Search and contextual search |
| Follow | What changed in work I care about? | Feed |
| Respond | What request, invitation, application, or access decision needs action? | Notifications + contextual queues |

These modes share objects and identity but should not share one undifferentiated card layout.

## Global navigation

Authenticated desktop primary: **Home, Explore, Following, Opportunities**. **Create** is an action, not an information destination. Utilities: **Search, Notifications, Profile/account**. Events, Jams, Studios, and publisher-facing tools remain visible through Explore/contextual routes and are promoted only when inventory and repeat use justify it.

Mobile bottom navigation: **Home, Explore, Create, Alerts, You**. Search is the first control in Explore and a header action from Home/management. Opportunities are a stable Explore section and a Home module when the user's declared intent matches. Current management context is reached from Home's Your work or a canonical object's Manage button.

Global Create is prioritized rather than seven equal choices: Project; Devlog after Project selection; Opportunity (Collaboration or Playtest); then Event, Jam, and Studio under More/recently used.

## Object hierarchy and ownership

- **Developer:** identity, availability, ordered proof, follows, memberships.
- **Studio:** public identity plus private membership/invitation/ownership management.
- **Project:** durable work hub; owned by Developer or Studio.
- **Devlog:** typed Project update.
- **Collaboration opening → Application:** structured work need and private response.
- **Playtest → Request → Access grant/cohort → Session → Feedback:** separate admission, playability, participation, and result states.
- **Event → Registration/attendance:** organized by Developer or Studio, optional Project relation.
- **Jam → Team/Entry → Submission snapshot → Score/result:** time-bound competition/showcase.
- **Publisher relationship:** initially a developer-side private external-contact/Project record. A first-class Publisher organization identity is deferred until its actor and verification model are proven.
- **Notification:** durable, safe reference to an event and object; not the source of truth.

## Page families

1. **Canonical identity pages:** Developer, Studio, Project.
2. **Canonical time-bound pages:** Event, Jam, Playtest.
3. **Canonical opportunity pages:** Collaboration opening and publisher-visible Project.
4. **Management workspaces:** requests/applicants/registrations/submissions/members/contacts.
5. **Discovery indexes:** Explore and type-specific browse pages.
6. **Streams:** Following and Notifications, with different inclusion rules.
7. **Creation/editing:** draft-first, object-specific flows.

Public pages and management workspaces use different data contracts. Owner tools may link from a public page, but private records are never hydrated into its payload.

## Creation architecture

- A global Create menu routes to typed creation.
- If a child object requires a Project, the Project is selected first and remains visibly pinned.
- **Quick create → setup workspace:** Project, Event, Studio. Ask only minimum identity/time fields, create a private draft, then continue in management.
- **Contextual single-page editor:** Devlog and simple Collaboration. Keep the Project pinned; reveal advanced terms/questions only if enabled.
- **Guided setup:** Playtest and Jam only when access, eligibility, deadlines, builds/submissions, and evaluation have dependent decisions. Limit to 3–5 resumable semantic steps.
- Required data is the minimum necessary to create a safe draft; publish readiness is a separate contract.
- Preview is proportionate: full audience preview for public/access-bearing objects; lightweight preview toggle for Devlogs.
- After creation, route to the management overview with one recommended next action.

Every authoring flow defines draft-creation timing, Saving/Saved/Failed states, resume behavior, upload retry, collision recovery, inline plus summary validation, permission loss, concurrent edits, discard/recovery, and a quick path with safe defaults. Advanced controls never block a solo creator's first useful result.

Detailed fields and lifecycle steps are in `glyph-creation-flow-benchmark.md`.

## Management architecture

Every managed object gets an overview that answers:

- current public/operational state;
- next scheduled transition or deadline;
- items requiring action;
- participation/capacity summary;
- recent safe activity;
- highest-value next action;
- link to settings and archive/cancel controls.

Review queues use consistent primitives—status, proof/context, submitted time, assignee/reviewer, next action—but do not erase domain differences. A playtest request is not a job application; a jam submission is not an RSVP.

## State model: keep independent axes independent

| Axis | Examples | Rule |
|---|---|---|
| Editorial lifecycle | Draft, Published/Active, Closed/Completed, Archived | Mutually exclusive durable platform state |
| Audience visibility | Private, Invite-only, Unlisted, Public | Who may open it; never treated as lifecycle progress |
| Distribution | Excluded, Eligible, Indexed, Featured/Suppressed | Where it can appear, with reason/readiness |
| Domain stage/phase | Concept/In development/Released; Recruiting/Active; Registration/Submission/Judging | Object-specific operational or product phase |
| History event | Rescheduled, reopened, access revoked, criteria changed | Timestamped event, not a durable state |

Applications, registrations, test grants, sessions, and submissions retain their own state machines, but UI shows each role one primary status sentence and one next action. Audit/history stays in a timeline. “Viewed” and “Rescheduled” are events, not misleading terminal labels.

## Explore, Search, Following, and Notifications

- **Explore** finds unknown objects. It combines clearly labeled editorial modules with type-specific browse sections. Object tabs and filters preserve taxonomy; “Featured,” “Trending,” and “New” are never visually conflated.
- **Search** retrieves known or constrained objects. Start with All plus Projects, People/Studios, and Opportunities; add dedicated tabs only when inventory and query intent justify them. Filters live in URL state; contextual search declares its scope.
- **Following** follows the graph. Default grammar is actor + action + object + Project/context + time. It is chronological or transparently grouped, not engagement-ranked. Media appears when part of the update.
- **Notifications** communicate action or awareness. They show reason, object, context, time, unread state, and target availability. As volume grows, add Actionable/Updates, Done/Saved, filters, bulk actions, and per-object overrides.

Action ownership is explicit:

- **Home / Needs attention** is the canonical cross-object action queue.
- **Contextual management queue** is the source of truth and execution surface.
- **Notifications** are delivery receipts/awareness; marking read never completes the task.
- **Following** never contains private operational requests.

Resolving a domain task removes/resolves the Home action; the Notification remains readable; management retains history.

## Permissions and security architecture

- Least privilege: Owner/Admin/Member is the Studio baseline; sensitive reviewer/judge access is an explicit grant.
- Public, participant-owned, reviewer-private, and owner-private records use separate policies and response shapes.
- Authorization happens server-side for build access, applicant/tester answers, shortlist notes, exports, and state transitions.
- Capacity promotion, acceptance, and ownership transfer are transactional.
- Audit role/access/state/build-link changes.
- Reauthenticate for sensitive exports, ownership transfer, bulk access, and destructive operations.
- Deletion/private transitions produce safe unavailable references rather than leaking cached content.
- Add scoped communication, block/report, suspicious-link handling, rate limits, compensation labels, and participant-removal audit before opening high-trust workflows broadly.

## Delivery sequence

1. **Foundation:** orthogonal state model; timezones; draft/autosave/publish; private-data boundaries; audit; reliable assets/external links.
2. **Core loop:** Project proof and Devlogs; proof-led profile; lightweight Collaboration + scoped handoff; quick Playtest + in-flow feedback; Home action aggregation.
3. **Retrieval/repeatability:** Search for Projects, People/Studios, Opportunities; honest Explore; duplicate/reopen/staleness controls; Project-specific credits/access.
4. **Expansion:** minimum credible Events; showcase Jams; private developer-side publisher tracker; notification reason/mute/preferences.
5. **Later operations:** Event waitlists/check-in/recurrence; ranked Jam judging; advanced playtest cohorts; saved views/bulk triage/collections.

Do not redesign every surface simultaneously. Validate each page family with its real object states and responsive management flow before extending the visual system.

## Review disagreements and final decisions

Four independent passes reviewed all eight drafts: product strategy, UX/IA, indie-developer target user, and skeptical scope/complexity.

| Disagreement | Final decision |
|---|---|
| Competitor “core” means people use it most | Reject. This research proves structural centrality/repetition, not usage frequency; validate with interviews and telemetry |
| Every exposed surface is an equal strategic MUST HAVE | Reject. Foundation and the Project→Collaboration/Playtest loop come first; Events/Jams/Publisher depth is expansion |
| Project has one lifecycle including Private/Public/Discoverable/Released | Reject. Model editorial lifecycle, visibility, distribution, domain stage, and history separately |
| Dashboard, Notifications, and queues can all own actions | Reject. Home aggregates, management executes, Notifications record delivery/awareness |
| Five primary nav items plus Create destination is acceptable | Simplify to Home, Explore, Following, Opportunities; Create is an action; mobile is Home/Explore/Create/Alerts/You |
| Every consequential flow should be a stepper | Reject. Use quick-create, contextual editor, or guided setup according to field dependency and usability testing |
| Full Event operations and ranked Jam judging are near-term | Reject. Ship minimum credible listing/showcase modes; deepen only with demand. Trust controls remain mandatory if ranked mode exists |
| Publisher should begin as a two-sided in-product network | Reject. Begin as developer-side private tracking/project snapshot; define publisher identity before expansion |
| Notification Done/Saved/Snooze/bulk controls are inevitable now | Defer. Ship reason, deep link, unread/read, mute/preferences; add power tools only after volume evidence |
| Avoid open DMs means communication can remain external/undefined | Reject. Collaboration, Playtest, and publisher contact need scoped threads or an explicit external handoff, with safety boundaries |

The reviewers agreed to preserve: Project as durable hub; public/private data separation; no generic engagement feed; no people ratings/pay-to-rank/full ATS/full CRM/gig marketplace; least privilege; and evidence labels that never overclaim authenticated or quantitative usage.
