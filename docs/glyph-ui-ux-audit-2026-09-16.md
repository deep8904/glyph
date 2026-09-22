# Glyph — UI/UX & Product Experience Audit

**Date:** 2026-09-16
**Scope note:** This audit evaluates the actual experience of using Glyph — not whether features exist (that's `docs/glyph-product-completeness-audit.md`, which is treated here as context only, independently re-checked rather than trusted). This is not a pre-production, release-readiness, or final audit. Glyph is under active development and known to have missing/incomplete functionality; the job here is to find what's actually wrong with the experience, not to declare it finished. No code was changed while producing this document. Evidence tags: **OBSERVED** (live-tested in the browser this engagement or a prior phase of it), **CODE VERIFIED** (read from source, not clicked), **REPRODUCED** (issue triggered more than once), **INFERRED** (reasoned from code/behavior without a direct test).

---

## 1. Executive Summary

Glyph's functional core — auth, profile, projects, devlogs with comments/reactions/notifications, search, jams, studios (creation), publisher registration — largely works when exercised directly, and several individual surfaces (the project page, the devlog reading experience, Settings' sub-navigation) are genuinely well put together. The experience problems are concentrated in three places: (1) a uniform, undifferentiated visual/interaction vocabulary applied regardless of context — one empty-state template, one card treatment, symmetric grids everywhere — which is what makes the product read as generic/templated even where the underlying feature is solid; (2) real backend/UI gaps and outright missing UI (studio team management, jam host tools, ban-enforcement UI) that leave working backend code stranded with no way for a real user to reach it; and (3) a handful of "UI that lies" candidates — most notably the billing page's now-corrected-but-previously-misleading upgrade path and any remaining places where a button implies an action the backend can't actually complete — that matter more for user trust than their frequency would suggest.

## 2. Product Experience Overview

Glyph is a multi-surface product: a public marketing site, an authenticated dashboard-style app, public developer/project/devlog pages, a studio surface, a publisher surface, and an admin surface. OBSERVED across this engagement: these surfaces do not currently feel like one product in visual weight (public pages use a heavier "plasma" card-panel treatment; the dashboard uses a flatter light-gray-canvas-plus-white-card treatment) but they are terminologically consistent (the same words — project, devlog, playtest, studio — mean the same thing everywhere, which is a real, if easy to take for granted, coherence strength).

## 3. Complete Route Inventory

OBSERVED/CODE VERIFIED, consolidated from this engagement and the prior completeness audit's route walk. "Tested" reflects direct interaction at some point in this engagement, not necessarily this specific session.

| Route | Purpose | Primary User | Auth Required | Tested | UX State |
|---|---|---|---|---|---|
| `/` | Landing/marketing | Visitor | No | Yes | Reveal-flash fixed; nav is in-page anchors only, doesn't link to real content |
| `/explore` | Discovery grid | Any | No | Yes | Dense, no filters, sections cut off at viewport edge on desktop |
| `/search` | Full-text search | Any | No | Yes | Works correctly, no filters |
| `/dev/[username]` | Public profile | Any | No | Yes | Structured badges good; no activity signal; block/mute now wired |
| `/dev/[username]/followers`, `/following` | Follow lists | Any | No | Partial | Reachable, not deeply tested this pass |
| `/p/[username]/[project-slug]` | Project page | Any | No | Yes | Strongest page in the product; embedded playtest CTA |
| `/p/.../[devlog-slug]` | Devlog post | Any | No | Yes | Comments/reactions/notifications fully wired and live-tested |
| `/pricing` | Pricing page | Visitor | No | Partial | Links to `/dashboard/billing?plan=X` |
| `/dashboard` | Authenticated home | Developer | Yes | Yes | Three equal-weight empty cards, no prioritized first action |
| `/dashboard/billing` | Subscription mgmt | Developer | Yes | Yes | Honest "not available yet" notice (fixed this engagement); no real checkout |
| `/dashboard/playtests` | Playtest requester view | Developer | Yes | Yes | Generic empty-state template |
| `/events` | Local events | Any | No | Yes | Generic empty-state template |
| `/collaborate` | Collaboration board | Developer | Yes | Yes | Post/apply works; applicant review UI not located |
| `/jams` | Game jams | Any | No | Yes | Full loop (create→approve→submit→vote) verified working in a prior phase |
| `/settings/*` | Account settings | Developer | Yes | Yes | Sub-nav pattern is a genuine strength, worth replicating elsewhere |
| Studio routes | Studio mgmt | Studio owner | Yes | Partial | Creation works (post-RLS-fix); member invite/role/leave UI not found |
| Publisher routes | Publisher tooling | Publisher | Yes | Partial | Registration/dashboard work; contact-notification just fixed; shortlist-add UI not located |
| Admin routes | Moderation/jam approval | Admin | Yes (role) | Partial | Jam approval verified; ban-enforcement UI not found despite working backend actions |

