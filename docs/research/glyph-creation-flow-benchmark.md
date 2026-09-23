# Glyph creation-flow benchmark

## Shared creation contract

Across GitHub, itch.io, Luma, Meetup, Devpost, and Contra, the best flow is not always the shortest form. It minimizes irreversible decisions early, creates a recoverable draft, asks advanced questions only when relevant, previews consequences, and returns the creator to a management view with a clear next step.

Every consequential public or access-bearing Glyph creation flow should therefore provide:

- a stable owner and parent context;
- save-as-draft or immediate draft creation;
- explicit required/optional labels and inline validation;
- visibility separate from discovery eligibility;
- proportionate visitor/participant preview;
- a review step for consequential publishing;
- an auditable state transition and a post-create checklist where readiness matters.

Use three interaction families: quick-create then setup (Project/Event/Studio), contextual single-page editor (Devlog/simple Collaboration), and guided setup only for dependent Playtest/Jam decisions. Every flow must recover from interruption, failed uploads, validation, slug collision, permission loss, and save failure without losing valid work.

## 1. Project

**Reference models:** GitHub repository creation for minimal start; itch.io for private draft and publishing readiness; Behance for ordered media; Product Hunt for preview and launch timing.

**Recommended flow**

1. Create → Project.
2. Required: owner (Developer or Studio), name, project type. Create draft immediately.
3. Identity: one-line pitch, stage, genre/category, platforms, tags.
4. Proof: cover, ordered screenshots/trailer, long description, build/playable/external links.
5. People: credits and collaborator invitations with roles and acceptance state.
6. Intent: optionally start separate Collaboration, Playtest, or publisher-interest child flow.
7. Access: Private, Unlisted, Public; show discovery eligibility separately.
8. Preview as visitor → Publish.
9. Management checklist: missing proof, indexing readiness, next update, open operations.

**Current Glyph:** one long form with title/slug required and private default; media are URLs; no strong readiness/preview. **Decision:** adapt to staged progressive disclosure without blocking early drafts.

## 2. Devlog

**Reference models:** itch.io project-bound devlogs; GitHub releases for version context; editorial publishing for draft/preview/schedule.

1. Start from Project or global Create with Project selector.
2. Choose type: Progress, Milestone, Release/build, Playtest update, Team/collaboration.
3. Required: title and body. Optional: media, version/build, changelog, focus areas.
4. Auto-save draft; Markdown/rich preview.
5. Audience/distribution preview: Project page, follower feed, participant notification/digest eligibility.
6. Publish now or schedule.
7. Canonical Project history; edit history for material corrections; previous/next navigation.

**Current Glyph:** title/body, Markdown preview, draft or immediate publish. **Gap:** media, scheduling, typed updates, distribution preview.

## 3. Collaboration opening and application

**Reference models:** Wellfound/LinkedIn for structured constraints and review; Contra for proof-first applications; GitHub issue forms for role-specific questions.

**Host flow**

1. Start from Project → Open collaboration.
2. Role and deliverable; looking-for/offering; skills; compensation type/range/currency.
3. Remote/location/time zone; hours/week; expected duration; start timing; expiry.
4. Add up to five role-specific questions; select reviewers.
5. Preview → Draft/Open. Later transitions: Open ↔ Paused → Filled/Closed; closure reason visible.

**Applicant flow**

1. Inspect Project, terms, owner identity, and closure date.
2. Apply with note, relevant Glyph work, availability, and answers; optional external resume/link.
3. Applicant state: Submitted → Viewed/Shortlisted → Accepted or Declined; applicant can Withdraw.
4. Reviewer management: filter, compare relevant proof, private notes, shortlist, decision, message.
5. Acceptance creates a handoff checklist; it does not silently grant Project edit access.

**Current Glyph:** strong project anchoring and base fields; lacks structured skills/duration/questions, pause/shortlist, reviewer grants, and explicit handoff.

## 4. Playtest

**Reference models:** Steam Playtest for project-attached access and cohorts; PlaytestCloud for study brief/tasks; TestFlight for build-scoped expiry.

1. Project → New playtest.
2. Brief: purpose, target experience, platforms/devices, dates, capacity, participation mode (request/open/invite-only).
3. Eligibility: region/language/device/experience only when necessary; transparent reason; optional acknowledgement/NDA.
4. Build access: external build/key/link, version, instructions, validity window, per-cohort access policy.
5. Study: focus areas, optional ordered tasks, short structured questions, freeform feedback.
6. Preview → Draft → Recruiting.
7. Requests: Requested/Waitlisted/Accepted/Declined/Withdrawn.
8. Sessions: Not started/In progress/Submitted/Completed/Skipped/Expired; access can be revoked or phase paused.
9. Developer review: responses by build/cohort; acknowledge/close; export later only with explicit authorization.
10. End phase → stop signup → revoke where possible → archive while retaining safe history.

