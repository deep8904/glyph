# Glyph Navigation Model

**Date:** 2026-09-16
**Status:** Research/architecture document. No code, schema, or UI was changed to produce this.
**Purpose:** Determine Glyph's actual final navigation — explicitly re-derived from the platform research and product model, not assumed to be either the earlier product-design-blueprint's proposal or Phase 2's shipped structure by default. As it turns out, both converge on the same answer via independent reasoning paths; this document explains why, rather than picking one authority and calling it done.

---

## 1. Desktop Navigation

### Global navigation (persistent)
**Dashboard · My Projects · Feed · Explore · Playtests · Collaborate**

**Why this set, why this order:** Reasoned independently in `docs/glyph-information-architecture.md` §4 from the product model (which routes answer "daily check" vs. "occasional use"), and cross-checked against LinkedIn's own hard-capped nav (Home/Network/Jobs/Messaging/Notifications/Me — six items, pattern library §1). Both derivations land on a six-item cap. Order follows the core loop from the product design blueprint: orient (Dashboard) → build (My Projects) → discover others' work (Feed, then Explore) → participate structurally (Playtests, then Collaborate).

**Why NOT merged (Playtests/Collaborate):** The product design blueprint's original proposal to combine these into one tabbed destination was explicitly not adopted in Phase 2, and this research pass finds no new evidence to reverse that. If anything, LinkedIn's own practice of keeping Jobs and Messaging as fully separate top-level items (not tabs within one destination) despite both being "structured opportunity" surfaces in a loose sense, reinforces keeping Glyph's two structurally-distinct surfaces (a dashboard view vs. a public browse-with-filters page) separate rather than merged.

### Search
**Not a persistent nav item; not a command palette (not built this pass).** LinkedIn's search is a persistent top-bar element (pattern library §1), which Glyph doesn't currently have — `/search` is reached via a link from `/explore`'s header only. This is named as an explicit open gap in the information architecture document (§5, "search category tabs + two-layer filters," P2) but a full persistent-search-bar redesign is out of scope for this research pass — flagged for a future Search/Discovery phase, not decided here.

### Create action
**Not currently a persistent affordance.** No researched platform's create pattern (§13 of the pattern library — GitHub/itch.io single-form, Discord's guided-template flow) implies Glyph needs a persistent global "+" button; each core object (Project, Devlog, Playtest Request, Collaboration Post) already has its own contextual creation entry point (a header-action button on the relevant page). **Recommendation: do not add a global create menu speculatively** — no researched pattern or Glyph-specific evidence supports the added complexity over the current per-page entry points.

### Notifications
**A persistent icon with an unread-count indicator — already shipped in Phase 2** (`AppShell`'s bell icon in both top bars). Matches LinkedIn's persistent Notifications tab (pattern library §1) and the general principle that time-sensitive, personal-relevance content deserves permanent visibility, unlike Studios/Jams/Events which are product-area browsing, not personal alerts.

### Account/context menu
**The "More" secondary panel, shipped in Phase 2** (`SecondaryNav.tsx`), functions as Glyph's equivalent of LinkedIn's "Me" menu (pattern library §12) — an account-management hub distinct from any public-facing page, containing both product-area links (Studios/Jams/Events/Publisher) and account-level links (Notifications/Settings/Billing) grouped with a visual divider between the two categories. This already matches the pattern; no structural change recommended.

### Contextual navigation
Per `docs/glyph-information-architecture.md` §3 — project/studio/publisher/jam/event/settings context-specific navigation, reached only from within that object, never competing with the global six-item set. Already correctly implemented for Settings (the `SettingsNav.tsx` pattern); recommended-but-not-built for Project↔Studio reciprocal linking (per the product model's project blueprint).

## 2. Mobile Navigation

**Primary destinations:** identical set to desktop (Dashboard/My Projects/Feed/Explore/Playtests/Collaborate), rendered through the same `SidebarBody` component Phase 2 already built — deliberate IA parity, not a shrunk copy.

**Create action:** Per the LinkedIn mobile-nav finding (pattern library §1/§16 — LinkedIn's mobile bar is NOT a desktop-shrink; it centers a persistent "Post" create action and demotes Messaging to a header icon), this is the one place this research pass surfaces a genuine open question rather than a confirmed answer: **should Glyph's mobile nav diverge from desktop the way LinkedIn's does, centering a create action?** Glyph currently has no persistent create affordance on either breakpoint. This is recorded as an **open product decision** (§ below), not resolved by this document, since Phase 2's IA-parity choice was reasonable but this research surfaces a specific, cited counter-pattern worth weighing deliberately rather than by default.

**Notifications:** persistent bell icon in the mobile top bar — already shipped in Phase 2, matches the same reasoning as desktop.

**Profile/account:** reached via the mobile drawer's account block + "More" panel, same component as desktop — consistent with the "same IA, different chrome" principle this document endorses throughout.

**Contextual navigation:** identical mechanism to desktop (in-page links, `SettingsNav.tsx`), no mobile-specific divergence needed since these are already per-object pages, not persistent chrome.

## 3. Why This Sequence, Restated

Every element of this navigation model was reached by the same test, applied consistently: **does this destination answer "what do I check or do today," or does it answer "what feature exists in this product"?** The first category earns persistent nav; the second earns contextual/secondary placement. This is directly derived from LinkedIn's own demonstrated practice (a mature product with 20+ years of iteration deliberately keeping its persistent nav to 6 items despite having dozens of features) rather than an arbitrary design preference. Applying that same test to Glyph's actual object model (not copying LinkedIn's specific items) produces the exact structure Phase 2 already shipped — which is the reason this document confirms rather than overturns it: the convergence itself is the evidence the earlier decision was sound, not a coincidence to be second-guessed.

## 4. Open Product Decisions From This Document

- **Should Glyph's mobile nav diverge from desktop with a centered create action**, per LinkedIn's demonstrated pattern? Not decided here — requires weighing against Phase 2's deliberate IA-parity choice.
- **Should `/search` gain a persistent nav/header presence** (a search bar, not just a link from Explore)? Flagged as P2 in the information architecture gap table — a future Search/Discovery phase's call, not this document's.
- **Should the "More" panel's account link surface a direct "View public profile" entry**, per the small LinkedIn-Me-menu gap noted in the pattern library (§12)? Minor, low-priority, foldable into any future navigation refinement.

No other open decisions — every other element of this navigation model has a clear, evidence-backed answer stated above.