**Not in primary navigation despite being real, working routes (OBSERVED, `components/dashboard/AppShell.tsx` `NAV_ITEMS`):** Studios, Publisher, Jams, Admin. A signed-in user with access to any of these has no persistent path back to them except a bookmark or a workspace-card link — this is a discoverability finding, not merely an IA preference (see §9).

## 4. Complete User Journey Audit

| Journey | Discoverability | Usability | Completeness | Main Issues |
|---|---|---|---|---|
| Visitor → understand product | Good (clear hero copy) | Good | Good | Nav is in-page anchors, doesn't reach real content |
| Visitor → browse real projects | Poor | Good once found | Good | `/explore` not linked from landing nav |
| Sign up → first dashboard view | Good | Fair | Fair | Three equal empty cards, no prioritized action |
| Post a devlog | Good | Good | Good | Editing not found (per completeness audit — CODE VERIFIED not this pass) |
| React/comment on a devlog | Good | Good | Good (fixed this engagement) | None found |
| Follow a developer | Good | Good | Good | No resulting activity-feed depth beyond raw posts |
| Request/find a playtester | Fair (project-page embedded) | Good (requester side) | Unknown (tester side untested) | Tester-side flow not verified end to end |
| Post/apply to collaborate | Fair (own nav item) | Good (posting/applying) | Partial | No applicant-review UI located |
| Create/join a studio | Poor (not in nav) | Good (creation) | Poor | No member invite/role/leave UI — solo-only in practice |
| Create/browse a jam | Poor (not in nav) | Good | Good (full loop verified) | Voting anti-abuse design unverified |
| Publisher registers/contacts | Poor (not in nav) | Fair | Partial | Shortlist-add UI not located |
| Manage billing | Fair | Good | Honest-but-incomplete | Correctly discloses no real checkout (fixed this engagement) |
| Block/mute/report a user | Poor (only reachable from a profile page, not documented anywhere) | Good once found | Good (wired this engagement) | No discovery path beyond visiting the profile itself |

## 5. Critical UX Problems (P0/P1)

1. **[P1] Dashboard gives no prioritized first action.** OBSERVED, `/dashboard`: three cards (Projects/Events/Collaborations) with equal visual weight, all showing "no data yet" variants simultaneously for a new user. A first-time user has no signal about which of the three matters most, or which best fits Glyph's own "post your progress" positioning.
2. **[P1] Studios/Publisher/Jams/Admin absent from primary navigation.** CODE VERIFIED, `AppShell.tsx` `NAV_ITEMS`. A user with a studio or publisher account effectively loses their own feature surface the moment they navigate away from a bookmarked URL.
3. **[P1] Landing page's own navigation never links to real content.** OBSERVED, `components/landing/Landing.tsx`: `NAV_LINKS` are `#features`/`#community`/`#events`/`#jobs`, all anchors within the marketing page. A visitor evaluating the product has no one-click path to a real project or a real developer profile.
4. **[P2] Identical empty-state template used across every feature area regardless of context.** OBSERVED across `/dashboard`, `/dashboard/playtests`, `/events`: same icon-square + heading + gray subtext + single CTA structure, with copy generic enough to belong to any SaaS product, not specifically a game-dev platform.
5. **[P2] No visible activity/momentum signal anywhere in the product**, despite the product's own positioning being about developers "still building." CODE VERIFIED: `/dev/[username]/page.tsx` shows only "Member since {date}" — no last-active, no recent-devlog preview.

## 6. Visual Design Problems

