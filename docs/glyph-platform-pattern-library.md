# Glyph Platform Pattern Library

**Date:** 2026-09-16
**Status:** Research document. No code, schema, or UI was changed to produce this.
**Method:** LinkedIn is the primary structural reference (deepest research, real cited sources — official LinkedIn Help pages fetched directly, LinkedIn's own blog/engineering posts, and independent UX teardowns). GitHub, itch.io, Discord, Behance, Dribbble, Reddit, Letterboxd, Product Hunt, and Steam are secondary references, researched for specific transferable patterns rather than exhaustively. Every entry is tagged **OBSERVED** (a real, cited source), **INTERPRETATION** (reasoned analysis of why a pattern exists, not itself a quoted fact), or **GLYPH RECOMMENDATION** (a proposal — not yet decided, not implemented). Only patterns that produce a specific, actionable "what Glyph can learn" are recorded — platforms with nothing distinctive to say about a given section are omitted from that section rather than padded with a vague entry.

---

## 1. Global Navigation

### LinkedIn
**Pattern:** A hard-capped desktop top nav — Home, My Network, Jobs, Messaging, Notifications, Me, plus a "Work" flyout (Learning, post a job, Groups, Pages) and a separate top-right "For Business" menu (Recruiter, Sales Navigator, etc.) kept entirely outside the primary bar. Mobile bottom nav is a *different* 5-item set (Home, My Network, Post, Notifications, Jobs) — Messaging is demoted off the bottom bar entirely on mobile. [Understand the LinkedIn.com navigation bar](https://www.linkedin.com/help/linkedin/answer/a525089/); [Navigate the LinkedIn Mobile App](https://www.linkedin.com/help/linkedin/answer/a528037/navigate-the-linkedin-mobile-app). **OBSERVED.**
**User problem it solves:** New capabilities (Learning, Recruiter, Sales Navigator) don't dilute the primary nav's memorability — the daily-use set stays fixed size regardless of how much the product grows.
**Why it works:** A persistent nav answers "what do I check daily"; everything else is reachable but demoted, so users never have to scan a growing list to find their five daily destinations. **INTERPRETATION.**
**Glyph equivalent:** The Phase 2 six-item primary nav (Dashboard, My Projects, Feed, Explore, Playtests, Collaborate) + "More" secondary panel (Studios, Jams, Events, Publisher, Notifications, Settings, Billing, Admin).
**Current Glyph implementation:** Exactly this shape, already built in Phase 2 (`components/dashboard/AppShell.tsx`, `components/dashboard/SecondaryNav.tsx`).
**Gap:** Mobile currently mirrors desktop 1:1 (same `SidebarBody` component, same item order) rather than re-ranking by mobile-specific frequency-of-intent the way LinkedIn's bottom bar differs from its desktop bar.
**Recommendation:** Consider, for a future mobile-specific pass (not this phase): whether Glyph's mobile primary set should re-prioritize a "create" action the way LinkedIn's mobile bar centers "Post" — Glyph has no persistent create affordance at all currently. **GLYPH RECOMMENDATION**, not decided.

### Discord
**Pattern:** A three/four-pane persistent layout (server rail → channel list → content → member list) rather than a single top bar — navigation is spatial, not a dropdown list. [Server Discovery](https://support.discord.com/hc/en-us/articles/360023968311-Server-Discovery); category/channel structure cross-checked against [Server Templates](https://support.discord.com/hc/en-us/articles/360041033511-Server-Templates). **OBSERVED**, with the specific pane-count description partly **INTERPRETATION**.
**User problem it solves:** For a product whose core unit of "belonging" is a community (server), not a single global feed, spatial nav keeps the user oriented to *which* community's content they're viewing.
**Glyph equivalent:** N/A directly — Glyph's core loop is devlog-centric, not community-container-centric (see Reddit, §1 below, for the closer analog). Noted here only as a contrast case: Glyph should not adopt a Discord-style pane-per-community layout, since Glyph's core object (a project) doesn't need its own persistent chrome the way a Discord server does.
**Recommendation:** Do not import this pattern. Included to explicitly rule it out with reasoning, not by omission.

### Reddit
**Pattern:** Every subreddit is a bounded, self-contained context — its own sidebar, rules, sort tabs (Hot/New/Top), and optionally a pinned "wiki" of resources — nested inside one global nav (Home/Popular/search). [Reddit's Approach to Information Architecture](https://medium.com/@briglaser2024/reddits-approach-to-information-architecture-1cfb40eb376f). **OBSERVED** (secondary source, cross-referenced with Reddit's own help docs on karma/sorting).
**User problem it solves:** Lets a global platform host many small, differently-governed communities without every community needing its own top-level nav entry.
**Glyph equivalent:** A specific Project or Studio page.
**Current Glyph implementation:** Project pages already embed devlogs + playtest CTA inline (per Phase 1/2 findings) — a lightweight version of "bounded context," but with no per-project sort/filter or pinned-resources concept.
**Gap:** No equivalent to a subreddit's "sort tabs" or "wiki" for a project — a project's devlog list is a flat reverse-chronological feed with no sort option.
**Recommendation:** Low priority; Glyph's devlog volume per project is far smaller than a subreddit's post volume, so this gap is real but not urgent. **GLYPH RECOMMENDATION**, deferred.

---

## 2. Profiles

### LinkedIn
**Pattern:** Layered, per-section visibility — identity/headline always public, Contact Info gated to 1st-degree connections only, and a separate "off-LinkedIn visibility" (search-engine indexing) toggle independent of both. [What People Can See on Your Profile](https://www.linkedin.com/help/linkedin/answer/a545600/what-people-can-see-on-your-profile); [Manage your profile's visibility on and off LinkedIn](https://www.linkedin.com/help/linkedin/answer/a548106). **OBSERVED**, directly fetched and quoted.
**User problem it solves:** Different profile content carries different trust requirements — a headline is fine for anyone, a phone number is not.
**Glyph equivalent:** A developer profile's public bio/badges vs. any future direct-contact field.
**Current Glyph implementation:** Everything on `/dev/[username]` is uniformly public; there is no contact-info field at all (no email/phone shown), so this specific gap doesn't currently exist in a harmful form — but if Glyph ever adds a direct-contact field (e.g., for collaboration), it should not default to fully public.
**Recommendation:** When/if a direct-contact field is added to developer profiles, gate it (e.g., visible only to accepted collaborators or after a follow-back), not public-by-default. **GLYPH RECOMMENDATION.**

**Pattern:** A "Featured" section — a small, user-curated shelf of pinned best work, positioned near the top (directly below About), structurally distinct from the chronological Experience/Activity timeline. [LinkedIn Featured Section Guide](https://resumeoptimizerpro.com/blog/linkedin-featured-section-guide). **OBSERVED** (secondary/guide source, consistent across multiple independent authors — treated as reliable but not primary-sourced).
**User problem it solves:** Answers "show me your best work" (curated) separately from "show me your work history" (chronological) — two different questions a visitor might have.
**Glyph equivalent:** A pinned/featured devlog or project on a developer or studio profile.
**Current Glyph implementation:** None — the profile shows only the single `is_primary` project and a flat, unfiltered devlog history has no featured/pinned concept at all (confirmed: `app/dev/[username]/page.tsx` has no featured-content query).
**Gap:** No way for a developer to say "this is my best work" distinct from "this is chronologically my most recent work."
**Recommendation:** A small, owner-curated "Featured" shelf (1-3 pinned devlogs or project links) is a low-schema-cost, high-signal addition — closely related to GitHub's Pinned-repos pattern below. **GLYPH RECOMMENDATION**, not yet implemented.

**Pattern:** Same template renders differently based on viewership — your own profile shows inline edit affordances (pencil icons per section, a "view as" preview) and privileged data ("who viewed your profile"); another person's profile replaces those with relationship actions (Connect/Follow/Message). [What People Can See on Your Profile](https://www.linkedin.com/help/linkedin/answer/a545600/what-people-can-see-on-your-profile) + general LinkedIn Help corpus on inline editing (e.g. [Edit the Contact Info Section](https://www.linkedin.com/help/linkedin/answer/a570132/editing-the-contact-info-section-of-your-profile)). **OBSERVED** (inline-edit convention directly cited; the exact own-vs-other-render split is **INTERPRETATION** reconstructed from the visibility rules).
**Glyph equivalent:** `/dev/[username]` already does this correctly — `isOwner` gates the Follow/Block/Mute buttons vs. nothing shown on your own profile (confirmed in `app/dev/[username]/page.tsx:192`). **No gap** — Glyph already follows this pattern; noted here as confirmation, not a new recommendation.

### GitHub
**Pattern:** "Pinned" items — up to 6 repos or gists a user chooses to feature on their profile, eligibility-gated (must own it or have contributed within the last year; forks you don't own can't be pinned). [Pinning items to your profile](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/pinning-items-to-your-profile). **OBSERVED.**
**User problem it solves:** Same as LinkedIn's Featured — curated "best evidence" distinct from the full repo list.
**Glyph equivalent / gap / recommendation:** Same as the LinkedIn Featured entry above — these two platforms converge on the same pattern independently, which strengthens the case for it. **GLYPH RECOMMENDATION**, not yet implemented.

**Pattern:** The contribution graph — a persistent, cumulative activity signal on every profile — is a well-known pattern, but is also independently criticized (in this engagement's own earlier competitive research, `glyph-competitive-product-research.md` §4.5) as rewarding volume over meaningful work. **Not re-researched fresh this pass** — carried forward from prior research to avoid re-deriving it, and reinforced by GitHub's own Pinned-items feature existing specifically as a counterweight (curated quality signal next to the raw activity signal, not instead of it).
**Recommendation:** If Glyph adds any profile activity/momentum signal (per the product design blueprint's "still building" thesis), pair a lightweight recency signal ("last posted 3 days ago") with the Featured/Pinned shelf above, not a raw activity-count graph alone — this mirrors how GitHub itself pairs the two rather than relying on the graph alone. **GLYPH RECOMMENDATION**, reinforcing prior research.

### Discord
**Pattern:** Per-Server Profiles — a Nitro (paid) feature letting a user present a different avatar/banner/about-me in different servers, layered on top of one global profile. [Per-Server Profiles](https://support.discord.com/hc/en-us/articles/4409388345495-Per-Server-Profiles). **OBSERVED.**
**Glyph equivalent:** A developer's identity within a specific Studio.
**Recommendation:** Not worth the complexity for Glyph at its current scale — one global developer profile is sufficient; flagged only to note it was considered and deliberately not recommended. **GLYPH RECOMMENDATION: do not build.**

---

## 3. Projects

### Steam
**Pattern:** Three structurally distinct views of the same game object — the **Store page** (commercial pitch, public), the **Community Hub** (discussions/workshop/news, public, tabbed, can go live before the store listing), and the **Library entry** (owner/team-only, install-and-play focused). [Steam Community — Steamworks Documentation](https://partner.steamgames.com/doc/features/community). **OBSERVED.**
**User problem it solves:** A visitor evaluating whether to try the game, a community member discussing it, and the owner managing it have fundamentally different jobs-to-be-done — one page trying to serve all three inevitably compromises each.
**Why it works:** Each view can be optimized for its actual audience's primary action (buy/wishlist vs. discuss/follow-updates vs. manage/configure) instead of a single page burying one audience's needs under another's.
**Glyph equivalent:** The public project page (`/p/[username]/[project-slug]`) currently tries to serve all three audiences (visitor, community member, owner) with conditional rendering (`isOwner` checks) rather than genuinely distinct views.
**Current Glyph implementation:** One route, one template, with owner-only elements (edit/write-devlog links) conditionally shown inline — confirmed in `app/p/[username]/[project-slug]/page.tsx`.
**Gap:** No dedicated "management/backstage" view distinct from the public page — project editing lives at a completely different route (`/dashboard/projects/[id]/edit`) with no shared visual continuity to the public page, and there's no real "community hub" concept (comments/discussion live only on individual devlog posts, not the project as a whole).
**Recommendation:** This is the single most directly transferable pattern from this research pass for a future project-page phase: keep one canonical project object, but design toward three intentional views — public showcase (current `/p/...` page, refined), owner/team management (`/dashboard/projects/[id]/*`, already exists structurally, just visually disconnected), and a possible future community/discussion layer. Not a redesign to implement now — a lens for the eventual Phase 5 (Project/Devlog) work. **GLYPH RECOMMENDATION.**

### Behance / Dribbble
**Pattern:** Two-tier content depth — Behance's project is a free-form, multi-block "case study" (Behance's own guidance: structure it as Challenge → Solution → Results); Dribbble's "shot" is snippet-first (one lead image), with an optional "Multi-Shot" expansion (up to 8 images/videos, added as a middle ground between a single snippet and a full case study). [Building the Perfect Case Study](https://www.behance.net/resources/articles/building-the-perfect-case-study); [Announcing Multi-Shot](https://dribbble.com/stories/2019/08/06/announcing-multi-shot-coming-to-pros-and-teams-soon); Dribbble's own advice: "A single-image shot attracts likes... A case study converts clients... lead with your strongest visual" ([How to Share Your Work on Dribbble](https://dribbble.com/stories/2026/02/18/how-to-share-your-work-on-dribbble-while-attracting-the-right-clients)). **OBSERVED.**
**Glyph equivalent:** Project (deep, occasional, Behance-like) vs. Devlog (quick, frequent, Dribbble-shot-like).
**Current Glyph implementation:** This split already exists structurally in Glyph's schema and UI — a project page vs. a devlog post are already two distinct object types with two distinct page templates.
**Gap:** None structurally — this is a confirmation that Glyph's existing project/devlog split matches a validated, independently-converged-upon pattern from two different mature platforms, not a gap to fix.
**Recommendation:** Protect this split; do not collapse devlogs into project-page sub-sections or vice versa. **No action needed — confirmation only.**

### Letterboxd
**Pattern:** A canonical, shared object (the film) plus a personal, dated "log" entry against it (diary/review) — logging is lightweight (date + rating + optional tags), distinct from writing a full review. [Importing data](https://letterboxd.com/about/importing-data/); [Welcome to Letterboxd](https://letterboxd.com/welcome/). **OBSERVED.**
**Glyph equivalent:** Project (canonical) + Devlog entry (personal, dated log against it) — this is a second, independent confirmation of the same project/devlog split validated by Behance/Dribbble above, from an entirely different product category.
**Recommendation:** No action needed — further confirms the existing split is correct, not something to redesign. **Confirmation only.**

---

## 4. Activity / Feed

### LinkedIn
**Pattern:** Post-card anatomy is consistent regardless of content type (author block, timestamp, body, media, reaction bar, threaded comments); sponsored content uses the *same card shape* with only a label difference ("Promoted" instead of headline/connection-degree), not a separate ad module. [LinkedIn Sponsored Content](https://www.adsights.ai/resources/glossary/platform/linkedin-sponsored-content). **OBSERVED/INTERPRETATION blend**, standard across cited UX teardowns.
**Glyph equivalent:** Glyph's feed items (currently devlogs only).
**Recommendation:** If Glyph ever surfaces paid/featured content in the feed (tying back to the currently-broken `featured_listings` surfacing gap noted in the implementation plan), use the same card shape with a label difference, not a visually separate unit. **GLYPH RECOMMENDATION**, low priority, contingent on the featured-listings fix happening first.

**Pattern:** Feed ranking is not purely reverse-chronological — LinkedIn's own engineering blog describes a unified scoring model, and independent analysis describes staged distribution (a post shown to a small sample first, wider fan-out gated on early engagement). [Reverse-Engineering LinkedIn's 360Brew](https://dev.to/nicolasai/reverse-engineering-linkedins-360brew-from-their-engineering-blog-4jm6); underlying paper [360Brew (arXiv 2501.16450)](https://ar5iv.labs.arxiv.org/html/2501.16450). **OBSERVED**, with specific numeric engagement-weight claims flagged lower-confidence (third-party marketing sources, not LinkedIn primary).
**Glyph equivalent:** `/feed`, currently strict reverse-chronological from `feed_items`.
**Recommendation:** Do NOT build an algorithmic feed — this is explicitly on Glyph's own "do not build" list (per the product design blueprint and implementation plan), and Are.na's non-algorithmic precedent (from the earlier competitive research) remains the better fit for Glyph's current catalog size. Recorded here only so the reasoning is explicit: LinkedIn's own model is genuinely complex infrastructure disproportionate to Glyph's current scale, not a pattern to emulate yet. **Confirms prior "do not build" decision, does not reverse it.**

### itch.io
**Pattern:** Devlogs are the primary activity primitive, indexed by search even without attached files, and pushed to followers via **email digest** (not just in-app). [Getting indexed on Search &amp; Browse](https://itch.io/docs/creators/getting-indexed). **OBSERVED.**
**Glyph equivalent:** Glyph's devlog posts + `/feed`.
**Current Glyph implementation:** Devlogs drive `/feed` in-app; the built email infrastructure (`lib/email/*`) exists but has zero callers (confirmed in the implementation plan's Phase 1 recon) — so Glyph currently lacks the email-digest half of this pattern entirely.
**Recommendation:** Wiring devlog-publish notifications into the existing (unused) email system is directly validated by itch.io's own practice of using email as a primary re-engagement channel for exactly this content type — reinforces the implementation plan's existing "wire up email" open item rather than introducing a new one. **GLYPH RECOMMENDATION**, already tracked in the implementation plan.

### Discord
**Pattern:** No global cross-server activity feed exists by design — activity lives entirely per-channel, with unread/mention badges rather than an aggregated inbox. **INTERPRETATION**, drawn from Discord's documented navigation structure rather than a single explicit source.
**Glyph equivalent / recommendation:** Contrast case, not adoptable — Glyph's core loop depends on a cross-project feed (seeing devlogs from everyone you follow) in a way Discord's per-channel model doesn't need to solve. Included to explicitly rule out, with reasoning. **Do not adopt.**

---

## 5. Search

### LinkedIn
**Pattern:** A two-layer filter model: category tabs first (People/Jobs/Posts/Companies/Groups/Events/Schools/Services/Courses/Products), then within a category, "quick" filter chips for the most-used filters plus a separate "All filters" panel for everything else. [Search on LinkedIn](https://www.linkedin.com/help/linkedin/answer/a523136); [Filter search results by one or more locations](https://www.linkedin.com/help/linkedin/answer/a523131). **OBSERVED**, directly fetched.
**User problem it solves:** Avoids overwhelming a results page with every possible filter at once, while keeping the most commonly needed ones one click away.
**Glyph equivalent:** `/search`, which currently searches profiles/projects/devlog_posts via Postgres FTS.
**Current Glyph implementation:** Confirmed (Phase 1 recon and prior research): no filters exist on `/search` at all — it's a flat, unfiltered results list per object type.
**Gap:** No category-tab structure (results for different object types aren't clearly separated) and no filters.
**Recommendation:** A lightweight version — 3-4 category tabs (Developers/Projects/Devlogs, expandable later to Studios/Jams) with zero-to-minimal filters initially — is consistent with LinkedIn's pattern scaled down for Glyph's much smaller catalog. Do not build LinkedIn's full 10-tab, deeply-filtered model; that's disproportionate. **GLYPH RECOMMENDATION**, flagged for a future Search/Discovery phase, not this one.

**Pattern:** Recent-search history (free, unlimited, auto-populated, clearable) is structurally separate from saved/named searches with alerts (capped for free users, richer in paid tiers). [Search on LinkedIn](https://www.linkedin.com/help/linkedin/answer/a523136); [How to Save Your LinkedIn Searches](https://www.dummies.com/article/technology/social-media/linkedin/save-linkedin-searches-future-use-222878/). **OBSERVED.**
**Glyph equivalent / recommendation:** Not urgent for Glyph's scale — noted as a pattern to know about, not a near-term recommendation. **Deferred, low priority.**

### GitHub
**Pattern:** A dedicated search qualifier syntax (`label:`, `path:`, date-range comparisons, comma for OR, repeated qualifiers for AND) layered on top of plain free-text. [About searching on GitHub](https://github.com/github/docs/blob/main/content/search-github/getting-started-with-searching-on-github/about-searching-on-github.md). **OBSERVED.**
**Glyph equivalent / recommendation:** Disproportionate for Glyph's current object count and audience (not a developer-tool audience expecting query syntax) — explicitly not recommended. **Do not adopt.**

### itch.io
**Pattern:** Search is deliberately narrow — itch.io's own docs describe it as optimized for direct title matching, not full-text body search, with tag-based browsing treated as the *primary* discovery path and search as secondary. [Getting indexed on Search &amp; Browse](https://itch.io/docs/creators/getting-indexed). **OBSERVED.**
**Glyph equivalent:** `/search` (title/body FTS) + `/explore` (browse).
**Recommendation:** This validates Glyph's existing split (Explore = browse/discovery, Search = intent-driven lookup) from the earlier competitive research (`glyph-competitive-product-research.md` §13) — itch.io independently arrives at the same division of labor. **Confirmation, not a new recommendation.**

---

## 6. Discovery

### Discord
**Pattern:** Server Discovery is gated behind eligibility (≥1,000 members, ≥8 weeks old, activity/safety-guideline compliance) — a curated, late-stage reward for established communities, not an open on-ramp for new ones. [Server Discovery](https://support.discord.com/hc/en-us/articles/360023968311-Server-Discovery); [Discovery Guidelines](https://support.discord.com/hc/en-us/articles/4409308485271-Discovery-Guidelines). **OBSERVED.**
**User problem it solves:** Prevents Discovery from being flooded with low-quality/inactive/spam servers.
**Glyph equivalent:** `/explore`.
**Current Glyph implementation:** No gating at all — every public project/developer appears in Explore immediately (recency-ordered, per prior research).
**Recommendation:** Not urgent at Glyph's current scale (low volume, low spam risk) — but worth remembering as a pattern if/when volume grows and quality-curation becomes a real problem. **Deferred, noted for future consideration only.**

### Product Hunt
**Pattern:** A bounded daily launch window (midnight-to-midnight) with quality-weighted upvote ranking (established accounts weighted more than new ones; early momentum triggers front-page promotion). [What is an upvote? How Product Hunt's Ranking Really Works](https://poindeo.com/blog/product-hunt-upvote-ranking). **OBSERVED.**
**Glyph equivalent:** A hypothetical "showcase moment" for a devlog/demo release.
**Recommendation:** Explicitly risky to import wholesale — Product Hunt's model rewards one-time spectacle over the sustained devlog cadence Glyph's own product thesis (per the design blueprint) is built around. Noted and explicitly NOT recommended, to close off a plausible-sounding but wrong-fit idea before someone proposes it later. **Do not adopt** (this is itself the useful research finding).

---

## 7. Collaboration / Jobs

### LinkedIn
**Pattern:** First-party (Easy Apply — submitted and tracked entirely within LinkedIn) vs. third-party (external site — requires manual logging via "+ Add") applications are structurally distinguished; the seeker-side "Jobs Tracker" is a Kanban-like status board (Saved→Applied→In Progress→Interviewing) that only auto-updates for first-party applications. [How to Track Job Applications on LinkedIn](https://scale.jobs/blog/how-to-track-job-applications-on-linkedin). **OBSERVED.**
**User problem it solves:** LinkedIn can only reliably know the status of applications it processes itself — the UI honestly reflects that asymmetry instead of pretending equal fidelity.
**Glyph equivalent:** Collaboration applications (`collaboration_applications`) are entirely first-party (submitted and status-tracked within Glyph via `applyToCollabPost`/`updateApplicationStatus`) — there is no external-application path at all in Glyph's model.
**Current Glyph implementation (post-Phase-1):** Already a clean first-party system — apply → pending → accepted/rejected, fully tracked.
**Gap:** None relative to this specific pattern — Glyph's simpler, fully-first-party model doesn't need LinkedIn's first/third-party distinction because it has no third-party path. **Confirmation that current scope is appropriately simple, not a gap.**

**Pattern:** Poster-side is a 3-level drill: My Postings (list) → one Posting → its Applicants. [Manage your posted jobs on LinkedIn](https://www.linkedin.com/help/linkedin/answer/a520582/manage-your-posted-jobs-on-linkedin). **OBSERVED.**
**Glyph equivalent:** `/collaborate` (all posts, not filtered to "mine") → `/collaborate/[id]` (one post, showing applicants inline for the owner, Phase 1).
**Current Glyph implementation:** `/collaborate` is a public browse of all posts, not a personal "my postings" management list — a developer managing multiple collaboration posts has no dedicated "my postings" view, only the general public browse page filtered mentally by memory of which are theirs.
**Gap:** No "My Collaboration Posts" management list analogous to LinkedIn's poster-side Jobs list.
**Recommendation:** A "My Posts" filter/view on `/collaborate` (or a dashboard section) for a developer managing multiple open posts — low-cost, directly modeled on the LinkedIn 3-level drill. **GLYPH RECOMMENDATION**, flagged for Phase 8 (Collaboration/Playtesting) in the updated phase sequence below.

**Pattern:** Preferences (role, location, work type) are captured once and fan out into two downstream surfaces — personalized recommendations (pull) and alerts (push) — rather than each surface having separate settings. [Let recruiters know you're Open to Work](https://www.linkedin.com/help/linkedin/answer/a507508/let-recruiters-know-you-re-open-to-work). **OBSERVED.**
**Glyph equivalent:** A developer's `collaboration_status` field (already exists: open/selective/closed) plus role/engine/experience badges.
**Gap:** These fields don't currently drive any recommendation or alert surface — they're purely descriptive/display, not used to power a "collaboration opportunities matching your profile" feed or notification.
**Recommendation:** Once a Collaboration/Discovery phase is scoped, consider using existing profile fields (`primary_role`, `collaboration_status`) to power a simple recommended-opportunities module — the data already exists, it's just not connected to anything. **GLYPH RECOMMENDATION**, future phase.

### itch.io
**Pattern:** No collaboration/recruiting feature exists at all — validated independently in this pass (itch.io's own community repeatedly requests something like it) and in the earlier competitive research. **OBSERVED** (community threads cited in the GitHub/itch.io/Discord research above).
**Recommendation:** Reinforces the existing conclusion (from `glyph-competitive-product-research.md` §10) that Glyph's collaboration board is a genuine structural advantage over the closest direct competitor — protect and finish it (per the implementation plan's Phase 1 applicant-review work, already done) rather than redesigning it. **Confirmation, not new.**

---

## 8. Studios / Organizations

### LinkedIn (Company Pages)
**Pattern:** A three-tier trust model for employer association: (1) self-declared (free-text Experience entry, unverified), (2) admin-visible-but-not-verified (appears on the People tab as an "associated member"), (3) domain-verified (work-email-domain match, produces a visible badge, underlying email hidden). [Workplace verification with your work email](https://www.linkedin.com/help/linkedin/answer/a1423367); [Verifications on your LinkedIn profile](https://www.linkedin.com/help/linkedin/answer/a1359065). **OBSERVED.**
**User problem it solves:** Lets anyone claim an employer (low friction) while still offering a stronger, verifiable signal for those who want it, without forcing every association through a slow admin-approval gate.
**Glyph equivalent:** Studio membership (`studio_members`).
**Current Glyph implementation (post-Phase-1):** A single tier only — membership is either owner/admin-added (Phase 1's `inviteStudioMember`) or nothing; there's no self-declared "I work at this studio" claim, and no domain/email verification concept.
**Gap:** Glyph's model is actually *more* controlled than LinkedIn's (admin-gated invite only, no self-declaration) — which is arguably correct for Glyph's smaller, higher-trust context, but worth naming as a deliberate choice, not an oversight.
**Recommendation:** No change recommended — Glyph's simpler, admin-invite-only model is appropriate at current scale; LinkedIn's added verification tiers solve a trust problem (impersonation at massive scale) Glyph doesn't yet have. **Confirms current design is appropriate, explicitly not recommending added complexity.**

**Pattern:** Feature-gating an entire *tab* (the "Life" tab, employer-branding content) behind a paid product tier, rather than feature-flagging within existing tabs. [Administering LinkedIn Career Pages: Life Tab](https://business.linkedin.com/content/dam/me/business/en-us/talent-solutions/learning-center/tip-sheets/en-us/LCPAdmin_LifeTab.pdf). **OBSERVED.**
**Glyph equivalent:** A hypothetical paid studio tier.
**Recommendation:** Noted as a pattern for if/when Glyph's monetization model (currently non-functional per the completeness audit — no real Stripe checkout) is finished — an entire extra tab as the paid differentiator is cleaner than feature-flagging within existing ones. **GLYPH RECOMMENDATION**, far future, contingent on monetization being fixed first.

### GitHub
**Pattern:** Graduated, task-named repository roles — Read → Triage → Write → Maintain → Admin — where each name describes what the role is *for* (Triage = manage issues/PRs without write access; Maintain = manage the repo without destructive/sensitive actions), not just a numeric tier. [Repository roles for an organization](https://docs.github.com/organizations/managing-user-access-to-your-organizations-repositories/repository-roles-for-an-organization). **OBSERVED.**
**User problem it solves:** A role name that describes its job (not "Level 2") is self-documenting — a studio owner assigning a role doesn't need to look up what each tier means.
**Glyph equivalent:** `studio_members.role` (owner/admin/member).
**Current Glyph implementation:** Three roles, already task-appropriate at Glyph's scale (owner/admin/member), matching the schema built in migration `012` and used throughout Phase 1's studio work.
**Gap:** None significant — three roles is proportionate to Glyph's current studio complexity; GitHub's five-tier system solves a problem (large orgs with many contributor types) Glyph doesn't have yet.
**Recommendation:** Keep three roles. Do not expand to a GitHub-style five-tier system without evidence real studios need finer-grained permission splits. **Confirms current design, explicitly recommends against premature expansion.**

### Discord
**Pattern:** Two-tier permission model — server-wide role permissions (bitwise, additive) as the baseline, with per-channel or per-category **overwrites** layered on top (allow/deny exceptions scoped to just that channel); role hierarchy gates *who can manage which roles* (a role can only edit/assign roles positioned below it). [Discord Roles and Permissions](https://support.discord.com/hc/en-us/articles/214836687-Discord-Roles-and-Permissions); [Permissions — Discord Developer Docs](https://docs.discord.com/developers/topics/permissions). **OBSERVED.**
**User problem it solves:** Lets one community have public, member-only, and staff-only spaces simultaneously without multiplying roles for every combination, and prevents a lower-ranked admin from accidentally (or maliciously) elevating themselves or peers above their own rank.
**Glyph equivalent:** `studio_members.role` × `studio_projects` (which projects a studio has attached).
**Current Glyph implementation (post-Phase-1):** Flat — every studio member with `admin`/`owner` role has the same authority over every attached project; there's no per-project scoping (e.g., "admin for Project A but not Project B").
**Gap:** A studio with multiple unrelated projects has no way to scope a member's admin rights to just one of them.
**Recommendation:** Not urgent — most studios in Glyph's actual usage are likely small/single-project; this becomes relevant only if multi-project studios with distinct teams per project turn out to be common. Flagged as a known limitation, not a near-term build item. **GLYPH RECOMMENDATION, deferred, contingent on evidence of real need.**

**Pattern (role-hierarchy specifically):** A role can never manage a role at or above its own rank — this is enforced by position in an ordered list, not just by permission flags. [Discord Roles and Permissions](https://support.discord.com/hc/en-us/articles/214836687-Discord-Roles-and-Permissions). **OBSERVED.**
**Glyph equivalent:** Phase 1's `updateMemberRole`/`removeStudioMember` last-owner protection.
**Current Glyph implementation:** Partially equivalent — Phase 1 already blocks removing/demoting the last owner, but does NOT block an `admin` from demoting or removing another `admin` (any owner/admin can act on any other non-owner member, confirmed in `app/actions/studios.ts`'s `updateMemberRole`/`removeStudioMember` authorization checks, which only distinguish owner/admin from member, not admin-from-admin).
**Gap:** Two co-admins of a studio can each remove or demote the other — there's no hierarchy protection between same-tier roles the way Discord's ordered-role-list provides.
**Recommendation:** Minor, low-urgency: consider whether an admin should be blocked from removing/demoting another admin (only an owner should be able to), mirroring Discord's hierarchy-gating principle. **GLYPH RECOMMENDATION**, flagged for future studio-model refinement, not urgent.

---

## 9. Playtesting

No researched mature platform (LinkedIn, GitHub, itch.io, Discord, Behance, Dribbble, Reddit, Letterboxd, Product Hunt, Steam) has a direct structural equivalent to Glyph's playtesting model — this was already established in the prior competitive research (`glyph-competitive-product-research.md` §11) and is reconfirmed here: nothing in this pass's research contradicts it. The one partially-relevant pattern is LinkedIn's Easy-Apply-vs-external distinction (§7 above), which doesn't apply since Glyph's playtest signups are entirely first-party. **No new patterns found this pass; existing design stands un-contradicted.**

---

## 10. Notifications

### LinkedIn
**Pattern:** Notification copy follows a consistent actor→action→object template ("{Actor} {action} {your object}"), with same-action-same-object instances batched ("Sarah and 12 others reacted to your post") rather than one notification per event. [Notifications on LinkedIn](https://www.linkedin.com/help/linkedin/answer/a1341821); batching pattern cross-referenced against [How to Batch Notifications](https://www.suprsend.com/post/how-to-batch-notifications-for-your-social-media-collaborative-application) and the general actor-action-object template documented at [Notification UX: Best Practices](https://foundey.com/blog/notification-ux). **OBSERVED/INTERPRETATION blend** — the exact LinkedIn copy strings are reconstructed, not verbatim-quoted.
**User problem it solves:** A notification list should be scannable at a glance — who did what to which of my things — and batching prevents a popular post from flooding the list with 50 near-identical entries.
**Glyph equivalent:** `notifications` table + `app/notifications/page.tsx`.
**Current Glyph implementation:** The table structure is already close to actor→action→object (`actor_id` + `type` + `entity_type`/`entity_id`), but the UI (`notifLabel()` in `app/notifications/page.tsx`) doesn't resolve `entity_type`/`entity_id` into a real link, and there is no batching — every reaction/comment generates its own separate row.
**Gap:** (1) notifications aren't clickable to their source object; (2) no batching, so an active devlog with many reactions produces many near-identical notification rows.
**Recommendation:** Both gaps were already flagged in the implementation plan as open items (entity-link resolution) — this research adds the batching gap as a new, specific finding, and confirms the actor→action→object framing is the right target shape to resolve entity-linking toward, not a structural rebuild. **GLYPH RECOMMENDATION**, extends existing tracked work.

**Pattern:** Notification preferences organized as category-first, then a type×channel grid within each category (7 categories, each expanding to In-app/Push/Email toggles per sub-type) — avoids a single unmanageable giant matrix. [Notifications on LinkedIn](https://www.linkedin.com/help/linkedin/answer/a1341821); [Manage your job post email notifications](https://www.linkedin.com/help/linkedin/answer/a416410/manage-your-job-post-email-notifications). **OBSERVED.**
**Glyph equivalent:** `/settings/notifications` — currently a "coming soon" stub (confirmed, Phase 1's AI-slop findings).
**Recommendation:** When this stub is eventually built (explicitly NOT this phase, per the settings architecture document below), a shallow version of LinkedIn's pattern — 2-3 categories (e.g. "Social" / "Studio &amp; Collaboration" / "Platform") each with simple toggles, not a full channel grid until email is actually wired up — is the right-sized target. **GLYPH RECOMMENDATION**, tracked for a future Settings phase.

### GitHub
**Pattern:** A unified notifications inbox merging email, in-app, and mobile push into one filterable/groupable list, with per-repository custom watch settings. [Managing notifications from your inbox](https://docs.github.com/en/subscriptions-and-notifications/how-tos/viewing-and-triaging-notifications/managing-notifications-from-your-inbox). **OBSERVED.**
**Glyph equivalent / recommendation:** Directionally consistent with the LinkedIn pattern above (unify channels, don't fragment them) — no separate new recommendation, reinforces the same conclusion from a second source. **Confirmation.**

---

## 11. Settings

*(Full detail in the companion `docs/glyph-settings-architecture.md` — this section records only the headline structural pattern.)*

### LinkedIn
**Pattern:** Six top-level categories (Account preferences, Sign in &amp; security, Visibility, Data privacy, Advertising data, Notifications), each with a one-line descriptor, rendered as a left-rail category list + right-side detail panel. Crucially, "who can see things" (Visibility) is a fully separate top-level category from "how the account is secured" (Sign in &amp; security) and from "how the platform uses your data" (Data privacy) — never nested inside each other. [Manage your account and privacy settings](https://www.linkedin.com/help/linkedin/answer/a1337839). **OBSERVED**, directly fetched.
**User problem it solves:** A user looking for "who can see my activity" shouldn't have to search through password/security settings to find it, and vice versa.
**Glyph equivalent:** `/settings/*` (Profile, Account, Notifications, Danger Zone).
**Current Glyph implementation:** 4 categories via `SettingsNav.tsx` — Profile, Account, Notifications, Danger Zone. No dedicated "Visibility/Privacy" category exists at all; whatever privacy-relevant settings exist (if any) are presumably folded into Account or Profile.
**Gap:** No explicit Visibility/Privacy category — a real gap given Glyph now has Block/Mute (Phase 1's predecessor work) and studio-membership visibility, neither of which has an obvious settings home.
**Recommendation:** See `docs/glyph-settings-architecture.md` for the full proposed category structure — headline recommendation is adding a "Privacy" category separating visibility/blocking controls from both Profile (content) and Account (security/credentials). **GLYPH RECOMMENDATION**, detailed separately.

**Pattern:** Destructive account closure is gated by a 4-step flow: reason selection → password re-authentication → itemized stated consequences shown inline → explicit final confirmation click; owned paid/premium resources must be resolved before closure proceeds. [Close and delete your LinkedIn account](https://www.linkedin.com/help/linkedin/answer/a1379064). **OBSERVED.**
**Glyph equivalent:** `/settings/danger` (Danger Zone).
**Recommendation:** Full detail in the settings architecture document — headline: Glyph's danger-zone flow should require re-authentication and explicitly resolve owned resources (active studio ownership, open playtests/collab posts) before allowing account deletion, not just a single confirm click. **GLYPH RECOMMENDATION**, detailed separately.

---

## 12. Account

### LinkedIn
**Pattern:** The "Me" menu (clicking your own avatar) opens an account-management dropdown — profile editing, settings, help — NOT a navigation to your own public profile page; "View Profile" is one option *inside* that menu, not the click target itself. [Understand the LinkedIn.com navigation bar](https://www.linkedin.com/help/linkedin/answer/a525089/). **OBSERVED.**
**User problem it solves:** Separates "manage my account" from "see my public page" — two different intents that shouldn't collide on one click target.
**Glyph equivalent:** The account block at the bottom of `AppShell`'s sidebar.
**Current Glyph implementation (post-Phase-2):** The account block shows name/email + the new "More" secondary-nav toggle (Settings, Notifications, Billing, plus product areas) + Sign Out — functionally close to this pattern already (clicking the account area reveals account-management options, not a direct jump to the public profile).
**Gap:** None significant — Phase 2's `SecondaryNav` already achieves the LinkedIn "Me menu = account hub" pattern; there's no dedicated "View my public profile" link inside it though (it's reachable from the dashboard's own header action, per `DashboardClient.tsx`'s "View public profile" link, just not from the account menu itself).
**Recommendation:** Minor: consider adding a direct "View public profile" link inside the SecondaryNav/account area for consistency with where a user might expect to find it, mirroring LinkedIn's "View Profile" inside the Me menu. **GLYPH RECOMMENDATION**, small, low-priority polish item for a future navigation refinement, not urgent.

---

## 13. Creation Flows

### Discord
**Pattern:** Guided, template-first server creation — "Create My Own" vs. choosing a pre-built template (Gaming/School Club/Study Group) that pre-populates categories, channels, roles, and permissions. [Discord Server Setup Guide](https://support.discord.com/hc/en-us/articles/33023827550359-Discord-Server-Setup-Guide); [Server Templates](https://support.discord.com/hc/en-us/articles/360041033511-Server-Templates). **OBSERVED.**
**User problem it solves:** Removes the "blank page" problem for a genuinely complex object (a server has many interdependent parts) by offering a proven starting structure.
**Glyph equivalent:** New Studio creation (`/dashboard/studios/new`).
**Current Glyph implementation:** A single flat form (name/description/size/location/website) — no templates, but also a genuinely simpler object than a Discord server (no channels/roles to pre-populate), so the complexity Discord's templates solve doesn't really exist for a Glyph studio yet.
**Recommendation:** Not applicable at Glyph's current studio complexity — noted and explicitly not recommended, since importing a templating system for a 6-field form would be over-engineering. **Do not adopt** (this is itself the useful finding — ruling out an over-ambitious pattern).

### GitHub / itch.io
**Pattern:** Both use a single, un-wizarded form for their core-object creation (new repo; new project) — no multi-step flow. [Quickstart for repositories](https://docs.github.com/en/repositories/creating-and-managing-repositories/quickstart-for-repositories); itch.io's project creation per [Getting indexed on Search &amp; Browse](https://itch.io/docs/creators/getting-indexed). **OBSERVED.**
**Glyph equivalent:** New Project, New Devlog, New Playtest Request, New Collaboration Post — all already single-form flows in Glyph.
**Recommendation:** Confirms Glyph's existing creation flows (single-page forms, no wizards) match the pattern of the two platforms closest to Glyph's own complexity level (GitHub for structured-object creation, itch.io for the closest direct competitor) — do not add wizard steps to these flows. **Confirmation, not a new recommendation.**

---

## 14. Editing

No platform in this research pass revealed a pattern materially different from what's already documented in §2 (Profiles — own-vs-other-render, inline edit) and §13 (Creation Flows — single-form, no wizard) above. Editing in every researched platform is simply "the creation form, pre-filled, shown when the owner is viewing" — Glyph already follows this (`ProjectForm.tsx` used for both `/dashboard/projects/new` and `/dashboard/projects/[id]/edit`, per the codebase). **Confirmation only, no new section content.**

---

## 15. Permissions / Roles

*(Covered in depth in §8 above — GitHub's graduated repo roles and Discord's hierarchy+overwrite model are the two substantive findings. Not repeated here.)*

---

## 16. Mobile

### LinkedIn
**Pattern:** Mobile nav is NOT desktop-shrunk — it's a different 5-item set, re-ranked by mobile-specific intent (Post/create gets a persistent centered slot; Messaging is demoted to a header icon). [Navigate the LinkedIn Mobile App](https://www.linkedin.com/help/linkedin/answer/a528037/navigate-the-linkedin-mobile-app). **OBSERVED.**
**Glyph equivalent:** AppShell's mobile drawer.
**Current Glyph implementation (post-Phase-2):** Mobile mirrors desktop exactly (same `SidebarBody`, same item order) — deliberately, per Phase 2's own reasoning (IA parity), but this research suggests that's a reasonable starting choice, not necessarily the end state.
**Recommendation:** Flagged already in Phase 2's own "deferred" list — worth revisiting once real usage data exists, per LinkedIn's demonstrated willingness to diverge mobile from desktop when warranted. **No change now — confirms this is a legitimate future consideration, not urgent.**

### Discord
**Pattern:** The full desktop permission/role/channel model is preserved on mobile (no reduced admin feature set), but the persistent three-pane layout collapses into a single-pane drill-down (server list → channel list → channel). **INTERPRETATION**, based on the documented desktop model; not independently re-sourced for mobile specifically.
**Glyph equivalent / recommendation:** Consistent with general "don't remove capability on mobile, just restructure navigation to it" principle — already Glyph's own practice (Phase 1/2 work is capability-complete regardless of viewport). No new action. **Confirmation.**

---

## 17. Empty States

No platform researched this pass revealed a pattern beyond what the earlier UI/UX audit (`glyph-ui-ux-audit-2026-09-16.md` §6/§9/§12) already established: Glyph's single generic empty-state template is the known gap, and this research doesn't add new content to that finding — no mature platform researched here documents its empty-state philosophy explicitly enough to cite. **No new findings; prior audit stands.**

---

## 18. Lists vs. Cards

### Reddit
**Pattern:** Posts within a subreddit render as a list (title-forward, metadata-dense, vote count prominent), not a card grid — appropriate for high-volume, scan-heavy browsing where density matters more than visual richness. [Reddit's Approach to Information Architecture](https://medium.com/@briglaser2024/reddits-approach-to-information-architecture-1cfb40eb376f). **OBSERVED** (secondary source).
**Glyph equivalent:** `/dashboard/playtests` (a list of a user's own requests/sessions) vs. `/explore` (a card grid of developers/projects).
**Current Glyph implementation:** Glyph already uses list-like rows for dense, personal-management surfaces (`/dashboard/playtests`, `/dashboard/projects`) and card grids for discovery/showcase surfaces (`/explore`) — this is already the right split, confirmed by Reddit's pattern rather than contradicted.
**Recommendation:** No change — confirms the existing (if not explicitly designed) list-vs-card split in Glyph's current implementation is directionally correct. Any future design-system phase should make this split a *stated rule* (dense management = list/row, discovery/showcase = card), not just an accident of how each page happened to be built. **GLYPH RECOMMENDATION: codify the existing accidental-correct split as an explicit design-system rule in a future phase.**

---

## 19. Detail Pages

Covered in depth in §3 (Projects — Steam's three-views pattern) above. Not repeated here.

---

## 20. Moderation

### Discord
**Pattern:** Moderation authority is gated by role hierarchy — a member cannot moderate (ban/kick/nickname-change) another member whose highest role is equal to or above their own, regardless of individually-granted permission flags. [Discord Roles and Permissions](https://support.discord.com/hc/en-us/articles/214836687-Discord-Roles-and-Permissions). **OBSERVED.**
**Glyph equivalent:** Admin moderation (`app/actions/moderation.ts`, `admin_users` table) and studio member management (Phase 1).
**Current Glyph implementation:** Glyph's admin moderation is a flat single tier (you're in `admin_users` or you're not — no admin-hierarchy); studio moderation (member removal) has the same flat owner/admin-vs-member gap noted in §8 above (an admin can remove another admin).
**Recommendation:** Same as §8's recommendation — low priority, flagged for future refinement of the studio role model specifically; Glyph's admin-user moderation is single-tier by design (a small, trusted team) and doesn't need Discord's hierarchy for that specific surface. **GLYPH RECOMMENDATION, deferred, studio-scope only.**

---

## Sources Consulted (Consolidated)

All URLs cited inline above. Primary/official sources used: LinkedIn Help (linkedin.com/help, ~20 articles fetched or referenced), LinkedIn's own Engineering and Company blogs, GitHub Docs (docs.github.com, ~15 articles), Discord Support and Developer Docs (support.discord.com, docs.discord.com), itch.io's own creator documentation (itch.io/docs) and community forum threads, Behance's own blog/resources, Dribbble's own design blog/help center/API docs, Steamworks Documentation (partner.steamgames.com), Letterboxd's own about/journal pages, Product Hunt's own stories/blog. Secondary sources (UX teardowns, aggregator/guide sites) used only where no primary source was found, and flagged inline as lower-confidence where relevant (e.g., specific numeric claims like LinkedIn's "70+ notification types" or "14-day reactivation window," which came from unofficial aggregators, not linkedin.com/help directly).

**Explicitly not found / gaps disclosed:** A dedicated Nielsen Norman Group or Growth.Design LinkedIn-specific teardown was searched for but not located; Built For Mars' LinkedIn analysis was referenced only via search snippets, not directly fetched. Discord's official "Roles and Permissions" support article returned an HTTP 403 on direct fetch (bot-blocked); findings for it are drawn from indexed excerpts plus the fully-fetchable Developer Docs permissions page. These gaps are disclosed rather than papered over with fabricated citations.
