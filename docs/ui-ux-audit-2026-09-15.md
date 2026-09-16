# Glyph UI/UX Audit

**Date:** 2026-09-15
**Method:** Live browser testing against `localhost:3000` (Next.js dev server), authenticated as a real seeded user ("Deep"), plus source inspection to confirm root causes and discover routes not linked from the UI. This is not a synthetic or assumed audit — every finding below was reproduced in the browser before being recorded.

**Scope actually covered:** Landing, full dashboard shell (`/dashboard`, `/dashboard/projects`, `/dashboard/playtests`, `/dashboard/projects/new`), `/settings`, `/feed`, `/notifications`, `/collaborate`, `/explore`, `/pricing`. Desktop and mobile (375px) viewports checked on the pages above.

**Scope NOT covered in this pass** (disclosed, not fabricated): `/admin/*`, `/search`, `/events`, `/jams/*`, `/playtests/browse`, `/publishers`, `/studios/*`, `/p/[username]/[slug]`, `/dev/[username]`, dashboard studio/publisher/billing/jam sub-flows, and any workflow requiring seeded data I don't control (creating a devlog, submitting to a jam, etc.). These need a follow-up pass — see **Remaining Issues**.

---

## Executive Summary

**Critical blockers:** One — the entire primary dashboard sidebar navigation was non-functional (every nav item, and several CTAs, pointed at `href="#"`). **Fixed in this pass.**

**Major UX problems:** The authenticated app has no persistent navigation shell outside the exact `/dashboard` route — every sub-page (`/dashboard/projects`, `/dashboard/playtests`, `/settings`, `/feed`, `/notifications`, `/collaborate`) renders as its own isolated card with no way back except browser Back or a small breadcrumb. Not fixed in this pass (architectural, see below).

**Visual/design problems:** The dashboard shell had the same generic-AI tells already fixed on the landing page (decorative glass-slice overlay, full-panel `backdrop-blur-2xl`, monospace-as-costume on labels) — duplicated instead of shared. Fixed for the dashboard shell in this pass; not yet checked on settings/other sub-pages.

**Responsive problems:** None found that broke layout in the pages actually tested (dashboard, landing, pricing, collaborate, notifications all held up at 375px). Not exhaustively tested across the unaudited routes.

**Accessibility problems:** Not deeply tested this pass beyond visible focus rings (present, from existing `:focus-visible` styles) and touch target sizing (44px minimum already enforced globally in `globals.css`). Keyboard-only traversal of the dashboard sidebar was not tested.

**Technical problems:** No console errors, no broken images, no hydration errors on any page actually visited. One `ReferenceError` observed was confirmed to be a stale HMR artifact from mid-edit, not a live bug (verified clean on a fresh tab).

**Polish opportunities:** Several — see P3 list.

---

## P0 Critical Issues

### P0-1: Dashboard sidebar navigation was completely non-functional
**Severity:** P0
**Route:** `/dashboard` (shell used by all authenticated pages via `DashboardClient`)
**Category:** Functional / Navigation
**Problem:** Every item in the primary sidebar nav (Profile, My Projects, Playtests, Events, Collaborate, Feed) was `<a href="#">`. Clicking any of them did nothing but jump to the top of the page. Same for the "New Project" button in the top bar, the "Browse Community" button on the welcome card, and all three empty-state "Get started →" links (Projects, Events, Collaborations).
**Evidence:** Read `components/dashboard/DashboardClient.tsx` — confirmed every interactive nav element used `href="#"` or a `<button>` with no `onClick`. Reproduced in browser: clicking "My Projects" before the fix kept the URL at `/dashboard`.
**Why it matters:** This is the primary navigation surface for every logged-in user. Nobody using the real app could reach Playtests, Events, Collaborate, or Feed from the dashboard, could not start a new project, and could not act on any empty-state prompt. This alone makes the authenticated product effectively unusable beyond the dashboard home screen.
**Recommended fix:** Wire real `href`s: Profile → `/dashboard`, My Projects → `/dashboard/projects`, Playtests → `/dashboard/playtests`, Events → `/events` (no dashboard-scoped events list exists — see P1-2), Collaborate → `/collaborate`, Feed → `/feed`. New Project → `/dashboard/projects/new`. Browse Community → `/explore`. Empty-state CTAs → their respective `/new` routes.
**Status: FIXED.** Sidebar now uses `next/link`, computes active state from `usePathname()`, all CTAs point at real routes. Verified by clicking through in the browser post-fix (My Projects correctly navigates to `/dashboard/projects` and highlights).
**Acceptance criteria:** ✅ Every sidebar item navigates to a real page. ✅ Active state reflects current route. ✅ "New Project," "Browse Community," and all three empty-state CTAs navigate correctly. ✅ `tsc --noEmit` clean.