- **Uniform card/rounded-corner/shadow treatment applied without regard to whether elevation communicates real hierarchy** — CODE VERIFIED across `app/dashboard/billing/page.tsx` (`rounded-2xl` cards for both the current-plan summary and a one-off notice, no visual distinction of importance), `/dashboard` workspace cards, and devlog/project panels (`rounded-[2.5rem]` consistently, even for low-information states).
- **Symmetric three-column dashboard grid** reads as a generated-dashboard pattern (a very common LLM/template default) rather than an edited, prioritized layout — OBSERVED, `/dashboard`.
- **Public "plasma" panel background treatment** (`bg-plasma`, layered translucent right-edge panels — CODE VERIFIED, `app/dev/[username]/page.tsx` lines 115–120, duplicated verbatim in `app/p/.../[devlog-slug]/page.tsx` lines 135–140) is visually distinctive and a genuine point of character — but its exact-duplicate implementation across two separate page files (rather than a shared layout/component) is itself a design-system inconsistency (see §14).

## 7. Interaction Problems

- **Billing page's "Manage subscription" button is `disabled` with a tooltip** rather than hidden or replaced with an honest "not available" state matching the pattern used elsewhere on the same page for the no-checkout notice — CODE VERIFIED, `app/dashboard/billing/page.tsx` lines 63–69. This is a minor internal inconsistency: the page discloses one limitation via a visible amber notice but a second, closely related limitation (managing an existing subscription) via a disabled control with only a hover tooltip, which is far less discoverable, especially on touch devices where hover doesn't exist.
- **No confirmation step visible in code for block/mute actions** — CODE VERIFIED, `BlockMuteButtons` is rendered but its internal confirmation behavior wasn't re-inspected this pass; flagged as INFERRED-risk, not a confirmed finding, pending a closer look at `components/moderation/BlockMuteButtons.tsx`.

## 8. Information Architecture Problems

- **Primary sidebar (Profile, My Projects, Playtests, Events, Collaborate, Feed) does not represent the product's actual feature set** (§3, §5) — the mismatch between "what's in nav" and "what's built" is the single largest IA problem found.
- **Devlogs have no dedicated top-level destination** — they exist only nested under a project, with no "all my devlogs across projects" or "devlogs from people I follow" view distinct from the general Feed. This may be intentional (devlogs are inherently project-scoped) but is worth a deliberate product decision rather than an accident of how the nav grew.

## 9. Discoverability Problems

- **Block/Mute/Report only reachable by visiting a target user's own profile page** — CODE VERIFIED, `app/dev/[username]/page.tsx` line 192. There is no notification-level or comment-level "report this" affordance found this pass, meaning the most likely moment a user wants to report content (right after seeing it) is not where the tool is offered.
- **Studios/Publisher/Jams reachable only via direct URL or a dashboard workspace card** — repeating §5/§8's finding here specifically as a discoverability issue: a feature that works but that a reasonable new user would not know exists.
- **Admin ban functionality exists and works in `app/actions/moderation.ts` (CODE VERIFIED, prior phase) but has zero UI callers** — the most severe discoverability finding in the product: a real, tested-capable moderation action that literally cannot be reached through any UI.

## 10. Responsive Problems

- **Dashboard workspace cards stack full-width vertically at 375px** (OBSERVED, mobile screenshot this session) — functionally fine (no overflow, no broken layout) but this is desktop-compressed rather than mobile-redesigned: the three-card IA problem from §5 is simply inherited at mobile width instead of being rethought (e.g., prioritizing one card, collapsing the others behind a single "more" affordance).
- **`/explore`'s dense grid was not specifically re-tested at 375/390/430/768/1024/1280/1440px this pass** — flagging this as untested rather than assuming it's fine, since the desktop view already showed content cut off at the viewport edge before scrolling (OBSERVED), which is exactly the kind of layout that can misbehave at intermediate breakpoints.

## 11. Accessibility Problems

