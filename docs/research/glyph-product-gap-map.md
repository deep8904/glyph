# Glyph product gap map

## Baseline and confidence

Baseline inspected: `/Users/deeppatel/glyph`, branch `portfolio-screenshots`, commit `6f410cd`, plus current routes, forms, migrations, and existing design/audit documents. The local rendered app was not reachable during this pass, so “present” below means **CODE VERIFIED**, not newly browser-verified. Existing unrelated worktree changes were not touched.

## Missing but important

| Gap | Evidence | Why it matters | Priority | Impact |
|---|---|---|---|---|
| Project asset upload/order/readiness and visitor preview | itch.io, Behance, Product Hunt | Project proof is Glyph's central currency | MUST | Storage policy, asset records, draft checklist, preview |
| Explicit timezone for Events/Jams/Playtests | Meetup, Luma, Eventbrite, Devpost | Prevents real-world schedule failure | MUST | UTC + IANA zone, migration/backfill, form/display |
| Event draft/review, online/hybrid, approval/waitlist, questions | Meetup/Luma/Eventbrite | Current immediate publish cannot support serious organizing | MUST | State UI, registration schema, transactional capacity/RLS |
| Event change communication/check-in/completion | Meetup/Eventbrite | Lifecycle does not end at publish | HIGH | notification outbox, attendee management, audit |
| Jam showcase/ranked mode, criteria/judges, submission snapshot | itch.io/Devpost | Trust and fairness require explicit rules and immutable deadline state | MUST | versioning, role-scoped RLS, scoring |
| Collaboration skills/duration/questions/shortlist/paused state | LinkedIn/Wellfound/Contra/GitHub forms | Reduces vague posts and ad-hoc review | MUST | structured fields, form schema, reviewer views |
| Playtest eligibility/questions/cohort/build expiry/revoke | Steam, PlaytestCloud, TestFlight | Admission, access, and completion are different states | MUST | cohort/grant model, secure access checks, deadlines |
| Profile pins and structured availability audience | LinkedIn/GitHub/Contra | Makes identity scannable and matching trustworthy | HIGH | ordered pins, preference/privacy model |
| Search type tabs and surface-specific filters | LinkedIn/GitHub/itch.io | Mixed generic results hide object differences | MUST | search contract/index, URL-state filters |
| Notification reason, action class, preferences and object overrides | GitHub/Linear/Slack | Prevents noise as workflow volume grows | HIGH | preference hierarchy, reason enum, batching |
| Publisher next-action/history and safe material boundary | public publisher forms + lightweight pipeline pattern | Maintains follow-up without becoming CRM | HIGH | private timeline, notes/next date, strict RLS |

## Present but weak

| Capability | Current evidence | Weakness | Recommended repair |
|---|---|---|---|
| Project creation | `ProjectForm.tsx` | One long form; URL media; visibility carries too much draft meaning | Draft-first staged setup and readiness |
| Devlog creation | `DevlogForm.tsx` | Good draft/preview base; no media/type/schedule/distribution preview | Add only evidence-backed authoring utilities |
| Developer profile | `EditProfileForm.tsx`, `CurrentWork.tsx` | Strong current-work concept; no explicit ordered proof or granular intent | Pins + structured availability |
| Collaboration | `NewCollabForm.tsx` + migrations | Core terms and state exist; thin matching/review | Add structure and management before more discovery |
| Playtesting | `NewPlaytestForm.tsx` + session/RLS migrations | Strong project/access base; no cohort/version lifecycle | Separate request, grant, playable window, session |
| Events | `NewEventForm.tsx` + event states | Backend draft/cancel/complete exists; creation immediately publishes and omits operational fields | Expose lifecycle and organizer tools |
| Jams | `NewJamForm.tsx` | Dates/rules/theme/team exist; trust controls absent | Add submission and judging state machine |
| Studios | creation/member/invite/ownership flows | Good foundation; public/private boundary and invitation explanation could be clearer | Preview, status, contextual permissions |
| Publisher tools | shortlist/contact status | Useful minimal scope; lacks timeline/next step | Add minimal private relationship history |
| Feed | current work-anchored rows | Project media and richer provenance may be limited by data view | Fix data contract; do not add generic engagement |
| Notifications | day grouping, unread treatment, unavailable target | Passive list; limited reasons/actions/preferences | Incrementally add triage at real volume |

## Implemented foundation (quality not re-verified live in this pass)

- Project is the canonical object and already parents important workflows.
- Profile Current Work is more prominent without becoming a generic hero.
- Project opportunity summaries distinguish Playtest/Collaboration from About content.
- Dashboard separates “Needs attention” from informational activity.
- Feed remains a work/provenance stream rather than a generic social card grid.
- Notifications use unread dot plus weight and handle unavailable targets.
- Collaboration and Playtest migrations already encode meaningful states and server-side access boundaries.
- Studio Owner/Admin/Member, invitations, ownership transfer, and Project attachment form a sound minimal team model.
- Publisher shortlist/contact is already deliberately lighter than CRM.

## Underweighted cross-cutting gaps

- **Scoped communication and handoff:** Collaboration and Playtest need a Project-context thread or explicit external handoff, participant visibility, mute, block/report, and closure rules.
- **Safety/moderation:** report/block, spam/rate limits, compensation clarity, suspicious-link handling, participant removal, code-of-conduct/content-age boundaries.
- **External-link ergonomics:** safe preview, visibility warnings, human labels, broken-target handling, and optional user-approved import.
- **Staleness:** refresh/expiry prompts, last-reviewed signal, close/reopen/duplicate, applicant-visible closure category without silent auto-rejection.
- **Recovery:** autosave state, resume, upload retry, validation summary, collision recovery, permission/concurrent-edit behavior.
- **Cold-start empty states:** creator, collaborator, tester, jam participant, and publisher-facing developer need a truthful next action without fake trending.

## Unnecessary competitor features

- Storefront commerce, user reviews, pricing, wishlists, and sales analytics.
- Freelance bidding, boosts, proposal credits, escrow, payments, and time tracking.
- Full recruiter ATS, AI fit scoring, sourcing automation, and demographic analytics.
- Full CRM deal values, probabilities, forecasts, email sync, and automated sequences.
- Enterprise organization-role matrices before concrete permission needs emerge.
- Video/face recording, demographic panel marketplace, and sentiment automation for playtests.
- Public reputation scores for developers.
- Arbitrary page theming/CSS.
- Generic connection/follower growth mechanics and engagement leaderboards.
- Paid tickets, seating maps, tax/payment operations for Events in the near term.

## Future opportunities

- Event recurrence after clone + reschedule/cancel are reliable.
- Private/public collections and shareable lists.
- Saved Explore/Search filters and notification views.
- Project metadata import with explicit verification.
- Jam rating queues and theme suggestion/voting with abuse controls.
- Playtest incentives/recordings only if Glyph becomes a research marketplace.
- Publisher pitch export built from a versioned Project snapshot.

## Release and security gates

1. Never expose build URLs/keys, eligibility answers, application answers, private notes, publisher shortlists, or moderation evidence through public project payloads.
2. Make capacity/waitlist admission transactional; do not infer from client counts.
3. Treat every state transition as an authorized server operation with audit history.
4. Snapshot jam criteria/submissions and accepted legal/embargo text with versions.
5. Separate Studio membership from implicit edit access to all Studio Projects.
6. Preserve safe notification history without retaining private deleted content.
7. Communicate external-link limits: Glyph cannot revoke a copied key or third-party URL.