---

## P1 Major Issues

### P1-1: No persistent navigation once you leave `/dashboard` itself
**Severity:** P1
**Route:** `/dashboard/projects`, `/dashboard/playtests`, `/settings`, `/feed`, `/notifications`, `/collaborate` (i.e., almost every authenticated page)
**Category:** UX / Information Architecture
**Problem:** `app/dashboard/layout.tsx` only performs an auth check and renders `{children}` — it supplies no shared shell. The sidebar with working navigation exists only inside `DashboardClient`, which is used exclusively by `app/dashboard/page.tsx`. Every other route under `/dashboard/*`, plus the sibling top-level authenticated routes (`/settings`, `/feed`, `/notifications`), builds its own tiny standalone card with, at best, a small breadcrumb ("Glyph° / Projects") and no way to jump directly to another section.
**Evidence:** Screenshotted `/dashboard` (full sidebar), then `/dashboard/projects`, `/dashboard/playtests`, `/settings`, `/feed`, `/notifications` — none of them show the sidebar. `/settings` has its own separate sub-nav (Profile/Account/Notifications/Danger Zone) that doesn't connect to the dashboard sidebar either. Confirmed via `find app/dashboard -name page.tsx` and reading `app/dashboard/layout.tsx`.
**Why it matters:** Once a user clicks into any dashboard feature, they lose the ability to move to a sibling feature without going back to `/dashboard` first (or using browser Back). This is a real navigation regression, not a cosmetic one — it will get worse as more of the app fills in.
**Recommended fix:** Extract the sidebar (`SidebarBody`) into a shared layout component and render it from `app/dashboard/layout.tsx` (and ideally a shared layout for `/settings`, `/feed`, `/notifications` too), so the shell is consistent everywhere and each page only supplies its content region. This is a real refactor touching the dashboard route group's layout plus removing the duplicate "no-nav" chrome each sub-page currently builds for itself.
**Status: NOT fixed in this pass** — this is a structural change bigger than a targeted patch, and I did not want to rush a shared-layout refactor without being able to verify every affected sub-page. Flagging clearly rather than doing a partial, unverified version of it.
**Acceptance criteria:** Sidebar (or equivalent persistent nav) is visible and functional on every authenticated route; active-state highlighting is correct on each.