- **Mobile drawer Escape-to-close now genuinely works** (fixed and verified this engagement, `AppShell.tsx`/`Landing.tsx`) — noted here as a positive, since an earlier pass in this same engagement had incorrectly claimed this worked before it actually did; the correction is preserved in `docs/full-product-audit-2026-09-15.md`.
- **Heading hierarchy fix (dashboard workspace card `<h3>`→`<h2>`) verified in a prior phase** — not re-broken as of this pass (CODE VERIFIED, `components/dashboard/DashboardClient.tsx`).
- **Icon-only social links on the profile page** (`GitHub`, `itch.io`, `Twitter/X`, `Website` — CODE VERIFIED, `app/dev/[username]/page.tsx` lines 216–229) do include visible text labels alongside the icons, which is correct and better than icon-only; no issue found here.
- **Disabled "Manage subscription" button relies on a `title` tooltip as its only explanation** (§7) — `title` attributes are not reliably exposed to screen readers or touch devices, which makes this both a discoverability and an accessibility gap for the same element.
- **A full keyboard-navigation/focus-order/contrast pass across the newly-touched surfaces (billing page, profile page with block/mute) was not conducted this specific session** — flagged as not independently re-verified this pass, distinct from claiming it's fine.

## 12. Content/UX Writing Problems

- **Generic empty-state copy** ("No data yet" variants, §6/§9) doesn't use game-development-specific language anywhere it could (e.g., "No devlogs yet — post your first update" vs. a fully generic placeholder).
- **Billing page's disclosure copy is a genuine strength worth calling out**: "Paid plans aren't open yet. Every core feature... is free for individual developers" (CODE VERIFIED, `app/dashboard/billing/page.tsx` line 73) is honest, specific, and avoids implying a feature that doesn't exist — this is exactly the kind of copy the "UI that lies" audit (§16) is looking for the *absence* of, and it's good practice worth extending to other incomplete features (studios, publisher shortlist) that currently have no equivalent disclosure.

## 13. Product Coherence Problems

- **Public pages (profile/devlog/project) use a heavier, more decorated "plasma" visual treatment; the authenticated dashboard uses a flatter, denser treatment** — this isn't necessarily wrong (public pages are Persuade/Experience-mode surfaces, the dashboard is Operate-mode, and different visual weight is defensible per-mode), but there's no shared visual anchor (a consistent header treatment, a consistent accent application) tying the two together as "the same product," which is worth a deliberate decision either way rather than an unexamined drift.

## 14. Design-System Inconsistencies

- **The "plasma" background panel markup is duplicated verbatim across at least two page files** (`app/dev/[username]/page.tsx` and `app/p/.../[devlog-slug]/page.tsx`) rather than extracted into a shared layout component — CODE VERIFIED, identical `fixed inset-y-0 right-0 w-[120vw] md:w-[70vw]...` blocks in both files. This is real technical/design debt: any future adjustment to this treatment requires editing it in every page that copied it, and inevitably one will be missed.
- **Rounded-corner radii are inconsistent across comparable containers**: `rounded-2xl` (billing cards), `rounded-3xl` (project card on profile), `rounded-[2.5rem]` (main page panels) all appear as "the card treatment" in different files without an evident rule for which radius applies when — CODE VERIFIED across the three files read this session alone.

## 15. Backend/UI Gaps

(Cross-referenced against, not copied from, `docs/glyph-product-completeness-audit.md` — independently re-confirmed via source reads this session where noted.)

- **Admin ban/unban functions** (`app/actions/moderation.ts`) — CODE VERIFIED to exist and be correct; CODE VERIFIED (prior phase grep) to have zero UI callers. Backend-only.
- **Email sending (`lib/email/*`)** — CODE VERIFIED to be a correct, complete Resend integration; CODE VERIFIED to have zero callers anywhere in `app/`. A user who is blocked, receives a comment, or gets a publisher contact today gets an in-app notification (fixed this engagement) but never an email, despite the email templates for exactly these cases already existing.
- **Studio member management** — CODE VERIFIED absence of invite/role/leave UI despite the studio and studio_members schema supporting it.
- **Publisher shortlist-add UI** — not located this pass; publisher dashboard and registration are confirmed working.

## 16. Misleading/Incorrect UI ("UI That Lies")

- **RESOLVED this engagement, noted for the record:** the billing page previously implied paid checkout was available via the pricing page's `?plan=` links with no disclosure that it wasn't — now fixed with an honest amber notice (§12). This was exactly the class of finding this section is designed to catch, and it's now a good example of the fix rather than an open item.
- **Disabled "Manage subscription" button** (§7, §11) is not exactly a lie — it doesn't claim to work — but a disabled control with only a hover-dependent explanation is closer to "silently broken" than "honestly unavailable" from a touch-device user's perspective. Worth tightening to match the amber-notice pattern already established on the same page.
- **No other claimed-vs-actual-behavior mismatches were newly identified this pass** in the surfaces read/tested this session (billing, profile, devlog post) — this is a narrower claim than "none exist in the product," since the full destructive-action-copy-vs-backend-behavior sweep across studios/jams/collaboration was not completed this specific session (see §26, "What Needs Development Next").

