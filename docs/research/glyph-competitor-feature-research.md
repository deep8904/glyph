# Glyph competitor feature research

**Date:** 2026-09-23  
**Scope:** product and UX research only; no Glyph implementation changes.  
**Current Glyph baseline:** `/Users/deeppatel/glyph`, branch `portfolio-screenshots`, commit `6f410cd`. Existing unrelated worktree changes were not modified.

## Evidence method

Evidence labels:

- **OBSERVED IN LIVE PRODUCT** — inspected in a public rendered product on 2026-09-23.
- **OFFICIAL DOCS** — current first-party product/help/developer documentation.
- **USER/COMMUNITY FEEDBACK** — user reports; useful for failure modes, not product truth.
- **THIRD-PARTY ANALYSIS** — secondary interpretation; never used alone for a core recommendation.
- **INFERENCE** — synthesis that is explicitly not a verified product behavior.
- **NOT ACCESSIBLE / NOT VERIFIED** — login, plan, region, shutdown, or access limits prevented verification.

Importance labels: **CORE / MUST HAVE**, **IMPORTANT / HIGH VALUE**, **SUPPORTING / NICE TO HAVE**, **POWER USER**, **OPTIONAL / FUTURE**, **AVOID / NOT FIT FOR GLYPH**.

This pass deliberately distinguishes a public screen from an authenticated workflow. A live public page does not prove the private management flow behind it.

## Executive synthesis

Mature products do not win by having the longest feature list. They win by making one object and one lifecycle legible:

- GitHub makes the repository the durable work object.
- itch.io makes the project page the durable game object; devlogs and jam entries point back to it.
- LinkedIn makes the member/company/job relationship legible.
- Meetup and Luma make the event lifecycle legible from draft through attendance.
- Steam Playtest keeps testing attached to the canonical game while isolating access and risk.
- Linear and GitHub make the inbox triageable, not merely chronological.

Glyph's strongest thesis is therefore not “all creator features in one app.” It is a connected graph: **Developer → Project → Devlog / Playtest / Collaboration**, with Studios grouping people and projects, Jams and Events creating time-bound participation, and Publishers forming a lightweight relationship to canonical Projects.

## Products actually inspected

### Live public UI