### P1-2: Sidebar "Events" nav item has no dedicated destination
**Severity:** P1
**Route:** Dashboard sidebar
**Category:** Navigation / Missing feature
**Problem:** There is no `/dashboard/events` listing page — only `/dashboard/events/new` and `/dashboard/events/[id]/manage` exist (confirmed via `find app/dashboard/events`). "Events" in the sidebar now points at the public `/events` discovery page as the closest real destination, but that's not the same as "your upcoming events" that the dashboard welcome card's empty state promises.
**Evidence:** `find app/dashboard -name page.tsx` shows no `app/dashboard/events/page.tsx`.
**Why it matters:** The product implies a "my events" view exists (the dashboard home's "Upcoming Events" empty-state card), but there's nowhere for it to live yet.
**Recommended fix:** Build `/dashboard/events/page.tsx` listing the user's own hosted/RSVP'd events, or explicitly point both the sidebar and the empty-state card at `/events` with copy that makes clear it's the public directory, not a personal list.
**Status: Not fixed** — this needs a product decision, not a mechanical patch.

### P1-3: Duplicate, unshared "AI-generic" chrome in the dashboard shell
**Severity:** P1
**Route:** `/dashboard` (via `DashboardClient`)
**Category:** Visual Design / Consistency
**Problem:** The dashboard shell independently reimplemented the same patterns already identified and fixed on the landing page: a purely decorative glass-slice overlay div, `backdrop-blur-2xl` on the entire main panel (expensive, and the backdrop behind it is now a static gradient so the blur buys nothing), and monospace used as pure styling ("costume") on the avatar initial and profile-completion badges rather than for actual data.
**Evidence:** Read `components/dashboard/DashboardClient.tsx` before fixing — found the identical `linear-gradient(...) backdropFilter: blur(...)` triple-div overlay and `bg-white/95 backdrop-blur-2xl` pattern that were removed from `components/landing/Landing.tsx` earlier in this project.
**Status: FIXED** in this pass — removed the glass-slice overlay, dropped the panel to solid `bg-white`, added the shared grain texture (`bg-grain`) for consistency with the landing page, and removed costume-mono from the avatar badge and profile-field pills.
**Acceptance criteria:** ✅ No decorative blur-heavy overlay. ✅ Visual language matches the already-refined landing page. ✅ `tsc --noEmit` and `impeccable detect` both clean.

---

## P2 Issues

### P2-1: User's own account suggested as someone to follow
**Severity:** P2
**Route:** `/feed` (empty state)
**Category:** UX / Data correctness
**Problem:** The empty feed state ("Follow some developers to get started") lists 8 suggested profiles, one of which ("Deep patel") is the logged-in user's own seeded test account.
**Evidence:** Screenshot of `/feed` while logged in as "Deep" shows "Deep patel · @deeppatel" in the suggestion grid.
**Why it matters:** Suggesting a user follow themselves is a visible logic bug in whatever query powers "who to follow," not just a content issue.
**Recommended fix:** Exclude `auth.uid()` from the suggested-developers query.
**Status: Not fixed** — did not want to touch a data query without seeing its source and full call sites in this pass; flagging for a dedicated fix.

### P2-2: Inconsistent empty-state treatment across dashboard sub-pages
**Severity:** P2
**Route:** `/dashboard/projects` vs `/dashboard/playtests`
**Category:** Visual Design / Components
**Problem:** `/dashboard/projects`'s empty state has an icon, heading, description, and a filled pill CTA. `/dashboard/playtests`'s empty state is two lines of plain text with an inline link — a noticeably lower level of polish for the same conceptual state.
**Evidence:** Screenshots of both pages.
**Recommended fix:** Extract one shared `EmptyState` component (icon, title, description, primary action) and use it everywhere instead of each page hand-rolling its own.
**Status: Not fixed.**

---

## P3 Polish

- **P3-1:** The dashboard main panel still uses `max-w-352` like the landing page did before its gutter fix — worth checking at very wide viewports for the same dead-space issue found (and fixed) on the landing page. Not yet checked.
- **P3-2:** `/settings` has its own tab-style sub-nav (Profile/Account/Notifications/Danger Zone) that is visually and structurally disconnected from the main dashboard sidebar — once P1-1 is resolved, these two nav systems should be reconciled (e.g., Settings could be a sidebar destination rather than a fully separate shell).

---

## Visual Design Findings

Covered above under P1-3 (dashboard shell) and P2-2 (empty-state inconsistency). The landing page's visual issues (plasma gradient, gradient text, kicker pills, hero-metric template, fake devlog placeholder, generic typography, wasted gutter space) were already identified and fixed earlier in this project session, prior to this audit — not re-litigated here.

## UX Findings

- Dashboard navigation was fully broken (P0-1, fixed) and remains structurally inconsistent across sub-pages (P1-1, not fixed).
- Real workflows tested end-to-end: sign-in redirect (`/login` → `/dashboard` for an authenticated user, correct), opening the "New Project" form (renders correctly, real fields, sensible defaults like "Private by default"), navigating Collaborate (real seeded listings with tags, filters visible: All/Seeking/Available/Remote Only).
- Empty states across Projects, Playtests, Feed, and Notifications are present and mostly well-composed (not generic "coming soon" placeholders) — this is a genuine strength, not a finding against the product.

## Responsive Findings

Tested at 375px (mobile) and default desktop width for: landing, dashboard home, pricing, collaborate, notifications. No horizontal overflow, no clipped content, no broken grids found in the pages actually tested. The mobile hamburger menu opens on the landing page (verified earlier in this session); the dashboard's mobile drawer trigger was not successfully click-tested in this pass (coordinate/viewport-scaling mismatch in the test tooling, not a confirmed product bug) — needs a follow-up check.

## Accessibility Findings

Not deeply audited this pass. Known-good from existing code: global `:focus-visible` outline styling, 44px minimum touch targets on mobile (`globals.css`), `aria-label`/`aria-expanded` on the mobile menu toggle buttons. Not tested: full keyboard traversal of the dashboard sidebar, screen-reader semantics on empty/loading states, color contrast measurement (visual inspection only, no contrast-ratio tooling run).

## Technical / Runtime Findings

- No console errors, hydration errors, or broken assets on any page visited (landing, dashboard, projects, playtests, new-project form, settings, feed, notifications, collaborate, explore, pricing).
- The only console noise observed everywhere is a pre-existing, unrelated CSP block of a Vercel Analytics debug script (`va.vercel-scripts.com/v1/script.debug.js`) — not something introduced by this audit or its fixes, and not user-facing.
- One `ReferenceError: pathname is not defined` was observed once, mid-session, during active file editing. Verified on a fresh tab immediately after that it does not reproduce — it was a stale Hot Module Reload artifact from an in-progress edit, not a shipped bug.

## Navigation / Information Architecture Findings

Covered in P1-1 and P1-2. The core problem: the dashboard route group has no shared layout beyond an auth check, so navigation only exists on the exact `/dashboard` route. This is the single most important structural issue in the product right now.

## Changes Implemented

1. **Fixed dashboard sidebar navigation** (`components/dashboard/DashboardClient.tsx`): all nav items, "New Project," "Browse Community," and empty-state CTAs now use real `next/link` hrefs with correct active-state detection via `usePathname()`.
2. **Removed duplicate decorative chrome** from the dashboard shell: dropped the glass-slice overlay div, dropped `backdrop-blur-2xl` in favor of solid background (perf + consistency with the already-fixed landing page), added the shared grain texture, removed costume-monospace from the avatar initial and profile-completion badge pills.
3. Landing page hero spacing regression (reported by user screenshot at the start of this session) fixed: removed a duplicated top-padding stack that was pushing hero content far down and clipping the devlog card off-screen.

## Verification Results

- `npx tsc --noEmit` — clean, no errors, after every change in this pass.
- `impeccable detect --json` — zero findings on all touched files.
- Manually re-tested in browser after the sidebar fix: clicked "My Projects" from `/dashboard`, confirmed URL changed to `/dashboard/projects` and the destination page rendered correctly.
- Checked console on a fresh tab post-fix: zero errors (confirming the one `ReferenceError` seen mid-edit was not a real regression).
- Checked mobile viewport (375px) on the dashboard home post-fix: renders correctly, no overflow.

## Remaining Issues

- **P1-1** (no persistent nav outside `/dashboard`) — the single biggest remaining problem. Needs a shared layout refactor, not a quick patch.
- **P1-2** (no `/dashboard/events` page) — needs a product decision on scope before building.
- **P2-1** (self-follow suggestion bug) and **P2-2** (empty-state component duplication) — both real, both un-fixed, both bounded enough to tackle in a focused follow-up.
- **Unaudited routes**: `/admin/*`, `/search`, `/events`, `/jams/*`, `/playtests/browse`, `/publishers`, `/studios/*`, public profile/project pages, and every workflow requiring data I don't have seeded (creating a devlog, submitting a jam entry, publisher registration, admin moderation actions). None of these were visited in this pass — I'm not reporting on them because I did not test them, not because they're assumed fine.
- Accessibility (keyboard traversal, contrast ratios, screen-reader semantics) needs a dedicated pass with proper tooling, not the visual-only check done here.

---

## Summary

**What was broken:** The dashboard's entire primary navigation was dead (`href="#"` everywhere) — a real P0 that made the authenticated app unusable beyond the dashboard home screen. A landing-page hero spacing regression from earlier in this session was also present.

**What I fixed:** Wired every dashboard nav item and CTA to its real destination with correct active-state tracking; removed duplicated decorative/expensive chrome from the dashboard shell to match the already-refined landing page; fixed the hero spacing regression.

**What remains:** The bigger structural gap — no persistent navigation shell once you leave the exact `/dashboard` route — is identified with its root cause (`app/dashboard/layout.tsx` renders no shell) but not fixed; it needs a real layout refactor I didn't want to rush unverified. A missing `/dashboard/events` page, a self-follow suggestion bug, and empty-state component duplication are also documented but not fixed. Large parts of the app (admin, search, events, jams, playtests browse, publishers, studios, public profile/project pages) were not tested in this pass at all.

**Is localhost ready for another serious testing pass?** For the specific pages covered here — yes, meaningfully more so than before (navigation actually works now). For the product as a whole — no: the unaudited routes are the majority of the route list, and the persistent-navigation gap (P1-1) will keep surfacing as more surfaces get tested. The next pass should either fix P1-1 first, or explicitly test each remaining route through direct URL navigation (since in-app links to reach them mostly don't exist yet outside the fixed dashboard sidebar).