## 17. Missing UX States

- **No error/failure state was observed or tested this pass** for any of the three pages read/re-verified this session (billing, profile, devlog) — none were deliberately triggered (e.g., simulating a failed reaction insert) this specific pass, so this remains an open verification gap rather than a confirmed absence of error handling.
- **Draft-devlog state is handled and visually distinct** — CODE VERIFIED, `app/p/.../[devlog-slug]/page.tsx` lines 158–162, amber banner "Draft — only you can see this post," gated correctly to the owner (`isDraft && !isOwner` → `notFound()`). This is a good, specific example of a well-handled edge state worth preserving.

## 18. Feature-Specific UX Findings

- **Devlog post page (`[devlog-slug]/page.tsx`):** Well-structured — draft-gating, reactions, threaded comments (one level deep), footer navigation back to project and to author's profile. The `initials()` helper only takes the first character of the display name (line 22) rather than the two-initial pattern used elsewhere (`app/dev/[username]/page.tsx` line 18-25 takes up to two words) — a small, low-severity inconsistency between two avatar-fallback implementations that produce visibly different results (one-letter vs. two-letter initials) for the same user depending on which page renders their avatar.
- **Profile page (`[username]/page.tsx`):** Follow counts, follow button, and block/mute are all present and correctly gated (`currentUser && currentUser.id !== profile.id`, line 192) so a user never sees block/mute controls on their own profile. Current-project card correctly falls back to a dashed-border empty state when no primary project exists (lines 257–261) — better than the generic empty-state template used elsewhere, worth propagating that specific treatment (dashed border, muted text, no heavy icon) to other empty states as a lighter-weight alternative to the icon-square template.
- **Billing page:** Already discussed at length above; the strongest example in the product of honest, well-written disclosure copy for an incomplete feature.

## 19. Design Debt

- Duplicated "plasma" panel markup (§14).
- Inconsistent rounded-corner scale across card contexts (§14).
- Two different avatar-initials algorithms (§18).
- The identical empty-state template used everywhere, which is debt in the sense that it was clearly built once and reused without adaptation rather than designed per-context (§6, §9).

## 20. Recommended Fixes

**P0:** None identified this pass that rise to P0 (data loss, security, or complete inability to use a core feature) — the most severe items found (§9's admin-ban-has-no-UI, §15's email-never-sent) are real but are "feature incomplete," not "feature broken," so they're classified P1.

**P1:**
- Add real UI for Studios/Publisher/Jams/Admin to primary navigation, or deliberately gate them out of nav with a clear reason if they're staying unfinished (§3, §5, §8, §9).
- Link real discovery content from the landing page's own navigation (§3, §5).
- Give the dashboard's first-run state one prioritized action instead of three equal ones (§5).
- Reconcile the disabled "Manage subscription" button with the page's own honest-disclosure pattern (§7, §16).

**P2:**
- Differentiate empty-state copy/visuals per feature area (§6, §9, §12).
- Add a real activity/momentum signal to profiles (§5).
- Extract the duplicated "plasma" panel markup into a shared component (§14).
- Standardize the rounded-corner scale (§14) and the avatar-initials algorithm (§18).

**P3:**
- Consider surfacing block/mute/report from more contexts than just the profile page (§9).

## 21. Recommended Design-System Changes

Not prescribed in detail here — the companion research document (`docs/glyph-competitive-product-research.md` §27–§29) covers the visual-direction reasoning (density-by-context, momentum signal, surface hierarchy). This audit's job is to confirm those recommendations are grounded in real, observed problems (they are — §6, §14 above independently arrive at several of the same conclusions from the UX-audit side rather than the competitive-research side, which is a useful cross-check between the two documents).

## 22. Recommended Product-Experience Changes

- Finish and verify the playtester-side flow end to end — it's both the biggest untested gap and, per the companion research doc, the most differentiated flow in the product.
- Decide deliberately whether Studios is a near-term priority; right now it's neither finished nor removed, which is the worst of both options for discoverability and trust.
- Wire the existing, correct email infrastructure (`lib/email/*`) to at least the highest-value events (new comment, new reaction, publisher contact) so notifications reach users outside the app, not just in it.