**Current Glyph:** project, build link/key, platform, capacity, focus areas, private accepted-tester access, sessions/feedback. **Gap:** eligibility, reusable questions, cohort/build expiry, granular revoke, participant deadline/state messaging.

## 5. Event / meetup

**Reference models:** Luma for fast first draft; Meetup for recurrence and host tools; Eventbrite for registration/check-in.

1. Create → Event. Required: title, organizer, start/end, timezone.
2. Type and mode: in-person/online/hybrid; venue or private join details.
3. Public page: description, cover, agenda/speakers optional, accessibility/contact information.
4. Attendance: capacity, approval, waitlist, guest allowance, RSVP window, registration questions.
5. Team and visibility: host/cohosts; Public/Unlisted/Invite-only; discoverability separate.
6. Review → Draft or Publish; optional calendar export and invitations.
7. Attendee lifecycle: Interested/Requested → Going/Waitlisted/Declined/Cancelled → Checked in/No-show.
8. Host tools: registrations, targeted message, promote from waitlist, check-in.
9. Edit/reschedule/cancel with affected-attendee preview and notification; recurrence later with “this/this and following/all.”
10. Post-event: Completed state, attendance correction, follow-up/resources. No attendee ratings.

**Current Glyph:** core descriptive/date/venue/capacity fields but local time lacks explicit timezone, and creation immediately publishes. Recurrence, hybrid/private details, approval/waitlist, questions, cohosts, check-in, and change communication are gaps.

## 6. Jam

**Reference models:** itch.io for complete host controls and locked submission state; Devpost for eligibility/draft/judging trust; Ludum Dare for simple participation culture.

1. Host creates draft: title, host, start/end/timezone, theme release rules, team size/assets, code of conduct.
2. Configure submission: required Project snapshot/build/media fields, eligibility, late-entry policy.
3. Configure outcome: Showcase or Ranked. If ranked, select judges/community/participants, criteria, weights, scoring visibility, tie handling.
4. Preview → Publish; participant registration/team formation.
5. Submission draft with readiness checklist; submit by deadline; snapshot answers/build/version.
6. Lock uploads or require audited host override; late links are single-use and expiring.
7. Judging: criteria freeze, conflict disclosure, assigned queue, moderation and disqualification with reason.
8. Results preview for host → Publish → archive canonical entry/project relationship.

**Current Glyph:** dates, voting window, theme, rules, team size/assets. **Gap:** showcase/ranked choice, eligibility, required submission schema, version lock, judging roles/criteria, moderation, late entry, results preview.

## 7. Studio

**Reference models:** GitHub Organizations for public/private separation and invitations; Figma for workspace/team context; Behance for public multi-owner attribution.

1. Create with name and owner; reserve slug and create private setup state.
2. Add public identity: summary, cover/avatar, location/site, disciplines.
3. Invite members by handle/email; default Member role. Roles remain Owner/Admin/Member initially.
4. Attach Projects with explicit Project-owner approval; membership alone does not imply edit rights to every Project.
5. Preview and publish Studio page.
6. Manage invitations, roles, member removal, ownership transfer, project detachment, archive/delete.

**Current Glyph:** creation, roles, invites, ownership transfer, and Project attachment are a sound base. Add invitation status clarity, public preview, access explanation, and recovery-safe transfer.

## 8. Publisher shortlist/contact

**Reference models:** public publisher pitch forms for evidence; recruiting inboxes and lightweight pipelines for next-action state.

**Publisher flow**

1. Discover a Project; save privately to shortlist with optional note/tag.
2. Contact from the Project: purpose, message, optional specific request and next-action date.
3. Developer sees sender organization/role and Project context; reply, decline, archive, or report.
4. Private relationship timeline records sent/read/replied/declined/archived and manual follow-up.

**Developer pitch flow, if added later**

Project identity, team/contact, genre/platform/stage, one-line pitch and core loop, release plan, audience/comparables, trailer, pitch deck, playable build, budget/support sought. Reuse a Project snapshot; do not ask teams to rebuild a disconnected profile for each publisher.

**Current Glyph:** shortlist and project-context contact already exist. Add next action, history, safe external-material boundary, and minimal internal notes. Reject deal forecasting, email sync, sales sequences, and heavyweight CRM.

## Cross-flow permission rules

- Public objects, submissions/requests, and private management records are separate resources.
- Reviewer or judge access is explicit and narrower than Project edit access.
- Applicants/testers see only their own sensitive submission and the disclosed status.
- Build links, eligibility answers, applicant notes, publisher notes, and moderation evidence require server-authorized reads.
- State changes and sensitive access changes are audited; bulk grants, ownership transfer, and destructive operations require reauthentication where proportionate.
