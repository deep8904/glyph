# Glyph Product Design Blueprint

**Date:** 2026-09-16
**Status:** Design/product blueprint. No application code, database schema, or component implementation was changed to produce this document. It synthesizes `docs/glyph-product-completeness-audit.md`, `docs/glyph-ui-ux-audit-2026-09-16.md`, `docs/glyph-competitive-product-research.md`, `docs/glyph-competitive-ux-comparison.md`, the README, the route tree (`app/*`), and the migration history (`supabase/migrations/001`–`021`) as primary sources. Where a claim is grounded in one of those, it's tagged inline. This document is the single reference a future implementation pass should follow rather than inventing its own direction.

**Correction to prior-phase evidence, made while re-reading the route tree for this blueprint:** the earlier finding that "Studios/Publisher/Jams are absent from the product entirely, reachable only by direct URL" was too strong. The actual route tree shows `app/dashboard/studios/[slug]`, `app/dashboard/publisher`, and `app/dashboard/jams` all exist as authenticated sub-routes one level under `/dashboard`, alongside public mirrors at `app/studios/[slug]`, `app/jams/[slug]`, and `app/publishers`. The real finding, confirmed here, is narrower and still real: `components/dashboard/AppShell.tsx`'s primary sidebar (`NAV_ITEMS`) does not link to any of them, so a user can reach these routes only by already knowing the URL (e.g., from a dashboard workspace card at some earlier point) — a discoverability problem, not a routing gap. §7 designs the fix.

---

## 1. Product Thesis

**What Glyph is, stated as a single idea, not a feature list:**

Glyph is the place where an indie game's *development history* becomes a public, followable, collaborative record — one continuous object graph from the first devlog to the first playtester to the first collaborator — rather than a scattered set of posts across Discord, itch.io, and Reddit.

This is derived, not asserted: the competitive research (`glyph-competitive-product-research.md` §18) found real, cited developer complaints that the actual hard problems in this space are *follow-through and trust* ("about half of those who offered to test never actually attempted it"; "what's truly hard is finding the right people you can really trust"), not *discovery* — and that no researched competitor (itch.io, Game Jolt, GameDev.net, TIGSource, Ludum Dare) unifies devlog, playtesting, and collaboration into one connected loop; each owns at most one piece. Glyph's own schema (`002_projects.sql` → `003_devlogs.sql` → `008_playtests.sql` → `010_collaboration.sql` → `004_follows_feed.sql`) was already built as one continuous chain of foreign keys before this document existed. The product thesis is therefore not a new idea — it's naming what the schema already committed to, so the interface can finally express it.

- **Core user:** an indie developer who is actively building something unfinished, and wants a public record of that work to attract feedback, collaborators, and an audience before launch.
- **Core problem:** development-in-progress has no single home — devlogs live on itch.io, discussion lives on Discord, recruiting happens ad hoc on Reddit/forum threads, and playtesting relies on subreddits like r/GamePlayTest — and none of those surfaces connect to each other (`glyph-competitive-product-research.md` §1, §18).
- **Core object:** the **devlog entry** — a timestamped, project-scoped unit of real progress. Not the project (too coarse-grained to show momentum) and not the developer (an identity, not an event) — the devlog post is the atomic thing a user creates, reacts to, comments on, and follows a project *for*.
- **Core relationship:** developer → project → devlog, radiating outward to the people around that work: followers, commenters, playtesters, collaborators.
- **Core loop:** see §3.
- **Reason to return:** to see what's changed in the projects and people you follow since last time — not a generic social-feed reason ("see what's new") but a specific one ("see what got built").
- **Reason to contribute:** posting progress is the cheapest, lowest-friction way to keep a project's public record alive, and it's the one action every other feature (playtesting, collaboration, discovery) ultimately hangs off of.
- **Reason to follow someone:** to track a specific unfinished thing they're building, not to accumulate a generic social-graph follower count.
- **Reason to create a project:** to get a durable, structured home for updates that's more credible and more discoverable than a Discord channel.
- **Reason to publish a devlog:** itch.io's own data (42,000+ posts across 15,000 projects, cited in the research doc) validates this as a real, scalable habit already — Glyph doesn't need to invent the behavior, only give it a better home.
- **Reason to playtest:** structured, focused feedback requests (tagged by focus area) that target the documented real failure mode — vague, low-commitment testers — better than an open-ended "please try my game" post.
- **Reason to collaborate:** a structured post/apply model that's already more trustworthy-by-design than an anonymous forum thread, because both sides carry a real Glyph identity with a visible build history.

## 2. Core User

One primary persona, three secondary. (Derived from `glyph-competitive-product-research.md` §19's persona testing, not invented fresh here.)

- **Primary: the actively-building indie developer.** Has at least one project in progress, wants visibility, feedback, and eventually collaborators or players. This is who every Level-1 surface (§4) is designed for.
- **Secondary: the playtester/community member.** Doesn't necessarily have their own project; comes to follow, react, comment, and occasionally test.
- **Secondary: the collaborator-seeker.** A developer specifically looking to join or staff a project, not just observe one.
- **Secondary: the studio/publisher.** An organizational identity layered on top of one or more developer identities — real, but structurally a Level-3 concern (§4), not the product's center of gravity.

## 3. Core Product Loop

Derived from Glyph's actual built features, the migration order (which itself shows the product's own construction priority — profiles → projects → devlogs → follows/feed → reactions/comments → search → notifications → playtests → events → collaboration → jams → studios → payments → publisher → admin → moderation), and the competitive research's finding that follow-through/trust, not discovery, is the real bottleneck:

**BUILD → DOCUMENT (devlog) → BE DISCOVERED → GET FOLLOWED / GET FEEDBACK → GET TESTED / GET A COLLABORATOR → CONNECT → BUILD AGAIN**

This differs from a generic social loop (post → like → follow → repeat) in one deliberate way: the loop's payoff isn't engagement for its own sake, it's a concrete asset your project gains — a follower who tracks your progress, a playtester who found a bug, a collaborator who joined. Every step should be answerable with "what did this get the developer that they didn't have before."

