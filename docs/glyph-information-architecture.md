# Glyph Information Architecture

**Date:** 2026-09-16
**Status:** Research/architecture document. No code, schema, or UI was changed to produce this.
**Method:** Built from the product model (`docs/glyph-product-model.md`), not from the current sidebar — then reconciled against what Phase 2 actually shipped, since discarding working, already-verified navigation would be wasteful. Where this document confirms Phase 2's structure, it says so explicitly rather than re-deriving it from scratch for its own sake.

---

## 1. Public Information Architecture

| Destination | Route | Object model source | Persistent nav? |
|---|---|---|---|
| Home | `/` | Marketing/landing | Yes (unauthenticated) |
| Explore | `/explore` | Developer, Project, Devlog Post (browse) | Yes |
| Search | `/search` | Developer, Project, Devlog Post (query) | Contextual (linked from Explore) |
| Developer profile | `/dev/[username]` | Developer | Contextual (reached via Explore/Search/links) |
| Project page | `/p/[username]/[project-slug]` | Project | Contextual |
| Devlog post | `/p/.../[devlog-slug]` | Devlog Post | Contextual |
| Studios directory | (none — no public studio list exists) | Studio | **Gap**, see §4 |
| Studio page | `/studios/[slug]` | Studio | Contextual only |
| Jams | `/jams`, `/jams/[slug]`, `/jams/[slug]/results` | Game Jam, Jam Entry | Yes (unauthenticated) |
| Events | `/events`, `/events/city/[city]` | Event | Yes (unauthenticated) |
| Publishers directory | `/publishers` | Publisher Account | Yes (unauthenticated) |
| Playtests browse | `/playtests/browse` | Playtest Request | Yes (unauthenticated) |
| Collaboration board | `/collaborate` | Collaboration Post | Yes (unauthenticated) |
| Pricing | `/pricing` | N/A | Contextual |

**Confirmed gap, not addressed by Phase 2 (out of its scope — nav-only, not route-creation):** there is no public studios directory/browse page analogous to `/publishers` or `/jams` — a visitor can only reach a specific studio via a direct link (from a project page, once Project↔Studio reciprocal linking is built per the earlier project blueprint work) or by guessing a slug. This is a real, still-open orphaned-surface finding, distinct from the nav-reachability gaps Phase 2 already closed for authenticated routes.

## 2. Authenticated Information Architecture

This is Phase 2's shipped structure, reconciled against the product model rather than re-derived:

**Level 1 — Primary (always visible):** Dashboard, My Projects, Feed, Explore, Playtests, Collaborate.

**Level 2 — Secondary/contextual (one click away via "More"):** My Studios, Game Jams, Events, Publisher Tools (role-gated), Notifications, Settings, Billing.

**Level 3 — Administrative:** Admin (role-gated).

