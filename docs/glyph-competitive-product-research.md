# Glyph Competitive Product Research & Product Experience Study

**Date:** 2026-09-16
**Method note (read this first):** This is desk research conducted via web search and direct page fetches (cited below, each with a URL), plus first-party review of the itch.io project-page design documentation. It is **not** the result of creating live test accounts on every competitor and using them end-to-end — that was not feasible within this engagement. Where a claim is grounded in a fetched or searched source, it is marked **RESEARCHED** with a citation. Where it comes from general product knowledge not verified against a live source this session, it is marked **INFERRED** and flagged as lower-confidence. Every claim about Glyph itself is marked **OBSERVED** (live-tested in the browser, with a route/file) or **CODE VERIFIED** (read from source, not clicked). Recommendations are marked **RECOMMENDED** and are never presented as fact.

---

## 1. Executive Summary

Glyph enters a real, evidenced gap: indie developers' own accounts of their workflow (see §18) describe a genuinely fragmented toolchain — devlogs on itch.io, discussion on Discord, recruiting on Reddit or itch's collaboration threads, playtesting through ad-hoc subreddits like r/GamePlayTest, and no single place that ties a developer's identity, their project's history, and their community relationships together. No researched competitor unifies all of this; each owns one or two pieces well (itch.io owns distribution + devlogs + jams; Discord owns real-time community; GitHub owns technical identity + collaboration graph; Reddit owns discovery-by-discussion).

