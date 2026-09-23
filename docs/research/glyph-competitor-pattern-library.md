# Glyph competitor pattern library

Each pattern below names the problem it solves and the adaptation boundary. “Use” means the interaction model is a close fit; it does not authorize visual cloning.

| Pattern | Evidence / reference | Why it works | Glyph decision | Data / implementation impact |
|---|---|---|---|---|
| Canonical Project hub | [GitHub repositories](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository), [itch.io projects](https://itch.io/docs/creators/getting-started), [Steam Playtest](https://partner.steamgames.com/doc/features/playtest?l=english) | Preserves provenance and prevents disconnected posts/workflows | **USE** for Devlogs, Playtests, collaboration, jam entries, publisher contact | Stable IDs/routes; parent FKs; project identity component everywhere |
| Minimum create, progressive setup | GitHub repo creation; Contra onboarding | Lets intent become a recoverable object before asking for polish | **USE** for Project/Studio | Draft state, autosave, checklist |
| Private draft before publication | [itch.io access control](https://itch.io/docs/creators/access-control) | Reduces accidental exposure and supports iteration | **USE** for every publishable object | Visibility + lifecycle, server enforcement |
| Visibility separate from indexing | itch.io | “Can open URL” and “should appear in discovery” are different decisions | **USE** | Search-index eligibility and RLS remain distinct |
| Limited ordered pins | LinkedIn Featured, GitHub pinned repositories | Forces useful curation and fast scanning | **ADAPT** to 3–6 Projects/Devlogs | Ordered pin records and owner editor |
| Structured availability | LinkedIn/Contra/Wellfound | Converts vague prose into searchable intent | **ADAPT** for role, commitment, timing, compensation, remote | Typed profile preference; privacy controls |
| Project-scoped update type | itch.io devlogs, GitHub releases | Makes an update meaningful without becoming generic social content | **USE** | Devlog type/version/media fields |
| Distribution preview | itch.io/Steam creator publishing | Prevents accidental audience blasts | **ADAPT** before Devlog/Event/Jam publish | Audience calculation; notification policy |
| Public page + private manage view | Meetup/Eventbrite/GitHub Organizations | Keeps participant truth simple while protecting operational detail | **USE** for all managed objects | Separate queries/routes/permission policies |
| Timezone shown with date | Meetup/Luma/Eventbrite/Devpost | Prevents deadline and attendance failures | **USE** for Events/Jams/Playtests | IANA timezone, UTC storage, local display |
| Capacity + waitlist promotion | [Meetup waitlists](https://help.meetup.com/hc/en-us/articles/360003883411), [Luma waitlist](https://help.luma.com/p/waitlist) | Capacity remains honest without forcing manual spreadsheets | **USE** for Events/Playtests | Transactional counters, promotion order, audit |
| Approval distinct from RSVP | Luma/Eventbrite | “Requested” is not “Going”; avoids ambiguous access | **USE** | Explicit registration/request state machine |
| Attendee change-impact preview | Meetup/Eventbrite | Reschedule/cancel is communication, not just record mutation | **ADAPT** | Affected cohort query + notification outbox |
| Event clone | Meetup | Reuses structure without premature recurrence complexity | **USE** before full recurrence | Duplicate draft excluding attendance and secrets |
| Jam submission snapshot | itch.io/Devpost | Preserves fairness after deadline | **USE** | Versioned submission answers/build reference |
| Criteria freeze and results preview | itch.io/Devpost | Protects judging trust | **USE** | Version criteria; publish results transition |
| Single-use late link | itch.io | Handles legitimate exceptions without reopening globally | **ADAPT** | Expiring token, issuer/reason audit |
| Proof-first application | Contra | Lets builders show fit through work rather than resume bureaucracy | **USE** | Selected Project/Devlog references in application |
| Role-specific application questions | GitHub issue forms, job platforms | Improves signal without universal long forms | **ADAPT** with hard question limit | Versioned schema/answers; reviewer-only visibility |
| Applicant shortlist separate from rejection | LinkedIn/Upwork | Supports comparison without lying about final state | **USE** | Additional state and audit history |
| Cohort/build-scoped playtest access | Steam/TestFlight | Separates admission from whether a build is currently playable | **USE** | Cohort, build version, start/end, revoke |
| Feedback inside the test loop | PlaytestCloud + Steam community complaints | Lowers the biggest source of feedback loss | **USE** | Focused form, session context, completion |
| Minimal organization roles | GitHub Organizations/Figma | Handles responsibility without premature enterprise RBAC | **USE** Owner/Admin/Member | Membership + explicit object permissions |
| Typed search result tabs | LinkedIn/GitHub/Behance | Different objects require different anatomy and filters | **USE** | Search index/type facets/URL state |
| Facet rail → mobile filter sheet | [itch.io Browse](https://itch.io/games), Meetup discovery | Keeps rich filtering usable across widths | **ADAPT** per object type | Query parameters, applied count, removable chips |
| Editorial label separate from ranking | GitHub Explore/Product Hunt | Users can understand why something is shown | **USE** | Curator record + explicit labels |
| Actor + action + object + context feed grammar | GitHub/GitLab/Letterboxd | Maintains scannable provenance | **USE** | Typed activity events and stable fallback labels |
| Notification reason + Done/Saved | [GitHub inbox](https://docs.github.com/en/subscriptions-and-notifications/how-tos/viewing-and-triaging-notifications/managing-notifications-from-your-inbox) | Supports triage instead of endless unread debt | **ADAPT** when volume justifies it | Reason enum, user state, bulk actions |
| Action queue separate from activity | Linear/GitLab | Protects urgent work from informational updates | **USE** on Dashboard | Deterministic classification and next action |
| Object-level notification override | Slack/Discord/Notion/Figma | Lets users control noisy contexts without muting safety events | **ADAPT** | Account default → object override hierarchy |
| Safe unavailable-target row | GitHub/Linear-style durable inbox | History remains intelligible after deletion/private transition | **USE** | Denormalized safe label; never leak old body |

## Patterns to avoid

| Pattern | Why it fails Glyph | Decision |
|---|---|---|
| Generic engagement-ranked social feed | Incentivizes posting for reach rather than building | **AVOID** |
| Pay-to-rank discovery or boosts | Breaks trust and advantages funded teams | **AVOID** |
| Rating developers | Creates harassment/bias and reduces work to reputation scores | **AVOID** |
| Arbitrary page CSS/themes | Accessibility, moderation, and consistency cost | **AVOID** |
| Full gig marketplace | Bids, credits, escrow, disputes, payouts are a different company | **AVOID** |
| Full ATS or publisher CRM | Automation, forecasting, email sync, and many stages exceed the thesis | **AVOID** |
| Default open DMs | Spam and safety burden; prefer project-context contact | **AVOID** |
| Public jam voting without controls | Popularity and brigading distort judging | **AVOID by default** |
| Notification for every event | Turns Notifications into a duplicate activity feed | **AVOID** |
| AI-generated descriptions/pitches as the default | Homogenizes voice and can conceal low-quality inputs | **AVOID; optional assist only** |

## Screenshot and evidence note

Rendered public screens were reviewed for itch.io Browse, GitHub Explore, Meetup Find, Luma Discover, Product Hunt, and Behance Search. The browser session did not expose a safe local screenshot-export primitive, so no fabricated or downloaded screenshots are included. The evidence index at `screenshots/competitors/README.md` records the exact pages and observations.