1. **itch.io Browse Games** — global navigation, dense facet rail, sort modes, tag suggestions, project-card anatomy, pagination. **OBSERVED IN LIVE PRODUCT**: [itch.io games](https://itch.io/games).
2. **GitHub Explore** — Explore/Topics/Trending/Collections/Events/Sponsors sub-navigation; editorial modules mixed with repository objects; consistent repository metadata. **OBSERVED IN LIVE PRODUCT**: [GitHub Explore](https://github.com/explore).
3. **Meetup discovery** — Events/Groups split, location and date/size/type filters, recurring labels, organizer identity, attendance/capacity/waitlist status. **OBSERVED IN LIVE PRODUCT**: [Meetup Find](https://www.meetup.com/find/).
4. **Luma discovery** — local popular events, category counts, featured calendars, follow affordances, city directory. **OBSERVED IN LIVE PRODUCT**: [Luma Discover](https://luma.com/discover).
5. **Luma creation entry** — direct creation URL exists but required sign-in before form access. **NOT ACCESSIBLE / NOT VERIFIED** beyond entry gate: [Luma Create](https://luma.com/create).
6. **Product Hunt** — today/yesterday/week/month launch groupings, category taxonomy, hidden early vote counts, launch objects separated from forum threads and events. **OBSERVED IN LIVE PRODUCT**: [Product Hunt](https://www.producthunt.com/).
7. **Behance project search** — Projects/People scoping, tag suggestions, filters, save action, creator attribution, multi-owner label, appreciation/view counts, promoted content. **OBSERVED IN LIVE PRODUCT**: [Behance game-design search](https://www.behance.net/search/projects/game%20design).

### Official workflow documentation / public product material

LinkedIn, GitHub, GitHub Organizations/Primer, Contra, Wellfound, itch.io, Steam/Steamworks, Meetup, Luma, Eventbrite, Discord Events, Ludum Dare, Devpost, PlaytestCloud, BetaFamily, GitHub Discussions/Issues, Linear, Slack, Discord, Notion, Figma, Product Hunt, and multiple public publisher submission forms were reviewed through current first-party sources. Product-specific boundaries follow below.

### Not current or not meaningfully inspectable

- **Read.cv:** shut down in May 2025 after its team joined Perplexity. Historical patterns are useful, but it is not a current competitor. Archived help still exposes features such as profile insights; current end-to-end flows are **NOT ACCESSIBLE / NOT VERIFIED**. [Archived profile insights](https://read.cv/support/profile-insights).
- **Polywork:** no sufficiently current, trustworthy public workflow evidence was found in this pass; excluded from recommendations.
- **Game Jolt, IndieDB, TIGSource:** public/community material was useful for market context, but authenticated creation and management flows were not verified. They are treated as secondary comparators, not authorities.
- **Partiful:** public behavior was considered, but current official workflow documentation was not sufficient for field-by-field claims.
- **Figma/Notion authenticated admin flows:** official docs were used; private workspace behavior was not independently walked.

### Coverage register

| Product | Surfaces/workflows studied | Strongest evidence | Access boundary |
|---|---|---|---|
| LinkedIn | profile, Featured, typed search, job post/screen/review | Official help | Authenticated rendered flows not walked |
| GitHub / Primer | repository create, Explore, organizations/roles, Issues/Discussions, inbox/search | Live public UI + official docs | Private org admin not walked |
| GitLab | project/activity/To-Do and project-centered IA | Official docs/public product material | Authenticated UI not walked |
| Contra | onboarding, profile completeness, proof-first application/client review | Official help | Authenticated UI not walked |
| Wellfound | role constraints, job post/apply | Official help | Applicant-management UI not walked |
| Read.cv | historical profile/insights | Archived support | Product shut down May 2025 |
| Polywork | attempted relevance check | Not verified | Excluded for insufficient current evidence |
| Figma | teams/community, notifications | Official help/public community concepts | Admin UI not walked |
| Notion | updates/notifications/workspace concepts | Official help | Admin UI not walked |
| Linear | inbox, priority vs updates, delivery settings | Official docs | Authenticated UI not walked |
| itch.io | browse, project creation/access, devlogs, jams | Live public UI + official docs | Creator dashboard not authenticated |
| Steam / Steamworks | store taxonomy and Playtest lifecycle | Public pages + official partner docs | Partner UI not accessible |
| Game Jolt / IndieDB / TIGSource | community/devlog/recruiting context | Public material | Creation/management not verified; not used as authority |
| Ludum Dare | jam format, themes, participation and judging conventions | Official/public material | Host/admin UI partly inaccessible |
| Indie Hackers | build-in-public/community context | Public material | Not treated as primary game-dev authority |
| Product Hunt | launches, day groupings, taxonomy, early vote behavior | Live public UI | Maker submission flow not authenticated |
| Behance | project/person search, project tiles, attribution, saves | Live public UI | Project editor not authenticated |
| Dribbble | profile/team/discovery concepts | Official/public material | Team admin not walked |
| Letterboxd | lists/watchlist/activity distinctions | Public UI/material | Authenticated list management not walked |
| Are.na | collections/channels and curation | Public UI/material | Private collaboration not walked |
| Reddit | community/feed/discussion and user reports | Public UI + community evidence | Opinion only for pain points |
| PlaytestCloud | study setup, tasks, research workflow | Official help | Paid study not created |
| Beta Family | tester marketplace and feedback concepts | Official product material | Developer dashboard not accessible |
| TestFlight | group/build access, expiry, feedback | Official Apple docs | App Store Connect not accessible |
| Meetup | discovery, create/recurrence, host/cohost, waitlist, attendance | Live public UI + official help | Organizer form not authenticated |
| Luma | discovery, compact creation, approval/waitlist/questions | Live public UI + official help/API docs | Creation gated at sign-in |
| Eventbrite | creation, registration, permissions, status, waitlist/check-in | Official help | Organizer UI not authenticated |
| Partiful | lightweight privacy/date coordination/message concepts | Public/official material | Field-level flow not fully verified |
| Discord Events | interested state, scheduled event/channel context | Official help | Server admin UI not walked |
| Devpost | hackathon eligibility, draft submission, judging | Official/public material | Host admin partly inaccessible |
| GitHub Organizations | public org vs private management, roles/invitations | Official docs | Private admin not walked |
| Publisher portals | pitch intake fields and material expectations | Public forms from Marvelous, Chucklefish, Xbox, MicroProse, Coffee Stain, Devolver, Raw Fury, Fellow Traveller | Internal review pipeline not public |

## Product-by-product findings

### LinkedIn — professional identity, search, and hiring

**Primary jobs:** represent professional identity; discover people/companies/jobs; recruit; maintain a professional graph.

**Core features:** identity intro, current role, location, headline, availability signals, Featured work, activity, typed search tabs, job posting, screening, applicant review. The profile intro intentionally answers identity at a glance and supports “open to work/hiring/services.” **OFFICIAL DOCS:** [edit profile introduction](https://www.linkedin.com/help/linkedin/answer/a547248). Featured allows authored posts, articles, links, and uploaded media to be curated and reordered. **OFFICIAL DOCS:** [Featured work](https://www.linkedin.com/help/linkedin/answer/a550399/manage-featured-samples-of-your-work-on-your-linkedin-profile).

**IA:** global jobs include Home, network, jobs, messaging, notifications, and account; search is universal, then scoped into People, Posts, Jobs, Companies, Groups, Events, Schools, Services, Courses, and Products with context-specific filters. **OFFICIAL DOCS:** [LinkedIn search](https://www.linkedin.com/help/linkedin/answer/a523136).

**Hiring flow:** Jobs → Post a job → title → description → job settings → screening questions/rejection settings/application destination → review → free/promoted publication → applicant review and closure. Screening can encode must-have answers and automatic archival/rejection. **OFFICIAL DOCS:** [post a job](https://www.linkedin.com/help/linkedin/answer/a517545/posting-a-job-on-linkedin), [screening questions](https://www.linkedin.com/help/linkedin/answer/a519651), [review applicants](https://www.linkedin.com/help/linkedin/answer/a522326).

**High-value minor utilities:** typeahead; scoped result tabs; frequently used filters exposed before “All filters”; owner-vs-visitor edit affordances; Featured reorder; explicit open-to-work state.

**Avoid:** resume bureaucracy, engagement-optimized generic feed, vanity-first connection counts, paid amplification in Glyph opportunity ranking, auto-rejection without a transparent reason.

**Glyph mapping:** adapt intro identity + current work + curated proof; adapt typed search; adapt structured applicant review. Do not import education/employment timelines as Glyph's core identity—Projects and Devlogs are stronger evidence.

### GitHub / Primer — durable work objects, teams, search, and inbox

**Primary jobs:** create and collaborate on repositories; inspect work and provenance; coordinate issues/discussions; manage organizations and access.

**Core object:** Repository. Profile, issue, pull request, discussion, release, organization, team, and notification all retain repository context.

**Creation:** global `+` → New repository → optional template → owner → required name → optional description → visibility → optional README/.gitignore/license/apps → create → quick setup/import. **OFFICIAL DOCS:** [create repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository). Required fields are kept short; setup grows after object creation.

**Explore:** editorial features, trending repositories/developers, topics, collections, and events share a stable repository anatomy: owner/name, description, topics, language, update recency, and engagement signals. **OBSERVED IN LIVE PRODUCT:** [GitHub Explore](https://github.com/explore).

**Search:** global and contextual scope plus qualifiers. **OFFICIAL DOCS:** [GitHub account search overview](https://docs.github.com/en/get-started/onboarding/getting-started-with-your-github-account).

**Teams and permissions:** organization, team, and repository scopes are distinct. Standard repository roles progress Read → Triage → Write → Maintain → Admin, matching least privilege. **OFFICIAL DOCS:** [repository roles](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization), [organization roles](https://docs.github.com/en/organizations/managing-peoples-access-to-your-organization-with-roles/roles-in-an-organization).

**Inbox:** unread/read, save, done, unsubscribe, bulk triage, reason labels, preview, custom filters, grouping by repository/date. **OFFICIAL DOCS:** [manage notification inbox](https://docs.github.com/en/subscriptions-and-notifications/how-tos/viewing-and-triaging-notifications/managing-notifications-from-your-inbox), [inbox filters](https://docs.github.com/en/subscriptions-and-notifications/reference/inbox-filters).

**High-value minor utilities:** prefilled creation URLs, templates, README bootstrap, contextual tabs, shareable filter URLs, reason-for-notification labels, saved notification filters.

**Avoid:** code-centric density everywhere, contribution-graph gamification, five-level permissions before Glyph has evidence it needs them, advanced query language as a requirement for ordinary search.

**Glyph mapping:** adopt short first-step Project creation then progressive setup; preserve project context everywhere; keep Studio roles minimal now but permission-ready; evolve Notifications from passive rows to explainable triage only when volume warrants it.

### Contra — proof-led identity and opportunity matching

**Primary jobs:** present independent work, become discoverable, find opportunities, manage contracts/payment.

**Onboarding:** choose independent/client workspace → photo → one-line positioning → account → interests. Discoverability later requires cover media, four work samples, rate, social link, identity verification, and wallet setup. **OFFICIAL DOCS:** [Contra onboarding/profile completion](https://help.contra.com/en/articles/9322381-onboarding-and-completing-your-profile).

**Pattern:** separate minimum account creation from a visible completion checklist. Proof and trust are added progressively rather than blocking first use.

**Avoid:** forcing payment setup, rates, four polished case studies, or marketplace economics into Glyph identity. These requirements fit paid freelancing, not all indie developers.

**Glyph mapping:** adapt the progressive completeness checklist; treat current Project and recent Devlog as proof. Make availability specific without requiring a service marketplace.

### Wellfound — startup jobs and candidate intent

**Primary jobs:** candidates signal role/location/compensation/remote preferences; companies post roles and assess startup-fit applicants.

**Transferable pattern:** opportunity matching improves when intent constraints are structured and visible before application. **OFFICIAL DOCS evidence reviewed**, but authenticated management details were not independently walked.

**Glyph mapping:** collaboration posts need role, project, arrangement/compensation, time commitment, location/remote, duration/expiry, and concrete deliverable. Glyph already has most; skills, duration, questions, and application management views are the important gaps.

### itch.io — canonical game page, devlogs, discovery, and jams

**Primary jobs:** publish and distribute games; maintain project pages; write devlogs; host/join jams; discover games.

**IA observed:** Browse Games, Game Jams, Upload Game, Developer Logs, Community, and global search. Browse has a left facet rail for platform, price, recency, genre, input, session length, multiplayer, accessibility, type, and misc; the main region has sort and tag shortcuts. **OBSERVED IN LIVE PRODUCT:** [games](https://itch.io/games).

**Project creation:** Dashboard → Create new game → title/short description/cover/URL/classification → upload type/files → rich description → genre/tags → Save & view → private draft by default → later Public or Restricted. **OFFICIAL DOCS:** [first project page](https://itch.io/docs/creators/getting-started), [access control](https://itch.io/docs/creators/access-control). Screenshots/media and taxonomy materially affect downstream listings; the project remains the canonical object.

**Devlogs:** attach to a Project; public devlogs can be indexed and travel to followers, while the Project page links its recent blog history. **OFFICIAL DOCS:** [project-page design](https://itch.io/docs/creators/design), [getting indexed](https://itch.io/docs/creators/getting-indexed).

**Jams:** start/end; optional voting period; ranked/non-ranked; voter eligibility; criteria; manual results; judges; custom required/private submission fields; unlisted mode; moderators/admins; locked uploads; hidden submissions/results; late-submit links; participant mailing segments; submission pages distinct from canonical project pages. **OFFICIAL DOCS:** [hosting a jam](https://itch.io/docs/creators/game-jams).

**Community feedback:** developers report devlogs can be valuable as a low-cost build record and collaborator proof but weak as pure acquisition; effort must remain bounded. **USER/COMMUNITY FEEDBACK:** [devlog usefulness discussion](https://www.reddit.com/r/gamedev/comments/yi1pu8/), [devlog as work evidence](https://www.reddit.com/r/gamedev/comments/1avjh2e/).

**Avoid:** storefront price/sales/review mechanics; unrestricted page theming; huge filter taxonomy at Glyph's current inventory; public jam voting without abuse controls.

**Glyph mapping:** adopt canonical Project, private-by-default draft, activity-linked devlogs, stable taxonomy, and most jam lifecycle controls. Adapt rather than copy storefront or commerce.

### Steam / Steam Playtest — project-attached access lifecycle

**Primary job:** recruit and gate testers without contaminating the main game's reviews, wishlists, or ownership.

**Structure:** Playtest is a separate child app operationally but appears as a section on the canonical base-game store page. Potential testers request access; developers admit batches or use open signup; the developer can target countries, hide signup, make the build not playable, restart a phase, or reset participants. **OFFICIAL DOCS:** [Steam Playtest](https://partner.steamgames.com/doc/features/playtest?l=english).

**Lifecycle:** configure child app → pass simplified review → expose signup → upload build → limited/open admissions → playable phase → communicate → stop signup → mark not playable → optionally restart/reset. Access state is visible on the base game page; admitted users get email.

**Critical limitation:** Steam explicitly does not provide a structured feedback loop. Community reports consistently say access is easy but written feedback is rare unless the game links directly to a short, focused survey or other feedback surface. **USER/COMMUNITY FEEDBACK:** [two-week Steam Playtest report](https://www.reddit.com/r/gamedev/comments/1d8wae0), [feedback friction](https://www.reddit.com/r/gamedev/comments/1snuzjl/how_do_you_get_your_steam_playtesters_to_give/).

**Avoid:** anonymous/open access as Glyph's only model; confusing “accepted” with “build currently playable”; NDAs as a default; external survey scavenger hunts.

**Glyph mapping:** a hypothesis worth validating is that coupling access with focus areas, a short structured feedback form, explicit state, deadlines, and developer review will reduce feedback loss for small teams—while keeping build links private and server-authorized.

### PlaytestCloud / BetaFamily — research operations

**Primary jobs:** recruit matching testers, define a study, observe sessions, collect answers, and review results.

**Transferable pattern:** separate eligibility/screener, session instructions, tasks/focus areas, and post-session feedback. More sophisticated services add video, demographics, compensation, and research operations.

**Evidence boundary:** public product/help materials were reviewed; a paid developer study was not created. **OFFICIAL DOCS / NOT ACCESSIBLE** for the authenticated paid flow.

**Avoid:** marketplace payout, demographic surveillance, video-recording infrastructure, automated sentiment scoring, and heavyweight research dashboards in Glyph V1.

**Glyph mapping:** adopt study brief + eligibility + structured questions + completion state. Defer incentives and recordings.

### Meetup — group-attached recurring community events

**Primary jobs:** discover/join interest groups; organize recurring events; manage RSVP, capacity, attendance, and communication.

**Discovery observed:** Events/Groups, location, date/size/type filters, categories, organizer, rating, attendee count, remaining seats/waitlist, recurring labels. **OBSERVED IN LIVE PRODUCT:** [Meetup Find](https://www.meetup.com/find/).

**Creation:** group page → Create event → new/copy/AI/draft → title → date/time/duration → image → rich description → optional speaker/topics → in-person/online/hybrid location and directions → hosts → fee → optional repeat/question/limit/guests/RSVP window/registration form → draft or publish/announce. **OFFICIAL DOCS:** [creating an event](https://help.meetup.com/hc/en-us/articles/39790436736525-Creating-an-event).

**Lifecycle:** recurring series supports one-instance vs this-and-following edits; attendee limit can create a waitlist; organizer can add/remove attendees/hosts, edit guest count, check in, mark no-show/not-coming, and adjust post-event attendance. **OFFICIAL DOCS:** [repeating events](https://help.meetup.com/hc/en-us/articles/39795590048781-Creating-a-repeating-event), [manage attendance](https://help.meetup.com/hc/en-us/articles/9389668230541-Managing-my-events-attendees).

**Avoid:** mandatory group/subscription coupling, ratings, broad social discovery, paid priority in waitlists.

**Glyph mapping:** adopt timezone-aware date/time, event mode, recurring series later, capacity/waitlist, hosts, RSVP questions, calendar, edit/cancel/reschedule notification, check-in/post-event states. Events should optionally attach to a Studio or organizer identity, not require a separate group object.

### Luma — compact creation and approval-first attendance

**Primary jobs:** create a polished event quickly; invite or discover; approve guests; communicate; manage calendars.

**Discovery observed:** Popular near you, category counts, featured calendars, follow calendar, city directory. **OBSERVED IN LIVE PRODUCT:** [Luma Discover](https://luma.com/discover).

**Creation structure:** the public creation surface exposes theme, title, start/end, location, description, ticket price, approval, capacity, waitlist, and create; current direct browser access was gated by sign-in. **OFFICIAL PRODUCT SURFACE / NOT ACCESSIBLE:** [Luma Create](https://luma.com/create).

**Underlying event fields:** name, start/end/timezone, in-person or online location, precise-location visibility, description, cover, visibility, approval, capacity, waitlist, tickets, group registration, guest list, reminders, registration questions, and post-event feedback. **OFFICIAL DOCS:** [create-event API](https://docs.luma.com/reference/post_v1-events-create), [registration questions](https://help.lu.ma/p/collect-registration-questions).

**Waitlist:** event-wide capacity, manual host approval/decline, explicit Waitlisted/Going states, optional message, and deferred capture for paid tickets. **OFFICIAL DOCS:** [Luma waitlist](https://help.luma.com/p/waitlist).

**Avoid:** theme customization as a product priority, crypto tickets, payment complexity, follower-count popularity.

**Glyph mapping:** borrow compact initial creation, then manage advanced registration separately. This is the clearest model for Glyph Events.

### Eventbrite — event operations depth

**Primary jobs:** build event page, ticket/register, market, manage attendance, check in, handle post-publication operations.

**Creation:** Create → title/summary/date/time/location/media/overview/agenda → online page if needed → ticket/add-on setup → order form/questions/confirmation → preview → organizer/search/privacy/refund/payout → publish or schedule. **OFFICIAL DOCS:** [create event](https://www.eventbrite.com/help/da/articles/551351/how-to-create-an-event/).

**Operations:** explicit permissions for editing, status, tickets, attendees, waitlist, check-in, guest lists, and email. **OFFICIAL DOCS:** [permissions glossary](https://www.eventbrite.com/help/en-us/articles/362073/). Status includes sold out, tickets at door, cancelled, and postponed; status changes do not magically refund or communicate, an important warning for Glyph. **OFFICIAL DOCS:** [event status](https://www.eventbrite.com/help/en-us/articles/125543/).

**Avoid:** tickets, payouts, tax, reserved seating, promotions, refunds, seat holds, and organizer enterprise roles for current Glyph.

**Glyph mapping:** adopt preview-before-publish, registration questions, explicit operations, and separated permissions concept; omit commerce.

### Ludum Dare / Devpost — competitions and submissions

**Primary jobs:** time-box creation, publish rules/theme, form teams, submit, judge/vote, announce results.

**Proven patterns:** phase clock; separate submission and judging windows; eligibility/rules visible before joining; canonical entry; results by criteria; sponsor/prize disclosures; organizer moderation.

**Avoid:** popularity-only voting, opaque judging, automatic team-building complexity, prizes before legal/operational readiness.

**Glyph mapping:** adopt explicit phases and immutable/frozen criteria once judging begins. Use itch.io's more documented moderation and late-submission model as the stronger authority.

### GitHub Organizations / Figma teams — Studios

**Primary jobs:** public team identity, invite members, group projects, control access, preserve ownership continuity.

**Proven structure:** organization/team roles separate from project-level access; invitations have pending states; ownership is protected; public identity and private admin live in different surfaces. GitHub's role model is the clearest documented reference. **OFFICIAL DOCS:** [organizations and teams](https://docs.github.com/en/organizations), [repository roles](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization).

**Avoid:** enterprise custom roles, billing managers, security managers, SCIM, and workspace sprawl.

**Glyph mapping:** keep owner/admin/member; add clear pending invitations, transfer ownership with strong confirmation, project attachment permissions, and a public Studio page distinct from private management.

### Product Hunt / Behance / Steam — discovery patterns

**Product Hunt:** separates launches by day and hides early vote counts to reduce immediate rich-get-richer effects. Product rows expose short pitch, taxonomy, comments, and later votes. **OBSERVED IN LIVE PRODUCT:** [Product Hunt](https://www.producthunt.com/).

**Behance:** scopes Projects vs People, uses visual project tiles, tags, creator/multi-owner identity, save, and explicit promoted items. **OBSERVED IN LIVE PRODUCT:** [Behance search](https://www.behance.net/search/projects/game%20design).

**Steam:** store taxonomy and media are useful for understanding game identity, but sales/promotions/review scores are wrong for Glyph's pre-launch purpose.

**Glyph mapping:** combine editorial modules and current opportunities without fake trending; keep object types separable; let Project identity travel; use chronological/recent activity transparently.

### Linear / GitHub / Slack / Discord — notifications and settings

**Linear Inbox:** Priority vs other updates, read/unread, delete, snooze, reminders, quick search, grouping, direct object actions. **OFFICIAL DOCS:** [Linear Inbox](https://linear.app/docs/inbox).

**Linear delivery:** channel-specific toggles and digests that suppress mail when the user already read the in-app item. **OFFICIAL DOCS:** [Linear notifications](https://linear.app/docs/notifications).

**Slack:** user controls by channel and delivery surface, schedules, mobile overrides, keyword/mention logic. **OFFICIAL DOCS:** [Slack notifications](https://slack.com/help/articles/201355156-Configure-your-Slack-notifications).

**GitHub:** reason labels, source-object preview, bulk triage, custom filters. See GitHub section above.

**Avoid:** a work-inbox power-user system before Glyph has notification volume; per-type matrices that users cannot understand; “everything” defaults; channel semantics Glyph does not have.

**Glyph mapping:** current day grouping and actor→action→object rows are sound. Next priorities are actionable vs FYI filter, source-level preference, delivery channel/frequency, mute, and digest suppression. Snooze/saved filters are future.

### Public game-publisher submission portals — publisher intake

Common required information is remarkably consistent: team/studio, contact, game title, genre, elevator pitch/core loop, stage, target platforms, release target, comparable titles, gameplay video, pitch deck, playable build, budget/funding ask, requested support, and consent. Examples: [Marvelous](https://marvelousgames.com/submit-game), [Chucklefish](https://pitch.chucklefish.org/), [ID@Xbox](https://developer.microsoft.com/en-NZ/games/publish/pitch), [MicroProse](https://microprose.com/publishing/), [Coffee Stain](https://pitch.coffeestain.com/).

**Proven pattern:** the project itself is the intake packet; a publisher asks for missing business context and links instead of forcing a second duplicated portfolio.

**Avoid:** turning Glyph into a pitch-deck marketplace, promising publisher replies, exposing private notes, ranking projects by opaque “publisher interest,” or storing confidential builds without a mature security model.

**Glyph mapping:** Publisher should discover canonical public Projects, save to private shortlists, contact the developer with project context, and move a lightweight private relationship through Contacted → Conversation → Passed/Archived. A future developer-initiated “submit to publisher” must explicitly add the missing pitch fields and consent; it should not silently expose private work.

## Cross-product feature conclusions

### CORE / MUST HAVE

1. Canonical Project as the parent of progress and opportunities.
2. Short private-by-default Project creation followed by progressive setup.
3. Developer identity with current work, availability, proof, and owner/visitor views.
4. Project-bound Devlogs with draft, preview, edit, and history.
5. Collaboration post with project, role, arrangement, compensation, time, location, skills, deadline, and managed application states.
6. Playtest request with private build access, capacity, focus, explicit tester state, and structured feedback.
7. Event timezone/mode/capacity/host/RSVP lifecycle.
8. Jam phase model, rules, eligibility, submission, judging/voting, results, and moderation.
9. Studio invitations and simple least-privilege roles.
10. Typed search and object-specific result anatomy.
11. Discovery that is transparent about recency/editorial selection.
12. Notifications that explain actor → action → object and route to an available target.
13. Settings separated into profile, account/security, privacy, and notifications.
14. Server/RLS enforcement for all private objects and state transitions.

### IMPORTANT / HIGH VALUE

- profile completeness checklist; pinned proof; creation drafts and review screens; event waitlist; registration questions; cohosts; calendar export; playtest eligibility; application questions; opportunity expiry; project collaborators; jam late-submit moderation; shortlist relationship status; actionable-vs-FYI inbox.

### SUPPORTING / NICE TO HAVE

- copy previous event, recurring events, organizer check-in, saved searches, notification digest, project templates, reusable application answers, Studio project grouping, post-event feedback.

### POWER USER

- advanced search syntax, saved notification filters, bulk attendee/application operations, event series editing, custom jam submission fields, custom roles.

### OPTIONAL / FUTURE

- scheduled Devlogs, publisher submission packets, paid event tickets, tester incentives, video session recording, analytics, integrations.

### AVOID / NOT FIT FOR GLYPH

- popularity/engagement feed as the product center; follower/like vanity dashboards; ratings/reviews of unfinished games; sales and marketplace economics; open DMs; generic CRM; unlimited theming; public jam voting without abuse defenses; AI-generated descriptions by default; premium waitlist priority; enterprise permissions; opaque “trending.”

## Evidence limitations

- No competitor account was created, no paid plan purchased, and no external form was submitted.
- LinkedIn, Luma creation, paid playtesting services, and many management surfaces require authentication; these are based on current official documentation unless explicitly marked live-observed.
- Mobile behavior was taken from official mobile instructions where available; the public live-product inspection was desktop-oriented.
- User/community reports establish pain points, not prevalence. They do not justify a feature without matching product evidence.
- Browser screenshots were reviewed during research, but the browser environment did not expose a safe local screenshot-export path. The repository evidence folder contains a README and direct URLs instead of copied full-site imagery.

## Review disagreements and final decisions

Four independent reviews agreed on the Project-centered architecture and privacy boundaries but rejected the first draft's breadth. The reconciled decisions are:

1. Competitor documentation establishes workflow structure, not feature-use frequency. “Core” here means structurally central/repeated, not telemetry-proven.
2. Glyph's wedge is **credible Project proof + structured collaboration/playtesting**. Events, Jams, and Publisher operations are coherent extensions, not equal launch priorities.
3. Editorial lifecycle, visibility, distribution eligibility, domain phase, and history events must remain separate axes.
4. Home owns cross-object action aggregation; contextual management owns execution; Notifications own awareness; Following owns public activity.
5. Creation uses quick path + advanced controls, not universal steppers or ceremony.
6. Search initially privileges Projects, People/Studios, and Opportunities; other tabs appear when inventory supports them.
7. Minimum Events and showcase Jams may launch before native waitlist/check-in or ranked judging. If ranked judging ships, criteria freeze, submission snapshot, scoped judge access, moderation, and results control are non-negotiable.
8. Publisher tooling begins as a developer-side private tracker/Project snapshot; a two-sided publisher identity is not assumed.
9. Scoped communication, handoff, safety/reporting, external-link quality, staleness, and recovery are higher-value than advanced inbox/CRM analytics.
10. See `glyph-recommended-product-architecture.md` for the full disagreement table and final sequence.