**CORE** (the loop cannot function without these — Level 1, §4):
- Project (the durable container)
- Devlog (the atomic unit of progress)
- Developer profile (the identity everything attaches to)

**SECONDARY** (amplify and monetize the core loop — Level 2, §4):
- Comments/reactions (feedback on a devlog)
- Follow (tracking a project over time)
- Playtesting (structured feedback request)
- Collaboration (structured team-building)
- Feed (surfacing core-loop activity from people you follow)
- Search/Explore (surfacing core-loop activity from people you don't yet follow)

**SUPPORTING** (real, valuable, but not what a new user needs to understand Glyph — Level 3, §4):
- Game jams (a time-boxed variant of the core loop)
- Events (community logistics, adjacent to but not part of the loop)
- Studios (an organizational wrapper around multiple developers' core loops)
- Publisher tooling (a discovery/business layer on top of finished project pages)
- Admin/moderation (infrastructure, not user-facing loop)

This tiering is the single most load-bearing decision in this document — it's what everything in §4 through §9 is built to express visually and structurally.

## 4. Product Hierarchy

**LEVEL 1 — must be visible within the first five seconds of any authenticated session:**
- Developer (who am I / who is this)
- Project (what is being built)
- Devlog / development activity (what's happening right now)

**LEVEL 2 — one navigation action away, always reachable, never hidden:**
- Feed (activity from people/projects you follow)
- Explore/Search (activity from people/projects you don't)
- Playtesting
- Collaboration

**LEVEL 3 — real, valuable, contextually surfaced rather than competing for primary attention:**
- Jams
- Events
- Studios
- Publisher

**ACCOUNT LAYER — always available, never primary:**
- Notifications
- Settings
- (No messages/DMs feature exists in the schema or routes — not included here; inventing one would violate the "derive, don't invent" instruction.)

**ADMIN LAYER — role-gated, invisible to everyone else:**
- Moderation, Users, Reports, Jam approval, Featured listings, Flags (`app/admin/*` — moderation, featured, flags, jams, studios, users, audit)

## 5. Product Objects and Relationships

Four chains, all confirmed against the actual schema/migrations and route tree, not assumed:

```
DEVELOPER → PROJECT → DEVLOG → COMMENT/REACTION → (visible to) FOLLOWER
                    ↳ PLAYTEST REQUEST → PLAYTEST SIGNUP → FEEDBACK

DEVELOPER → COLLABORATION POST → APPLICATION → (joins) PROJECT

DEVELOPER → STUDIO → STUDIO MEMBER → PROJECT
                                   (studio is a wrapper, not a replacement, for developer→project)

DEVELOPER → PROJECT → JAM SUBMISSION → (discovered via) JAM RESULTS

DEVELOPER → PROJECT → PUBLISHER CONTACT → PUBLISHER SHORTLIST
```

**The design principle this implies:** every object page (project, devlog, profile) should visibly link both up and down this chain — a devlog should always show its project and its author; a project should always show its devlog history, its playtest status, and (if applicable) its studio and jam submissions; a profile should always show current projects and recent devlog activity. This is not new UI — it's making the existing foreign-key relationships the actual navigational backbone, which the current implementation does inconsistently (e.g., the project page embeds a live playtest CTA — good — but a studio page's relationship to its member developers' individual profiles was not confirmed as reciprocally linked this pass).

## 6. Information Architecture

**PUBLIC (unauthenticated):**
- **Home (`/`)** — marketing/landing. Its job is to prove the core loop is real by showing one live example of it, not just describe it in prose.
- **Explore (`/explore`)** — Level 1/2 discovery surface: projects and developers, ranked by recent activity.
- **Search (`/search`)** — intent-driven lookup across all object types.
- **Developers (`/dev/[username]`)** — public profile.
- **Projects (`/p/[username]/[slug]`)** — public project page, the product's flagship surface.
- **Devlogs (`/p/.../[devlog-slug]`)** — public devlog reading page.
- **Jams (`/jams`, `/jams/[slug]`)** — public jam browsing/results.
- **Events (`/events`, `/events/city/[city]`)** — public event browsing.
- **Playtests (`/playtests`, `/playtests/browse`)** — public playtest-request browsing (exists in the route tree; treat as the public-facing half of the playtesting model, §14).
- **Studios (`/studios/[slug]`)** — public studio page.
- **Publishers (`/publishers`)** — public publisher directory.
- **Pricing (`/pricing`)**.

**AUTHENTICATED (under `/dashboard`, and the account-layer routes):**
- **Home/Dashboard (`/dashboard`)** — redesigned per §8; the "what's happening with my work and my community" surface.
- **Projects (`/dashboard/projects`, `/new`, `/[id]`)** — a developer's own project management.
- **Playtests (`/dashboard/playtests`, `/new`)** — a developer's own playtest requests (requester side).
- **Collaboration (`/collaborate`, `/[id]`, `/new`)** — post/browse/apply.
- **Events (`/dashboard/events`, `/new`, `/[id]`)** — a developer's own event management.
- **Jams (`/dashboard/jams`, `/new`)** — a developer's own jam hosting.
- **Studios (`/dashboard/studios`, `/new`, `/[slug]`)** — a developer's own studio management.
- **Publisher (`/dashboard/publisher`, `/register`)** — publisher-role tooling.
- **Billing (`/dashboard/billing`)**.
- **Feed (`/feed`)**.
- **Notifications (`/notifications`)**.
- **Settings (`/settings/profile`, `/account`, `/notifications`, `/danger`)**.
- **Onboarding (`/onboarding`)**.

**ADMIN (`/admin/*`):** moderation, featured, flags, jams, studios, users, audit — role-gated, entirely separate navigation context.

**Per-item rationale (representative sample, not exhaustive — full reasoning follows the tiering in §3–§4):**

| Item | Why it belongs | Who needs it | Frequency | Primary/Contextual/Hidden |
|---|---|---|---|---|
| Dashboard | The loop's home base — "what's happening" | Every returning developer | Every session | Primary |
| My Projects | Manage the core object | Every developer with a project | Frequent | Primary |
| Feed | Level-2 loop amplifier — see followed activity | Every developer with follows | Frequent | Primary |
| Explore | Level-2 loop amplifier — discover new activity | New users; developers seeking exposure | Frequent early, occasional later | Primary |
| Playtesting | Structured feedback — Level 2 | Developers actively seeking testers | Occasional, high-value when needed | Primary |
| Collaboration | Structured team-building — Level 2 | Developers seeking/offering to join | Occasional | Primary |
| Jams | Time-boxed loop variant — Level 3 | Jam participants (subset of users, seasonal) | Bursty (jam season), otherwise rare | Contextual (surfaced when relevant, not a permanent top-level tab — see §7) |
| Events | Community logistics — Level 3 | Local-event-interested subset | Rare | Contextual |
| Studios | Organizational wrapper — Level 3 | Studio owners/members (small subset) | Rare for most, frequent for studio owners | Contextual, promoted to primary only within a studio-owner's own session context |
| Publisher | Business layer — Level 3 | Publisher-role accounts (small, distinct subset) | Rare | Contextual, role-gated |
| Admin | Infrastructure | Admins only | N/A for regular users | Hidden entirely from non-admins |

## 7. Navigation Architecture

The current problem (per `glyph-ui-ux-audit-2026-09-16.md` §5, §8, §9) is not that Studios/Publisher/Jams are unreachable — they have real routes — it's that the primary sidebar doesn't index them, so they're invisible until a user already knows the URL. The wrong fix is cramming all eleven feature areas into one flat sidebar (the brief explicitly warns against this, correctly — that just relocates the "equal weight to everything" problem from the dashboard to the nav).

**The right model: a two-tier navigation system — a small, fixed PRIMARY set (Level 1+2 from §4) plus a CONTEXT SWITCHER for Level 3 and role-specific areas.**

**DESKTOP:**
- **Primary sidebar (always visible, 5 items max):** Dashboard, My Projects, Feed, Explore, and one combined "Playtesting & Collaboration" entry (these two are closely related Level-2 loop-amplifiers; combining them keeps the primary set small without hiding either — they can be tabs within one destination rather than two separate sidebar rows).
- **Top bar, persistent across all authenticated pages:** logo/home, a lightweight search affordance (not a full nav item — a search trigger, since Linear's command-palette research, cited in the companion doc §4.8/§25, shows search-as-overlay beats search-as-destination for a growing object graph), notifications bell, and a profile/account menu.
- **Context switcher, inside the profile/account menu (not the primary sidebar):** "My Studios," "Publisher Tools," "Admin" (role-gated, only rendered if the user actually has that role) — each a real link to the existing routes. This is where Jams also lives as a persistent-but-secondary entry ("Game Jams"), since it's a real, working, full-loop feature that deserves to be one click away without occupying permanent primary real estate.
- **Studio/project context:** when a user is inside a specific project's management pages or a specific studio's pages, a contextual sub-nav (matching the pattern `/settings/*` already uses successfully — CODE VERIFIED as a strength in the prior audit) replaces or supplements the primary sidebar for that scope, rather than adding more permanent top-level items.
- **Creation action:** a single, persistent "+" affordance in the top bar that opens a small menu (New Project, New Devlog, New Playtest Request, New Collaboration Post) rather than one generic "New Project" button that doesn't cover the other creatable objects — this directly answers the completeness audit's and UX audit's observation that "New Project" was the dashboard's only prominent creation action despite devlogs/playtests/collab-posts being equally creatable objects.

**MOBILE:**
- Bottom-anchored or drawer-based primary nav carrying the same 5-item primary set (Dashboard, Projects, Feed, Explore, Playtesting & Collaboration).
- Search, notifications, and the context switcher (Studios/Publisher/Jams/Admin) collapse into the existing drawer pattern (`AppShell.tsx`'s mobile drawer, already functionally sound per the prior audit, including the now-fixed Escape-to-close — kept, not replaced).
- The "+" creation affordance becomes a floating action button, consistent with its desktop role as a single, always-reachable entry point to all creatable object types.

**Mental model to hand to an implementer:** *primary nav answers "what do I check regularly," the context switcher answers "what role am I acting in right now," and object pages themselves (project, studio, jam) carry their own contextual sub-nav for anything scoped to that object.* No feature is hidden — every real route from §6 has a path — but only Level-1/2 items get permanent visual weight.

## 8. Dashboard Model

Reframing the question per the brief: not "which cards" but **"what should a developer see when they open Glyph."** The answer, derived from the core loop (§3) and the "still building" thesis (§1): **the dashboard should answer "what's happening with my work and my community," not display three static counters.**

**Redesigned information hierarchy (highest to lowest priority):**

1. **Current project + its most recent devlog** — the single most important thing: what am I building, and what did I last say about it. If a user has multiple projects, this is their most recently active one, not an arbitrary first-created one.
2. **Activity on that work since last visit** — new comments, reactions, playtest signups, collaboration applications. This is the dashboard's actual news — not a generic activity log, but specifically activity *on the user's own core-loop objects*.
3. **People and projects you follow, recently active** — a compact, feed-adjacent module (not the full feed — a teaser that leads into it), reinforcing the loop's community half.
4. **One clear next action** — this replaces the three-equal-empty-cards pattern entirely. For a user with no devlog posted in N days, that action is "post an update." For a user with an open playtest request and zero signups, it's "share your playtest request." For a brand-new user with no project, it's "start a project." The dashboard picks ONE next action based on actual state, not three permanently-visible options.
5. **Secondary/supporting entries** (Level 3 from §4) — jams you're in, studio activity, publisher interest — surfaced as a smaller, lower-weight module, not equal-sized cards.

**Explicitly not the model:** a fixed three-card grid that looks the same whether the user has one devlog or a hundred. The dashboard's layout should visibly change shape based on how much "still building" activity actually exists — sparse for a new user (mostly the single "next action" prompt), dense for an active one (project status + activity feed + community teaser all populated). This directly operationalizes "still building" as structure, not decoration (see §9's contrast with fake metrics).

## 9. The "Still Building" Experience

The brief is explicit: no gamification, no fake progress bars, no meaningless metrics. The competitive research (`glyph-competitive-product-research.md` §4.5, §17) independently arrived at the same caution — GitHub's contribution graph is real-world evidence that an activity signal divorced from actual artifacts gets criticized as gameable and shallow.

**The authentic version, derived from what Glyph already models in its schema:**
- **Recency, not counting.** "Last updated 3 days ago" on a project card is authentic (it's a real timestamp on a real devlog); "47 devlogs posted" as a badge is closer to the gameable-metric pattern the research warns against. Prefer recency-based signals over count-based ones.
- **The devlog itself is the progress indicator.** Glyph doesn't need an invented "progress bar" — the devlog history *is* the progress record. The design implication: make a project's devlog timeline itself more visually prominent (see §9 of the project-page model below) rather than inventing a separate, parallel "progress" widget that duplicates what devlogs already show.
- **Project stage (already in the schema — `PROJECT_STAGES`, used as a badge) is the one legitimate "status" signal**, because it's developer-declared and low-frequency, not an auto-generated metric. Keep it; don't add a second, competing status system.
- **Momentum on the profile (identified as missing in both the completeness and UX audits) should be the most-recent-devlog preview plus a "last active" timestamp** — not a graph, not a streak counter, not a percentage. This is deliberately the least gamified option available and is directly tied to a real artifact (the last thing they actually posted), satisfying the brief's "authentic, not gamified" requirement.
- **Playtest and collaboration activity should surface as real counts of real actions** ("3 testers signed up," "2 people applied") — these are legitimate because they're literal, current, small-number facts about a specific object, not an accumulated score.

## 10. Project Model

The project page is already the product's strongest surface (confirmed independently by both the completeness audit and the competitive research — it structurally out-does itch.io's free-text credibility model). The redesign here is about hierarchy and completeness, not a rebuild.

**Derived hierarchy (desktop):**

1. **Project identity** — title, one-line description, stage badge, engine/genre badges (kept — this structured-badge approach beats itch.io's prose-only model, per the research doc, and should not be replaced with free text).
2. **Current state** — most recent devlog excerpt/timestamp, directly under identity, so "is this alive" is answerable before scrolling.
3. **Media** — screenshot grid (kept, already present).
4. **Description** — the free-form "About" section (kept).
5. **Development activity** — the devlog timeline, promoted to a more prominent position than "just a list at the bottom" (per §9, this doubles as the "still building" signal for this specific project).
6. **Playtesting** — the embedded live playtest CTA (kept — genuinely ahead of every researched competitor; do not bury it further down the page).
7. **Team** — if studio-owned, the contributing developers, each linking to their own profile (this reciprocal link was flagged in §5 as not confirmed to exist — add it).
8. **Community** — comment/reaction activity, follower count.
9. **Links** — external (GitHub, itch.io, website) — lowest priority, last on the page, consistent with itch.io's own pattern of putting external links near the bottom rather than the top.

**Mobile:** identity + current-state + one-line stage badge stay above the fold; media becomes a horizontally-scrollable strip rather than a grid; devlog timeline and playtesting CTA remain full-width, high-priority (not deprioritized just because they're lower on a desktop page — on mobile they should still appear early, since "is this project alive" and "can I help test it" are the two highest-value questions regardless of viewport).

## 11. Profile Model

Derived from comparing GitHub (identity, criticized for gameable activity), Letterboxd (identity + unpersonalized activity), Behance/Dribbble (portfolio depth vs. snippet) — without copying any of them (`glyph-competitive-product-research.md` §4.5–§4.9, §7).

**What a Glyph profile should communicate in five seconds:** *this person is building something, right now, and here's the proof.*

**Hierarchy:**
1. **Identity** — avatar, name, username, role/engine/experience badges (kept — already better-structured than GitHub's implicit-from-repos approach).
2. **Current work** — the current/primary project card, prominently placed (kept, already exists) — but paired with its most recent devlog snippet, not just the project title, to satisfy the "proof of building" requirement.
3. **Activity signal** — last-active timestamp + recent devlog preview (new, per §9 — the single highest-priority addition this document recommends for the profile).
4. **Bio** (kept).
5. **Other projects, if any** (implied by schema, not confirmed as a distinct UI section this pass — worth verifying during implementation).
6. **Collaboration availability** — the "Open to Collaborate" indicator (kept, already present and well-executed).
7. **Social links** (kept, already good — labeled, not icon-only).
8. **Follower/following counts** (kept, de-emphasized relative to the activity signal — a follower count alone doesn't answer "is this person building," which is the profile's actual job).

## 12. Feed Model

The brief correctly asks whether a generic social feed is even the right model. Given the core-loop thesis (§3), the answer is: **yes, but scoped tightly to core-loop objects, not general status updates** — because Glyph doesn't have (and per the schema, was never built to have) generic text-post status updates; every feed-eligible object is already a specific, structured thing (a devlog, a reaction, a new project, a playtest signup).

**Content types, in priority order:** new devlog posts (highest value — the core object) → project milestones (stage changes) → playtest activity on projects you follow → collaboration activity on projects you follow. Reactions/comments themselves are probably too granular for the feed itself (they belong on the devlog page, not as their own feed entries) — this avoids the Letterboxd-style unpersonalized noise problem the research flagged.

**Ranking:** chronological from people/projects you follow, not algorithmic — this matches the Are.na precedent (non-algorithmic curation is a legitimate, not lesser, choice for a small creative catalog, per the research doc §4.7/§8) and avoids building a ranking system Glyph doesn't have the usage data to make good yet.

**Filters:** by object type (devlogs / milestones / playtests / collaboration) so a user who only cares about progress updates isn't forced to scroll past collaboration noise, and vice versa.

## 13. Discovery Model

Per the brief's explicit instruction not to dump everything into one search page, and per the research doc's finding that itch.io's 25-filter model would overwhelm Glyph's much smaller catalog (§8, §13 of the companion doc):

- **Explore** — a curated, recency-based browse surface for projects and developers (kept, lighter-touch than itch.io's filter depth — closer to Are.na's model).
- **Search** — intent-driven, cross-object-type lookup (kept, already works well per the UX audit).
- **Playtests browse (`/playtests/browse`)** and **Collaboration board (`/collaborate`)** — these are already separate, purpose-built discovery surfaces for their specific object types, which is correct and should stay separate from the general Explore grid rather than being merged into it (a playtest-seeker and a project-browser have different intents).
- **Jams (`/jams`)** and **Publishers (`/publishers`)** — similarly kept as their own dedicated discovery surfaces, since they're structurally distinct object types with their own lifecycle (time-boxed for jams, role-gated for publishers).
- **No global "trending/featured" system is recommended beyond what already exists** (`app/admin/featured` implies an editorial-featuring mechanism already exists at the admin level) — surface admin-curated featured content on Explore's top section rather than building a second, parallel trending algorithm.

**The model, stated simply:** one discovery surface per object type that has enough volume to need one (projects/developers, playtests, collaboration posts, jams, publishers), each recency/curation-based rather than filter-heavy, with Search as the cross-cutting intent-driven fallback.

## 14. Community Model

Community in Glyph is not a separate feature — per §3's loop, it's the reaction/comment/follow layer attached to every devlog and project. The design implication: don't build a standalone "Community" destination; keep community actions embedded at the object level (a devlog's comments, a project's followers) exactly as currently implemented, and let Feed (§12) be the only aggregate view of community activity. This avoids duplicating the same activity in two competing places.

## 15. Playtesting Model

Requester side (post a request, view signups) is confirmed working; tester side is not confirmed end-to-end (both audits flag this as the single highest-priority thing to finish, not redesign). Design-wise, the existing structure — tagged focus areas, embedded on the project page, a dedicated browse surface at `/playtests/browse` — is already well-targeted at the real, cited failure mode (low-commitment, unfocused testers). No structural redesign is recommended here; this model's problem is completeness, not design.

## 16. Collaboration Model

Post/apply is confirmed working; applicant review UI was not located in either audit. Structurally sound (better than any researched competitor's ad-hoc forum-thread approach) — the fix is finishing the review side, not redesigning the posting/applying flow.

## 17. Studio Model

The biggest gap between ambition and reality in the entire product (both prior audits agree): studios exist as an object with their own page and (per the schema, `012_studios.sql`, `studio_members`) a real membership model, but no UI to invite, assign roles to, or remove members was located — making studios solo-only in practice. This needs original product design work during implementation (no direct competitor precedent exists to lean on, per the research doc §4.9/§13) — this document doesn't prescribe the studio-management UI's exact shape, since that would be inventing a feature spec rather than synthesizing existing evidence; it flags studio membership as the top structural priority for the next phase of work that goes beyond this blueprint's scope.

## 18. Jam Model

Confirmed working end-to-end in a prior phase (create → admin-approve → public → submit → vote → results). Design-wise, sound as-is. The one flagged risk (Ludum Dare's documented vote-manipulation history, research doc §4.4/§17) is a trust/anti-abuse consideration for the voting mechanism specifically, not a UI redesign need.

## 19. Publisher Model

Registration and dashboard confirmed working; contact-notification was fixed this engagement; shortlist-add UI wasn't located. Structurally, this is a genuinely novel feature among researched competitors (§4, §14 of the research doc) — worth finishing as-is rather than redesigning.

## 20. Visual Language

**PERSONALITY:** editorial and workshop-like — closer to a developer's own notebook made public than a marketing dashboard. Not gaming-neon, not generic SaaS, not AI-startup. (Directly carried over from the research doc §27, re-confirmed here against the UX audit's specific evidence of where Glyph currently fails this — the identical empty-state template, the symmetric dashboard grid — both of which read as generated-template patterns, not workshop/editorial ones.)

**DENSITY:** varies by mode, not uniform. Task-oriented, authenticated surfaces (dashboard, settings, project/studio management) should be denser and less decorated — following the Linear precedent that visual weight should track task centrality, not a fixed card grid (research doc §4.8, UX audit §6/§21). Public, showcase surfaces (project page, profile, devlog reading) should stay closer to their current, more generous treatment — this is where itch.io's "let creator content lead" principle applies (research doc §4.1).

**TYPOGRAPHY:** keep Geist (body/UI) + JetBrains Mono (labels/metadata) — no evidence in either audit calls for a font change; the finding is inconsistent *application*, not wrong fonts.
- Display/H1: large, tight tracking, Geist — used for page-level identity only (project title, profile name), not repeated at every card level.
- H2: section headers within a page (already correctly used post-fix for dashboard workspace cards, per the completeness audit).
- H3: sub-section/card-title level.
- Body: Geist, relaxed line-height, for descriptions/bios.
- Metadata/labels: JetBrains Mono, uppercase, tracked-wide — already the established pattern for stage badges/timestamps; extend consistently rather than mixing in sans-serif labels for the same semantic role.
- Code/technical values: JetBrains Mono, as-is.
- Navigation: Geist, medium weight, no mono — navigation should read as UI chrome, not as a metadata label.

**SPACING:** a single consistent rhythm scale should replace the currently-inconsistent radii/padding choices found in the UX audit (`rounded-2xl` vs `rounded-3xl` vs `rounded-[2.5rem]` used seemingly per-file rather than per-purpose, UX audit §14). Recommend: one radius for dense/task surfaces (smaller, e.g. consistent `rounded-xl`/`rounded-2xl`), one radius for showcase/panel surfaces (larger, e.g. consistent `rounded-[2.5rem]` — the "plasma panel" treatment), and no radius scale in between chosen ad hoc per file.

**SURFACES:** background canvas for dense/task pages; border-only (no fill) for grouping within a dense page where a full card isn't needed (directly answering the "cards everywhere" problem in §14/§21 of this document below); a card/panel treatment reserved for genuinely showcase-worthy content (a project, a profile) or where elevation communicates real hierarchy (a modal, a notification).

**COLOR:** semantic roles, not decorative choices — background / surface / border / muted-text / primary-accent (indigo, kept — no evidence calls for a palette change) / destructive / success / warning. The existing single-accent-color discipline (indigo only) is a real strength worth protecting, not diluting with additional accent colors during implementation.

**IMAGERY:** project screenshots and avatars are the product's primary imagery — treat them as evidence of real work, not decoration. No stock imagery, no generated illustration for empty states (per §21's anti-pattern list) — an empty state should use typography and specific copy, not a generic illustrated icon.

**ICONOGRAPHY:** functional only (navigation, action buttons, status indicators) — not decorative accents next to headings or inside empty states, which is a specific pattern flagged as genericizing the current UI.

**MOTION:** keep the existing CSS-keyframe hero-reveal system (fixed this engagement, sound infrastructure) and the GSAP-driven below-the-fold reveal — but motion should communicate state (a new notification arriving, a successful submit, content loading) rather than decorate otherwise-static content. No new perpetual/ambient animation is recommended; the existing system is sufficient and better-targeted than adding more.

## 21. Components

Format: WHEN TO USE / WHEN NOT TO USE, for the components most implicated by the audits' findings.

- **Card:** use when content is genuinely a discrete, browsable unit (a project in a grid, a devlog preview). Do not use for grouping form fields, settings sections, or single-item detail pages where a border-only or no-container treatment communicates the same grouping with less visual noise (directly targets the "cards inside cards" and "generic dashboard hero" anti-patterns in §22 below).
- **Empty state:** use a differentiated template per feature area — icon (functional, not decorative), heading specific to what's missing, one line of context-specific guidance, one CTA. Do not reuse one generic "No data yet" template across unrelated feature areas (UX audit §6/§9/§12, the single most repeated finding across every audit in this engagement).
- **Badge:** use for developer-declared, low-frequency status (project stage, role, engine) — already well-used. Do not use for auto-generated counts or gamified metrics (§9's "no fake metrics" rule).
- **Empty-weight dashboard card:** do not build a card that's equally sized and equally prominent regardless of whether it has real content — this is the specific anti-pattern behind the current dashboard's three-equal-cards problem (§8).
- **Timeline/list:** use for devlog history and activity feeds — a genuinely time-ordered sequence is better served by a list/timeline component than a card grid, which implies items are independent and browsable rather than sequential.
- **Tabs:** use for the combined Playtesting & Collaboration nav destination (§7) and for object-scoped sub-navigation (studio, project management) — matching the pattern `/settings/*` already does well.
- **Navigation sub-nav:** replicate the Settings pattern (contextual, object-scoped) for Studios and Project management, rather than each section inventing its own pattern.

## 22. Motion

(Covered substantively in §20; not repeated here beyond noting the principle again for completeness of the required section list: motion communicates state transitions, not decoration. No section-specific additions beyond §20.)

## 23. AI-Slop Anti-Patterns (Derived From Glyph's Actual Current Implementation)

Each item below is grounded in a specific finding from the two audits, not a generic list:

1. **Three identical statistic/empty-state cards with equal visual weight** — the current `/dashboard` (UX audit §5, §21).
2. **One undifferentiated empty-state template reused across unrelated features** — `/dashboard`, `/dashboard/playtests`, `/events` (UX audit §6, §9, §12; research doc §21).
3. **Generic "Welcome back" dashboard framing with no prioritized action** — current dashboard header pattern (UX audit §5).
4. **Symmetric grid layouts used as a default rather than a deliberate choice** — dashboard cards, explore grid (UX audit §6, research doc §21).
5. **Rounded-corner/radius scale applied inconsistently per file rather than per purpose** — `rounded-2xl`/`rounded-3xl`/`rounded-[2.5rem]` coexisting without an evident rule (UX audit §14).
6. **Duplicated decorative markup copy-pasted across files instead of extracted into a shared component** — the "plasma" background panel duplicated verbatim across two page files (UX audit §14).
7. **Disabled controls whose only explanation is a hover tooltip** — the billing page's "Manage subscription" button (UX audit §7, §11, §16).
8. **Decorative icons attached to headings/empty states without functional purpose** — implicated by the generic empty-state template (§21 above).
9. **No fake/gamified metrics** — explicitly avoid inventing a progress bar, streak counter, or point system anywhere (§9); this is a preventive anti-pattern, not one observed in the current build, and should stay that way.
10. **Navigation that either hides real features or lists all of them with equal weight** — both the current under-indexing (Studios/Publisher/Jams missing from primary nav) and the naive over-correction (cramming all eleven areas into one flat list) are anti-patterns; §7's two-tier model is the deliberate middle path.

## 24. Priority: Structural / System / Polish

**STRUCTURAL (must come first — changes to IA, navigation, dashboard, page hierarchy, object relationships):**
- Two-tier navigation system (§7)
- Dashboard information hierarchy redesign (§8)
- Reciprocal object linking (project↔studio member↔profile, etc. — §5)
- Studio membership UI (§17) — flagged as needing original design work, highest-priority structural gap
- Playtester-side flow completion (§15) — structural in the sense that it's an incomplete core-loop step, not a visual issue

**SYSTEM (component-level, typography, spacing, surfaces, states):**
- Differentiated empty-state component per feature area (§21)
- Consistent radius/spacing scale (§20)
- Extracted shared "plasma panel" component (§23 item 6)
- Profile activity-signal component (§11)
- Creation-action menu component (§7)

**POLISH (shadows, micro-spacing, animation, small refinements):**
- Motion timing/easing refinements within the existing reveal system (§20)
- Avatar-initials algorithm consistency fix (two implementations currently produce different results — UX audit §18)
- Tooltip → visible-notice conversion for the disabled billing button (§21 item 7)

## 25. Mobile Architecture

Per-surface mobile behavior, derived rather than assumed (desktop-first, then "what changes," per the brief's explicit instruction not to just shrink desktop):

- **Dashboard:** the single "next action" prompt (§8) becomes the top-of-screen priority; the activity module and community teaser stack below, collapsible; Level-3 entries move entirely into the drawer's context switcher rather than appearing on the mobile dashboard at all.
- **Navigation:** primary 5-item set becomes a bottom bar or drawer (§7); context switcher and creation menu collapse into the drawer/FAB.
- **Project page:** identity + current-state + stage badge stay above the fold; media becomes a horizontal scroll strip (not a shrunk grid); devlog timeline and playtest CTA remain high-priority, not pushed below links/team as they might be under a naive "shrink everything proportionally" approach.
- **Profile:** identity + activity signal + current project stay above the fold; social links and follower counts move below.
- **Feed/Explore:** single-column, unchanged in content model, denser card treatment to fit more per scroll.
- **Search:** unchanged — already a simple, mobile-appropriate destination.

## 26. Accessibility Principles

Carried forward from the UX audit's confirmed findings, not re-litigated here: keep the now-working Escape-to-close mobile drawer and the corrected heading hierarchy (both verified holding, UX audit §11). Address the one open gap found — the disabled billing button relying solely on a `title` tooltip, which is not reliably exposed to screen readers or touch devices (§21 item 7 above; convert to a visible, dismissible notice matching the page's own established disclosure pattern). Any new component introduced per §21/§24 (differentiated empty states, activity-signal module, creation menu) should carry the same keyboard/focus-visible/labeled-icon standard already correctly applied to the profile page's social links (UX audit §11).

## 27. Page-by-Page Blueprint

For brevity and to avoid restating what §8–§19 already cover in depth, this section gives the compact per-page spec requested by the brief; deeper reasoning for each lives in the correspondingly-named section above.

**1. Landing** — Purpose: prove the core loop is real. Primary user: visitor. Primary job: understand what Glyph is within seconds. Primary action: sign up. Secondary: browse a real project. Hierarchy: hero → one live example → core-loop explanation → CTA. Layout: current asymmetric hero kept; nav must link to real `/explore` content (UX audit §3/§5 fix). Density: spacious. Nav: public. Empty/loading/error: N/A (static marketing). Mobile: hero stacks, single column. Key interaction: reveal-on-scroll (kept, already fixed this engagement).

**2. Explore** — Purpose: Level-2 discovery. Primary user: any. Primary job: find active projects/developers. Primary action: view a project/profile. Hierarchy: recent activity first, editorial/featured second (§13). Layout: card grid, but recency-sorted, not static. Density: medium. Nav: public/authenticated shared. Empty: "no projects match yet" (rare, given seed data — worth defining before launch). Loading: skeleton grid. Mobile: single column, denser cards.

**3. Search** — Purpose: intent-driven lookup. Primary user: any. Primary job: find a specific object. Primary action: navigate to result. Hierarchy: query-relevance. Layout: kept as-is (already works well). Density: medium. Mobile: unchanged.

**4. Dashboard** — See §8 in full. Purpose: "what's happening with my work and community." Primary action: the one dynamically-chosen next action. Density: varies by user's actual activity level (§8).

**5. Public profile** — See §11. Purpose: prove "this person is building something." Primary action: follow. Density: medium, showcase-leaning.

**6. Project** — See §10. Purpose: the flagship showcase surface. Primary action: follow / sign up to playtest. Density: spacious, showcase.

**7. Devlog** — Purpose: read one unit of progress and respond. Primary user: any. Primary action: react/comment. Hierarchy: content → reactions → comments → footer nav (kept, already good). Density: spacious, reading-focused. Mobile: unchanged, already works.

**8. Feed** — See §12. Purpose: aggregate core-loop activity from follows. Primary action: open a devlog/project. Density: medium, list/timeline-leaning, not card-grid.

**9. Playtesting** — See §15. Purpose: request/find structured feedback. Primary action (requester): post a request. Primary action (tester): sign up. Density: medium. Priority: finish tester-side flow before any visual rework.

**10. Collaboration** — See §16. Purpose: post/apply to join a project. Primary action: post or apply. Priority: finish applicant-review UI before visual rework.

**11. Events** — Purpose: local community logistics. Primary user: subset interested in in-person meetups. Density: medium. Priority: low relative to core-loop surfaces.

**12. Game jams** — See §18. Purpose: time-boxed core-loop variant. Primary action: submit/vote. Priority: verify voting anti-abuse design before promoting further in nav.

**13. Studio** — See §17. Purpose: organizational wrapper around multiple developers. Primary action (owner): manage members (currently missing — top structural priority). Primary action (visitor): view member projects.

**14. Publisher** — See §19. Purpose: business-layer discovery. Primary action: contact a developer / shortlist a project.

**15. Notifications** — Purpose: surface events needing attention. Primary action: navigate to the referenced object. Priority: pair with wiring the existing, unused email infrastructure (`lib/email/*`, flagged in both prior audits) so notifications reach users outside the app too.

**16. Settings** — Purpose: account management. Kept as-is; its sub-nav pattern is the model other sections should copy (§7, §21).

**17. Admin** — Purpose: moderation/jam-approval/infrastructure. Primary user: admins only. Priority: build UI for the confirmed-working, currently UI-less ban/unban functions (UX audit §9, §15).

## 28. Structural Changes

(Consolidated list, cross-referenced to §24 for the full structural/system/polish split.)
1. Two-tier navigation (§7).
2. Dashboard information hierarchy (§8).
3. Reciprocal object linking across project/studio/profile (§5).
4. Studio membership UI (§17).
5. Playtester-side flow completion (§15).
6. Applicant-review UI for collaboration (§16).

## 29. System Changes

1. Differentiated empty-state component (§21).
2. Consistent radius/spacing scale (§20).
3. Shared "plasma panel" component (§23).
4. Profile activity-signal module (§11).
5. Creation-action menu (§7).
6. Notification email wiring (§27, "Notifications").

## 30. Polish Changes

1. Motion timing refinements within the existing reveal system (§20).
2. Avatar-initials algorithm consistency (§24).
3. Tooltip → visible-notice conversion on the billing page's disabled button (§21).

## 31. Keep

- The project page's structural model (badges + embedded playtest CTA + devlog list).
- Settings' contextual sub-nav pattern.
- Geist + JetBrains Mono typography pairing.
- The single-indigo-accent color discipline.
- The mobile drawer navigation mechanism (post Escape-key fix).
- The CSS-keyframe hero reveal system.
- The collaboration-post and playtest-request structured-tag models.
- The billing page's honest disclosure copy pattern (extend it, don't replace it).
- The devlog page's draft-gating and comment/reaction wiring.

## 32. Remove

- The single undifferentiated empty-state template used everywhere.
- The dashboard's three-equal-weight-card pattern.
- The landing page's marketing-only anchor nav that never links to real content.
- The duplicated inline "plasma panel" markup (replace with a shared component — not removing the visual treatment itself, which stays).
- The disabled-button-with-only-a-tooltip pattern on the billing page.

## 33. Redesign

- Primary navigation (§7).
- Dashboard information architecture (§8).
- Profile's activity/momentum representation (§11).
- Studio management (needs new design work, §17).

## 34. What NOT To Build

- No messages/DMs feature — not present in schema or routes; inventing one here would violate the evidence-only constraint of this document.
- No algorithmic feed ranking — chronological-from-follows is the evidence-grounded recommendation (§12).
- No gamified progress bars, streaks, or point systems (§9).
- No new "trending" algorithm separate from the existing admin-featured mechanism (§13).
- No new accent colors beyond the existing single indigo (§20).
- No generic illustrated empty-state graphics (§20, §21).
- No itch.io-style 25-dimension filter system on Explore — wrong fit for Glyph's current catalog size (§13).

## 35. Implementation Order

Dependency-derived, not the brief's illustrative example order copied verbatim — reasoning given at each phase:

**PHASE 1 — Information architecture & navigation (§6, §7).** Everything else depends on knowing where things live; redesigning the dashboard or project page before nav is fixed means redesigning surfaces users still can't reliably reach.

**PHASE 2 — Dashboard model (§8).** The first authenticated surface every returning user sees; blocked only by Phase 1 (needs the new nav's creation-action menu and context switcher to exist).

**PHASE 3 — Core-loop completion: playtester-side flow, collaboration applicant review, studio membership (§15–§17).** These are structural gaps in the loop itself, not visual work — fixing them changes what the redesigned dashboard/project pages actually have to show, so they should land before the visual system pass, not after.

**PHASE 4 — Project & Profile models (§10, §11).** The two flagship object pages; now safe to redesign since nav (Phase 1), dashboard (Phase 2), and the loop's actual data completeness (Phase 3) are settled.

**PHASE 5 — Feed & Discovery (§12, §13).** Depends on Phase 3's completed core-loop objects (playtest/collaboration activity) having real events to surface.

**PHASE 6 — Design system consolidation (§20–§21, §29).** Once the structural pages are settled, extract the shared components (empty states, plasma panel, radius scale) rather than doing this first and having to redo it against a still-changing IA.

**PHASE 7 — Mobile architecture pass (§25).** Explicitly after desktop structural work, per the brief's own "mobile-first thinking" instruction interpreted correctly: mobile behavior should be *defined* alongside each surface's redesign (as §25 already does per-page), but the dedicated cross-cutting mobile QA/consistency pass happens once the desktop structure has stabilized, to avoid re-testing mobile against a moving target.

**PHASE 8 — Polish (§30).** Last, deliberately — per the brief's own instruction not to polish a structurally wrong page.

## 36. Design Principles

1. Derive, never invent — every recommendation in this document traces to a specific audit finding, schema fact, or cited competitor pattern.
2. Visual weight should match the core-loop tier (§3, §4) — Level 1 objects (project, devlog, developer) always outweigh Level 3 (jams, events, studios) in any shared view.
3. An empty state should be specific to what's missing, never generic.
4. Motion and color communicate state and hierarchy, never decorate empty space.
5. No feature is hidden, but not every feature gets equal weight — the two-tier nav model (§7) is the concrete expression of this.
6. Authenticity over gamification in anything claiming to represent "still building" (§9).
7. Structural fixes precede visual polish, always (§24, §35).

## 37. Competitive Evidence

Every major decision above cites its source inline; the pattern, restated once for clarity:

- **Project-first, devlog-centered core object** — evidence: itch.io's 42,000+-devlog usage data + real developer pain-point research on fragmentation (`glyph-competitive-product-research.md` §4.1, §18) + Glyph's own schema construction order.
- **Density-varies-by-mode visual system** — evidence: Linear's stated design philosophy (research doc §4.8) + the UX audit's direct observation that Glyph's dense task surfaces currently use showcase-level decoration (UX audit §6, §21).
- **Non-algorithmic, recency-based Feed/Explore** — evidence: Are.na's precedent (research doc §4.7) + Glyph's current catalog size making itch.io's 25-filter model a poor fit (research doc §8, §13).
- **Authentic, artifact-tied activity signal, not a gameable metric** — evidence: GitHub's own documented criticism of its contribution graph, and Letterboxd's documented unpersonalized-feed criticism (research doc §4.5, §4.6, §17).
- **Two-tier navigation (small primary set + context switcher)** — evidence: no single researched competitor solves this cleanly (itch.io's own nav is comparatively flat because its catalog/feature set is narrower per surface, research doc §5), so this is the one place this document proposes a structure without a direct precedent — flagged honestly as RECOMMENDED/original synthesis rather than claimed as researched.

## 38. Final Product Direction

Glyph should stop trying to visually represent all eleven of its feature areas as equally important, and start visually representing the one thing that's actually true about it: it's a place to document unfinished work in public, and every other feature — playtesting, collaboration, jams, studios, publishers — exists to circulate that documented work to the right person at the right moment. The interface's job is to make that hierarchy legible at a glance: what am I building, what happened to it recently, who's paying attention, and what's my one next move — with everything else one deliberate step away, not competing for the same pixel.

This is not a claim that Glyph should narrow its feature set (§34's "what not to build" is short precisely because most of what's already built is worth keeping) — it's a claim about what should organize the *presentation* of a feature set that's already more sophisticated than its current interface admits.

---

*This document is a design/product blueprint only. No component, route, or database change was made while producing it. Every structural claim about Glyph's current state is either CODE VERIFIED (read from the actual route tree, schema, and components this session and prior phases) or drawn directly from the two prior audits; every competitive claim traces to `docs/glyph-competitive-product-research.md`'s cited sources. Where this document proposes something with no direct precedent (§7's two-tier nav model being the clearest example), that is stated explicitly rather than presented as researched fact.*