## 23. Things That Are Already Working Well

- **The devlog reading/reacting/commenting experience** — draft-gating, threaded replies, reaction counts with per-user reacted state, and (as of this engagement) real notification delivery, all verified working end to end.
- **The project page's structural model** — badges, embedded live playtest CTA, devlog list — confirmed by the companion research document to be ahead of the closest direct competitor (itch.io) on structure.
- **Settings' sub-navigation pattern** — a genuinely good, reusable IA pattern that the rest of the product should be borrowing from, not something that needs fixing itself.
- **The billing page's honest disclosure copy** (post-fix) — a specific, positive example of how to handle an incomplete feature without misleading the user.
- **The profile page's current-project empty state** (dashed border, muted, no heavy icon) — lighter and better-suited to its context than the icon-square template used elsewhere.
- **Mobile drawer navigation**, including the now-genuinely-working Escape-to-close.

## 24. What Needs Development Next

**Broken:** Nothing newly found this pass rises to "broken" (functionally failing) in the three surfaces directly re-verified — billing, profile, devlog post all behave as coded.

**Incomplete:** Studio team management, jam host tools, publisher shortlist UI, admin ban UI, playtester-side flow (untested, possibly incomplete), devlog editing (per completeness audit, not re-verified this pass).

**Confusing:** Dashboard's three-equal-card first-run state; disabled billing button with only a tooltip explanation.

**Undiscoverable:** Studios/Publisher/Jams/Admin nav absence; block/mute/report only reachable from a profile page; admin ban functionality with zero UI path.

**Visually inconsistent:** Rounded-corner scale, duplicated plasma-panel markup, two avatar-initials algorithms, one generic empty-state template applied without adaptation everywhere.

**Technically incomplete:** Email notifications built but never triggered from any code path.

---

### Terminal Summary

- **Routes inspected this document:** 18 route groups (§3), cross-referencing the prior engagement's broader testing.
- **Workflows inspected:** 13 user journeys (§4).
- **UI/UX issues found:** 5 critical (§5) plus additional visual/interaction/content findings across §6–§7, §12.
- **Product issues found:** IA/navigation mismatch (§8), 3 discoverability gaps (§9), 4 backend/UI gaps (§15).
- **Accessibility issues found:** 1 open gap (disabled-button tooltip reliance), 1 area not independently re-verified this pass (full keyboard/contrast sweep on the three re-read surfaces); 2 prior-phase fixes confirmed still holding (Escape-key, heading hierarchy).
- **Responsive issues found:** 1 confirmed (dashboard cards desktop-compressed, not mobile-redesigned), 1 flagged as untested this pass (`/explore` at intermediate breakpoints).
- **Discoverability issues found:** 3 (§9), the most severe being admin-ban functionality with no UI path at all.
- **Design-system inconsistencies found:** 4 (§14, §18) — duplicated plasma markup, inconsistent radii, two avatar-initials implementations, one undifferentiated empty-state template.
- **Backend/UI gaps found:** 4 (§15) — admin ban, email notifications, studio membership, publisher shortlist.
- **Highest-impact findings:** the navigation/discoverability mismatch between Glyph's built feature set and its primary nav (§3, §5, §8, §9); the dashboard's unprioritized first-run state (§5); the still-unwired email notification system despite complete backend infrastructure (§15, §22).
- **Most important user journeys needing redesign, not just polish:** new-developer first action (§4, §5) and studio-owner team-building (§4, §13 of the companion research doc) — both are structural, not cosmetic.
- **Did the previous completeness audit miss significant problems?** No major new missing-feature was uncovered this pass — the completeness audit's inventory held up under re-verification of the three surfaces directly re-read this session. What this audit adds beyond that one is the *experience*-level framing: several things the completeness audit correctly marked COMPLETE (billing page, profile page, devlog page) still have real, specific UX problems (disabled-button discoverability, empty-state genericness, duplicated markup) that a feature-existence audit wouldn't surface. That distinction — "it's built" vs. "it's a good experience" — is exactly the gap this document was commissioned to check, and it was real in at least three concrete places (§5, §7, §14).