**Reconciliation against the product model:** every Level-1 item maps to a core-loop object (Developer's own work: Projects; the two discovery surfaces: Feed/Explore; the two structured-participation surfaces: Playtests/Collaborate). Every Level-2 item maps to an object that wraps or intersects the loop rather than being the loop itself (Studio wraps Projects; Game Jam is a time-boxed Project variant; Event is adjacent community infrastructure; Publisher is a business-role viewer of the same Projects; Notifications/Settings/Billing are account-level, not object-level). This is the same conclusion Phase 2 reached independently — the product-model-first derivation this document was asked to perform **confirms** Phase 2's structure rather than overturning it. No change to the shipped nav is recommended by this document.

## 3. Contextual Information Architecture

Object-scoped navigation, reached only from within that object's own pages — never a persistent nav item:

- **Project context** (`/dashboard/projects/[id]/edit`, `/devlogs/new`): reached from `/dashboard/projects`' per-project action row and (recommended, not built — see the product model's project blueprint) a reciprocal link from the public project page.
- **Studio context** (`/dashboard/studios/[slug]`): reached from `/dashboard/studios` (Phase 1's landing page) and the public `/studios/[slug]` page's "Manage" affordance for members.
- **Publisher context** (`/dashboard/publisher/contact/[id]`): reached from the project page's publisher-viewer-gated "Contact developer" link (Phase 1) — correctly never a persistent nav item, since it's meaningful only in the context of a specific developer.
- **Jam context** (`/jams/[slug]/submit`, `/vote`, `/dashboard/jams/new`): reached from the jam's own detail page and `/dashboard/jams/new`.
- **Event context** (`/dashboard/events/[id]/manage`): reached from the event's own detail page (owner-only).
- **Settings context** (`/settings/profile`, `/account`, `/notifications`, `/danger`): reached via the shared `SettingsNav.tsx` sub-nav — already a confirmed-good pattern (per every prior audit and Phase 2's own documentation), not changed here.

## 4. Which Routes Deserve Persistent Navigation — the Actual Decision Rule

Derived from the LinkedIn research (pattern library §1): a route deserves **persistent** nav only if it answers "what does this user check/do *daily*," not merely "is this a real feature." Applying that rule explicitly (not assuming every route needs a nav item, per the task's own instruction):

- **Persistent, correctly:** Dashboard, My Projects, Feed, Explore, Playtests, Collaborate — all daily-frequency for an active developer.
- **Secondary, correctly:** Studios, Jams, Events, Publisher — all real, but weekly-or-rarer frequency for most users, matching LinkedIn's own treatment of Learning/Groups/Pages as a "Work" flyout rather than primary items (pattern library §1).
- **Account-level, correctly:** Notifications, Settings, Billing — not "product areas" at all, correctly grouped separately from Studios/Jams/Events/Publisher in Phase 2's `SecondaryNav`, matching LinkedIn's "Me menu = account hub, distinct from product surfaces" pattern (pattern library §12).
- **Never persistent, correctly:** Admin (role-gated to a tiny fraction of users), and every contextual route in §3 above (a specific project/studio/jam/event's management page — these are inherently one-object-at-a-time, not daily-check destinations in the abstract).

**Conclusion: no route currently lacks appropriate navigation treatment.** This document's product-model-first derivation converges on the same structure Phase 2 already shipped — the value of this exercise is the explicit reasoning trail (§2, above) confirming the existing IA is not an accident, rather than a mandate to change it.

## 5. Feature/Pattern Gap Table

| Mature Platform Pattern | Source | Glyph Equivalent | Exists? | Current Route | Gap | Priority |
|---|---|---|---|---|---|---|
| Featured/Pinned profile shelf | LinkedIn, GitHub | Featured devlogs/projects on profile | No | `/dev/[username]` | Profile has no curated-highlight section | P1 |
| Activity/momentum signal on profile | GitHub (as counterweight to raw graph) | "Last posted" signal | No | `/dev/[username]` | Confirmed again this pass — highest-priority profile gap, consistent across every audit in this engagement | P0 |
| Layered profile visibility (public/connection-gated/off-platform) | LinkedIn | Contact-info gating, if ever added | N/A (no contact field exists yet) | — | Not a current gap; a forward-looking guardrail | Deferred |
| Search category tabs + two-layer filters | LinkedIn | `/search` result-type separation | No | `/search` | Flat, unfiltered results across object types | P2 |
| Public studios directory | itch.io/publishers-style directory pattern (internal consistency, not itself researched externally) | Browse all studios | No | — | No route exists at all | P2 |
| Reciprocal project↔studio link | Steam (three-views continuity) | Project page shows parent studio | No | `/p/[username]/[project-slug]` | Already flagged in prior audits; reconfirmed here | P1 |
| "My Postings" management list (poster-side drill) | LinkedIn Jobs | Collaboration posts a developer owns | No | `/collaborate` | Public browse only, no personal management filter | P2 |
| Email digest for devlog activity | itch.io | Devlog-publish → email | No (infra built, unwired) | `lib/email/*` | Already tracked in the implementation plan | P1 |
| Notification batching | LinkedIn | Multiple reactions → one notification | No | `notifications` table | New finding this pass | P2 |
| Notification entity deep-linking | LinkedIn (actor→action→object) | Click notification → source object | No | `/notifications` | Already tracked in the implementation plan | P1 |
| Settings: Visibility/Privacy as its own category | LinkedIn | Block/mute/visibility settings home | No | `/settings/*` | See `docs/glyph-settings-architecture.md` | P1 |
| Graduated task-named roles | GitHub | Studio member roles | Yes (owner/admin/member, appropriately scoped) | `studio_members.role` | No gap — confirmed appropriate at current scale | N/A |
| Role-hierarchy protection (admin can't touch admin) | Discord | Studio member management | Partial | `app/actions/studios.ts` | Admin can remove/demote another admin; only last-owner is protected | P3 |
| Per-channel/per-project permission scoping | Discord | Studio member access to specific projects | No | `studio_members` | A studio admin has uniform authority over all attached projects | Deferred, no evidence of need yet |
| Three-views object model (public/management/community) | Steam | Project page | Partial (2 of 3: public + management exist, disconnected) | `/p/...` + `/dashboard/projects/[id]/*` | No reciprocal linking between the two existing views; no community view (deliberately not recommended yet) | P2 |
| Devlog/Project dual-surface (deep vs. snippet) | Behance/Dribbble/Letterboxd (triple-confirmed) | Project vs. Devlog | Yes | Both routes | No gap — confirms existing design | N/A |

Priority key: P0 = highest-confidence, cross-referenced across multiple prior audits and this research pass; P1 = strong single-source evidence; P2 = reasonable but lower-urgency; P3 = minor; Deferred = explicitly not recommended without further evidence.