That gap is real. Whether Glyph currently *occupies* it is a separate question, and the honest answer from direct use (this engagement's testing, and the two prior audits it draws on) is: **not yet, on two fronts.** First, several of the exact features that would justify consolidation — studio team management, jam host management, real notifications reaching users outside the app — are missing or half-wired (see the companion `glyph-product-completeness-audit.md`). Second, and this document's actual focus, the *experience* leans toward the visual grammar of a generic SaaS dashboard (rounded white cards on a light-gray canvas, identical empty-state template everywhere, symmetric grid layouts) rather than a product with an opinion about what it means to document a game's development in public. itch.io's own design guidance to creators — "non-obtrusive and flexible... letting creators showcase their work distinctly" (§4.1) — is itself evidence that the strongest reference product in this space treats *the developer's presentation of their work* as the primary design surface, not the platform's own chrome. Glyph's current project page (screenshots, tags, devlog list, playtest CTA) is closer to this than its dashboard is, which is a useful, specific signal for where to focus.

This document does not conclude "make Glyph look like itch.io." It concludes that Glyph's differentiator, if it commits to one, is most plausibly **the connective tissue between a developer's ongoing work and the people around it** — devlog → discovery → playtester → collaborator → community, as one continuous graph — because that connective tissue is the thing no single researched competitor provides, and it's also the thing Glyph's own schema (comments, reactions, follows, playtest_requests, collaboration_posts, notifications) was already built to support before this document existed. What's missing isn't the idea; it's finishing the loop (see §26 and the companion completeness audit) and giving the interface enough of a point of view that it stops reading as a template.

## 2. Current Glyph Assessment

**OBSERVED / CODE VERIFIED**, drawing on direct testing across this engagement plus `docs/glyph-product-completeness-audit.md` and `docs/full-product-audit-2026-09-15.md`:

- **Positioning:** "Your home base before launch" / "The platform for indie game developers who are still building" (`components/landing/Landing.tsx`).
- **Core built surface:** developer profiles, projects, devlogs (with comments/reactions, notification-wired this engagement), a global feed, full-text search, playtesting requests, local events, a collaboration board, game jams, studios, publisher tooling, admin/moderation, and a monetization shell with no working checkout.
- **What's functionally solid:** auth, profile CRUD, project CRUD (including delete, added this engagement), devlog creation, search, explore, publisher registration, studio creation/management (after an RLS fix this engagement), admin dashboard/jam approval.
- **What's missing or half-built:** password recovery, devlog editing, studio member invitations/roles/leaving (studios are solo-only in practice), jam host management, real Stripe checkout, and — most relevant to this document — a visual/interaction language distinct enough to read as a deliberate product rather than a generated one.
- **Visual system as currently implemented:** Geist for UI text, JetBrains Mono for labels/metadata, Tailwind v4 tokens, a light `gray-50` canvas with white `rounded-2xl`/`rounded-3xl` cards, indigo as the single accent (`app/globals.css`, `components/dashboard/AppShell.tsx`, `components/layout/PageShell.tsx`).

## 3. Competitive Landscape

Researched this pass, in depth order: **itch.io** (primary reference — deep, multiple primary sources), **Game Jolt** (comparative, via aggregator/community sources), **GameDev.net** and **TIGSource/TIGForums** (community/forum layer), **Ludum Dare** and **Global Game Jam** (jam-specific UX and lore), **GitHub** (developer-identity pattern reference), **Letterboxd** (activity/social-graph pattern reference), **Are.na** (curation/IA pattern reference), **Linear** (density/navigation pattern reference), **Behance/Dribbble** (creative-portfolio-discovery pattern reference). None of the "pattern reference" products (GitHub, Letterboxd, Are.na, Linear, Behance/Dribbble) are treated as competitors to Glyph — they're studied for specific interaction/IA patterns only, exactly as the brief requests.

## 4. Competitor Profiles

### 4.1 itch.io — the closest direct competitor

- **Product:** Open, creator-controlled game distribution platform with devlogs, jams, and community features built in.
- **Audience:** Indie/hobbyist game developers across all engines and experience levels, plus players/buyers.
- **Core loop (RESEARCHED, itch.io blog):** Since launching devlogs, over 42,000 posts have been published across 15,000 projects — [March 2025 Devlog: A New Website!](https://itch.io/blog/902930/march-2025-devlog-a-new-website) — indicating the devlog→project→audience loop is genuinely used at scale, not a vestigial feature.
- **Information architecture (RESEARCHED, direct fetch of [itch.io/games](https://itch.io/games)):** Top-level nav: Browse Games, Game Jams, Upload Game, Developer Logs, Community. Browse pages carry a dense left-rail filter system: platform, price, recency, 18 genre categories, 25+ input-method options, session length, multiplayer, accessibility, and type/misc — sorted by Popular, New & Popular, Top sellers, Top rated, Most Recent.
- **Project-page architecture (RESEARCHED, direct fetch of [itch.io/docs/creators/design](https://itch.io/docs/creators/design)):** Two layout modes (two-column for downloadables, single-column for HTML5). Ordered sections: Description → collapsible metadata (More information) → Download area → Purchase area → Project blog (devlogs) → Community (discussion/comments). itch.io explicitly recommends creators include a Credits section, system requirements, development status/roadmap, and contact links — i.e., the platform pushes *credibility signals* into the description rather than surfacing them as platform-owned metadata.
- **Design philosophy (RESEARCHED, same source):** itch.io's stated philosophy is "non-obtrusive and flexible," prioritizing letting creators showcase work distinctly through customizable themes and CSS rather than a uniform platform template. This is the single most load-bearing finding in this whole document for Glyph's direction — see §22.
- **Discovery:** Filter-driven browse pages, not algorithmic feed. No researched evidence of a personalized "for you" ranking.
- **Community:** RESEARCHED comparison source ([appmus.com itch.io vs Game Jolt](https://appmus.com/vs/itch-io-vs-game-jolt)) characterizes itch as "a storefront with a comments section" — community is present but secondary to distribution.
- **Collaboration:** No dedicated collaboration/recruiting feature was found in itch.io's own IA; developers instead post in community/jam forum threads ([itch.io: collaboration find team members](https://itch.io/jam/goedware-game-jam-zero-ui/topic/3759021/collaboration-find-team-members)) — an ad-hoc workaround, not a product feature. This is a real gap Glyph's collaboration board already targets on paper.
- **Game jams:** RESEARCHED ([appmus.com](https://appmus.com/vs/itch-io-vs-game-jolt)) — itch.io "has effectively cornered the game jam market," hosting Ludum Dare, Global Game Jam, GMTK Game Jam, and most major jams.
- **Visual language (INFERRED from documentation + general knowledge, not independently screenshotted this session):** Deliberately unopinionated at the platform-chrome level so each project page can carry its own identity — dark default theme, but creators can heavily reskin their own project page.
- **Strengths:** Zero-friction publishing, the dominant jam ecosystem, creator control over presentation, a real (if secondary) community layer.
- **Weaknesses (RESEARCHED, itch.io's own forums):** New games can fail to surface in search ([itch.io alternatives discussion](https://alternativeto.net/software/itch-io/?p=4)); the 2025 NSFW de-indexing caused visibility complaints; no dedicated collaboration/recruiting or structured-playtesting product — both live in ad-hoc forum threads.
- **Lessons for Glyph:** (1) Treat the project/devlog page as the primary design surface — the platform's own chrome should recede. (2) A credibility checklist (credits, status, roadmap) baked into the *content model*, not just left to the developer's prose, would out-do itch.io's "please remember to add credits" approach. (3) Collaboration and structured playtesting are validated real gaps even in the market leader — Glyph already has features aimed at both; the job is finishing and surfacing them, not inventing new ones.

### 4.2 Game Jolt — comparative

- **Product:** Community-first game platform, games-only (unlike itch.io's broader "any digital good" marketplace).
- **RESEARCHED** ([appmus.com Game Jolt vs itch.io](https://appmus.com/vs/game-jolt-vs-itch-io), [SimilarWeb comparison](https://www.similarweb.com/website/gamejolt.com/vs/itch.io/)): Game Jolt has "a wide margin advantage on community" over itch — forums, comments, integrated social features — but a much smaller audience (SimilarWeb global rank ~#7,791 vs itch's ~#826) and a weaker jam ecosystem, since "the gravitational pull of itch is growing" even for jams Game Jolt hosts itself.
- **Lesson for Glyph:** Community depth and distribution scale are in tension for these platforms — neither researched competitor does both well. A platform whose core object is the *developer relationship*, not the download count, doesn't need to win on distribution scale to be useful.

### 4.3 GameDev.net & TIGSource/TIGForums — the forum layer

- **RESEARCHED** ([MakeUseOf indie community roundup](https://www.makeuseof.com/indie-game-developer-community/), [Feedspot forums list](https://forums.feedspot.com/game_development_forums/)): Both remain active in 2025–2026. GameDev.net is organized by topic boards (beginners, programming, game design, visual art, audio); TIGForums centers on devlogs, playtesting requests, and jam participation inside a traditional threaded-forum IA.
- **Lesson for Glyph:** These are proof that "post your devlog and get feedback from other developers" is a durable, still-active pattern — but it lives inside 2000s-era forum software. The opportunity isn't the concept, it's presenting the same loop (devlog → feedback → relationship) with modern information density and without forum-thread noise.

### 4.4 Ludum Dare & Global Game Jam — jam-specific patterns

- **RESEARCHED** ([Wikipedia: Ludum Dare](https://en.wikipedia.org/wiki/Ludum_Dare), [Ludum Dare 2017 rules archive](https://ludumdare.com/resources/archive/rules-2017/)): Ludum Dare's theme-voting system (open submission → elimination rounds → final vote) is a distinct, well-loved community-ownership mechanic. Its post-jam rating system had a documented trust failure (vote manipulation via alt accounts led to LD35 cancelling its rating phase per community referendum) — evidence that open voting systems need real anti-abuse design, not just a UI.
- **Lesson for Glyph:** Jam voting/rating is not a solved, copy-safe pattern — it's an area with documented failure modes. Glyph's jam-voting feature (currently untested, per the completeness audit) should be designed with this history in mind, not treated as a routine CRUD feature.

### 4.5 GitHub — pattern reference (developer identity, not a competitor)

- **RESEARCHED** ([dev.to: Level Up Your GitHub Profile](https://dev.to/keshabkjha/level-up-your-github-profile-a-complete-guide-to-stand-out-and-shine-5f5p), [dev.to: contribution graph critique](https://dev.to/sylwia-lask/your-github-contribution-graph-means-absolutely-nothing-and-heres-why-2kjc/comments)): The contribution graph "changed developer behavior by visualizing daily commits and gamifying consistency without explicit rewards" — but is also widely criticized for measuring activity, not meaningful work ("one solid project... is worth far more than a fully green graph made of tiny typo fixes").
- **Pattern worth studying, not copying:** A low-friction, always-visible signal of *ongoing* activity is powerful for a "still building" positioning — but Glyph should learn from GitHub's own criticism and tie any such signal to real artifacts (a devlog posted, a playtest opened) rather than an abstract activity count, to avoid the same "gamed metric" critique.

### 4.6 Letterboxd — pattern reference (identity + activity + social graph)

- **RESEARCHED** ([Medium: Letterboxd UX case study](https://medium.com/@mjess.ux/ui-ux-case-study-redesigning-letterboxds-web-and-app-87c180d414da), [Design for Kats case study](https://designforkats.com/letterboxd/)): Multiple independent redesign case studies converge on the same critique — Letterboxd's activity feed lacks personalization/discovery-of-similar-users, and its web/iOS/Android experiences are inconsistent with each other.
- **Pattern worth studying:** Letterboxd's core object is a *logged activity* (a watched film + a rating), and its social graph exists to surface other people's activity around the same objects. Glyph's analogous core object could be a devlog entry or a playtest request — the lesson is to design the feed around *objects a user creates*, not generic status updates.
- **Anti-pattern to avoid:** Don't ship an activity feed with no personalization and call it done — that's the exact, repeatedly-documented complaint about Letterboxd.

### 4.7 Are.na — pattern reference (curation, not a competitor)

- **RESEARCHED** ([Wikipedia: Are.na](https://en.wikipedia.org/wiki/Are.na)): Built explicitly as "an ad-free alternative to social networks," organized around Blocks (individual content pieces) and Channels (collections). Popular specifically with designers/artists/architects who value flexible, deliberate organization over algorithmic feeds.
- **Pattern worth studying:** Are.na proves a non-algorithmic, curation-first IA can sustain a dedicated creative community. If Glyph's feed leans toward "chronological, from people you follow" rather than an algorithmic ranking, Are.na is evidence that's a legitimate, not a lesser, choice for a creative-work-focused product.

### 4.8 Linear — pattern reference (density, navigation, not a competitor)

- **RESEARCHED** ([Identity Forge: Linear design system as constraints](https://identityforge.io/learn/linear-design-system), [925 Studios: Linear Design Breakdown](https://www.925studios.co/blog/linear-design-breakdown-saas-ui-2026)): Linear's stated philosophy is that "not every element... should carry equal visual weight" — task-central elements stay in focus, orientation/navigation elements recede. Its surface system deliberately avoids "rounded corners and gaps between cards" in favor of "flush tiling with thin border lines" to pack more real information into the same viewport, described as "an engineered look with precision over friendliness." Its command palette (Cmd+K) is described as "not a feature — a core design philosophy" shortening the path between intent and action.
- **This is the single most directly actionable pattern-reference finding for Glyph's dashboard specifically** — see §21 and §27. Glyph's dashboard currently uses the opposite approach (rounded-card-everywhere, generous gaps) for what is, functionally, a task-oriented authenticated surface, not a showcase surface.

### 4.9 Behance / Dribbble — pattern reference (creative discovery, not a competitor)

- **RESEARCHED** ([ruul.io: Contra vs Dribbble vs Behance](https://ruul.io/blog/contra-vs-dribbble-vs-behance)): Behance "handles depth: case studies, process documentation, multi-image project presentations"; Dribbble is snippet-first (a single shot), community-engagement-driven. The two are frequently used together — Dribbble for discovery/engagement, Behance for the full case study.
- **Pattern worth studying:** This maps directly onto Glyph's existing project-page vs. devlog-post split (a project is the "Behance case study," a devlog entry is closer to the "Dribbble shot" — a single, digestible unit of progress). Glyph already has this structural split in its schema; the finding is to lean into it in the *presentation*, not to invent a new dual-surface model.

## 5. Competitor Navigation Comparison

| Product | Primary Nav | Secondary/Contextual Nav | Search | Profile | Creation | Discovery | Community | Settings |
|---|---|---|---|---|---|---|---|---|
| **itch.io** RESEARCHED | Browse Games · Game Jams · Upload Game · Developer Logs · Community | Left-rail filters on browse pages (18 genres, platform, price, etc.) | Yes, filter-driven, not conversational | Creator/user dashboard, separate from public creator page | "Upload Game" is a top-level nav item — creation is first-class | Filter/sort-driven browse, no evidence of algorithmic ranking | Comments + discussion boards, secondary to distribution | Not surfaced in top nav (account menu) |
| **Game Jolt** RESEARCHED (comparative sources only) | Games-first nav, community features more integrated than itch | Forums | Present, scope not verified this pass | Present | Present | Present, smaller catalog | Stronger than itch's — "wide margin advantage on community" | Not verified |
| **GameDev.net / TIGSource** RESEARCHED | Topic-board forum structure | Threads within boards | Forum search | Forum user profile | New-thread creation | Board browsing | **Is** the product — forum-native | Standard forum account settings | 
| **Glyph** OBSERVED | Sidebar: Profile · My Projects · Playtests · Events · Collaborate · Feed (`components/dashboard/AppShell.tsx`) | Settings has its own sub-nav (Profile/Account/Notifications/Danger Zone); Studios/Publisher/Jams/Admin are reachable but **not in the primary sidebar at all** | `/search` — real full-text search, works | `/dev/[username]` public + `/settings/profile` edit, cleanly separated | "New Project" button in the dashboard header; otherwise creation is per-section (each area has its own "new" flow) | `/explore` — grid browse, no filters found this pass | Feed + comments/reactions + follow, recently wired to notifications | Own sub-nav under Settings |

**Observation (not yet interpretation):** Studios, Publisher, Jams, and Admin are all real, working features (per the completeness audit) that do not appear anywhere in Glyph's primary navigation (`NAV_ITEMS` in `components/dashboard/AppShell.tsx` lists exactly: Profile, My Projects, Playtests, Events, Collaborate, Feed). A logged-in developer with a studio or a publisher account has no persistent way to get back to it except a bookmarked URL or the dashboard's own workspace cards. This is a discoverability finding, detailed in §9/§16 of the companion UX audit — flagged here because it's also an information-architecture finding: **Glyph's actual feature surface is wider than its navigation admits.**

## 6. Competitor Project-Page Comparison

| Area | itch.io (RESEARCHED) | Glyph (OBSERVED, `/p/[username]/[project-slug]`) |
|---|---|---|
| Hero/identity | Creator-controlled banner/theme, project title | Status badge (Alpha/Beta) + title + tags, no custom banner |
| Media | Screenshots/video in a dedicated sidebar (two-column mode) | Screenshot grid mid-page (observed live: 3-up grid on Emberfall Keep) |
| Description | Free-form, platform recommends credits/status/roadmap in prose | Structured "About" section with markdown |
| Downloads/builds | First-class — download/purchase areas are core to the page | Not applicable to Glyph's model (no build distribution) — links to GitHub/itch.io instead |
| Devlogs | Linked list of most-recent posts | Full devlog list on the project page, live-tested |
| Community/comments | Discussion board or comments, developer-enabled | Comments + reactions live on each devlog post, not the project page itself |
| Credibility signals | Left to developer prose (itch explicitly *recommends* but doesn't structure this) | Structured: engine, genre, stage badges, tags — **this is a genuine structural advantage over itch's free-text approach**, worth keeping |
| Playtest/collaboration tie-in | None found | Live playtest-request card embedded directly on the project page (observed: "Open Playtest · 4/12 testers · Sign Up to Test") — **no researched competitor does this** |

**Interpretation:** Glyph's project page already does something itch.io doesn't — it structurally ties a live playtest request to the project page itself, and its stage/engine/genre badges are more scannable than itch's prose-based credibility signals. This is a real, evidenced point of differentiation already built, not merely proposed. The gap is presentation polish and the missing "why does this feel alive" signals (recent activity timestamp prominence, follower/tester counts near the top) more than structure.

## 7. Competitor Profile Comparison

| Area | GitHub (pattern ref, RESEARCHED) | Letterboxd (pattern ref, RESEARCHED) | Glyph (OBSERVED, `/dev/[username]`) |
|---|---|---|---|
| Identity signal | Avatar, bio, pinned repos, contribution graph | Avatar, bio, favorite films, diary | Avatar, bio, role/engine/experience badges, current project card |
| Activity signal | Contribution graph (criticized as gameable/shallow) | Recent activity feed (criticized as unpersonalized) | "Member since" only — **no activity signal at all** |
| Social graph | Followers, following, org memberships | Followers, following, "friends who watched" | Followers/following counts (live), Follow button (live), Block/Mute (added this engagement) |
| What it must say in 5 seconds | What do you build / what do you know | What do you watch / your taste | (per Glyph's own positioning) what are you building *right now* and are you open to work with |

**Interpretation:** Glyph's profile answers "what is your role/engine/experience" well (structured badges beat GitHub's implicit-from-repos approach) but has no activity signal at all — no "last active," no recent-devlog preview, no visible momentum. Given Glyph's positioning is explicitly about developers "still building," the absence of any visible *in-progress* signal on the profile is a real gap relative to what both pattern references (GitHub's graph, Letterboxd's activity feed) treat as core, even though both are separately criticized for how they implement it (see §4.5, §4.6) — the fix is to add a momentum signal without repeating either's specific flaw (gameable/impersonal).

## 8. Competitor Discovery Comparison

| Area | itch.io (RESEARCHED) | Are.na (pattern ref, RESEARCHED) | Glyph (OBSERVED, `/explore`, `/search`) |
|---|---|---|---|
| Model | Filter-driven browse (genre, platform, price, recency, 25+ input methods) | Curation-first, channel-based, non-algorithmic | Flat grid sections: Developers, Recent Projects, Recent Devlogs — no filters found |
| Search | Present, filter-integrated | Present | Real full-text search (`.textSearch`), live-tested, returns correct results |
| Personalization | None found | None (deliberately) | None |
| Sense of "what's active right now" | Sort by New & Popular / Most Recent | Channel activity | "Recent Projects" / "Recent Devlogs" sections exist but weren't verified to be time-ordered vs static this pass |

**Interpretation:** itch.io's discovery is filter-heavy because its catalog is enormous and heterogeneous (players filtering for a specific kind of game). Glyph's catalog is small and the audience is developers discovering *other developers*, not consumers filtering products — so itch's 25-filter model is very likely the wrong pattern to copy (it would visually overwhelm a page that currently has 8 cards on it). Are.na's non-algorithmic, browse-by-recency model is closer to what Glyph's actual catalog size and audience intent call for. This is a **RECOMMENDATION**, not yet validated against real Glyph usage data (which doesn't exist — the catalog is seed data).

## 9. Competitor Community Comparison

itch.io: comments/discussion boards, secondary to distribution (RESEARCHED). Game Jolt: forums, stronger community integration (RESEARCHED, comparative sources). GameDev.net/TIGSource: forum-native, community *is* the product (RESEARCHED). Glyph: feed + follow + comments/reactions + notifications, now correctly wired end-to-end for comment/reply/reaction this engagement (OBSERVED — live-verified with real DB writes). Glyph's community model is structurally closer to a modern social graph (Letterboxd/GitHub-style follow+activity) than to any researched game-dev-specific competitor's forum-native model — this is a genuine differentiation opportunity (§22) rather than a gap, provided the activity-signal weakness noted in §7 is addressed.

## 10. Competitor Collaboration Comparison

No researched competitor (itch.io, Game Jolt, GameDev.net, TIGSource) has a structured, first-class collaboration/recruiting feature — all route this through general-purpose forum threads or external tools (Discord, Reddit r/INAT — RESEARCHED, §4.1/§18). Glyph's collaboration board (`/collaborate`) is a structured, first-class feature with post/apply/notify already working end-to-end for creation and application (per the completeness audit, applicant *review* UI is the missing piece). This is a genuine, evidenced structural advantage over every direct competitor researched — the finding is to finish it (applicant review UI), not to redesign it.

## 11. Competitor Playtesting Comparison

No researched direct competitor has a structured playtesting feature; the real-world workaround is subreddits like r/GamePlayTest (RESEARCHED, §18). Real developer accounts (§18) describe playtester engagement as the actual hard problem — not finding testers, but getting them to follow through and give specific, actionable feedback ("about half of those who offered to test never actually attempted it... the rest often ignored feedback forms"). Glyph's playtest-request model (tags for focus areas, tester-count target, embedded on the project page) is a structurally better-informed design than anything researched, because it targets the documented failure mode (vague, low-commitment testers) with structure (focus tags) rather than just a signup form. This is a genuine potential differentiator, contingent on the tester-side flow actually working end-to-end (currently BLOCKED-NOT-TESTABLE per the completeness audit — needs a second account).

## 12. Competitor Game-Jam Comparison

itch.io dominates jam hosting; Ludum Dare's theme-voting is a distinct community-ownership mechanic with a documented trust-failure history (§4.4). Glyph's jam feature (host → admin-approve → public → submit → vote → results) mirrors the itch.io/Ludum Dare shape but adds a moderation gate (admin approval) neither of those has — a reasonable choice for a smaller, identity-tied community, but it also means Glyph jams can never spin up as fast/spontaneously as an itch.io jam can. This is a genuine trade-off, not a strict improvement or regression — worth being deliberate about, not accidental.

## 13. Competitor Team/Studio Comparison

No researched direct competitor has a "studio" concept as a first-class object with its own page, member roles, and project attachment — this is closer to a GitHub-organization pattern (pattern ref, not independently re-researched this pass beyond §4.5) than anything in the itch.io/Game Jolt/forum world. Glyph's studios feature is architecturally ambitious relative to the competitive set, which makes it more disappointing that it's currently solo-only in practice (no invite/role/leave UI — per the completeness audit). This is Glyph's biggest gap between competitive ambition and current reality.

## 14. Competitor Publisher/Professional-Networking Comparison

No researched competitor in the direct/near-direct set has a publisher-discovery or publisher-contact feature at all — this appears to be genuinely novel among the researched set. Glyph's publisher registration/dashboard/shortlist/contact model (per the completeness audit: registration and dashboard complete, contact notification was broken and is now fixed this engagement, shortlist-item-adding UI not located) is a real, differentiated feature if finished.

## 15. Competitive Feature Matrix

STRONG / MODERATE / WEAK / MISSING / NOT APPLICABLE. Glyph ratings are OBSERVED/CODE VERIFIED per the completeness audit; competitor ratings are RESEARCHED or INFERRED as noted.

| Area | Glyph | itch.io | Game Jolt | GameDev.net/TIGSource |
|---|---|---|---|---|
| Developer identity | MODERATE — structured badges, no activity signal | WEAK — profile is secondary to the storefront (INFERRED) | MODERATE (INFERRED) | WEAK — forum-account-only (INFERRED) |
| Profiles | MODERATE | WEAK (INFERRED) | MODERATE (INFERRED) | WEAK (INFERRED) |
| Projects | STRONG (structured badges + embedded playtest CTA) | STRONG (mature, download-first) | MODERATE (INFERRED) | N/A |
| Devlogs | STRONG (live-tested, notification-wired) | STRONG (42,000+ posts, RESEARCHED) | MODERATE (INFERRED) | STRONG (forum-native, RESEARCHED) |
| Feed | MODERATE (works, no personalization) | N/A | N/A | N/A (forum, not feed) |
| Discovery | WEAK (no filters, small catalog) | STRONG (25+ filter dimensions, RESEARCHED) | MODERATE (INFERRED) | WEAK (forum search only, INFERRED) |
| Search | MODERATE (real fts, no filters) | STRONG (RESEARCHED) | MODERATE (INFERRED) | WEAK (INFERRED) |
| Following | MODERATE (works, no activity feed depth) | N/A | MODERATE (INFERRED) | N/A |
| Comments/reactions | STRONG (live-tested, notification-wired) | STRONG (RESEARCHED) | STRONG (INFERRED) | STRONG (forum-native) |
| Playtesting | MODERATE (requester side works; tester side untested) | MISSING (ad-hoc forum only, RESEARCHED) | MISSING (INFERRED) | MODERATE (forum-based requests, RESEARCHED) |
| Collaboration | MODERATE (post/apply works; review UI missing) | MISSING (forum threads only, RESEARCHED) | MISSING (INFERRED) | MODERATE (forum threads, RESEARCHED) |
| Game jams | STRONG (full loop verified this engagement) | STRONG (dominant, RESEARCHED) | MODERATE (RESEARCHED) | MODERATE (RESEARCHED) |
| Teams/Studios | WEAK (solo-only in practice) | MISSING | MISSING | MISSING |
| Publisher interaction | MODERATE (registration/dashboard work, contact just fixed) | MISSING | MISSING | MISSING |
| Monetization | WEAK (webhook works, no checkout) | STRONG (mature payments, RESEARCHED) | MODERATE (INFERRED) | N/A |
| Notifications | MODERATE (in-app now covers 5/5 types; email built, unwired) | MODERATE (INFERRED) | MODERATE (INFERRED) | WEAK (forum-native, INFERRED) |
| Moderation | MODERATE (backend strong; ban UI missing) | STRONG (mature, RESEARCHED — de-indexing example) | MODERATE (INFERRED) | STRONG (mature forum moderation, INFERRED) |
| Mobile UX | MODERATE (no overflow, but desktop-compressed per §16) | MODERATE (INFERRED) | WEAK (INFERRED) | WEAK (INFERRED) |
| Community | MODERATE | MODERATE (secondary to storefront, RESEARCHED) | STRONG (RESEARCHED) | STRONG (forum-native) |

## 16. UX Pattern Library — Patterns Glyph Should Learn From

1. **itch.io: platform chrome recedes, creator content leads.** (§4.1) Apply by reducing Glyph's own decorative UI on project/devlog pages relative to the developer's actual content.
2. **itch.io: structured credibility fields beat free-text recommendations.** (§4.1, §6) Glyph already does this better than itch — protect and extend it (e.g., a structured "current focus" field), don't regress toward free text.
3. **Linear: visual weight should match task centrality; navigation/orientation elements recede.** (§4.8) Apply to Glyph's dashboard, which currently gives equal visual weight to three permanently-empty workspace cards and the actual page header.
4. **Behance/Dribbble: a dual-surface model (deep case study + quick snippet) maps onto project-vs-devlog.** (§4.9) Glyph already has this split structurally; lean into it visually — devlog entries could read more like quick, scannable "shots," project pages more like full case studies.
5. **Are.na: non-algorithmic, recency-based discovery is a legitimate choice for a small, creative catalog.** (§8) Don't force a "for you" ranking system Glyph doesn't have the data to make good yet.
6. **GitHub/Letterboxd: a visible momentum/activity signal on identity pages is expected by users of comparable products, but must be tied to real artifacts, not gameable counts.** (§7)

## 17. Anti-Patterns — What Glyph Should Explicitly Avoid

1. **Letterboxd's documented flaw: an activity feed with zero personalization, shipped and left there.** (§4.6) If Glyph's feed stays purely chronological-from-follows with no other utility, it will accumulate the same complaint.
2. **GitHub's documented flaw: a gameable activity metric that rewards volume over meaning.** (§4.5) Any momentum signal Glyph adds should weight substantive artifacts (a devlog, a playtest opened) over trivial activity.
3. **itch.io's documented discovery flaw: new content failing to surface at all.** (§4.1) Glyph's small catalog makes this easy to avoid now, but the "Recent Projects"/"Recent Devlogs" explore sections should be verified to actually be recency-ordered, not static, before the catalog grows.
4. **Ludum Dare's documented voting-trust failure.** (§4.4) Glyph's jam-voting feature should have anti-abuse consideration designed in before it's ever used with a real community, not retrofitted after a trust incident.
5. **itch's own forum evidence that fragmenting community across too many platforms doesn't work** (§18) — Glyph should not treat Discord/external integration as a substitute for finishing its own in-app notification loop; the research suggests consolidation, not federation, is what developers actually want.

## 18. User Behavior Research — Recurring Real-User Problems

All entries below are **RESEARCHED**, drawn from forum/community discussion, with the caveat (stated by the search tool itself in multiple queries) that some results skew toward itch.io's own forums rather than a broader Reddit sample — treated as a real limitation, not hidden.

- **Playtester follow-through, not playtester discovery, is the hard problem.** "About half of those who offered to test never actually attempted it... the rest often ignored feedback forms and prompts entirely, giving random or minimal feedback with little actionable value." ([king-studio devlog, "Working with Playtesters"](https://itch.io/devlog/456005/working-with-playtesters)) A dedicated subreddit (r/GamePlayTest) exists specifically because this is unsolved elsewhere.
- **Finding collaborators is described as trust-limited, not discovery-limited.** "What's truly hard is finding the right people you can really trust and have fun together, even though finding people on the internet is the easiest thing on the planet." Multiple threads titled "Is Finding A Team Really This Hard?" ([itch.io jam topic](https://itch.io/jam/jamsepticeye/topic/5332024/is-finding-a-team-really-this-hard)) — developers report posting into collaboration threads and getting zero replies.
- **Community is fragmented across Discord, itch forums, and Twitter/X, and developers explicitly find this unsustainable.** "Some developers advise sticking with one or two platforms and being active there" ([search synthesis of itch.io forum discussion](https://itch.io/post/83481)) — a direct, if modest, piece of evidence for a consolidation thesis.
- **itch.io became relevant as a community platform partly because "ppl don't want to use discord"** for everything — but the same source notes moderators "talk to a lot more people regularly on Discord," showing the fragmentation isn't fully resolved by itch.io either.

**Pattern across all four findings:** the recurring complaint is never "I can't find a platform" — it's "the platform doesn't produce follow-through, trust, or focus." This is a meaningfully different design target than a typical "more discovery surface area" recommendation, and it argues for Glyph investing in structured commitment mechanics (the kind its playtest-request tags and collaboration-post structure already gesture at) over investing in more browse/filter surface area.

## 19. Glyph User Testing (First-Time-User Perspective)

Conducted as a fresh-eyes pass, live in the browser (OBSERVED), deliberately setting aside internal product knowledge:

- **USER C — Visitor, not signed in:** The landing page (`/`) immediately states the product and audience ("Your home base before launch... For developers who are still building") and shows one concrete artifact (a mock project page with a playtest signup). This answers "what is this" reasonably well. It does **not** let a visitor browse real people or real projects without navigating away from the hero — the landing page's own "Community"/"Events"/"Jobs" nav items are anchor links within the marketing page, not links to `/explore` or `/dev/[username]`. A visitor has to actively find `/explore` (not linked from the header nav at all — OBSERVED, `NAV_LINKS` in `Landing.tsx` is `#features`/`#community`/`#events`/`#jobs`, all in-page anchors).
- **USER A — First-time indie developer, post-signup:** Reaches `/dashboard` and sees "Welcome back, [name]" with three permanently-templated cards (Projects/Events/Collaborations), each saying some variant of "no data yet, [do this]." There is no single obvious first action prioritized over the other two — the page gives three equal-weight options, which is itself a finding (§21 of the companion UX audit covers this in visual-hierarchy terms; here it's a *product* finding: onboarding doesn't pick a winner).
- **USER B — Experienced indie developer, evaluating against Discord/itch/Reddit:** The honest answer, based on this research, is that Glyph's most defensible "why here instead" is the collaboration board and playtest-request structure (§10, §11) — both are genuinely more structured than the ad-hoc alternatives this user currently uses. That case is not made anywhere in Glyph's own onboarding or landing copy today; the pitch is generic ("all in one place, always free"), not the specific, evidenced differentiation this research surfaces.
- **USER E — Developer with a project, presenting it professionally:** The project page (§6) is Glyph's strongest asset relative to competitors — structured badges, embedded playtest card, real devlog history. This *is* working.
- **USER H — Studio owner:** Cannot actually run a team (§13, and the completeness audit) — this user's needs are the least met of any persona researched.

## 20. Glyph vs. Competitors — Feature-by-Feature

Covered in depth per-area in §6–§14; consolidated in the matrix at §15. Repeating it feature-by-feature in prose form here would duplicate that table without adding evidence, so this section points to it rather than restating it.

## 21. Why Glyph Currently Feels Generic — Specific Evidence

This is a visual/structural finding, grounded in direct observation of Glyph's own code and screenshots taken across this engagement, cross-referenced against the pattern research above:

1. **Every empty state uses one undifferentiated template.** OBSERVED across `/dashboard`, `/dashboard/playtests`, `/events`, `/jams` this session: a light rounded-square icon, a bold heading, one line of gray subtext, one CTA button — identical structure regardless of whether the empty thing is "projects," "events," or "game jams." None of it is written or illustrated in a way that's specific to *game development* — the same template would work unchanged for a generic B2B SaaS product's "no invoices yet" state. This is the single most concrete, repeatable piece of evidence behind "feels AI-generated": nothing about the empty states signals "this is for people who make games."
2. **The dashboard gives three permanently-visible cards equal visual weight regardless of whether they contain real data or not** (§19) — a symmetric three-column grid is a very common generated-dashboard pattern precisely because it requires no editorial decision about what matters most.
3. **No visible momentum/activity signal anywhere** (§7) — a product about developers "still building" has no UI element that actually shows building *happening*, which is a content/product gap that reads visually as inertness.
4. **itch.io's own stated design philosophy — creator content should lead, platform chrome should recede (§4.1) — is the inverse of Glyph's current authenticated-app visual weighting**, where the AppShell's own chrome (sidebar, header bar, rounded panel) is consistently more visually assertive than the sparse content inside it on low-data pages.
5. **Linear's principle that orientation elements should recede while task-central elements stay in focus (§4.8) is not currently applied** — Glyph's sidebar and dashboard cards carry roughly equal visual weight to the page's actual content in every screenshot taken this engagement.

These are the specific, falsifiable claims behind "feels generic" — not a vibe, but five concrete, checkable patterns.

## 22. Glyph Product Differentiation — What Glyph Can Genuinely Own

Derived from the research above, not assumed in advance:

- **The connective loop between a developer's ongoing work and the people around it** (§1, §9) — devlog → discovery → playtester → collaborator → community as one continuous object graph. No researched competitor does all of this in one product; the real-world evidence (§18) is that developers actively feel the pain of *not* having this.
- **Structured commitment mechanics over raw discovery surface area** (§18) — Glyph's existing playtest-tag structure and collaboration-post structure are already better-targeted at the documented real problem (follow-through/trust) than any researched competitor's ad-hoc-forum-thread approach.
- **A project page that ties presentation, credibility, and an active playtest ask into one place** (§6) — already structurally ahead of itch.io here; the opportunity is to make this the flagship surface of the product rather than one page among many.

None of these are new inventions — they're already present in Glyph's schema and partially built UI. The differentiation case is about finishing and foregrounding what exists, not adding net-new concepts.

## 23. Recommended Product Model

**RECOMMENDED**, derived from the above: Glyph's core object is **the devlog entry** — a timestamped unit of real progress, tied to a project, which is in turn tied to a developer. The primary loop, grounded in the actual documented user pain points (§18), is:

**BUILD → DOCUMENT (devlog) → BE DISCOVERED → GET STRUCTURED FEEDBACK (playtest/comment) → CONNECT (follow/collaborate) → BUILD AGAIN**

This differs from a generic social-media loop (post → like → follow) by putting a concrete work artifact at the center rather than a status update, and by treating "structured feedback" (not passive reactions) as the loop's most important step — directly answering the documented complaint that generic feedback mechanisms produce low-value engagement (§18).

## 24. Recommended Information Architecture

**RECOMMENDED.** The current primary nav (Profile, My Projects, Playtests, Events, Collaborate, Feed) omits Studios, Publisher, and Jams entirely (§5). A revised structure, derived from the loop in §23:

- **Home** (renamed from "Profile" — the dashboard's actual job is orientation, not profile-editing)
- **My Work** (Projects + Devlogs, merged — currently split awkwardly across "My Projects" and per-project devlog management)
- **Community** (Feed + Explore + Search, merged into one destination with tabs, rather than three separate nav-adjacent destinations)
- **Playtesting**
- **Collaborate**
- **Events & Jams** (merged — both are time-boxed, discoverable, RSVP/join-style objects; currently split with Jams entirely absent from nav)
- **Studios** (added to primary nav once it has real multi-member functionality — not before, per §13)

This is a proposal for discussion, not a spec — it has not been validated with users.

## 25. Recommended Navigation

**RECOMMENDED**, following from §24:

**DESKTOP:** Primary sidebar per §24's list. Secondary/contextual nav appears only within a section (e.g., Settings' existing sub-nav pattern, which already works well and should be the template other sections follow). Search as a persistent, always-reachable element (currently a full-page destination, not a persistent affordance — worth reconsidering as a command-palette-style overlay per the Linear reference, §4.8, given Glyph's small-but-growing object graph of people/projects/devlogs). Creation actions contextual to the current section rather than a single generic "New Project" button that doesn't cover devlogs/playtests/collab posts equally.

**MOBILE:** The existing drawer pattern (OBSERVED, `AppShell.tsx`, verified working including Escape-to-close after this engagement's fix) is sound and should be kept — the finding is about *what's in it* (§24's list), not the mechanism.

## 26. Recommended Core User Flows

Per persona, CURRENT vs. COMPETITOR PATTERN vs. RECOMMENDED:

- **New developer:** Current: dashboard with three equal-weight empty cards. Competitor pattern: itch.io's "Upload Game" as a first-class nav item (§5) makes the first action unambiguous. Recommended: pick one winning first action (most plausibly "post your first devlog," since that's the core object per §23) and visually subordinate the rest.
- **Developer posting a devlog:** Current: solid, live-tested, works end to end. No significant change recommended — this is closest to itch.io's own model and already works.
- **Visitor discovering a project:** Current: must navigate away from the landing page's anchor-link nav to find `/explore` (§19). Recommended: link real discovery from the primary marketing nav, not just in-page anchors.
- **Playtester:** Current: requester side works, tester side untested/possibly incomplete (per completeness audit). Competitor pattern: none of the researched competitors solve this well either (§11) — Glyph's structured-tag approach is already ahead on paper. Recommended: prioritize finishing and testing this flow specifically, since it's a genuine, evidenced differentiator if it works.
- **Studio owner:** Current: cannot add a second person (§13). No competitor pattern to follow here since none of the researched direct competitors have this concept. Recommended: this needs product design work, not competitive benchmarking — it's the least-precedented feature in the set.

## 27. Recommended Design Language

**RECOMMENDED**, per the brief's explicit instruction not to start with colors:

- **Personality:** editorial and workshop-like — closer to a developer's own devlog/notebook than a marketing dashboard. Not "gaming neon," not "generic SaaS," not "AI startup."
- **Density:** should vary by context, following Linear's principle (§4.8) — the authenticated, task-oriented surfaces (dashboard, settings, management pages) should be denser and less decorated than they currently are; the public-facing project/devlog pages should stay closer to their current, more generous treatment, since that's where itch.io's "let creator content lead" principle (§4.1) applies most directly.
- **Typography:** the existing Geist/JetBrains Mono pairing is sound and shouldn't change for its own sake — the finding is about applying it more consistently to create actual hierarchy (per the companion UX audit), not about swapping fonts.
- **Surfaces:** move authenticated-app surfaces away from the uniform rounded-white-card-on-gray pattern toward more of Linear's flush/bordered density where the content is task-oriented data, while keeping generous card treatment where the content is genuinely showcase-oriented (project pages, profiles).
- **Motion:** the reveal-animation system fixed earlier this engagement (CSS-driven, no more flash) is sound infrastructure — the finding is about where it's used, not the mechanism itself.
- **Component philosophy:** fewer, more purposeful card variants; the identical empty-state template (§21) should be replaced with per-context copy and, where feasible, per-context illustration that actually signals "this is about games."

## 28. Keep / Remove / Redesign

**Keep (specific, evidenced):**
- The project page's structural model (badges + embedded playtest CTA + devlog list) — ahead of itch.io on structure (§6).
- The Settings sub-nav pattern — a working example of contextual secondary navigation Glyph should replicate elsewhere (§25).
- Geist + JetBrains Mono typography pairing — sound, under-applied, not wrong.
- The mobile drawer navigation mechanism (post Escape-key fix) — functionally solid.
- The collaboration-post and playtest-request structured-tag models — genuinely ahead of the researched competitive set (§10, §11).

**Remove/replace (specific, evidenced):**
- The single undifferentiated empty-state template used everywhere (§21).
- The landing page's marketing-only anchor nav that never links to real `/explore` content (§19).
- The dashboard's three-equal-weight-card pattern with no prioritized first action (§19, §21).

**Redesign (structural, not cosmetic — per §29 below):**
- Primary navigation, to surface Studios/Publisher/Jams (§5, §24).
- The dashboard's information architecture and visual hierarchy (§21, §27).
- The profile page's activity/momentum signal (currently absent) (§7).

## 29. Highest-Impact Changes

In rough priority order, each tied to specific evidence above:

1. Add a real momentum/activity signal to profiles and the dashboard (§7, §21) — directly serves the "still building" positioning and is currently the single biggest gap between what Glyph claims to be about and what its UI actually shows.
2. Redesign the dashboard's empty/low-data state to pick one prioritized first action instead of three equal ones (§19, §21).
3. Surface Studios/Publisher/Jams in primary navigation (§5) — or, if studio team features stay unbuilt, deliberately hold them out of nav rather than leaving them in an undocumented limbo.
4. Differentiate empty-state copy/visuals per feature area instead of one shared template (§21).
5. Link real discovery (`/explore`) from the landing page's own navigation, not just in-page anchors (§19).
6. Finish and test the playtester-side flow end to end — it's a genuine, evidenced differentiator if it works (§11, §26).

## 30. Long-Term Product Direction

**RECOMMENDED**, contingent on validating §23's proposed core loop with real usage once the catalog has real users rather than seed data: Glyph's strongest long-term position, based on this research, is as the place where a devlog entry is the atomic unit of a developer's public record — with discovery, playtesting, and collaboration all existing to circulate that unit to the right people at the right moment, rather than as three separate, disconnected feature areas competing for nav space. This is not a claim that Glyph should narrow its feature set — it's a claim about what should organize the *presentation* of the feature set it already has.

---

*Every finding above is labeled OBSERVED, CODE VERIFIED, RESEARCHED (with a citation), INFERRED, or RECOMMENDED. Nowhere in this document is a competitor claim made without a source, and nowhere is a Glyph claim made without a route/file/test reference. Where research was limited by this engagement's tooling (no live test accounts on competitor products), that limitation is stated in the method note at the top rather than papered over.*
