# Glyph — Implementation Plan

**Date:** 2026-09-16
**Status:** Planning document only. No application code, migrations, or database state were changed to produce this. Every claim below was verified against the actual repository this session (six parallel read-only reconnaissance passes covering navigation/dashboard/design tokens, studios, playtesting, collaboration/publisher, project/profile/feed/explore/search, and notifications/email/jams/events/security), not carried over from prior summaries without re-checking.

**Correction made while writing this document, stated per the "report discrepancies, don't silently resolve them" instruction:** one of this session's own reconnaissance passes reported that only two files in the repo insert notification rows (`app/actions/publisher.ts`, `app/actions/collaboration.ts`), which would have meant the comment/reaction/follow notification wiring from a prior engagement phase had regressed. Direct verification (`grep -rn "from('notifications')" components/ app/`) shows this was a false gap caused by that recon pass's own grep scope being limited to `app/` and not including `components/`. The actual, verified state: six call sites insert notifications — `components/devlog/CommentThread.tsx` (comment + reply, two call sites), `components/devlog/ReactionsBar.tsx` (reaction), `components/social/FollowButton.tsx` (follow — not previously documented in this engagement), `app/actions/collaboration.ts` (mention/collaboration_post, reachable), and `app/actions/publisher.ts` (mention/publisher_contact — reachable from the *function's* authorization logic, but see §7, its only caller-route doesn't exist). Four of the five `notifications.type` enum values (`follow`, `comment`, `reply`, `reaction`) are wired and working; `mention` is wired for collaboration but effectively dead for publisher contact due to a missing route, not a missing notification call. The repository is **not** stale relative to the blueprint here — this session's own tooling was under-scoped, now corrected.

---

## 1. Executive Summary

Glyph's backend is substantially more complete than its UI exposes. Every core-loop table (projects, devlogs, playtests, collaboration, studios, publisher) has correct, tested RLS and largely-correct server actions. The gap between "built" and "usable" is concentrated in a small number of specific, nameable holes: three server actions that exist, are correctly authorized, and are never called by any UI (`updateApplicationStatus`, `addToShortlist`/`removeFromShortlist`, and `updateSessionStatus`'s accept/skip path is technically callable but has no button); one broken route (`/dashboard/publisher/contact/[id]` doesn't exist, so `contactDeveloper` — despite being correctly fixed in a prior phase — is unreachable); one broken link inside a working flow (`RequestSessionButton`'s feedback link points to a nonexistent `/playtests/[id]/test/new` instead of the real session-scoped route); one cosmetic-only counter (`playtest_requests.current_testers` is never incremented, so its own progress bar and `full` status are decorative); and studios being permanently single-member because no UI path exists to add a second one, despite the schema, RLS, and role enum all supporting it. None of this requires a redesign — it requires wiring existing plumbing to existing UI, in most cases just adding buttons that call functions that already exist and are already correctly authorized.

The visual/IA work the blueprint calls for (navigation, dashboard, empty states, radius scale) is real but secondary to this — and several pieces of infrastructure it assumed would need building already exist and are simply underused: `components/layout/PageShell.tsx` already exports a proper `EmptyState` component; `app/settings/layout.tsx` + `components/settings/SettingsNav.tsx` already establish the contextual sub-nav pattern the blueprint recommends generalizing. The plan below is ordered to finish the core loop first (Phase 1), then IA/navigation (Phase 2), then the dashboard (Phase 3), then the flagship object pages (Phase 4), then discovery (Phase 5), then the design system (Phase 6), then mobile (Phase 7), then polish (Phase 8) — matching the blueprint's own dependency reasoning, now grounded in exact files.

## 2. Current-State Implementation Map

| Surface | Classification | Key files |
|---|---|---|
| Auth, onboarding | COMPLETE AND REUSABLE | `app/(auth)/*`, `app/onboarding/page.tsx` |
| Profile CRUD | COMPLETE AND REUSABLE | `app/settings/profile/*`, `app/dev/[username]/page.tsx` |
| Project CRUD | COMPLETE AND REUSABLE | `app/dashboard/projects/*`, `components/dashboard/ProjectForm.tsx` |
| Devlog create/read/react/comment | COMPLETE AND REUSABLE | `app/p/.../[devlog-slug]/page.tsx`, `components/devlog/*` |
| Devlog edit | FRONTEND MISSING (per completeness audit, not re-verified this pass) | — |
| Follow + notification | COMPLETE AND REUSABLE | `components/social/FollowButton.tsx` |
| Search (FTS) | COMPLETE AND REUSABLE | `app/search/page.tsx`, `supabase/migrations/006_search_fts.sql` |
| Feed | NEEDS STRUCTURAL CHANGE (works, but devlogs-only, no other loop-event types) | `app/feed/page.tsx`, migration `004_follows_feed.sql` |
| Explore | NEEDS VISUAL CHANGE (works, recency-ordered already, just no filters/featured-surfacing) | `app/explore/page.tsx` |
| Playtesting — requester side | PARTIAL (works for create/view; no accept/skip UI, no feedback-viewing UI) | `app/dashboard/playtests/*`, `app/actions/playtests.ts` |
| Playtesting — tester side | BROKEN (signup works; feedback-link bug blocks the direct path; accept/skip UI absent blocks the normal path entirely) | `components/playtests/RequestSessionButton.tsx`, `app/playtests/[id]/page.tsx` |
| Collaboration — post/apply | COMPLETE AND REUSABLE | `app/collaborate/*`, `app/actions/collaboration.ts` |
| Collaboration — applicant review | FRONTEND MISSING (backend ready, zero UI callers) | `app/actions/collaboration.ts:93` (`updateApplicationStatus`), `app/collaborate/[id]/page.tsx` |
| Studios — create/manage/projects | COMPLETE AND REUSABLE | `app/dashboard/studios/*`, `app/actions/studios.ts` |
| Studios — team membership | FRONTEND MISSING (schema/RLS ready, zero write-path UI beyond bootstrap self-insert) | `components/studios/StudioManageClient.tsx`, `supabase/migrations/012,018,019` |
| Publisher — registration/dashboard | COMPLETE AND REUSABLE | `app/dashboard/publisher/*`, `app/actions/publisher.ts` |
| Publisher — contact developer | BROKEN (function correct; calling route doesn't exist) | `app/publishers/page.tsx:66`, missing `app/dashboard/publisher/contact/[id]/page.tsx` |
| Publisher — shortlist add | FRONTEND MISSING (create/view works; add-item has no UI) | `app/actions/publisher.ts:55-102`, `components/publisher/PublisherDashboardClient.tsx` |
| Jams — full loop | COMPLETE AND REUSABLE, with one flagged gap | `app/jams/*`, `app/dashboard/jams/new/page.tsx`, `app/admin/jams/page.tsx` |
| Jams — self-vote prevention | BROKEN (dead-code filter always returns false; no enforcement anywhere) | `app/jams/[slug]/vote/page.tsx:44-49`, `components/jams/JamVoteClient.tsx` |
| Events | COMPLETE AND REUSABLE | `app/events/*`, `app/dashboard/events/*` |
| Notifications (in-app) | PARTIAL (4/5 types wired and working; `mention` for publisher unreachable; no entity-link resolution in UI) | `app/notifications/page.tsx`, six insert call sites listed above |
| Notifications (email) | BACKEND MISSING integration (templates/sender exist, zero callers) | `lib/email/*` |
| Admin moderation (ban/unban) | FRONTEND MISSING (per completeness audit — not re-verified this specific pass) | `app/actions/moderation.ts` |
| Admin featured listings | PARTIAL (Stripe webhook writes; admin can view; nothing on the public site reads it) | `app/api/webhooks/stripe/route.ts`, `app/admin/featured/page.tsx` |
| Billing | COMPLETE AND REUSABLE (honestly discloses no real checkout) | `app/dashboard/billing/page.tsx` |
| Navigation (AppShell) | NEEDS STRUCTURAL CHANGE | `components/dashboard/AppShell.tsx` |
| Dashboard | NEEDS STRUCTURAL CHANGE | `app/dashboard/page.tsx`, `components/dashboard/DashboardClient.tsx` |
| Design tokens/shared components | NEEDS SYSTEM CHANGE (EmptyState/PageShell already exist and are underused; no Button/Input/Dialog primitives exist at all) | `app/globals.css`, `components/layout/PageShell.tsx`, `components/ui/Badge.tsx` |

## 3. Core-Loop Gap Analysis

| Loop step | Current implementation | Gap | Files | DB impact | UI impact | Test required |
|---|---|---|---|---|---|---|
| Developer → Project | Full CRUD, `is_primary` flag exists and is used on profile/onboarding | None found | `app/dashboard/projects/*` | None | None | Regression only |
| Project → Devlog | Full create/read; edit missing (per completeness audit) | Edit UI | `app/dashboard/projects/[id]` (assumed location, verify on implementation) | None | New edit form | Owner-only auth test |
| Devlog → Discovery | Feed (follows-only), Explore (recency), Search (FTS) all functional | Feed is devlog-only; no milestone/playtest/collab events surfaced | `app/feed/page.tsx`, migration `004` | Possible view/query extension, no new tables needed | Feed item type filter | Multi-account follow test |
| Discovery → Follow | `FollowButton.tsx` works, inserts `notifications` (`type:'follow'`) | None found | `components/social/FollowButton.tsx` | None | None | Two-account follow/notify test |
| Devlog → Feedback (comment/reaction) | Fully working, notification-wired | None found | `components/devlog/CommentThread.tsx`, `ReactionsBar.tsx` | None | None | Two-account comment/react test |
| Project → Playtest signup | Signup works (`requestPlaytestSession`); accept/skip has no UI; feedback-link bug in `RequestSessionButton` | Accept/skip UI, feedback link fix, `current_testers` increment, requester feedback view, withdraw action | `app/actions/playtests.ts`, `components/playtests/RequestSessionButton.tsx`, `app/dashboard/playtests/page.tsx`, `app/playtests/[id]/page.tsx:42` (dead `isOwner`) | No schema change — existing columns unused, not missing | New buttons + link fix | Two-real-account playtest signup→accept→feedback test |
| Project → Collaboration post/apply | Fully working, notification-wired | Applicant accept/reject UI missing | `app/collaborate/[id]/page.tsx`, `app/actions/collaboration.ts:93` (`updateApplicationStatus`, unused) | None — reuse existing action | New Accept/Reject buttons | Two-account apply→accept test |
| Developer → Studio → Project | Studio creation/project-attach works; membership stuck at 1 | Invite/role-change/remove/leave UI + server actions | `app/actions/studios.ts`, `components/studios/StudioManageClient.tsx` | Possibly one new server action per operation; schema/RLS already support it (see §9) | New team-management panel | Owner/admin/member/non-member/anonymous RLS matrix (see §17) |
| Project → Publisher contact | `contactDeveloper` correct but unreachable — no calling route | Build `app/dashboard/publisher/contact/[id]/page.tsx` (or equivalent) | `app/publishers/page.tsx:66`, `app/actions/publisher.ts:113-155` | None | New contact form page | Publisher→developer contact + notification test |
| Publisher → Shortlist | Create/view works; add-item has no UI | Add/remove-from-shortlist controls | `app/actions/publisher.ts:55-102`, `components/publisher/PublisherDashboardClient.tsx` | None | New "Add to shortlist" control on project/explore cards | Publisher-role-only auth test |
| Any event → Notification → Email | In-app notification works for 4/5 types; email infra unwired | Wire `sendEmail` calls into the 4 working insert sites (or a subset — see §14 for which are highest-value) | `lib/email/index.ts`, the 4 working insert call sites | None | None (background call) | Email-stub console-log verification in dev; real send in a test environment before relying on it |

## 4. Navigation Implementation Plan

**CURRENT NAV** (`components/dashboard/AppShell.tsx`, `NAV_ITEMS` lines 19-26): Profile→`/dashboard`, My Projects→`/dashboard/projects`, Playtests→`/dashboard/playtests`, Events→`/events`, Collaborate→`/collaborate`, Feed→`/feed`. No account/context menu exists; no project/studio switcher exists. Mobile drawer works correctly (Escape, backdrop, body-scroll-lock, close-on-nav-click all confirmed present in `AppShell.tsx` lines 112-171).

**PROPOSED NAV** — per the blueprint's own instruction (echoed by the user) not to lock the exact 5-item combination without testing: implement the primary/context-switcher split, but ship Playtesting and Collaboration as **two separate primary nav items initially**, not pre-merged into one tabbed destination. Reasoning: merging them is the one part of the blueprint explicitly flagged as original synthesis with no competitor precedent; the current implementation already has them as two fully separate, differently-shaped surfaces (`/dashboard/playtests` is a two-section authenticated dashboard view, `/collaborate` is a public browse-with-filters page) — collapsing them into tabs is a bigger, riskier structural change than the evidence justifies at this stage. Recommended primary set for a first implementation pass, ordered by loop-tier (§4 of the blueprint):

1. Dashboard → `/dashboard`
2. My Projects → `/dashboard/projects`
3. Feed → `/feed`
4. Explore → `/explore`
5. Playtesting → `/dashboard/playtests`
6. Collaboration → `/collaborate`

This is 6 items, one more than the blueprint's proposed 5 — flagged explicitly as **NEEDS PRODUCT DECISION**: ship 6 now (lower-risk, no premature merge) and revisit merging Playtesting+Collaboration only if real usage/testing shows the sidebar is too crowded. Do not merge preemptively.

**Context switcher** (new — render inside the existing account block at `AppShell.tsx` lines 71-87, replacing the current static avatar+name+sign-out with a dropdown/menu): "My Studios" → `/dashboard/studios` (route currently doesn't exist — see §9, must be created as part of this phase), "Publisher Tools" → `/dashboard/publisher` (role-gated: only render if a `publisher_accounts` row exists for the user, or always render and let the existing register-prompt handle the empty case — recommend the latter, since it's already the existing page's behavior and avoids an extra query in the nav-render path), "Game Jams" → `/jams`, "Admin" → `/admin` (role-gated via existing `admin_users` lookup, reuse the pattern already used in `app/admin/featured/page.tsx:11-12`).

**CONFLICTS:**
- No `app/dashboard/studios/page.tsx` (list) exists — the context switcher's "My Studios" link needs a destination. Build it as part of Phase 1 studio work (§9), or point it at `app/dashboard/studios/new/page.tsx` as an interim if the user has no studio yet, redirecting to `[slug]` if they do (mirroring the existing redirect logic already in `app/dashboard/studios/new/page.tsx`).
- Adding a role-gated "Admin" link requires a query (`admin_users` lookup) on every authenticated page render if placed in `AppShell` itself; recommend fetching this once in `lib/dashboard/identity.ts`'s `getSidebarIdentity()` (already the shared identity-fetch used by `AppShell`-wrapping pages) and passing an `isAdmin` boolean down, rather than querying inside the nav component itself.
- The creation-action menu ("+", per blueprint §7) has no current analog — `DashboardClient.tsx`'s "New Project" button (lines 58-65) is the only existing creation entry point in the top bar. Implementing the full menu (New Project / New Devlog / New Playtest Request / New Collaboration Post) requires each target route to accept being linked from a generic entry point; verify `/dashboard/projects/new`, a devlog-creation route (locate this — not covered by this session's recon; likely nested under a specific project, meaning "New Devlog" from a generic top-level menu needs a project-picker step first), `/dashboard/playtests/new`, `/collaborate/new` all work standalone. Flag devlog creation's project-scoping as **NEEDS RESEARCH** before implementing the generic creation menu.

**IMPLEMENTATION WORK:** modify `NAV_ITEMS` in `AppShell.tsx`; replace the static account block (lines 71-87) with a dropdown component (new, e.g. `components/dashboard/AccountMenu.tsx`); extend `getSidebarIdentity()` in `lib/dashboard/identity.ts` to also return `isAdmin`/`isPublisher`/`studioSlug` (or null) so the nav can render conditionally without extra queries per nav render; create `app/dashboard/studios/page.tsx`.

**TEST PLAN:** verify every existing route under `/dashboard/studios`, `/dashboard/publisher`, `/jams`, `/admin` is still reachable directly by URL (regression — nothing should be removed, only indexed); verify the context switcher correctly hides Admin for non-admin users and shows the register-prompt (not a broken publisher dashboard) for users without a publisher account; verify mobile drawer still closes correctly with the new items added (re-run the existing Escape/backdrop/scroll-lock checks, since `NAV_ITEMS` length changing could affect layout but shouldn't affect the tested interaction logic).

## 5. Dashboard Implementation Plan

**Current exact state** (`app/dashboard/page.tsx` + `components/dashboard/DashboardClient.tsx`): three parallel count-only queries (`projects` count, `events` count, `collaboration_posts` count where `status='open'`) — no query for a specific "current project," despite `is_primary` existing and being used elsewhere (`app/dev/[username]/page.tsx:63`, `app/dashboard/projects/page.tsx`). `DashboardClient.tsx` renders: header ("Welcome back, {firstName}." + two links), a conditional profile-completion banner, and exactly three workspace cards (Projects/Events/Collaborations) via a `workspaceCards()` function (lines 7-34) — Projects branches its CTA based on `projectCount` (view vs. create), but Events and Collaborations always show the same "create new" CTA regardless of existing count (a real asymmetry bug, not just a design smell — a user with 3 open collab posts sees "Post a role" with no way to view their existing ones from this card).

**Implementation spec, replacing the current query set in `app/dashboard/page.tsx`:**

1. **Current project + latest devlog** — new query: `projects.select('*').eq('owner_id', user.id).eq('is_primary', true).maybeSingle()`, then `devlog_posts.select('*').eq('project_id', project.id).order('published_at', {ascending:false}).limit(1).maybeSingle()`. If no primary project, fall back to most-recently-updated project (`order('updated_at', {ascending:false}).limit(1)`) — do not leave this section blank for a user with any project, only for a user with zero.
2. **Activity on your work since last visit** — new query pattern: reuse the `notifications` table already scoped to `recipient_id = user.id`, filtered to unread (`read_at is null`) and recent (`created_at desc limit 10`) — this is the correct, already-existing data source (no new table needed), just a new query location (currently only queried in full in `app/notifications/page.tsx`).
3. **Followed activity teaser** — reuse the existing `feed_items` view query pattern from `app/feed/page.tsx:57-62`, limited to 3-5 items instead of 50, as a compact module linking to `/feed`.
4. **One dynamic next action** — new logic function (e.g. `lib/dashboard/nextAction.ts`), deriving from already-available data: no project → "Start a project"; project but zero devlogs → "Post your first update"; project with stale-most-recent-devlog (define a threshold, e.g. >14 days, flagged **NEEDS PRODUCT DECISION**) → "Post an update"; open playtest with zero signups → "Share your playtest request"; pending collaboration applications → "Review applicants" (once §7's review UI exists); otherwise → a lower-urgency default (e.g. "Explore the community"). This is the component most explicitly required by the blueprint (§8) to be state-driven, not static.
5. **Level-3 module** — small, low-weight list of studio/jam/publisher activity, only rendered if the user actually has any (studio membership, jam entry, publisher account) — do not render an empty Level-3 module for users with none of these.

**Enumerated dashboard states and their hierarchy/CTA** (per the user's request, derived from the actual queries above, not invented):

| State | Hierarchy shown | Primary CTA |
|---|---|---|
| New user, no project | Next-action module only, everything else empty/collapsed | "Start a project" → `/dashboard/projects/new` |
| Project, no devlog | Project card (empty devlog state) + next-action | "Post your first update" |
| Active project (recent devlog) | Full hierarchy: project+devlog, activity, followed teaser | Contextual (varies) |
| Stale project (old last devlog) | Full hierarchy, next-action nudges toward posting | "Post an update" |
| Open playtest, zero signups | Playtest status surfaces in activity/next-action | "Share your playtest request" |
| Open playtest, active signups | Activity module shows signup count | Link to `/dashboard/playtests` |
| Open collab post | Surfaces in activity if applications exist | "Review applicants" (post-§7) or "View your post" |
| Pending collab applications | Elevated in next-action priority | "Review applicants" |
| Studio owner | Level-3 module shows studio activity | N/A (secondary) |
| Publisher | Level-3 module shows publisher activity | N/A (secondary) |
| Multiple projects | Current-project card shows primary/most-recent only, with a "switch project" affordance (new — not currently possible anywhere) | N/A |
| No followed users | Followed-activity teaser replaced with the existing suggested-developers fallback already built for empty Feed (`app/feed/page.tsx:69-77`) — reuse, don't rebuild | "Explore developers" |
| Active followed users | Followed-activity teaser populated | Link to `/feed` |

**Explicitly not to add:** any percentage/streak/score. The "activity" module is literally the `notifications` table scoped and limited — a real data source, not an invented metric.

## 6. Project/Profile/Devlog Implementation Plan

**Project page** (`app/p/[username]/[project-slug]/page.tsx`, 269 lines) — current order confirmed: top bar → header/stage-badge → meta badges → external links → long description (`MarkdownRenderer`) → screenshots grid → open-playtest link-card → devlog grid (`DevlogCard`, limit 50) → footer. **Exact changes:**
- Add a "current state" line directly under the header (latest devlog title+date), reusing the same query already run for the devlog grid (`devlog_posts` limit 50, lines 58-66) — just surface the first item's title/date near the top too, no new query needed.
- Add a team/studio section: requires a new query joining `studio_projects` → `studios` (currently absent — the page query at lines 45-50 has no studio join at all). Only render if a `studio_projects` row exists for this project.
- **What must be preserved:** the structured badge model (stage/engine/genre), the embedded playtest link-card, the devlog grid via `DevlogCard` — all confirmed working and specifically called out as strengths in prior audits and the blueprint. Do not replace these with free-text or a different card component.
- Community/comments section: confirmed this session that comments live only on the devlog page, not the project page itself — the blueprint's §10 hierarchy lists "community" as a project-page section; this is a genuine gap to decide on (**NEEDS PRODUCT DECISION**: add an aggregate comment-count/recent-activity strip to the project page, or leave comments devlog-scoped only, which is arguably correct given the core-loop's devlog-centric model in §1 of the blueprint).

**Profile page** (`app/dev/[username]/page.tsx`, 273 lines) — confirmed no recent-devlog/last-active element exists anywhere in the file. **Exact change:** add one new query — `devlog_posts.select('title, published_at, project_id, projects(title, slug)').eq('project_id', primaryProject.id) ...order(published_at desc).limit(1)` (or across all the user's projects if no primary project exists) — and render it directly under the "Current Project" card (after line 262) as a small "Last posted: {title}, {relative date}" line. This is the single highest-priority profile change identified across every audit this engagement.

**Devlog page** (`app/p/.../[devlog-slug]/page.tsx`, 243 lines) — confirmed no next/prev navigation exists (only the single-post query at lines 57-62). **Exact change:** add a sibling query — `devlog_posts.select('slug, title').eq('project_id', project.id).order('published_at')`, then compute prev/next from the current post's position — render as two small footer links alongside the existing "More devlogs from {project}" link (lines 224-237). Low priority relative to the profile activity-signal gap; bundle into the same implementation pass as a low-risk addition.

**What must be preserved across all three:** draft-gating logic (devlog page lines 158-162, 66-67), the reaction/comment notification wiring (already correct), the "plasma" background treatment (kept per the blueprint, only its markup duplication is a system-layer fix, not a removal — see §12).

## 7. Playtesting Completion Plan

Do not redesign — the schema/RLS/action layer is structurally correct (confirmed this session). Finish exactly these pieces, in this order:

1. **Fix `RequestSessionButton`'s broken feedback link** (`components/playtests/RequestSessionButton.tsx:45`): it hardcodes `/playtests/${requestId}/test/new`, which doesn't resolve (no `app/playtests/[id]/test/new/page.tsx` exists; the real route is `test/[session-id]`). Fix: the component needs the session's own id, which it currently doesn't receive as a prop — trace where `RequestSessionButton` is rendered and thread the session id through, or have it fetch the just-created session id from `requestPlaytestSession`'s return value (currently likely returns void/redirects — verify and adjust to return the new session id if needed).
2. **Add accept/skip UI** on `app/dashboard/playtests/page.tsx` next to each tester's session (currently read-only status badges, lines ~93-103 per recon) — wire to the already-correct, already-authorized `updateSessionStatus` action (`app/actions/playtests.ts:74-88`). This is the single highest-priority playtesting fix: without it, no tester can ever legitimately reach `accepted` status, which blocks `submitPlaytestFeedback` (requires `status==='accepted'`, action line 103) for every real user, not just a UI inconvenience.
3. **Add requester-facing feedback display** — `app/dashboard/playtests/page.tsx` currently only checks feedback *existence* to decide whether to show a "Submit feedback →" link; it never renders `ratings`/`text_responses`. Add a feedback-detail view (new component, e.g. `components/playtests/FeedbackDetail.tsx`) rendering the jsonb `ratings`/`text_responses` fields for the request author.
4. **Increment `current_testers` and flip `status` to `full`** inside `requestPlaytestSession` (`app/actions/playtests.ts:50-72`) — currently never touched by any write path; the progress bars and "full" badges shown in `app/playtests/browse/page.tsx` and elsewhere are decorative. Add an UPDATE on `playtest_requests` inside the same transaction/flow as the session insert.
5. **Add a withdraw/cancel action** — no `withdraw`/`cancel` function exists anywhere; add one (e.g. `withdrawPlaytestSession(sessionId)`) with tester-only authorization mirroring `submitPlaytestFeedback`'s pattern, and a corresponding UI control.
6. **Remove the dead `isOwner` variable** (`app/playtests/[id]/page.tsx:42`) — compares a UUID to a username string, always false, unused; low-risk cleanup, bundle with item 1's fix in the same file area.
7. **Notification wiring** — none of the playtest actions currently insert into `notifications` (confirmed — zero matches in `app/actions/playtests.ts`). Add inserts at signup (`type` would need to be added to the existing enum — see §16, this requires a migration since the current `notifications.type` check constraint only allows `follow|comment|reply|reaction|mention`) and at feedback submission. Flag as **NEEDS PRODUCT DECISION**: extend the enum with a migration (e.g. add `playtest_signup`/`playtest_feedback`) vs. reuse `mention` generically the way collaboration/publisher currently do. Recommend extending the enum — reusing `mention` for semantically different events already makes the notification list's copy generic (`notifLabel()` can't currently distinguish a collaboration application from a publisher contact, both render as `mention`).

## 8. Collaboration Completion Plan

Backend fully ready; this is the lowest-risk, highest-leverage fix in the entire plan. `updateApplicationStatus(applicationId, status)` (`app/actions/collaboration.ts:93-110`) already correctly verifies `post.author_id === user.id` before allowing a status change — it just has zero callers. **Exact work:** in `app/collaborate/[id]/page.tsx` (lines ~109-126, currently read-only application list for the post author), add Accept/Reject buttons per pending application, each calling `updateApplicationStatus(app.id, 'accepted' | 'rejected')`. Also wire the already-existing, already-unused `closeCollabPost(postId)` (`app/actions/collaboration.ts:112-119`) to a "Close this post" control on the same page for the author. No schema change, no new server action, no new authorization logic — purely a missing UI layer on top of a complete backend. Notification-on-accept/reject is not currently wired (only notification-on-apply exists) — flag as a natural follow-on once the buttons exist, same enum-extension consideration as §7 item 7.

## 9. Studio Completion Plan

The largest genuine functional gap in the product. Current state (confirmed this session): `createStudio` auto-inserts the creator as `owner`; no other write path into `studio_members` exists anywhere in the codebase, though RLS (`studio_members_insert`, migration `019`, final form) explicitly supports two more cases: (a) self-insert when the studio currently has zero members (`not studio_has_members(studio_id)`), and (b) an owner/admin inserting any other user (`is_studio_member(studio_id, ['owner','admin'])`). Case (b) is exactly "invite a member" but nothing in the app calls it.

**Do not invent new roles** — reuse the existing `owner`/`admin`/`member` enum already in the schema (`studio_members.role`, migration `012`).

**Implementation plan:**
1. **Add an `inviteStudioMember` server action** (new, `app/actions/studios.ts`) — inputs: `studioId`, either a `username` or `userId` to invite, and a `role` (default `member`). Authorization: caller must pass `is_studio_member(studioId, ['owner','admin'])` — reuse the pattern already established in `updateStudio`/`addStudioProject` (lines 82-88, 119-120 per recon). This inserts into `studio_members` via RLS case (b) above — no RLS change needed, the policy already permits it.
2. **Add `removeStudioMember(studioId, userId)`** — same owner/admin authorization; deletes from `studio_members`. RLS `studio_members_delete` (migration `018`) already permits `auth.uid() = user_id OR is_studio_member(studio_id, ['owner','admin'])` — covers both "remove someone else" and the next item.
3. **Add `leaveStudio(studioId)`** — a thin wrapper (or the same `removeStudioMember` called with the caller's own id) — RLS already permits self-delete via the same policy. Guard against the last owner leaving without transferring ownership first (application-level check, since RLS doesn't enforce business rules like "a studio must always have an owner").
4. **Add `updateMemberRole(studioId, userId, newRole)`** — owner/admin authorization; updates `studio_members.role`. No existing UPDATE policy is listed for `studio_members` in migrations 012-021 (only SELECT/INSERT/DELETE were touched) — **this requires a new migration** adding a `studio_members_update` RLS policy, scoped to `is_studio_member(studio_id, ['owner','admin'])` with a matching `WITH CHECK`, following the exact lesson from migration `021` (an UPDATE policy without `WITH CHECK` is a real, previously-exploited bug class in this codebase — do not repeat it).
5. **UI**: extend `components/studios/StudioManageClient.tsx`'s currently-read-only "Team Members" section (lines ~146-161) with: an invite form (username/user lookup + role select, owner/admin only), a role-change control per member (owner/admin only, cannot demote the last owner), a remove button per member (owner/admin only, cannot remove the last owner), and a "Leave studio" button for the current user's own row (hidden for the sole owner unless ownership-transfer is implemented — flag transfer-of-ownership as **NEEDS PRODUCT DECISION**, out of scope for a first pass; simplest correct behavior is to block the last owner from leaving/being removed until at least one other owner exists).
6. **Build `app/dashboard/studios/page.tsx`** (currently doesn't exist) — list the user's studio memberships (query `studio_members` where `user_id = auth.uid()`, joined to `studios`), needed both for the nav context-switcher (§4) and as the natural landing page before drilling into a specific `[slug]`.

**Test matrix for every membership action** (owner/member/non-member/other-user/anonymous — per the task's explicit requirement): see §17's consolidated matrix; the studio-specific rows are the most security-sensitive in this entire plan given the documented history of RLS exploits in this exact table (migrations 017-019), so implement and test each action's RLS behavior via the `set local role authenticated; set local request.jwt.claims ...` role-impersonation pattern established in the prior engagement's RLS fix, inside a rolled-back transaction, before writing any UI against it.

## 10. Publisher Completion Plan

Two gaps, both narrow:
1. **Build the missing contact route** — `app/publishers/page.tsx:66` links to `/dashboard/publisher/contact/[id]` which doesn't exist. Create `app/dashboard/publisher/contact/[id]/page.tsx` (server component, `[id]` = developer id) rendering a message form that calls the already-correct `contactDeveloper(developerId, message)` (`app/actions/publisher.ts:113-155`). No changes needed to the action itself. Minor secondary fix noted by recon: the notification insert at lines 138-145 sets `entity_id: publisher.id` rather than the new `publisher_contacts` row's own id (the insert doesn't `.select()` the created row) — fix by adding `.select().single()` to the insert and using the returned row's `id`, so the notification can eventually deep-link to the specific message once notification entity-linking is built (§16).
2. **Add shortlist-add UI** — `addToShortlist`/`removeFromShortlist` (`app/actions/publisher.ts:55-102`) are correctly authorized and completely unused. Add an "Add to shortlist" control (new small component, e.g. `components/publisher/AddToShortlistButton.tsx`) rendered on project cards when viewed by a user with a `publisher_accounts` row — likely on `/explore` project cards and/or the project page itself, gated to publisher-role users only. Do not expand shortlist functionality beyond add/remove (no new shortlist features, per the explicit "don't expand publisher functionality beyond the existing model" instruction).

## 11. Feed/Explore/Search Plan

**Feed** (`app/feed/page.tsx`) currently queries only the `feed_items` view (devlogs from follows, chronological, migration `004`). Per the blueprint's Feed Model (§12) recommending playtest/collaboration activity also appear: this requires either extending the `feed_items` view (a migration) or a separate query unioned client-side. Recommend a migration extending the view (or adding a second view) to include playtest-signup and collaboration-application events scoped to followed users' projects — flagged **NEEDS PRODUCT DECISION** on exact scope (all playtest/collab activity on followed projects, or only activity a user directly participated in) before writing the migration. Do not add algorithmic ranking — keep strictly chronological, per both the blueprint and this plan's explicit "do not build" list (§18).

**Explore** (`app/explore/page.tsx`) is already recency-ordered with no artificial trending algorithm — confirmed this session, no change needed to its ordering logic. The one real gap: `featured_listings` (written only by the Stripe webhook) is never read anywhere on the public site — confirmed this session that a purchased featured listing currently has zero visible effect. Exact fix: add a query in `app/explore/page.tsx` for active `featured_listings` (`ends_at >= now()`) and surface those entities in a distinct top section — this is a real, currently-broken paid-feature promise (a user can pay for featured placement via Stripe and it does nothing), arguably higher priority than most visual-polish items in this plan given it's a monetization-integrity issue, not just a UX one.

**Search** (`app/search/page.tsx`) — confirmed functional, FTS-based, no separate API route (logic lives in the page itself). No structural change recommended; blueprint's §13 explicitly endorses keeping this model rather than building a heavier filter system.

## 12. Design-System Consolidation

Corrected understanding from this session's recon (important: some of what earlier audits implied needed to be *built* already exists and is instead under-adopted):

- **`EmptyState` already exists** (`components/layout/PageShell.tsx`) — icon chip + title + description + optional action. The "one generic empty state everywhere" finding from the prior UX audit is therefore not "no EmptyState component exists," it's "the existing one either isn't used consistently, or is used with generic per-instance copy." **Exact fix:** audit every empty-state call site (dashboard cards, playtests, events, explore-when-empty) and ensure each passes feature-specific `title`/`description` text rather than a shared generic string — likely a copy-only change in most call sites, not a new component.
- **No shared `Button`/`Input`/`Dialog` exists at all** — `components/ui/` contains only `Badge.tsx`. Every button in the codebase is a hand-styled `<button>`/`<Link>` with inline Tailwind, duplicated per file. **Recommend building a minimal `Button` component first** (variants: primary/secondary/ghost/destructive, matching the existing visual styles already in use so this is a consolidation, not a redesign) — this is the single highest-leverage design-system addition, since it touches every page.
- **Radius scale**: current census (repo-wide) — `rounded-full`(178, avatars/pills, fine as-is), `rounded-2xl`(91), `rounded-xl`(71), `rounded-3xl`(29), `rounded-[2.5rem]`(12, outer showcase panels), plus a handful of one-off arbitrary values (`[2rem]`, `[22px]`, `[1.75rem]`, each used once). Recommend collapsing to: `rounded-xl` for dense/task-surface elements (buttons, inputs, small cards), `rounded-2xl` for standard cards, `rounded-3xl` reserved for one specific showcase context (verify current usage pattern before deciding which), `rounded-[2.5rem]` kept as the one deliberate "outer panel" treatment (already low-count and consistent). Eliminate the three single-use arbitrary values by mapping each to the nearest scale value during whatever file each appears in is next touched — not a dedicated sweep on its own.
- **Plasma panel markup**: confirmed 12 occurrences (not the 2 previously believed), all identical `<div className="fixed inset-0 z-0 bg-plasma...">` blocks. Extract into a single shared component (e.g. `components/layout/PlasmaBackground.tsx`) and replace all 12 call sites — mechanical, low-risk, high-value for future maintainability (a future change to this treatment currently requires editing 12 files correctly).
- **Color tokens**: `app/globals.css`'s `@theme inline` block only defines font tokens (lines 7-11) — no color CSS variables exist; every color is a raw Tailwind utility class. This is lower-priority than the above (Tailwind's own token system already provides consistency at the utility level) but worth noting for anyone later wanting true semantic color tokens (e.g. `--color-destructive` usable in both Tailwind classes and inline styles) — flag as **NEEDS RESEARCH** on whether Tailwind v4's `@theme` block should be extended with color tokens or whether current utility-class discipline is sufficient; not blocking for this plan.

## 13. AI-Slop Removal Plan

Grounded in this session's actual grep sweep (not the generic list from the brief):

| File | Current pattern | Why it feels generic | Target pattern | Recommended change |
|---|---|---|---|---|
| `app/settings/notifications/page.tsx:19` | `"Email preferences coming soon"` stub copy | Placeholder text shipped as if final | Either build the feature or remove the page entirely until ready | Decide: implement (pairs naturally with §7/§16's email work) or hide the settings-nav entry until it exists |
| `lib/email/index.ts:19` | `console.log('[Email stub]', ...)` | Dead/stub infrastructure masquerading as working | Real Resend call (already correctly implemented per prior-phase verification — just never invoked) | Wire actual call sites per §7/§16, not a rewrite of this file |
| `components/landing/Landing.tsx:488-491, 497-499` | Footer links (About/Press/Privacy/Terms, X/Discord/GitHub) all `href="#"` | Dead links are a textbook "unfinished template" signal | Real destinations or remove the links entirely until real ones exist | Remove any link with no real destination rather than leaving a dead `#` — a missing link is honest, a dead one isn't |
| `components/dashboard/DashboardClient.tsx` (Events/Collaborations cards) | Same CTA regardless of existing count (§5's asymmetry bug) | Reads as a template that wasn't adapted per-section | Branch CTA like the Projects card already does | Direct fix, part of §5's dashboard work |
| `app/dashboard/page.tsx` + `DashboardClient.tsx` | Symmetric 3-card grid, header says "Welcome back" unconditionally | Generic SaaS dashboard framing | State-driven hierarchy per §5 | Full dashboard rework, §5 |
| `app/jams/[slug]/vote/page.tsx:44-49` | Dead-code filter (`return false // will be handled client-side`) that was never actually handled client-side | Not a visual anti-pattern, but the same "looks finished, isn't" problem in code form | Real self-vote prevention (§17 security note) | See §14/§9's security section |

No hardcoded/mock data arrays feeding production UI were found (confirmed this session) — this specific anti-pattern from the brief's generic list does not apply to Glyph's current implementation and should not be reported as a finding.

## 14. Responsive Implementation Plan

Not independently re-tested at all six breakpoints this specific session (prior engagement tested 375px for the dashboard only). Recommend, per surface, deferred to Phase 7 (after structural work per §35 of the blueprint) rather than specified in full detail now — speculative responsive specs written before the structural redesign lands would likely need rewriting anyway. The one concrete, already-confirmed responsive fact: `AppShell`'s mobile drawer mechanism (backdrop, Escape, body-scroll-lock, close-on-nav-click) is sound and should be extended, not replaced, when nav items change per §4. `Landing.tsx`'s mobile menu, by contrast, has no Escape handling and no body-scroll-lock (confirmed this session, `Landing.tsx:242-279`) — this is a real, newly-confirmed gap (the prior engagement's Escape-key fix was applied to `AppShell` and `Landing.tsx`'s *drawer*, but this session's recon shows `Landing.tsx`'s mobile menu is an in-flow dropdown, not a drawer, and still lacks Escape handling) — flag as a small, independent fix, not gated on the larger responsive pass.

## 15. Accessibility Implementation Plan

- **Confirmed gap, low-risk fix:** `Landing.tsx`'s mobile nav dropdown lacks Escape-to-close (§14) — add the same `keydown` listener pattern already proven in `AppShell.tsx` lines 121-128.
- **Confirmed from prior audit, not re-tested this session:** billing page's disabled "Manage subscription" button relies solely on a `title` tooltip — convert to a visible notice matching the page's own established amber-notice pattern (already used for the no-checkout disclosure on the same page).
- **New UI from this plan** (accept/reject buttons, invite/remove-member controls, next-action CTA) must follow the existing focus-visible/44px-touch-target/reduced-motion conventions already established in `app/globals.css` (lines 92-117) — no new ARIA beyond semantic HTML/buttons/labels, consistent with the blueprint's "prefer semantic HTML" principle.

## 16. Security/RLS Impact

**No existing policy from migrations 017-021 is touched by any recommendation in this plan.** Every new mutation planned reuses `is_studio_member()`/`studio_has_members()` rather than introducing new correlated subqueries (learning directly from the exact bug class fixed in 017/019).

**New RLS surface required:**
- `studio_members_update` policy (§9 item 4) — new migration, must include both `USING` and `WITH CHECK` from the start (the exact omission that caused the `studios_update` bug fixed in migration 021).
- If the `notifications.type` enum is extended (§7/§8's playtest/collaboration notification types) — a migration altering the CHECK constraint, additive only, no existing row/policy affected.
- If `featured_listings` gains a public-read consumer (§11) — verify its existing RLS already permits public SELECT for active listings (not confirmed this session — check before implementing the Explore query) rather than assuming.

**Jam vote self-vote prevention** (§13's `app/jams/[slug]/vote/page.tsx:44-49` dead-code finding) — currently **zero enforcement**, DB or app-level, against a jam entry's own team voting for itself. This is a real, currently-exploitable gap (not a hypothetical one — confirmed via code read that the filter always evaluates false). Recommend fixing at the RLS layer (add a policy or CHECK constraint preventing `jam_votes.voter_id` from matching the entry's `project_id`'s owner, or any `studio_members`/collaborator on that project) rather than only client-side, per this codebase's own established lesson that app-level-only checks in this exact feature area have failed before. Flag as **NEEDS RESEARCH** on exact scope (owner-only, or extend to studio members/collaborators too) before writing the migration.

**Notification insert policy note** (confirmed this session): `notifications_insert` RLS only requires `auth.uid() = actor_id` — any authenticated user can insert a notification naming any `recipient_id`, `type`, `entity_type`, `entity_id` they like, with no validation that the entity actually exists or that the type matches a real event. This is a low-severity but real abuse surface (a malicious user could spam another user with fabricated notifications). Not currently exploited by any known bug, and fixing it is not required for this plan's functional goals — flagged here for completeness per the task's explicit RLS-tracing instruction, classified **NEEDS PRODUCT DECISION** on whether it's worth tightening (e.g. requiring server-side-only inserts via a SECURITY DEFINER function) given it's a pre-existing condition, not a regression risk from this plan's changes.

## 17. Database/Backend Impact Summary

| Planned change | Classification |
|---|---|
| Dashboard current-project/activity/next-action queries (§5) | QUERY CHANGE only — no schema change, all target columns/tables already exist |
| Project-page team/studio section (§6) | QUERY CHANGE (new join), no migration |
| Profile activity signal (§6) | QUERY CHANGE only |
| Devlog prev/next nav (§6) | QUERY CHANGE only |
| Playtest feedback link fix, accept/skip UI, feedback display, `current_testers` increment, withdraw action (§7) | SERVER ACTION CHANGE (`playtests.ts` gets a new `withdrawPlaytestSession` action; `requestPlaytestSession` gets an added UPDATE) + UI only for the rest — no migration |
| Playtest/collaboration notification types (§7/§8) | MIGRATION REQUIRED (additive enum extension) — optional, flagged as a product decision |
| Collaboration applicant review UI (§8) | UI only — zero backend change, action already exists |
| Studio invite/remove/leave (§9 items 1-3) | SERVER ACTION CHANGE only — RLS already permits these operations |
| Studio role-change (§9 item 4) | MIGRATION REQUIRED (new `studio_members_update` RLS policy) |
| Studio dashboard list page (§9 item 6) | QUERY CHANGE + new route, no migration |
| Publisher contact route (§10 item 1) | New route only — action already correct; minor `.select()` addition to capture the inserted row id |
| Publisher shortlist-add UI (§10 item 2) | UI only — actions already exist |
| Feed extended to non-devlog events (§11) | MIGRATION REQUIRED (view extension) — scope flagged as a product decision |
| Explore featured-listing surfacing (§11) | QUERY CHANGE only, pending RLS verification |
| Jam self-vote prevention (§16) | MIGRATION REQUIRED (new policy/constraint) — scope flagged as needing research |
| Navigation/context switcher (§4) | QUERY CHANGE (`getSidebarIdentity()` extended) — no migration |
| Design-system consolidation (§12) | NO DB CHANGE |

No migration is proposed anywhere in this plan "because it's convenient" — every MIGRATION REQUIRED row above is required because the current schema genuinely lacks the specific policy or column needed, verified against migrations 001-021 directly, not assumed.

## 18. Dependency Graph

```
Phase 1 (Core loop: Playtesting, Collaboration, Studios, Publisher fixes)
   ├─ independent of Phase 2/3 — these are backend-adjacent UI wiring, not nav/dashboard-dependent
   └─ Studio role-change (§9.4) depends on its own new migration landing first

Phase 2 (Navigation)
   ├─ depends on Phase 1's studio dashboard-list route existing (§9.6) for the context switcher to link somewhere real
   └─ independent of Phase 3 otherwise

Phase 3 (Dashboard)
   ├─ depends on Phase 2's creation-action-menu component existing (if implemented as part of nav)
   └─ depends on Phase 1's collaboration/playtest state (pending applications, signups) being queryable for the next-action logic

Phase 4 (Project/Profile/Devlog)
   └─ independent of Phase 2/3, but benefits from Phase 1's studio work for the project-page team section

Phase 5 (Feed/Explore/Search)
   └─ depends on Phase 1's completed loop objects having real events to surface (playtest/collab activity in feed)

Phase 6 (Design system: Button, EmptyState adoption, plasma extraction, radius scale)
   └─ depends on Phases 2-4 having stabilized their markup, to avoid redoing consolidation against a moving target

Phase 7 (Mobile)
   └─ depends on Phases 2-6 (mobile behavior is defined per already-redesigned surface, not speculated in advance)

Phase 8 (Polish)
   └─ depends on everything above being structurally settled
```

## 19. Exact Implementation Phases

**PHASE 1 — STRUCTURAL/FUNCTIONAL: Core Loop Completion**
- Objective: make every core-loop step actually reachable by a real second user.
- Files: `app/actions/playtests.ts`, `components/playtests/RequestSessionButton.tsx`, `app/dashboard/playtests/page.tsx`, `app/playtests/[id]/page.tsx`, `app/collaborate/[id]/page.tsx`, `app/actions/studios.ts` (new functions), `components/studios/StudioManageClient.tsx`, `app/dashboard/studios/page.tsx` (new), `app/dashboard/publisher/contact/[id]/page.tsx` (new), `components/publisher/AddToShortlistButton.tsx` (new).
- Routes: new `app/dashboard/studios/page.tsx`, new `app/dashboard/publisher/contact/[id]/page.tsx`.
- Server actions: new `withdrawPlaytestSession`, `inviteStudioMember`, `removeStudioMember`, `leaveStudio`, `updateMemberRole`.
- DB/migrations: one migration for `studio_members_update` RLS; optionally one for jam self-vote prevention.
- Dependencies: none (can start immediately).
- Risks: studio membership RLS is the most exploit-sensitive surface in this codebase's history (three prior CVE-grade bugs in this exact table) — every new action must be tested with the role-impersonation pattern before shipping UI against it.
- Tests: full owner/admin/member/non-member/anonymous matrix (§20) for every studio action; two-real-account tests for playtest accept/feedback and collaboration accept/reject.
- Expected user-visible result: a second real account can be invited to a studio, accepted as a playtester, and accepted as a collaborator — none of which is currently possible.

**PHASE 2 — STRUCTURAL: Navigation**
- Objective: index the full real feature set without flattening everything to equal weight.
- Files: `components/dashboard/AppShell.tsx`, `lib/dashboard/identity.ts`, new `components/dashboard/AccountMenu.tsx`.
- Dependencies: Phase 1's `app/dashboard/studios/page.tsx` existing.
- Risks: over-crowding the sidebar (6 items, one more than the blueprint's original 5 — monitor, don't preemptively merge Playtesting/Collaboration).
- Tests: mobile drawer regression (Escape/backdrop/scroll-lock) with new item count; role-gated Admin/Publisher visibility correctness.
- Expected result: Studios/Publisher/Jams/Admin reachable from every authenticated page without a bookmark.

**PHASE 3 — STRUCTURAL: Dashboard**
- Objective: replace static 3-card grid with state-driven hierarchy.
- Files: `app/dashboard/page.tsx`, `components/dashboard/DashboardClient.tsx`, new `lib/dashboard/nextAction.ts`.
- Dependencies: Phase 1 (real playtest/collab state to derive next-action from), Phase 2 (creation menu, if bundled here).
- Risks: next-action logic thresholds (e.g. "stale" devlog definition) are product judgment calls, not derivable from evidence alone — flagged inline as decisions, not guessed silently.
- Tests: all 13 enumerated states in §5 manually verified with seeded/real data.
- Expected result: dashboard visibly differs in shape between a new user and an active one.

**PHASE 4 — FUNCTIONAL + VISUAL: Project/Profile/Devlog**
- Objective: close the profile activity-signal gap; add project-page team section; add devlog prev/next.
- Files: `app/p/[username]/[project-slug]/page.tsx`, `app/dev/[username]/page.tsx`, `app/p/.../[devlog-slug]/page.tsx`.
- Dependencies: Phase 1 (studio_projects data meaningful once studios have real members).
- Risks: low — all additive queries, no removal of existing working sections.
- Tests: verify all three pages still render correctly for projects/profiles with zero studio/devlog data (empty-state correctness).
- Expected result: a profile visibly shows "last posted," a project page shows its studio if any, a devlog links to its siblings.

**PHASE 5 — FUNCTIONAL: Feed/Explore/Search**
- Objective: surface featured listings (monetization-integrity fix); extend feed scope if product decision lands.
- Files: `app/explore/page.tsx`, `app/feed/page.tsx`, possible new migration.
- Dependencies: Phase 1 data + a product decision on feed scope.
- Risks: feed-scope migration needs care not to blow up query cost as the object graph grows.
- Tests: verify a purchased featured listing now actually appears on Explore.
- Expected result: paid featured placement has a visible effect for the first time.

**PHASE 6 — DESIGN SYSTEM**
- Objective: consolidate, don't invent — build `Button`, extract `PlasmaBackground`, adopt existing `EmptyState` consistently, collapse radius scale.
- Files: new `components/ui/Button.tsx`, new `components/layout/PlasmaBackground.tsx`, every one of the 12 plasma call sites, every hand-rolled button across the codebase (large mechanical change, high file count, low logic risk).
- Dependencies: Phases 2-4 stabilized.
- Risks: purely mechanical but touches many files — do in small batches with visual regression checks (screenshot before/after key pages), not one giant commit.
- Tests: visual diff on landing, dashboard, project, profile, devlog after each batch.
- Expected result: no visible change to any page, but 12 files' worth of duplicated markup becomes 1, and every button in the app shares one implementation.

**PHASE 7 — MOBILE**
- Objective: verify/fix mobile behavior for every surface touched in Phases 2-6, plus the two newly-confirmed gaps (Landing mobile menu Escape handling).
- Dependencies: Phases 2-6.
- Tests: 375/390/768/1024/1280/1440 for dashboard, project, profile, devlog, feed, explore, playtesting, collaboration, studio pages.
- Expected result: no page requires horizontal scroll; touch targets meet the existing 44px standard already defined in `globals.css`.

**PHASE 8 — POLISH**
- Objective: motion timing, avatar-initials consistency fix, billing-button tooltip→notice conversion.
- Dependencies: everything above.
- Risks: none — purely cosmetic, last by design.
- Expected result: small, low-risk refinements only, no structural surprises this late.

## 20. Test Matrix

| Workflow | Start state | Action | Expected result | DB effect | Notification | Redirect | Failure case |
|---|---|---|---|---|---|---|---|
| Studio invite | Owner, target user exists, not a member | Owner submits invite | Target added to `studio_members` as invited role | INSERT `studio_members` | (new, if added) invite notification | Stay on manage page, member list updates | Non-owner/admin attempts invite → RLS denies insert |
| Studio remove | Admin, target is a member | Admin removes member | Member deleted | DELETE `studio_members` | none currently | Stay on page | Member attempts to remove another member → RLS denies (only owner/admin can) |
| Studio leave | Member (not sole owner) | Self-removes | Own row deleted | DELETE `studio_members` (self) | none | Redirect away from studio manage page | Sole owner attempts to leave → app-level block (not RLS — RLS permits it, business rule must stop it) |
| Studio role change | Owner, target is member | Owner promotes to admin | Role updated | UPDATE `studio_members` | none | Stay on page | Member attempts role change → RLS denies (post-migration) |
| Playtest accept | Requester, pending session exists | Requester clicks Accept | Session → `accepted` | UPDATE `playtest_sessions` | none currently (flagged to add) | Stay on dashboard | Non-author attempts accept → existing action already blocks (verify) |
| Playtest feedback | Tester, own session `accepted` | Tester submits feedback | Feedback row created, session → `completed` | INSERT `playtest_feedback`, UPDATE `playtest_sessions` | none currently (flagged to add) | Redirect to `/dashboard/playtests` (existing) | Session not `accepted` → action already blocks (existing check, line 103) |
| Collaboration accept | Post owner, pending application | Owner clicks Accept | Application → `accepted` | UPDATE `collaboration_applications` | none currently (flagged to add) | Stay on page | Non-owner attempts accept → existing action already blocks (verify) |
| Publisher contact | Publisher account exists, developer target | Publisher submits message | Contact row created | INSERT `publisher_contacts` | Yes (existing, working) | New route needed (§10) | Non-publisher attempts contact → existing action already blocks |
| Publisher shortlist add | Publisher, shortlist exists, project exists | Publisher adds project | Project id added to `items` jsonb | UPDATE `publisher_shortlists` | none | Stay on page | Non-owner-of-shortlist attempts add → existing action already blocks |
| Anonymous visitor | Not logged in | Attempts any of the above via direct action call | All blocked | None | None | Redirect to login or RLS denial | Confirms no client-side-only gating anywhere |

(Full owner/member/non-member/other-user/anonymous variants for every studio action must be run via the role-impersonation transaction pattern before UI work begins, per §9's risk note — this table shows the primary-path rows; the negative-path rows are implied by "Failure case" and should be run exhaustively, not just spot-checked.)

## 21. Explicit "Do Not Build" List

Carried forward from the blueprint, reconfirmed against the actual repository (nothing found this session contradicts these):
- No DMs/messages feature — confirmed no schema/route trace exists.
- No algorithmic feed ranking — Feed and Explore are both confirmed chronological/recency already; keep them that way even when extending Feed's scope (§11).
- No gamification (streaks/progress bars/points) anywhere, including the new dashboard next-action logic (§5) and any studio "momentum" surfacing.
- No new trending algorithm — the `featured_listings` fix (§11) is about *surfacing an existing, paid, admin/Stripe-driven mechanism*, not building a new ranking system.
- No additional accent colors — single indigo accent confirmed as the only one in use; new UI (Button component, accept/reject buttons) must reuse it, not introduce new hues for "success"/"danger" beyond what's already established.
- No generic illustrated empty-state graphics — the existing `EmptyState` component (§12) uses an icon chip, not illustration; keep it that way.
- No itch.io-style large filter system on Explore.
- **Newly identified during this pass, not in the original blueprint list:** do not expand the `featured_listings`/monetization system beyond making the existing purchase actually visible (§11) — no new paid tiers, no new promotional mechanisms, since Stripe checkout itself is still not fully wired (per the completeness audit, unchanged this session) and expanding monetization surface before the base purchase flow works would compound an existing gap rather than close one.
- Do not build ownership-transfer for studios in this pass (§9) — flagged as a future decision, not something to add speculatively now.

## 22. Risks and Unresolved Questions

**NEEDS PRODUCT DECISION:**
- Exact "stale project" threshold for the dashboard's next-action logic (§5).
- Whether to extend the `notifications.type` enum for playtest/collaboration-decision events, or continue reusing `mention` generically (§7, §8).
- Whether Playtesting and Collaboration should eventually merge into one tabbed nav destination, per the blueprint's original proposal — explicitly deferred, not decided, in this plan (§4).
- Exact scope of Feed's extension beyond devlogs (all followed-project activity vs. only-participated-in activity) (§11).
- Whether to build or remove the `app/settings/notifications` "coming soon" stub page (§13).
- Studio ownership-transfer and last-owner-leaving edge case handling (§9, §21).
- Whether the `notifications_insert` RLS's lack of recipient-side validation is worth tightening (§16) — pre-existing, not a regression, low urgency.

**NEEDS RESEARCH:**
- Where devlog creation is actually scoped from (which route/form) — needed before the navigation creation-menu (§4) can include "New Devlog" as a generic, project-independent entry.
- Whether `featured_listings` RLS already permits public SELECT for active rows, or needs a policy addition before Explore can query it (§11, §16).
- Exact scope of jam self-vote/team-vote prevention (owner-only vs. extended to studio members/collaborators on the project) (§16).
- Whether Tailwind v4's `@theme` block should gain color tokens or whether current utility-class discipline is sufficient (§12) — not blocking, worth a future look.

**BLOCKED BY TECHNICAL ISSUE:** none identified this session — every gap found has a clear, unblocked implementation path once the product decisions above are made.

---

### IMPLEMENTATION STATUS

**READY TO IMPLEMENT (no product decision needed, path is fully specified):**
- Playtest feedback-link fix, accept/skip UI, requester feedback display, `current_testers` increment, dead-variable cleanup (§7 items 1-4, 6).
- Collaboration applicant accept/reject UI (§8).
- Studio invite/remove/leave/role-change actions + UI + migration (§9 items 1-6), pending the role-impersonation RLS test pass before shipping.
- Publisher contact route + shortlist-add UI (§10).
- Navigation restructure with the 6-item primary set as specified (§4).
- Dashboard state-driven hierarchy, minus the "stale" threshold constant (§5).
- Project/Profile/Devlog additive changes (§6).
- Featured-listing surfacing on Explore, pending the RLS-read verification (§11).
- `Button` component + plasma-markup extraction + radius-scale collapse (§12).
- Landing mobile-menu Escape-handling fix (§14/§15).

**NEEDS PRODUCT DECISION (listed in full above):** notification enum extension, stale-project threshold, Playtesting/Collaboration nav merge, feed-scope extent, settings-notifications stub fate, studio ownership-transfer edge cases.

**NEEDS RESEARCH:** devlog-creation route location, `featured_listings` RLS read permission, jam self-vote-prevention exact scope, color-token strategy.

**BLOCKED BY TECHNICAL ISSUE:** none.

---

*This plan makes no application code, migration, or database change. Every file path, line reference, and behavioral claim above was verified against the actual repository this session via direct reads and greps (not carried over unverified from prior summaries) — the one discrepancy encountered (the notification-insert scope gap, see the top of this document) was checked and resolved with a direct grep before being included here rather than being silently assumed either way.*

---

## Phase 1 Execution Status (2026-09-16)

Phase 1 (Core Loop Completion) has been implemented. This section records what actually happened, not what was planned — see below for exactly what's verified vs. not.

**Implemented, matching §7–§10 exactly:**
- Playtesting: fixed `RequestSessionButton`'s broken feedback route by threading a real `sessionId` through `requestPlaytestSession`'s return value and the request-detail page's query; added tester accept/skip UI (`components/playtests/SessionActions.tsx`) wired to the existing `updateSessionStatus`; added requester-facing feedback viewing (`components/playtests/FeedbackDetail.tsx`); made `current_testers`/`full` status genuinely tracked (increment on signup, decrement on skip/withdrawal, `full`↔`open` transitions); added `withdrawPlaytestSession` (reuses the existing `skipped` status rather than inventing a new one, with corrected neutral status copy); removed the dead `isOwner` variable in `app/playtests/[id]/page.tsx`.
- Collaboration: added Accept/Reject UI (`components/collaborate/ApplicationActions.tsx`) wired to the existing `updateApplicationStatus`; added a "Close this post" control (`components/collaborate/ClosePostButton.tsx`) wired to the existing `closeCollabPost`. No new server actions created.
- Studios: added `inviteStudioMember`, `removeStudioMember`, `leaveStudio`, `updateMemberRole` to `app/actions/studios.ts`, all reusing the existing owner/admin authorization pattern and adding an application-level "can't remove/demote/leave the last owner" guard (RLS doesn't enforce business rules like this, so it has to live in the action layer); added migration `022_studio_member_roles_and_jam_self_vote.sql` for the missing `studio_members_update` RLS policy (USING + WITH CHECK, reusing `is_studio_member()`); built the full team-management UI in `StudioManageClient.tsx`; built `app/dashboard/studios/page.tsx` as the membership landing page.
- Publisher: built `app/dashboard/publisher/contact/[id]/page.tsx` wired to the existing `contactDeveloper`; fixed the notification's `entity_id` to reference the newly-created `publisher_contacts` row instead of the publisher account; added shortlist add UI (`components/publisher/AddToShortlistButton.tsx`, on the project page for publisher-role viewers) and shortlist remove UI (extended `PublisherDashboardClient.tsx`), both using the existing `addToShortlist`/`removeFromShortlist`.
- Jam security: migration `022` also adds `jam_votes` self-vote prevention at the RLS layer. Scope was determined from the schema, not guessed: `jam_entries.team_lead_id` is the only ownership concept an entry has (no team/studio-member linkage exists), so the policy blocks exactly `voter_id = team_lead_id` for that entry, on both insert and update.
- **Bug discovered and fixed beyond the original plan's scope:** `app/publishers/page.tsx`'s "View Profile" link passed a `publisher_accounts.id` to a route that expects a developer's `profiles.id` (`contactDeveloper`'s signature) — a real, pre-existing dead/mismatched link, not just a missing route. Fixed by pointing it at the publisher's own public `/dev/[username]` profile (the correct semantic target) and building the actual publisher→developer contact entry point as a "Contact developer" link on the project page instead, gated to signed-in users with a `publisher_accounts` row.

**Migration applied:** `022_studio_member_roles_and_jam_self_vote.sql`, applied directly to the live project (`adiovtzggkpzrfqmevyx`) via `apply_migration`. Migrations 017–021 were not touched.

**VERIFIED:**
- TypeScript (`npx tsc --noEmit`): clean, zero errors.
- ESLint (`npm run lint`): zero errors/warnings in any file touched this phase; the 15 pre-existing errors found repo-wide are in `ds-bundle/` (a vendored bundle) and `components/dashboard/ProjectForm.tsx` (untouched this session, confirmed via `git diff --stat` showing no changes) — neither is a regression from this work.
- Production build (`npm run build`): succeeded, including both new routes (`/dashboard/publisher/contact/[id]`, `/dashboard/studios`).
- `studio_members_update` RLS: verified via 6 role-impersonation SQL tests in a rolled-back transaction (the same methodology established for migrations 017–021) — owner-promotes-member ✓, admin-demotes-member ✓, member-self-promotes denied ✓, non-member denied ✓, anonymous denied ✓, cross-tenant (owner of studio A touching studio B) denied ✓.
- `jam_votes` self-vote prevention: verified via 3 role-impersonation SQL tests — team-lead self-vote denied (both on first attempt and a second category) ✓, a different real user's vote succeeds ✓.
- `get_advisors` (security): re-run after the migration; zero new findings — all listed advisories are pre-existing and unrelated to this change.
- Single-real-account (user "deep") live browser testing, through actual HTTP requests against the running dev server: created a project, set it public, created a playtest request, created a collaboration post, created a studio — all four succeeded with no server errors (`preview_logs` checked clean throughout), and the new `/dashboard/studios` landing page correctly rendered the new studio with an "OWNER" badge.

**UNTESTED, with exact reason:**
- **Full two-live-session UI flows** (a second real account clicking "Request to test," "Apply," accepting a studio invite, appearing in the requester's session list, withdrawing, submitting feedback through the actual form; a publisher contacting a developer and the developer seeing the in-app notification) were not completed as live browser flows. Reason, stated plainly: this session's own browser tooling signed out of the only authenticated session it had (user "deep") without holding that account's password, and re-establishing a second session then hit two independent blockers — (1) Supabase's project-level email-send rate limit rejected every fresh signup attempt tried afterward (`email rate limit exceeded`, confirmed 3 times with different addresses), and (2) an attempt to set a temporary password on the user's own existing second seed account (`pateldeep8904@gmail.com`, id `e238e544-...`) via direct SQL was correctly refused by this session's own safety controls as a credential/secret-store write, and that refusal was respected rather than worked around. No further live-session testing was attempted after that; this is a genuine gap, not a claimed pass.
- Because of the above, the following are specifically unverified as live end-to-end flows (though their code was verified by typecheck/build, and the underlying authorization by direct RLS testing): playtest signup→accept→feedback→requester-views-feedback as a real two-party sequence; collaboration apply→accept as a real two-party sequence; studio invite→invitee-sees-membership→role-change→removal→leave as a real two-party sequence; publisher contact→developer-receives-notification as a real two-party sequence.
- Jam self-vote prevention was verified at the RLS/security layer (the part that actually matters for correctness) but not exercised through the live jam UI (create jam → admin-approve → submit entry → open voting → attempt self-vote in the browser), since building a full jam through its multi-day-gated lifecycle live wasn't practical within this pass; the SQL-level test used realistic fixture timestamps to simulate the `voting` status window directly.

**NEW BUGS DISCOVERED (beyond the implementation plan):**
1. `app/publishers/page.tsx`'s "View Profile" link passed the wrong id type to a route expecting a developer id (see above) — fixed.
2. (Documented for awareness, not fixed this phase, out of Phase 1's explicit scope) None of the newly-added notification-worthy events in this phase (playtest accept/skip, collaboration accept/reject, studio invite/role-change/removal) insert into `notifications` — consistent with the plan's §22 "NEEDS PRODUCT DECISION" flag on whether to extend the `notifications.type` enum, deliberately left undecided rather than guessed at during Phase 1.

**FILES CHANGED:** `app/actions/playtests.ts`, `app/actions/publisher.ts`, `app/actions/studios.ts`, `app/collaborate/[id]/page.tsx`, `app/dashboard/playtests/page.tsx`, `app/dashboard/publisher/page.tsx`, `app/dashboard/studios/[slug]/page.tsx`, `app/p/[username]/[project-slug]/page.tsx`, `app/playtests/[id]/page.tsx`, `app/publishers/page.tsx`, `components/playtests/RequestSessionButton.tsx`, `components/publisher/PublisherDashboardClient.tsx`, `components/studios/StudioManageClient.tsx`. **New files:** `app/dashboard/publisher/contact/[id]/page.tsx`, `app/dashboard/studios/page.tsx`, `components/collaborate/ApplicationActions.tsx`, `components/collaborate/ClosePostButton.tsx`, `components/playtests/FeedbackDetail.tsx`, `components/playtests/SessionActions.tsx`, `components/publisher/AddToShortlistButton.tsx`, `components/publisher/ContactDeveloperForm.tsx`.

**MIGRATIONS ADDED:** `supabase/migrations/022_studio_member_roles_and_jam_self_vote.sql` (applied to the live project).

**Phase 2 was not started at the time this line was written** — see the section below, added once Phase 2 was actually implemented.

---

## Phase 2 Execution Status (2026-09-16)

Phase 2 (Information Architecture + Navigation) has been implemented. Reconciled against the actual post-Phase-1 repository, not copied from the blueprint — one blueprint assumption was deliberately NOT followed (see below).

### What changed

- Extended `getSidebarIdentity()` (`lib/dashboard/identity.ts`) with a single batched `nav` flags query (`isAdmin`, `hasPublisherAccount`, `hasStudio`, `unreadNotifications`) computed once per page load from `admin_users`, `publisher_accounts`, `studio_members`, and unread `notifications` — the single shared source every nav-gating decision reads from, per the instruction not to duplicate permission logic in the UI.
- Rebuilt `AppShell`'s primary `NAV_ITEMS`: `Dashboard` (renamed from "Profile" — the item pointed at `/dashboard`, not a profile page, and was mislabeled), `My Projects`, `Feed`, `Explore` (**added** — previously absent from primary nav entirely despite being one of the three core discovery surfaces), `Playtests`, `Collaborate`. `Events` was removed from the primary six and moved to secondary (see reasoning below).
- Added `components/dashboard/SecondaryNav.tsx` — an expandable "More" section inside the existing sidebar (both desktop and mobile drawer, via the shared `SidebarBody`), listing: My Studios, Game Jams, Events, Publisher Tools (gated on `hasPublisherAccount`), then Notifications/Settings/Billing, then Admin (gated on `isAdmin`). Built as an inline expand/collapse using the exact existing nav-item visual language (same classes as the primary items), not a new floating-popover component or design system.
- Added a notifications bell with an unread-dot indicator to both the mobile top bar and the desktop content top bar — `/notifications` had zero links pointing to it anywhere in the app before this.
- Fixed a real dead link discovered during the route audit: `app/dashboard/projects/page.tsx`'s per-project "View" button linked to `` `/dev/${user.id}` `` — a raw UUID passed to a route that expects a username, which would 404 every time it was clicked. Fixed to `` `/p/${username}/${project.slug}` ``, the actual project page.
- Fixed the active-state matching logic (`pathname === href || pathname.startsWith(href + '/')` instead of a bare `.startsWith(href)`) to remove the latent prefix-collision risk the plan flagged, applied consistently in both the primary nav and `SecondaryNav`.
- Threaded the new `nav` prop through all 21 `<AppShell>` call sites (20 pages using `getSidebarIdentity()` directly, plus `app/dashboard/page.tsx`/`DashboardClient.tsx`, which has its own separate profile/onboarding query and now also calls `getSidebarIdentity()` purely for the nav flags).

### Deliberate deviation from the blueprint

The product design blueprint (`docs/glyph-product-design-blueprint.md` §7) originally proposed collapsing Playtesting and Collaboration into one combined, tabbed nav destination. Per this session's explicit instruction, that merge was **not** implemented — it was flagged in the blueprint itself as original synthesis with no competitor precedent, and the two areas are still structurally distinct surfaces in the current repo (`/dashboard/playtests` is an authenticated two-section dashboard view; `/collaborate` is a public browse-with-filters page). They ship as two separate primary items. The implementation plan's own §4 already reached the same conclusion; Phase 2 just executes it.

### Final information architecture

**Level 1 — Primary (AppShell sidebar, always visible):** Dashboard, My Projects, Feed, Explore, Playtests, Collaborate.

**Level 2 — Secondary/contextual (`SecondaryNav`, one click away via "More"):** My Studios, Game Jams, Events, Publisher Tools (role-gated), Notifications, Settings, Billing.

**Level 3 — Administrative:** Admin (role-gated, `isAdmin` only).

**Reasoning per area:**
- **My Projects** stays primary — it's the core object's management surface, used every session by an active developer.
- **Feed / Explore** stay primary — the two core discovery surfaces the product's loop depends on; Explore's previous total absence from any nav was a genuine gap, not a deliberate choice.
- **Playtests / Collaborate** stay primary and separate — both are structured, working, core-loop-completing features per Phase 1, and the plan's own reasoning against a premature merge holds.
- **Events moved to secondary.** Evidence: only 5 routes total (`/events`, `/events/[id]`, `/events/city/[city]`, `/dashboard/events/new`, `/dashboard/events/[id]/manage`), no reciprocal links from any core-loop object (a project or devlog never points at an event), and it's community-logistics-adjacent rather than part of the devlog→discovery→feedback loop every other primary item serves. It remains one click away via "More," not buried — this isn't a demotion in importance, just in daily-use frequency, consistent with the blueprint's Level 3 tiering and directly answering this phase's Step 8.
- **My Studios is unconditional (not gated on `hasStudio`).** The role matrix in the task prompt says "appropriate" for every user state including "New user" — Studios needs to stay discoverable so a user can *create* one, and `/dashboard/studios` (built in Phase 1) already renders a correct empty state with a "Create a studio" CTA for exactly this case. Gating it away for non-members would hide the entry point to the feature entirely.
- **Game Jams is unconditional.** Both hosting and participating are open to any authenticated user; no authorization boundary exists at the nav-visibility level for this feature (the schema's own gate is `admin_approved`, evaluated per-jam server-side, not per-user).
- **Publisher Tools is gated on `hasPublisherAccount`.** Matches the task's explicit role matrix ("Normal developer → Publisher: no"). Discovery of *becoming* a publisher happens through the existing public `/publishers` directory page (which already renders a "Register as Publisher" CTA for signed-in users without an account — unchanged this phase), not through the authenticated nav.
- **Admin is gated on `isAdmin` only**, reusing the exact `admin_users` lookup pattern already established in `app/admin/featured/page.tsx` and every other admin page — no new authorization logic invented, and the flag is presentational only since each `/admin/*` route still enforces its own check on load.
- **Settings / Billing / Notifications grouped as "Account"** inside the same secondary panel, visually separated from the product-area group by a divider, rather than either flattened into the primary six or given their own separate menu — keeps one mental model ("More" = everything that isn't the daily loop) instead of two.
- **Project-context navigation:** inspected `/dashboard/projects/[id]/edit` and the project page itself — found no genuine fragmentation across sibling views that would justify new tabs. Devlogs and the playtest CTA are already surfaced inline on the project page (not separate routes needing tab consolidation), and edit/write-devlog are already directly linked from `/dashboard/projects`' per-project action row. No new project-context sub-nav was built, per the explicit "don't create tabs just because they're convenient" instruction — there was no real problem here to solve.
- **Settings sub-nav (`SettingsNav.tsx` + `app/settings/layout.tsx`) was left untouched** — already structurally sound, exactly the pattern this phase's secondary nav borrows its visual language from.

### Role-gated navigation

| User state | Core nav (6) | My Studios | Game Jams | Events | Publisher Tools | Admin |
|---|---|---|---|---|---|---|
| New user, no studio/publisher/admin | shown | shown (empty state → create) | shown | shown | hidden | hidden |
| Normal developer | shown | shown | shown | shown | hidden | hidden |
| Studio owner/member | shown | shown (own studio) | shown | shown | hidden unless also publisher | hidden |
| Publisher-enabled user | shown | shown | shown | shown | shown | hidden |
| Admin | shown | shown | shown | shown | shown if also publisher | shown |

This matches the task's role matrix with one clarification made explicit above: "appropriate" for Studios/Jams/Events was read as "always visible to any authenticated user" rather than conditionally hidden, since both are open-participation features with no per-user nav-level gate in the actual authorization model — only Publisher and Admin have a real boolean gate (`publisher_accounts` existence, `admin_users` existence).

### Mobile

The mobile drawer (`AppShell`'s `<aside role="dialog">`) renders the exact same `SidebarBody` component as desktop — same `NAV_ITEMS`, same new `SecondaryNav`, same role-gating — so mobile IA is identical to desktop by construction, not a separately-maintained shrunk copy. Preserved without modification: Escape-to-close (`keydown` listener, unchanged), backdrop-click-to-close (unchanged), body-scroll-lock while open (unchanged), close-on-nav-click (unchanged, `onNavClick` now also passed into `SecondaryNav`), focus-visible styles (unchanged, inherited from `app/globals.css`), 44px touch targets (the mobile top bar's new notification bell link uses `h-11 w-11`, matching the existing hamburger button's own `h-11 w-11`). Added: the notification bell in the mobile top bar, positioned before the hamburger button.

**Landing-page mobile menu**, separately: confirmed (not fixed) that `components/landing/Landing.tsx`'s mobile dropdown has no Escape-key handler and no body-scroll-lock, unlike `AppShell`'s drawer — this is a pre-existing gap, not something Phase 2's navigation work touches or regresses (Landing's nav is a wholly separate component from AppShell, was not modified this phase), and per the explicit instruction not to expand Phase 2 into landing-page polish, it's documented here as deferred rather than fixed.

### Route discoverability audit

| Route / Area | Reachable from nav? | Correct role gating? | Contextual or primary? | Notes |
|---|---|---|---|---|
| `/dashboard` | Yes (primary) | N/A (auth only) | Primary | Renamed label "Profile"→"Dashboard" |
| `/dashboard/projects` | Yes (primary) | N/A | Primary | — |
| `/feed` | Yes (primary) | N/A | Primary | — |
| `/explore` | Yes (primary) — **newly added** | N/A | Primary | Previously unreachable from any authenticated nav |
| `/dashboard/playtests` | Yes (primary) | N/A | Primary | — |
| `/collaborate` | Yes (primary) | N/A | Primary | — |
| `/dashboard/studios` | Yes (secondary) — **newly added** | Unconditional (correct — see reasoning above) | Contextual | Built in Phase 1, had zero incoming nav links before this phase |
| `/jams` | Yes (secondary) — **newly added** | Unconditional (correct) | Contextual | Was completely unreachable from any nav before this phase |
| `/events` | Yes (secondary, moved from primary) | Unconditional (correct) | Contextual | See reasoning above |
| `/dashboard/publisher` | Yes (secondary, gated) — **newly added to nav** | Gated on `hasPublisherAccount` (correct) | Contextual | Previously reachable only via `/publishers` directory |
| `/notifications` | Yes (bell icon + secondary) — **newly added** | N/A | Account | Was completely unreachable from any nav before this phase |
| `/settings/*` | Yes (secondary) — **newly added** | N/A | Account | Was completely unreachable from any nav before this phase — confirmed via `grep 'href="/settings'` returning zero results outside `app/settings/*` itself |
| `/dashboard/billing` | Yes (secondary) — **newly added** | N/A | Account | Was completely unreachable from any nav before this phase |
| `/admin` | Yes (secondary, gated) — **newly added** | Gated on `isAdmin` (correct) | Administrative | Was completely unreachable from any nav before this phase |
| `/dashboard/publisher/contact/[id]` | Yes, contextually (linked from the project page for publisher-viewers, per Phase 1) | Gated (publisher-only, server-enforced) | Contextual | Not a nav item itself — reachable in-context, as intended |
| `/dashboard/projects/[id]/edit`, `/devlogs/new` | Yes, contextually (per-project action buttons on `/dashboard/projects`) | Owner-only (server-enforced) | Contextual | No change needed — already adequate |
| `/search` | Not in nav (unchanged this phase) | N/A | — | Reachable via a search input on `/explore`; out of this phase's scope to add to primary/secondary nav — flagged for Phase 5 (Feed/Explore/Search) rather than added speculatively here |

**No important user-facing feature remains accidentally orphaned** as of this phase — every route in the table above that had zero incoming navigation links before Phase 2 now has at least one.

### Dead/duplicate links fixed

1. `app/dashboard/projects/page.tsx` — "View" button linked to `` `/dev/${user.id}` `` (a raw UUID, not a username; always 404'd). Fixed to the real project page, `` `/p/${username}/${project.slug}` ``.

No other dead (`href="#"`), duplicate-destination, or stale-route navigation links were found in this pass beyond the ones already fixed in Phase 1 (`app/publishers/page.tsx`'s contact link). The Landing page's footer `href="#"` links (About/Press/Privacy/Terms, social icons) were re-confirmed present but are marketing-page content, not navigation in the sense this phase is scoped to (AppShell/product nav) — left untouched and undocumented as a new finding since it was already flagged in the prior UI/UX audit.

### Tested

- `npx tsc --noEmit`: clean, zero errors, after every change in this phase.
- `npm run lint`: zero errors/warnings in any file touched this phase (verified via `grep` against the lint output, cross-checked against `git status` to confirm the pre-existing errors elsewhere — `ds-bundle/*`, `components/dashboard/ProjectForm.tsx` — are in files this phase did not touch).
- `npm run build`: succeeded; all 21 threaded `<AppShell>` call sites compiled, including the two new Phase-1 routes (`/dashboard/studios`, `/dashboard/publisher/contact/[id]`) still present and unaffected.
- Migrations 017–022 confirmed still present and unmodified (`ls supabase/migrations/`); no new migration was added or needed this phase (pure UI/routing work, zero schema/RLS changes).
- `git diff --stat app/actions/` confirmed the three Phase 1 server-action files carry only their Phase 1 diff — nothing in `app/actions/*` was touched this phase.
- Live browser check of one **public, unauthenticated** route (`/publishers`) after the changes: renders correctly, zero server errors in `preview_logs`.
- Self-review of the full `AppShell.tsx` file post-edit for JSX/structural correctness (beyond what `tsc`/`build` already verify at the type level) — confirmed coherent.

### Untested, with exact reason

- **The actual authenticated navigation UI was not verified live in the browser this phase** — no active screenshot or interaction-tested confirmation that the new "More" panel opens, that active states highlight correctly across `/dashboard`, `/dashboard/projects`, `/explore`, etc., that the notification bell/badge renders correctly, or that role-gated items correctly show/hide for a real admin/publisher/studio-member account. Reason, stated plainly: this session inherited the Phase 1 session-loss (this environment's only authenticated account was signed out during Phase 1 without a saved password), and every attempt to re-establish a session this phase was blocked — one fresh signup attempt hit `email rate limit exceeded` again; a second attempt got past client-side validation and showed "Creating…" but a direct database check (`select ... from auth.users where email = ...`) confirmed **no row was created**, meaning it silently failed server-side, almost certainly the same rate limit. No credential-store workaround was attempted (that path was already correctly refused once in Phase 1 and is not being revisited).
- Specifically unverified as live interactions: opening/closing the "More" panel via click and keyboard, the notification bell's unread-dot rendering against a real unread count, active-state correctness for nested routes on a real navigated session, mobile drawer at 375/390/768 with the new items present, and role-gated visibility (Studios always-shown, Publisher Tools hidden for non-publishers, Admin hidden for non-admins) against real distinct accounts.
- All of the above were verified at the **code/type level** (props flow correctly, `tsc` confirms every consumer matches `SidebarNavFlags`'s shape, `build` confirms every route compiles and every `<AppShell>` call site has valid props) but not through an actual rendered, interacted-with page. Per the task's explicit instruction, this is stated as untested rather than implied to be verified.
- Desktop breakpoints (1024/1280/1440) and mobile breakpoints (375/390/768) were not visually exercised for the new nav for the same reason.

### Deferred to later phases

- Merging Playtesting/Collaboration into one tabbed destination — deliberately not done (see above); revisit only if real usage data or user feedback (not available yet) shows the six-item primary set is crowded.
- Landing page mobile menu's missing Escape/body-scroll handling — pre-existing, unrelated to this phase's AppShell work, left for whichever phase takes up public/marketing-page polish.
- Adding `/search` to primary or secondary nav — flagged for Phase 5 (Feed/Explore/Search), since deciding its exact placement (persistent search affordance vs. a nav link) is a discovery-surface design question, not a pure IA-wiring one.
- A command-palette / persistent search affordance (raised as a possibility in the product design blueprint) — explicitly out of scope; nothing beyond the existing per-page search entry points was touched.
- Notification-type-specific deep-linking (the notifications page still doesn't resolve `entity_type`/`entity_id` into a real link per notification) — pre-existing gap noted in Phase 1's plan, unrelated to nav wiring itself, left for whichever phase touches the Notifications page's own content.

### Files changed

**Modified:** `lib/dashboard/identity.ts`, `components/dashboard/AppShell.tsx`, `components/dashboard/DashboardClient.tsx`, `app/dashboard/page.tsx`, `app/dashboard/projects/page.tsx`, plus the `nav` prop threaded (destructure + `<AppShell>` prop, mechanical one-line-pattern change) into all other 19 files listed as `getSidebarIdentity()` call sites earlier in this document.

**New:** `components/dashboard/SecondaryNav.tsx`.

### Migrations

None. Phase 2 is UI/routing only — no schema, RLS, or server-action changes.

### Build/typecheck/lint

All three pass clean; see "Tested" above for exact commands and results.

### Regressions

None found. Migrations 017–022 untouched; `app/actions/*` untouched this phase; every previously-existing route in the build output from Phase 1 is still present in the Phase 2 build output; the mobile drawer's Escape/backdrop/scroll-lock/focus behavior is unchanged code (only new content added inside it, the interaction logic itself was not touched).

**Phase 3 (Dashboard redesign) was not started**, per the explicit instruction to stop after Phase 2.

---

## Platform Research + Product Architecture Reset (2026-09-16)

A dedicated research pass ("Glyph Phase 2 Reset") studied LinkedIn deeply (primary structural reference) plus GitHub, itch.io, Discord, Behance, Dribbble, Reddit, Letterboxd, Product Hunt, and Steam (secondary, targeted), and produced five new documents: `docs/glyph-platform-pattern-library.md`, `docs/glyph-product-model.md`, `docs/glyph-information-architecture.md`, `docs/glyph-navigation-model.md`, `docs/glyph-settings-architecture.md`. This section records how that research changes (or doesn't change) the phase sequence below. **No code was changed in this research pass** — Phase 2's shipped navigation stands as implemented; this section is forward-looking only.

**Headline finding:** the research independently converges on the same primary/secondary/admin navigation structure Phase 2 already shipped, reached via a completely different method (product-model-first derivation + LinkedIn's own demonstrated nav-capping practice, rather than the blueprint's original reasoning). This is treated as confirmation, not coincidence — see `docs/glyph-navigation-model.md` §3. **No navigation change is being made as a result of this research pass.**

**Genuine new findings that change future-phase scope, not the phase order:**
- A real, previously-undiscovered correctness bug in `components/settings/DeleteAccountForm.tsx`: its stated consequences ("removes your projects, devlogs, comments, reactions") don't match its actual behavior (only nulls a few profile fields), and it has no check preventing a sole studio owner from deleting their account and leaving the studio permanently ownerless — the exact class of bug Phase 1's studio actions deliberately guard against elsewhere. Documented in `docs/glyph-settings-architecture.md` §4, not fixed this pass.
- A missing "Privacy" settings category (block/mute management currently has no settings-page home at all, only reachable from a target user's own profile).
- A missing Featured/Pinned profile shelf (independently validated by both LinkedIn and GitHub in this research pass — the strongest-evidenced new recommendation from this document).
- Notification batching (LinkedIn's "X and N others" pattern) as a new, previously undocumented gap, alongside the already-tracked entity-deep-linking gap.
- Steam's Store/Hub/Library three-views pattern as a structural lens for a future project-page phase — not a redesign mandate, a way of thinking about the existing public-page/management-page split that's already latent in the codebase.

### Restructured future phase sequence

The original Phase 1-8 sequence (§19 of this document, above) is **superseded from Phase 3 onward** by the following, informed by this research pass. Phases 1 and 2 are unchanged (already implemented). Reasoning for each reordering/addition is stated inline — nothing is reordered without a reason.

**Phase 3 — Dashboard.** Unchanged in position and scope from the original plan (§5 above) — this research pass found nothing that changes the dashboard's own design, only reinforces that it should stay state-driven rather than static.

**Phase 4 — Profile.** *(New, was previously folded into "Phase 4 — Project/Profile/Devlog" in the original sequence; now split out and moved earlier.)* Reasoning: this research pass's single highest-confidence new finding (Featured shelf, activity/momentum signal — independently validated by LinkedIn, GitHub, and every prior audit in this engagement) lives entirely on the profile, and per `docs/glyph-product-model.md` §3's full section-by-section blueprint, is cheap relative to its evidence weight. Splitting it from Project/Devlog lets it land without waiting on the larger, less-resolved project-page questions.

**Phase 5 — Project / Devlog.** *(Was Phase 4 in the original sequence; now follows Profile.)* Reasoning: `docs/glyph-product-model.md` §4's Steam-derived three-views lens is a genuine but larger structural question (public/management/community) that benefits from the smaller Profile phase landing first as a proof of the "research-informed, evidence-gated addition" pattern before tackling a bigger surface. The one concrete near-term item this phase should include: reciprocal public-page↔management-page linking (small, low-risk, directly supported by the Steam pattern).

**Phase 6 — Feed / Activity.** *(Was folded into Phase 5 "Feed/Explore/Search" in the original sequence; now split out and comes first of the two.)* Reasoning: the notification-batching and entity-deep-linking findings (both feed/activity-adjacent) plus the itch.io email-digest confirmation give this phase concrete, evidence-backed scope that didn't exist as clearly before this research pass.

**Phase 7 — Search / Discovery.** *(Was folded into the original Phase 5; now split out and follows Feed/Activity.)* Reasoning: `docs/glyph-information-architecture.md` §5's search-category-tabs finding (LinkedIn, scaled down) is a real but distinct piece of scope from Feed/Activity — separating them avoids one phase trying to do two different jobs.

**Phase 8 — Collaboration / Playtesting.** *(New explicit phase; these were previously treated as "done" after Phase 1's core-loop wiring, with no further phase planned.)* Reasoning: this research pass found one concrete new gap — a "My Postings" management view for collaboration posts (LinkedIn's poster-side 3-level drill pattern) — that wasn't part of Phase 1's scope (which was about making existing actions reachable, not adding new management views). Small, evidence-backed, deserves its own light phase rather than being silently dropped or retrofitted into an unrelated one.

**Phase 9 — Studios / Publisher.** *(Was Phase 9 in the original sequence; position unchanged.)* This research pass adds two small, explicitly low-priority refinements (Discord-derived admin-can't-touch-admin hierarchy protection; per-project permission scoping, deferred pending evidence of need) — neither changes this phase's position, both are noted in `docs/glyph-platform-pattern-library.md` §8 for whoever picks up this phase.

**Phase 10 — Settings / Account.** *(New position — settings work was not previously called out as its own phase; it's elevated here specifically because of the real bug found in `DeleteAccountForm.tsx`.)* Reasoning: `docs/glyph-settings-architecture.md` §4's finding is the closest thing to an actual production bug this research pass surfaced (not just a UX gap) — a settings phase should exist and should prioritize that fix, plus the new Privacy category, over the previously-vague "settings redesign" scope.

**Phase 11 — Design System.** *(Was Phase 6 in the original sequence; now later.)* Reasoning: this research pass adds one new, low-cost, evidence-backed design-system rule — codify the already-accidentally-correct list-vs-card split (Reddit-derived, `docs/glyph-platform-pattern-library.md` §18) as an explicit rule — but otherwise doesn't change this phase's scope or justify moving it earlier; it still correctly depends on Phases 3-10 stabilizing first, per the original plan's own dependency reasoning.

**Phase 12 — Mobile.** *(Was Phase 7; position unchanged.)* This research pass surfaces one genuine open question (§ below) rather than new scope — LinkedIn's mobile-nav divergence (a centered create action) is flagged as an open decision for this phase to resolve, not a mandate.

**Phase 13 — Polish.** *(Was Phase 8; position unchanged, last by design, per the original plan's own reasoning, reconfirmed.)*

### Open product decisions surfaced by this research pass (new, not previously tracked)

- Fix `DeleteAccountForm`'s copy-vs-behavior mismatch, or implement real deletion to match its copy (§4 of the settings architecture doc) — either way, add the missing sole-studio-owner guard.
- Whether Glyph's mobile nav should diverge from desktop with a centered create action, per LinkedIn's demonstrated pattern (`docs/glyph-navigation-model.md` §4).
- Whether a persistent search affordance (not a full command palette) is worth adding before Phase 7.
- Whether a public studios directory (analogous to `/publishers` and `/jams`) is worth building — a real, newly-confirmed orphaned-surface gap (`docs/glyph-information-architecture.md` §1) not previously named in this engagement.

None of these are resolved by this document — they are handed to whichever future phase owns the relevant surface, consistent with this pass's explicit no-implementation scope.

---

## Phase 3 — Dashboard (2026-09-16)

### Final dashboard architecture

Single-column (`max-w-2xl`), vertically-stacked section model, replacing the prior symmetric three-card grid entirely:

1. **Identity** — one subtle line (`{firstName}'s workspace`), rendered as a real `<h1>` (visually quiet, semantically real — the page has no other top-level heading, since `AppShell`'s `headerLabel` is chrome text, not page content).
2. **Profile-completion banner** — kept, unchanged content/logic from before this phase, just moved below identity instead of beside it.
3. **Your Current Project** (`CurrentWork.tsx`) — the project + its latest devlog + one dynamically-chosen next action.
4. **Needs Your Attention** (`AttentionList.tsx`) — compact rows: pending collaboration applications, playtest sessions awaiting accept/skip, and an unread-notifications preview.
5. **Recent Activity On Your Work** (`ActivityList.tsx`) — recent comments on the user's own devlogs.
6. **From Your Network** (`NetworkPreview.tsx`) — a 5-item preview of `/feed`, or a follow-suggestions empty state if the user follows no one.
7. **Your Other Projects** (`ProjectsOverview.tsx`) — compact rows, only rendered if the user owns more than one project.
8. **More** (`SecondaryLinks.tsx`) — a small pill row: Studios, Game Jams, Events, and Publisher Tools if applicable.

Every section title is a real `<h2>` (`SectionHeading` in `DashboardClient.tsx`), giving a clean h1→h2 hierarchy with no skipped levels.

### Data sources — all real, none invented

| Section | Query | Table(s) |
|---|---|---|
| Current project | `projects` ordered `is_primary desc, updated_at desc`, first row | `projects` |
| Latest devlog | `devlog_posts` for that project, published, most recent | `devlog_posts` |
| Open playtest (for next-action only) | `playtest_requests` for that project, `status='open'` | `playtest_requests` |
| Pending applications | `collaboration_applications` join `collaboration_posts!inner`, `status='pending'`, filtered to posts the user authored | `collaboration_applications`, `collaboration_posts` |
| Playtest sessions awaiting decision | `playtest_sessions` join `playtest_requests!inner`, `status='requested'`, filtered to requests the user authored | `playtest_sessions`, `playtest_requests` |
| Notification preview | `notifications` where `recipient_id=user`, `read_at is null` | `notifications` |
| Activity (comments) | `comments` where `devlog_post_id in (user's own devlog ids)` | `comments`, `devlog_posts`, `projects` |
| Network | `feed_items` view where `follower_id=user` (same view `/feed` itself uses) | `feed_items` |
| Follow-suggestions empty state | `profiles` recently onboarded — the exact same fallback `/feed` already uses when empty, not a new one | `profiles` |
| Other projects | Same `projects` query as Current Project, rows after the first | `projects` |
| Secondary links | Reuses `nav.hasStudio` / `nav.hasPublisherAccount` from `getSidebarIdentity()` — no new query | — |

No mock arrays, no hardcoded counts, no fabricated activity. Where real data for a plausible section didn't exist without inventing new infrastructure (e.g., "feedback awaiting review" — no read/seen tracking exists on `playtest_feedback`; "studio invitations" — Phase 1's studio model has no pending-invite step, membership is direct-add), the section was **not built**, per the explicit instruction not to create fake UI to fill space. Documented as deferred below, not silently dropped.

**One explicit, stated judgment call:** a project is "stale" (triggering a "Post an update" next-action) if its latest devlog is more than 14 days old. This constant (`STALE_DAYS` in `app/dashboard/page.tsx`) was flagged in the implementation plan (§5, "NEEDS PRODUCT DECISION") as needing a human judgment call — 14 days was chosen and is now stated explicitly rather than picked silently.

### Dynamic next-action model

A discriminated union (`NextAction`, exported from `app/dashboard/page.tsx`) with seven states, evaluated in this priority order: no project → no devlog yet → pending applications → pending playtest decisions → open playtest with zero signups → stale project → otherwise "continue building." Only one CTA is ever shown at a time — no simultaneous equal-weight buttons.

### State matrix — code-verified against the actual query logic, not all browser-tested (see Untested)

| State | Primary content | Primary CTA | What's absent |
|---|---|---|---|
| Brand-new user | Empty-state Current Work panel | "Create project" | Attention/Activity/Network all show their own empty states, not hidden |
| No project | Same as above | Same | — |
| Project, no devlog | Current Work shows project, "No devlogs posted yet." | "Write your first devlog" | — |
| Active project | Full Current Work card with latest devlog | "Write a devlog" (continue_building) | — |
| Stale project (>14d) | Same card | "Post an update" | — |
| Multiple projects | "Your Other Projects" section renders | Varies by current-project state | Section fully absent for 0-1 projects |
| Open playtest, 0 signups | Current Work | "Share your playtest request" | — |
| Open playtest, has signups | Attention shows pending sessions if any are undecided | "Review playtest signups" (if any `requested`) | — |
| Playtest feedback exists | Not surfaced on the dashboard (no read-tracking exists to know if it's "new" — see Deferred) | — | — |
| Pending collab applications | Attention section, top priority | "Review applications" | — |
| Following developers | Network section shows feed preview | "View all activity" | Follow-suggestion empty state does not show |
| No follows | Network shows follow-suggestion empty state | "Explore developers" (or suggested-dev chips) | Feed preview list does not show |
| Unread notifications | Attention shows one preview row + "+N more" | Links to `/notifications` | — |
| Studio owner/member | "More" row reads "Studio activity" instead of "Studios" | — | No dedicated studio activity feed (would require new infrastructure — deferred) |
| Publisher-enabled | "More" row includes "Publisher tools" | — | Hidden entirely for non-publishers |

### Creation

No global "+" menu was added (explicitly ruled out in the navigation-model research — no evidence supports the added complexity over existing per-page entry points). Creation remains contextual: "Write your first devlog" / "Post an update" link directly to `/dashboard/projects/[id]/devlogs/new` (project-scoped, correctly, per the explicit instruction that a devlog cannot be presented as existing independently of a project), "Review applications" links to `/collaborate`, "Create project" links to `/dashboard/projects/new`.

### Responsive

The new architecture is a single vertical column at every width (`max-w-2xl`, no multi-column grid anywhere except `CurrentWork`'s own internal image+content row, which stacks via `flex-col sm:flex-row`). This structurally avoids the "desktop three-column compression" failure mode by construction — there is no three-column layout to compress. **CODE VERIFIED** (Tailwind classes reviewed for correctness at 375/390/768/1024/1280/1440 — no fixed pixel widths, no horizontal grids that would need to collapse, `flex-wrap` used for the profile-completion pills and the "More" link row so they wrap rather than overflow). **NOT BROWSER VERIFIED** at any breakpoint — see Untested.

### Accessibility

`<h1>` (workspace identity) → `<h2>` (each section) — real elements, not styled `<div>`s, verified by direct code read. All interactive rows are real `<Link>` elements (not `<div onClick>`), so keyboard focus and Enter-to-activate work natively. `SecondaryLinks`' pill buttons were found to fall short of the 44px minimum touch target during this phase's own review (`py-2` ≈ 36px) and were fixed to `min-h-11` (44px) before this phase was considered complete. No tooltip-only information anywhere in the new components. Reduced-motion: no new animation was introduced (only existing `transition-colors`/`transition-all` hover states, already governed by the site-wide `prefers-reduced-motion` rule in `app/globals.css`, untouched this phase). **CODE VERIFIED. NOT BROWSER VERIFIED** (no screen-reader or keyboard-trap testing was performed live).

### Product model / mature-platform mapping

Per the research documents, each pattern used has a named source: Current Work → LinkedIn's identity/work-context framing + GitHub's "what am I actively working on" activity model; the actor→action→object copy in Attention/Activity/Network → LinkedIn's notification-copy pattern (pattern library §10) and Letterboxd's object+dated-log model (canonical devlog + who-acted-on-it); compact list rows over cards → Reddit/GitHub's density conventions (pattern library §18); the dynamic single-CTA next-action model → LinkedIn's "Open to Work" preference→single-surfaced-recommendation fan-out, adapted (not copied) to Glyph's own state machine. No pattern was forced where it didn't fit — no Steam three-views concept was applied here (that's the Project-page phase's territory, correctly deferred).

### Files changed

**Rewritten:** `app/dashboard/page.tsx` (all-new query set and `NextAction` logic), `components/dashboard/DashboardClient.tsx` (all-new section composition, replacing `workspaceCards()`).
**New:** `components/dashboard/CurrentWork.tsx`, `components/dashboard/AttentionList.tsx`, `components/dashboard/ActivityList.tsx`, `components/dashboard/NetworkPreview.tsx`, `components/dashboard/ProjectsOverview.tsx`, `components/dashboard/SecondaryLinks.tsx`.
**Small, shared addition:** `lib/utils.ts` gained `relativeTime()` and `daysSince()` — two small, genuinely reused-across-components helpers, not duplicated inline per component.

### Database / server action changes

**None.** Every query in `app/dashboard/page.tsx` reads existing tables/views (`projects`, `devlog_posts`, `playtest_requests`, `playtest_sessions`, `collaboration_applications`, `collaboration_posts`, `notifications`, `comments`, `feed_items`, `profiles`) with no schema change, no new view, no new RLS policy, and no new migration — consistent with the explicit instruction not to create a migration just to make the UI easier. No RLS was touched or weakened.

### Tested

- `npx tsc --noEmit`: clean.
- `npm run lint`: zero errors/warnings in any file touched this phase.
- `npm run build`: succeeded; `/dashboard` compiles and is correctly listed as dynamic (server-rendered per request, as it must be for real per-user data).
- Migrations confirmed unchanged (still 22, `022_...` the latest) and `app/actions/*` confirmed unchanged this phase (`git diff --stat` matches Phase 1's own diff exactly, nothing added).
- The four structurally trickiest queries (nested `!inner`-join filters for collaboration applications, playtest sessions, and devlog-by-project-owner) were validated by running their equivalent plain SQL joins directly against the live database using real Phase 1 fixture data (project `91a246d1-...`, user `abb02b2a-...`) — all returned structurally correct (empty, since no fixture data exists in those particular states, but not erroring) results, confirming the join logic itself is sound. This is **not** the same as executing the actual PostgREST-embedded-select query strings Supabase-js generates, which was not independently verified this phase.

### Untested

**No live browser session was available this phase, for the same reason carried forward from Phases 1 and 2**: the one authenticated session this environment had was lost in Phase 1 (signed out without a saved password), and every fresh-signup attempt since — including two more made specifically for this phase — has hit `email rate limit exceeded`. No credential-store workaround was attempted (consistent with the standing refusal from Phase 1). Specifically **UNTESTED as live interactions** (code-verified only, per the distinction this phase's instructions explicitly required):
- Rendering of every section in an actual browser, at any of the 6 required breakpoints (375/390/768/1024/1280/1440).
- All 15 user/project states in the state matrix above, as real rendered pages.
- Keyboard navigation, focus order, and focus-visible styling on the new interactive rows.
- The mobile drawer/navigation regression check (though no drawer code was touched this phase — only `DashboardClient.tsx`'s content, which renders inside the existing, untouched `AppShell` — so regression risk is low, but "low risk" is not the same as "tested").
- All dashboard CTAs actually navigating to their intended destination when clicked (verified by code/type-checking the `href` values, not by clicking them).
- Sign-out and profile/account navigation from the dashboard (unchanged code path from Phase 2, not re-tested this phase).

### Deferred

- **Feedback-awaiting-review as an Attention item** — no read/seen-tracking exists on `playtest_feedback`, so "new" feedback can't be distinguished from previously-viewed feedback without new infrastructure (a `viewed_at` column or similar). Not built, to avoid inventing a false "new" signal.
- **Studio activity feed** — Phase 1's studio model has no activity-log table; "Studio activity" in the "More" row is currently just a relabeled link, not a real data-backed preview. Flagged honestly rather than faked.
- **Notification entity deep-linking** — the Attention section's notification preview still can't deep-link to the specific source object (same pre-existing gap tracked since the Phase 1 plan and reconfirmed in the Phase 2 research pass); the dashboard links to `/notifications` generally instead of pretending to deep-link.
- **A "Featured" project concept** — explicitly out of scope per this phase's own instructions (belongs to the Profile phase); "current project" logic here is purely `is_primary`/`updated_at`-based, no new featured-selection UI was added.
- Full mobile drawer/navigation redesign — untouched, remains Phase 12's scope.

### Regressions

None found. The profile-completion banner's logic is byte-for-byte unchanged, just relocated. `AppShell`'s nav/drawer code was not modified this phase (`DashboardClient.tsx` only changed what it renders *inside* `AppShell`, not `AppShell` itself). No previously-existing route was removed (confirmed via the build's route listing, identical set to Phase 2's). The `nav` prop threading from Phase 2 is preserved and reused (not reintroduced or duplicated).

### Documentation updated

This section of `docs/glyph-implementation-plan.md`. `docs/glyph-product-model.md`, `docs/glyph-information-architecture.md`, `docs/glyph-navigation-model.md`, `docs/glyph-settings-architecture.md`, and `docs/glyph-platform-pattern-library.md` were read but not modified this phase (their content directly informed this phase's design decisions, cited inline above).

**Phase 4 (Profile) was not started**, per the explicit instruction to stop after Phase 3.

---

## Phase 3 — Verification Pass (2026-09-16)

Independent re-verification of the Phase 3 dashboard, not assuming the original Phase 3 report's claims were correct. Two real bugs found and fixed (both in-scope, no redesign). Live browser interaction remained unavailable for a **new, distinct reason** this pass — recorded precisely below rather than repeating the prior phases' reason without checking.

### What was verified, and how

**CODE VERIFIED** (read every line of `app/dashboard/page.tsx`, `DashboardClient.tsx`, and all six new components; traced every query's filters/joins/ordering/limits; traced every `Link` destination against the actual route tree on disk):
- All 7 `NextAction` states, their exact precedence, and their destinations.
- All Attention/Activity/Network/Other-Projects/Secondary-Links data flows.
- Every rendered link destination exists as a real route (`find` confirmed `page.tsx` present for all 14 distinct destinations used).
- No hardcoded numbers, mock arrays, placeholder data, "coming soon," TODO/FIXME, or `console.log` anywhere in the seven Phase 3 files (`grep` returned zero matches).
- Migrations still exactly 22 files, `022_...` still the latest — no new migration this pass. `app/actions/*` diff unchanged from Phase 1 — no server action touched.

**SQL VERIFIED** (executed against the live database, `adiovtzggkpzrfqmevyx`, inside rolled-back transactions):
- The exact SQL-join shape underlying the dashboard's four trickiest queries (collaboration applications, playtest sessions, devlog-by-project-owner, notifications) returns structurally correct results against real Phase 1 fixture data.
- A second, stronger pass this time: the **actual RLS-scoped filters**, run under `set local role authenticated` + `request.jwt.claims` role-impersonation (the same methodology used to verify migrations 017–022), confirmed: (1) the dashboard owner (user A) correctly sees a real pending collaboration application and a real pending playtest session inserted as fixtures; (2) the applicant (user B) cannot see any other applicant's row on A's post when querying with the same filter shape. **3/3 passed.** This is genuine authorization-boundary verification, not just query-shape verification.

**BROWSER — could not be performed, new specific reason:** three fresh-signup attempts were made this pass (after starting a clean dev server on port 3000, distinct from a pre-existing "prod" server on port 3001 that was already running but not started by this session and not trusted to reflect the latest code). The third attempt got past the previously-blocking email rate limit entirely — signup succeeded — but Glyph's auth flow then required a 6-digit email verification code sent to the signup address. **This environment has no access to that inbox.** This is a genuinely different blocker than Phases 1–2's rate limit or Phase 1's lost-session issue, and is recorded as such rather than conflated with the earlier ones. No workaround was attempted (reading email is not something this session has tooling for, and none was sought out). **Net result: zero live-browser interaction with the dashboard was performed this pass. Every "COMPLETE" verdict below is a code/SQL verdict, not a functional/rendered one — stated explicitly per state.**

### 15-state matrix — verified classification

| # | State | Classification | Basis |
|---|---|---|---|
| 1 | Brand-new user | COMPLETE (code) | `!currentProject` branch renders `CurrentWork`'s empty state unconditionally; every other section independently handles its own zero-data case (verified each has a real empty-state branch, not a shared generic one) |
| 2 | No project | COMPLETE (code) | Same as #1 |
| 3 | Project, no devlog | COMPLETE (code) | `!latestDevlog` → `write_first_devlog`; UI shows "No devlogs posted yet." — **noted limitation, not a bug**: cannot distinguish "never wrote one" from "wrote one but never published it," since the query filters `published_at is not null`. Both render identically. |
| 4 | Active project | COMPLETE (code) | `continue_building` when not stale and no higher-priority attention item |
| 5 | Stale project (>14d) | COMPLETE (code) | `daysSince(latestDevlog.published_at) > 14` — arithmetic verified correct (`daysSince` uses `Date.now()` minus the ISO timestamp, divided by `86400000`, matching one day in ms) |
| 6 | Multiple projects | COMPLETE (code) | `otherProjects = projects.slice(1)`, section conditionally rendered only when non-empty — verified `ProjectsOverview` returns `null` for an empty array (not an empty-but-rendered container) |
| 7 | Open playtest, 0 signups | COMPLETE (code) | `openPlaytest && openPlaytest.current_testers === 0` — correctly scoped to `currentProject` only (confirmed by the query's `.eq('project_id', currentProject.id)`) |
| 8 | Open playtest, has signups | PARTIAL (code) | The state matrix in the original report conflated two different things: "has signups" and "has *undecided* (status='requested') signups" are not the same. If every existing session for the current project's open playtest is already `accepted`/`completed`/`skipped`, `sessions.length` (which only counts `status='requested'` rows, and — critically — **across all of the user's playtest requests, not just the current project's**) can be zero even though the playtest has signups. In that case the next-action falls through past `share_playtest` (since `current_testers > 0`) straight to the stale/continue-building check, which is defensible (nothing needs a decision) but the state as literally named in the original matrix ("has signups") is not the condition actually checked. Documented precisely rather than left ambiguous. |
| 9 | Playtest feedback exists | NOT TESTABLE / correctly deferred | No query for this exists at all — the original report already disclosed this as an intentional deferral (no read-tracking on `playtest_feedback`), reconfirmed accurate this pass, not a regression to flag |
| 10 | Pending collab applications | COMPLETE (SQL verified) | Confirmed via the RLS role-impersonation test above — real pending application correctly surfaces to the post author and nowhere else |
| 11 | Following developers | COMPLETE (code) | `feed_items` filtered by `follower_id`, identical to `/feed`'s own query — same source, same semantics, confirmed by direct comparison of the two query strings |
| 12 | No follows | COMPLETE (code) | `followsCount === 0` branch in `NetworkPreview`, correctly checked via a real `count`-mode query on `follows`, not inferred from `feed_items` being empty (which would conflate "no follows" with "follows exist but posted nothing yet" — the code correctly avoids that conflation) |
| 13 | Unread notifications | COMPLETE (code) | Verified `nav.unreadNotifications` (a separate `head:true` count query in `getSidebarIdentity()`) and the 5-row preview query use identical filter predicates (`recipient_id=user`, `read_at is null`) — cannot disagree except in a same-millisecond race, immaterial |
| 14 | Studio owner/member | PARTIAL (code) | `SecondaryLinks` correctly relabels "Studios" → "Studio activity" when `hasStudio`, but — as the original report already disclosed — this is a label change only, not a real data-backed preview (no studio activity-log table exists). Confirmed accurate, not a new gap. |
| 15 | Publisher-enabled | COMPLETE (code) | `hasPublisherAccount` correctly gates the "Publisher tools" link's presence entirely (verified via the conditional spread `...(hasPublisherAccount ? [...] : [])`, not a hidden-but-rendered element) |

**None of the above are BROKEN.** Two real, narrower bugs were found and fixed outside the 15-state framing (below) — they don't change any state's classification but are real defects in the code that shipped.

### Query verification — full trace

Every query re-traced for table/filters/scoping/joins/ordering/limits/null-handling (see the implementation plan's own Phase 3 table for the full list, not repeated here). New findings from this pass, beyond what was already documented:
- **`collaboration_applications`/`playtest_sessions` Attention queries are correctly global** (not scoped to `currentProject`) — this is the right product behavior (a user should be told about *any* pending decision, not just ones on their most-recently-updated project) but creates a real **visual-coherence gap**: `CurrentWork` displays Project X's title/image/devlog while its own CTA button can point at an attention item that belongs to a completely different project Y. Not broken — the link is correct and the copy is accurate on its own terms — but the card visually implies the action is about the shown project when it may not be. Documented as a genuine UX-precision finding, not fixed this pass (fixing it well would mean either scoping attention items per-project — changing product behavior, out of this pass's "no redesign" scope — or restructuring the card to visually decouple the CTA from the project identity, which is a design change, not a bug fix). **Left as a documented, deferred finding**, not silently accepted as fine.
- No query can leak another user's data — every Attention/Activity query is both explicitly filtered in the query string AND independently constrained by RLS (confirmed for `collaboration_applications`/`playtest_sessions` via the SQL-verified role-impersonation test above; `notifications`/`follows`/`feed_items` were already RLS-scoped by `recipient_id`/`follower_id` predicates matching existing, previously-verified policies, not newly introduced this phase).

### CTA precedence verification

Confirmed by direct code read (`app/dashboard/page.tsx` lines ~188–205), the actual `if/else if` chain, in order: no project → no devlog → pending applications → pending playtest decisions → open-playtest-zero-signups → stale-vs-continue. **Applications always outrank playtest sessions** when both are non-empty (confirmed by chain order, not assumed). One precedence subtlety not previously stated explicitly: **"pending applications" and "pending sessions" are evaluated globally across all of the user's projects/posts, while every other branch in the chain is scoped to `currentProject` only** — meaning the CTA can "jump" to an unrelated project's attention item ahead of anything about the currently-displayed project. This is the same finding as the query-verification note above, stated here specifically as a precedence fact per the task's request to "document the actual precedence rather than assuming it."

### Link/route verification

All 14 distinct destination routes used by the dashboard confirmed present on disk (`find`-verified, listed in the tool trace). **One real bug found and fixed**: `CurrentWork.tsx`'s "Latest devlog" link built `` `/p/${username}/${project.slug}/${latestDevlog.slug}` `` with no guard on `project.slug` being non-null, inconsistent with the adjacent `projectHref` on the very next lines, which does guard it (`project.slug ? ... : ...`). Since `Project.slug` is nullable in the schema (`lib/supabase/types.ts`), and the standard creation form enforces it as required but the database itself does not, this was a real, if narrow, latent bug — fixed by adding the same guard (falls back to plain, unlinked text when `project.slug` is null).

### Real-data verification

Zero exceptions found. `grep` across all seven Phase 3 files for hardcoded numbers/mock arrays/placeholder data/fake names/fake timestamps/"coming soon"/TODO/FIXME/`console.log` returned nothing.

### Responsive verification

**CODE VERIFIED, NOT BROWSER VERIFIED at any of the six required widths** — no live session was available (see above). Structural review: the entire dashboard is a single `max-w-2xl` vertical column with no multi-column grid anywhere except `CurrentWork`'s own internal `flex-col sm:flex-row` image row, which stacks below `sm:`. All list rows use `flex ... gap-3` with `truncate`/`shrink-0` applied to the correct sides (text truncates, timestamps and avatars don't), which is the correct pattern to prevent overflow at narrow widths — but this is a structural read of the Tailwind classes, not a rendered confirmation that text actually wraps/truncates as intended in a real browser at 375px. **Two touch-target fixes made this pass** (see Bugs Fixed) bring `NetworkPreview`'s suggested-developer chips and its "View all activity" footer link up to the 44px minimum the rest of the dashboard already met — both were previously under it (`py-1.5`/`py-2.5` ≈ 32–40px).

### Accessibility verification

**CODE VERIFIED, NOT BROWSER VERIFIED** (no keyboard/screen-reader testing performed — no live session). Confirmed by direct read: exactly one `<h1>` (`DashboardClient.tsx`'s workspace-identity line) and six `<h2>`s (one `SectionHeading` per section), a clean, non-skipping hierarchy. Every interactive row is a real `<Link>`, not a `<div onClick>` — keyboard focus and Enter-activation are native, not simulated. No tooltip-only information anywhere. All `<img>` tags use `alt=""` correctly (decorative — the accompanying text already carries the meaning), not missing alt attributes. Touch targets: fixed two sub-44px elements this pass (above); the rest were already ≥44px by construction (`px-4 py-3` list rows, `min-h-11` pills).

### UX/design verification

No equal-weight card grid returns — the old three-card grid is fully gone, replaced by a hierarchy where the current project is visually dominant and everything else is a compact list. No fake statistics anywhere (confirmed by the real-data grep above). "Welcome back, Deep" is gone, replaced by a deliberately quiet `<h1>`. One remaining pattern worth naming honestly: six stacked sections, several of which will very often be simultaneously empty for a new or lightly-active user (Attention, Activity, Network, Other Projects can all show empty/dashed-border states at once) — this risks reading as "a lot of boxes saying nothing," which is a real, if milder, echo of the "generic template" problem the redesign was meant to solve, even though each individual empty state is now contextual and specific rather than one shared generic component. Not fixed this pass (would require either collapsing/hiding empty sections or a different information density decision — a design change, not a bug), but named plainly rather than left for someone else to discover.

### Competitive-pattern cross-check

Re-confirmed against the pattern library without new research: persistent daily-check home (yes — this *is* the dashboard, correctly `/dashboard`, in primary nav); current work first (yes — `CurrentWork` is the first section); activity/momentum (partial — devlog recency shown, but the broader "momentum" profile-level signal remains Phase 4's scope, correctly not duplicated here); actionable attention (yes, and now SQL-verified as correctly scoped by RLS); network activity (yes, reuses `/feed`'s own source, no second algorithm); compact secondary work (yes — `SecondaryLinks` is a pill row, not panels); curated-vs-chronological distinction (not yet — no Featured concept exists on the dashboard, correctly deferred to Phase 4 per the original scope boundary); no fake gamification (confirmed, zero found).

### Security regression verification

Migrations 017–022 confirmed unmodified (file count and filenames unchanged). No RLS policy was touched, added, or weakened this phase or this verification pass. The one new SQL test performed this pass (role-impersonation check on the Attention queries) is additive verification, not a policy change, and confirmed existing policies already correctly prevent cross-user data exposure through the new dashboard queries.

### Regression check

`app/actions/*` diff unchanged from Phase 1 (confirmed via `git diff --stat`, identical line counts). `AppShell.tsx` was not touched this phase or this verification pass — the mobile drawer, primary nav, and `SecondaryNav` code are exactly Phase 2's, only *consumed* (not modified) by the new `DashboardClient.tsx`. Build output route list unchanged (identical set of routes to Phase 2's build). **Not browser-verified**: actually opening the mobile drawer, clicking through Feed/Explore/Playtesting/Collaboration/Studios/Publisher/Jams/Events/Notifications from a real session. Code-level risk is low (nothing in those surfaces was touched), but "low risk" is stated as exactly that, not as "verified."

### Bugs found

1. `CurrentWork.tsx` — unguarded `project.slug` in the "Latest devlog" link, inconsistent with the adjacent guarded `projectHref`. **Real, fixed.**
2. `NetworkPreview.tsx` — two elements (suggested-developer chips, "View all activity" footer link) under the 44px touch-target minimum. **Real, fixed.**
3. Attention-item/CurrentWork visual-coherence gap (CTA can reference a different project than the one displayed) — **real, documented, not fixed** (fixing it is a design decision, not a bug fix, per this pass's explicit scope boundary).
4. State #8's "has signups" framing in the original report was imprecise (conflates "any signup" with "any undecided signup," and undersells that it's evaluated across all projects, not just the current one) — **documentation-accuracy issue, corrected in this document, not a code bug.**

### Bugs fixed

#1 and #2 above. Typecheck/lint/build re-run clean after both fixes (see below).

### Remaining verification debt

Everything marked "NOT BROWSER VERIFIED" above: all six responsive breakpoints as rendered pages, all 15 states as actually-rendered UI, keyboard/focus/screen-reader behavior, and every dashboard CTA/link as an actual click rather than a traced `href` string. This debt is carried forward, not resolved by this pass, and should be paid down the moment a live authenticated session becomes available (whether via email-OTP access, a different auth method, or the rate limit clearing) — it is not safe to assume the remaining risk is zero just because the code and SQL layers check out.

### Exact files changed this pass

`components/dashboard/CurrentWork.tsx` (null-slug guard fix), `components/dashboard/NetworkPreview.tsx` (two touch-target fixes). No other files modified. No migration added.

### Build/typecheck/lint result

`npx tsc --noEmit`: clean. `npm run lint`: zero new errors/warnings (re-checked against the two changed files specifically). `npm run build`: succeeded, identical route list to before this pass.

**Phase 4 was not started at the time this line was written** — see the full Phase 4 section below.

---

## Phase 4 — Profile (2026-09-16)

### Product decisions

- **Information hierarchy**: Identity → Current Work → Activity/Momentum → About → Featured → Projects → Devlogs → Collaboration → Links, per the task's proposed order — no deviation was justified by the data.
- **Featured/Pinned implemented as a `devlog_posts.is_featured` boolean**, not a new content type or join table. Devlogs are Glyph's atomic core-loop object across every product doc in this engagement; a small owner-curated set of them is the smallest schema addition that satisfies the LinkedIn-Featured/GitHub-Pinned pattern independently validated in `docs/glyph-platform-pattern-library.md` §2. Cap of 3 enforced in `app/actions/devlogs.ts`, application-level (matching the existing precedent of other soft caps in this codebase, e.g. the 5-open-playtest-request cap), not a DB constraint.
- **Owner vs. visitor is resolved by one boolean (`isOwner`) driving different primary actions** (Edit profile vs. Follow) on an otherwise identical template — matching the LinkedIn pattern of one page template with ownership-conditional affordances, not two separate page structures.
- **No new settings system was created.** Editing remains at `/settings/profile`, already correctly separated from Account/Security/Notifications/Danger Zone (confirmed unchanged, matches the mature-platform separation the task asked to verify, not rebuild).
- **No new visibility/privacy system was built.** Two genuine, pre-existing RLS gaps were found and fixed instead (see Security below) — this is "ensure the public profile does not leak protected information" (explicitly in scope per Phase 19) rather than "build Phase 10's Privacy settings" (explicitly out of scope).

### Existing profile behavior (reconstructed before touching code)

Confirmed by reading `app/dev/[username]/page.tsx` as it stood before this phase: identity block (avatar/name/username/location/availability), follower/following counts with working links, a Follow button that already correctly self-hid on one's own profile and when signed out, Block/Mute controls, bio, three identity badges (role/engine/experience), external social links, a single "Current Project" card sourced from `is_primary`, and a "Member since" footer. Editing already lived at `/settings/profile` via `EditProfileForm`. No Featured concept, no Projects-list-beyond-primary, no Devlogs-on-profile, no Collaboration-availability-detail, and — critically — **no owner-specific action at all**: the Follow button's self-hide logic meant an owner viewing their own profile saw no primary action in its place.

### New profile architecture

Six new components under `components/profile/` (`ProfileHeader`, `CurrentProjectCard`, `FeaturedToggleButton`, `DevlogRow`, `ProjectsList`, `CollaborationCard`) compose the page; `app/dev/[username]/page.tsx` was rewritten to fetch all real data in parallel and render the full hierarchy. The "plasma" visual shell, top bar, and footer are unchanged — this phase changed the profile's *content model*, not its established visual language, per the instruction not to redesign the whole design system.

### Owner vs. visitor matrix

| State | Header action | Featured section | Devlog star toggle | Block/Mute | Notes |
|---|---|---|---|---|---|
| A. Own profile, authenticated | "Edit profile" → `/settings/profile` | Shown (even empty, with a hint) if owner | Visible on every devlog row | Not shown (can't block yourself) | |
| B. Another authenticated user's profile | Follow button | Shown only if featured items exist | Not shown | Shown | |
| C. Unauthenticated visitor | Neither (Follow returns `null` without a session — pre-existing behavior, confirmed unchanged) | Shown only if featured items exist | Not shown | Not shown | **Live-verified this pass**, see Browser verification |
| D. No projects | Current Work shows a specific empty state, contextual copy differs for owner ("You haven't started a project yet." + CTA) vs. visitor ("{name} hasn't published a project yet.") | — | — | — | |
| E. One project | No "Other Projects" section (only shown when `otherProjects.length > 0`) | — | — | — | **Live-verified this pass** (Deep has exactly one project) |
| F. Multiple projects | "Other Projects" section renders, compact rows | — | — | — | Code-verified only |
| G. No recent activity | "Recent Devlogs" shows a specific empty state, owner/visitor copy differs | — | — | — | **Live-verified this pass** ("Deep hasn't posted a devlog yet.") |
| H. Recent activity exists | Devlog rows render with real timestamps via `relativeTime()` | — | — | — | Code-verified only (no fixture with published devlogs was live-tested) |
| I. Featured content exists | Featured section shows amber-tinted rows | — | Toggle shows filled star | — | Code-verified only |
| J. No featured content | Section hidden entirely for visitors; shown with a hint only for the owner | — | — | — | **Live-verified this pass** for the visitor case (no Featured section appeared for Deep, who has none) |

### Current work

`CurrentProjectCard` reuses the exact conceptual pattern from Phase 3's dashboard `CurrentWork` (image, stage badge, "Updated Xd ago", primary CTA) but is a distinct, profile-scoped component — not a shared import — since the dashboard's version carries dynamic next-action logic that has no meaning on a public-facing page. Reciprocal linking confirmed already correct in both directions: the project page's footer already links back to the developer (`app/p/[username]/[project-slug]/page.tsx`, pre-existing, unchanged), and the profile's Current Project card links forward to the project.

### Activity/momentum

A single line ("Last posted {title} {relative time}"), derived from the most recent item across the already-fetched Featured+Recent devlog lists — no new query. No graphs, streaks, or scores, per the explicit instruction; this is the exact pattern independently validated by the earlier research (GitHub's Pinned-repos-as-counterweight-to-its-own-criticized-contribution-graph, `docs/glyph-platform-pattern-library.md` §2).

### Featured/Pinned

Implemented as described above. **Two real, pre-existing security gaps were discovered and fixed while building this feature** (see Security section) — both were prerequisites for Featured to be safe to build at all, since Featured queries read `devlog_posts` directly rather than going through a page route's own app-level visibility check.

### Projects

`ProjectsList` — compact rows (title, "Current" badge, stage badge, "Updated Xd ago"), explicitly not a card grid, only rendered for projects beyond the current one. Handles 0/1/many correctly (section absent for 0-1, per the matrix above).

### Devlogs

`DevlogRow`, shared between the Featured and Recent Devlogs sections, explicitly labeled "Recent Devlogs" (chronological) as distinct from "Featured" (curated) — the two sections never show the same devlog twice, since the Recent query explicitly excludes `is_featured=true` rows.

### Collaboration

`CollaborationCard` — shows the existing `collaboration_status`-derived availability sentence plus up to 3 real, open `collaboration_posts` authored by this developer, each linking to the real post. **Live-verified this pass**: Deep's real Phase-1 fixture collaboration post ("Seeking: Artist", "Revenue Share") rendered correctly, live, in the browser.

### Followers/following

Unchanged from the pre-existing implementation — confirmed still correct (counts, links, self-follow prevention via `FollowButton`'s own `currentUserId === targetId` guard, unmodified this phase).

### Profile editing

Unchanged — `/settings/profile` remains the dedicated edit surface, correctly separated from Account/Security/Notifications/Danger Zone. No new settings system was built.

### Visibility/privacy — two real bugs found and fixed

**Discovered while auditing what a public profile page can leak**, not hypothetically — both confirmed exploitable via live SQL role-impersonation tests before being fixed, and re-verified after:

1. **`projects` table had no real RLS enforcement of its own `visibility` column.** The original `002_projects.sql` SELECT policy was `using (true)` — unconditional — and `003_devlogs.sql` later added the `visibility` column without ever updating that policy. Confirmed live: an anonymous request could read a `private` project's full row directly. Fixed in `023_fix_projects_visibility_rls.sql`: `visibility in ('public','unlisted') or auth.uid() = owner_id`. 6/6 SQL tests passed (anon blocked from private, allowed public/unlisted, owner still sees own private, no regression on existing public data).
2. **`devlog_posts`' read policy never checked the parent project's visibility**, only `published_at`. Confirmed live: an anonymous request could read a devlog belonging to a `private` project. Fixed in `024_fix_devlog_posts_project_visibility_rls.sql`, adding an `exists (select ... from projects where visibility in ('public','unlisted'))` clause. 3/3 SQL tests passed.
3. **A third, related bug surfaced while verifying #2**: `devlog_posts`' UPDATE policy (`Authors can update own devlogs`) had `USING (auth.uid() = author_id)` but no `WITH CHECK` — the same bug class as `021_fix_studios_update_missing_with_check.sql`, but on a different table. Confirmed live-exploitable: an author could reassign their own devlog's `project_id` into a project they don't own. **Note documented in the migration itself**: a naive `WITH CHECK (auth.uid() = author_id)` (mirroring 021's exact fix) would *not* actually have closed this specific hole, since `author_id` isn't the column being abused — the correct fix (`026_fix_devlog_posts_update_missing_with_check.sql`) additionally verifies the *new* `project_id` belongs to a project the author owns. 4/4 SQL tests passed (exploit blocked, ordinary title edits unaffected, the Featured toggle itself unaffected, legitimate self-owned project reassignment still allowed).

All three fixes were verified via `get_advisors` (security) to introduce zero new findings, and via direct re-run of every relevant negative/positive test case.

### Profile completion

Not touched — the dashboard's existing profile-completion logic (`app/dashboard/page.tsx`) is a separate, already-correct source of truth; nothing in Phase 4 duplicates or recalculates it.

### Responsive behavior

**Genuinely browser-verified this pass** (a first for this engagement) at 375px, 768px, and 1440px against the live, real `/dev/deep` profile — screenshots confirmed: no horizontal overflow at any width, correct `flex-col sm:flex-row` header stacking (vertical on mobile, horizontal from `sm:` up), badges wrapping correctly, the "Current Project" card and Collaboration card both reflowing cleanly, and the page correctly staying capped at `max-w-3xl` on desktop (centered, not stretched) rather than leaving "unusually empty desktop space" as an unintended side effect — it's the same deliberate width constraint the pre-existing page already used. 390px, 1024px, and 1280px were **not** individually screenshotted (time-boxed to the three most structurally distinct breakpoints: narrowest mobile, the stack-to-row transition point, and full desktop) — code review confirms no additional breakpoint-specific classes exist between the three that were tested, so the untested widths are treated as low-risk, not zero-risk.

### Accessibility

**Partially browser-verified**: keyboard `Tab` navigation confirmed live — a visible indigo focus ring correctly appeared on the followers-count link after 3 tab-stops from the page load, confirming focus-visible styling (inherited, unmodified, from `app/globals.css`) works correctly against the new component structure. Exactly one `<h1>` (the developer's name, in `ProfileHeader`) confirmed by direct code read, with `<h2>`s for every section ("Current Project," "Featured," "Other Projects," "Recent Devlogs") — a clean, non-skipping hierarchy. Every interactive element is a real `<Link>` or `<button>`, not a `div` with a click handler. Touch targets: found and fixed two sub-44px elements this phase (`FeaturedToggleButton` was 32px, fixed to 44px; `CollaborationCard`'s post-link rows were ~36px, fixed to a `min-h-11` pattern matching Phase 3's established convention). Screen-reader-specific testing (announced labels, landmark navigation) was **not** performed — no screen-reader tooling was exercised, only visual focus-ring confirmation and code-level `aria-label` review (`FeaturedToggleButton` carries one).

### Route/link audit

Traced every link the new page renders: `/settings/profile`, `/dev/[username]/followers`, `/dev/[username]/following`, `/p/[username]/[slug]`, `/p/[username]/[slug]/[devlog-slug]`, `/dashboard/projects/new`, `/collaborate/[id]` — all confirmed present via `find`/build output, and the three most-used ones (`followers`, `following`, the project link) **additionally confirmed live and correct** via the browser's own accessibility-tree read (`read_page`) against the real rendered page. No dead links found. No `href="#"` anywhere in the new files.

### Security/RLS

Migrations 017–022 confirmed untouched (file list, not content-diffed again this phase since no tool touched them). Three new, narrowly-scoped migrations added (023, 024, 026) plus one additive schema migration (025) — all four justified above, none weaken any existing policy, and all were verified in both directions (the bug blocked, and every legitimate use case re-confirmed still working) before being considered complete. `get_advisors` re-run after every migration showed zero new findings.

### Bugs found

1. `projects` RLS: private projects fully readable by anyone (pre-existing, since migration 002/003 — not introduced this phase, but directly implicated by Phase 4's own data surface and explicitly required to be checked by Phase 19).
2. `devlog_posts` RLS: devlogs on private projects fully readable by anyone (same category, surfaced while building Featured).
3. `devlog_posts` UPDATE policy missing `WITH CHECK`, allowing project-reassignment across ownership boundaries (same bug class as migration 021, different table).
4. Owner had no primary action on their own profile (Follow button silently disappeared with nothing in its place) — a real, if minor, UX gap, not a security issue.
5. Two touch targets under 44px in new Phase 4 components.

### Bugs fixed

All five. 1–3 via migrations 023/024/026 (SQL-verified, live-tested). 4 via `ProfileHeader`'s owner-conditional "Edit profile" link. 5 via padding fixes in `FeaturedToggleButton` and `CollaborationCard`.

### Files changed

**New:** `app/actions/devlogs.ts`, `components/profile/ProfileHeader.tsx`, `components/profile/CurrentProjectCard.tsx`, `components/profile/FeaturedToggleButton.tsx`, `components/profile/DevlogRow.tsx`, `components/profile/ProjectsList.tsx`, `components/profile/CollaborationCard.tsx`, `supabase/migrations/023_fix_projects_visibility_rls.sql`, `supabase/migrations/024_fix_devlog_posts_project_visibility_rls.sql`, `supabase/migrations/025_add_devlog_featured.sql`, `supabase/migrations/026_fix_devlog_posts_update_missing_with_check.sql`.
**Rewritten:** `app/dev/[username]/page.tsx`.
**Modified:** `lib/supabase/types.ts` (added `is_featured` to the `DevlogPost` type, for correctness/completeness — purely additive, no behavior change).

### Database/migrations

Four new migrations (023–026), continuing the sequence from Phase 1's `022`. One additive column (`devlog_posts.is_featured`), three RLS policy fixes. No table was dropped or renamed; no existing policy's *legitimate* access was narrowed (every fix was verified to preserve all real, intended access patterns).

### Typecheck/lint/build

`npx tsc --noEmit`: clean throughout (re-run after every code change). `npm run lint`: zero errors/warnings in any Phase 4 file. `npm run build`: succeeded, `/dev/[username]` and its sub-routes present and unchanged in the route list.

### Browser verification — genuinely performed this pass, and precisely what was/wasn't

Unlike every prior phase in this engagement, **live browser verification was actually achieved this time**, for the unauthenticated-visitor path specifically (no login required, so the recurring auth blockers — lost session, rate limit, and this session's new email-OTP-with-no-inbox-access blocker — don't apply to this one path). Performed against the real `/dev/deep` profile, on a freshly started dev server:
- **BROWSER VERIFIED**: full page render and content correctness for an anonymous visitor (identity, current project with real `relativeTime()` output "9h ago", role/engine/experience badges, empty-state copy for no-devlogs, the real Phase-1 collaboration-post fixture rendering correctly, "Member since June 2026" footer); zero console errors beyond a pre-existing, unrelated Vercel Analytics CSP block; zero server errors; responsive correctness at 375/768/1440px; keyboard-focus-visible confirmed via live Tab navigation; all rendered links confirmed present and correctly targeted via the browser's own accessibility tree.
- **NOT BROWSER VERIFIED (blocked)**: any owner-state interaction (Edit-profile button, the Featured star-toggle's actual click behavior, `setDevlogFeatured` executed through a real browser session) and any signed-in visitor state (Follow button click, Block/Mute click) — all of these require an authenticated session, and every attempt to establish one this pass hit the same blocker as the prior verification pass: a fresh signup got past the earlier rate limit but stopped at a 6-digit email-verification code this environment cannot retrieve (confirmed via direct database check: `email_confirmed_at` is `null` for the test account). No credential-store workaround was attempted.
- **CODE + SQL VERIFIED only**: every owner/visitor branch not covered by the live anonymous-visitor test above, and all cross-user security boundaries (verified via RLS role-impersonation SQL tests in rolled-back transactions, not through the UI).

### Remaining limitations

- No authenticated browser state (owner view, Featured toggle interaction, Follow/Block click-through) was live-tested — carried forward as verification debt, same as every prior phase, though narrower than before since the unauthenticated path is now genuinely covered.
- 390px, 1024px, and 1280px breakpoints were not individually screenshotted (time-boxed to the three most structurally distinct widths).
- Screen-reader-specific accessibility testing (as opposed to focus-visible/keyboard testing) was not performed.
- No dedicated "no follows yet" or "has featured content" fixture existed to live-test those specific empty/populated states — both are code-verified only.

### Explicit Phase 5 deferrals

Project page redesign (Steam three-views model, per the product-model research) — not touched this phase beyond confirming the existing reciprocal link is correct. Devlog page redesign — untouched. Feed/Explore/Search — untouched. A community/discussion layer on the project page — explicitly not recommended yet (no evidence of need). Settings/Privacy category expansion — the two RLS fixes made here are data-safety prerequisites, not the Phase 10 Settings/Privacy UI work itself, which remains fully deferred.

---

## PHASE 5 — PROJECT + DEVLOG (2026-09-21)

### 1. Product model

A **Project** is the canonical public record of a game being built: one URL, `/p/<username>/<project-slug>`, that answers "what is this, who makes it, where is it now, what has happened, can I help or play it". A **Devlog** is that project's chronological record — dated entries with permanent URLs, not a free-floating blog. The project page is a single-column document (identity → links → about → screenshots → devlog timeline → playtest → collaboration), not a dashboard of cards. Management (edit, write, manage playtest) stays under `/dashboard/projects/[id]/*` and is reached from contextual controls that only the owner sees on the public page.

### 2. Hierarchy

Cover (if present) → identity (stage, current-project marker, title, one-line pitch) → creator line (avatar + name → profile, studio → studio page) → state line (started date, last devlog relative time, devlog count) → owner action bar (owner only) → engine/genre/tags → external links → About → Screenshots → Devlog timeline → Open playtest (only if one is open) → Looking for collaborators (only if this project has open posts) → publisher actions (publisher viewers only).

### 3. Canonical-object decision

One canonical project route. No `/store`, `/community`, or `/library` variants of a project.

### 4. Steam-pattern decision

Steam splits a game into Store (persuade), Hub (community), and Library (owner manage). Glyph does **not** need three routes: (a) *showcase* is the public page; (b) *owner management* already lives under `/dashboard/projects/[id]/*` and is surfaced contextually on the public page for the owner; (c) *community* currently exists as comments and reactions on individual devlogs — object-level, where the conversation actually is. A separate project-level community page would be empty at current volume and would split the conversation from the devlog it is about. Revisit only if per-project discussion outgrows devlog comments.

### 5. Owner vs visitor

| Element | Visitor | Owner |
|---|---|---|
| Edit project / Write devlog | hidden | shown |
| Visibility notice (private/unlisted) | hidden (private 404s; unlisted is by-link) | shown |
| Draft devlogs in timeline | hidden (also blocked by RLS) | shown, marked "Draft · only you", with edit link |
| Per-row edit pencil | hidden | shown |
| Playtest action | "View & sign up" → `/playtests/[id]` | "Manage playtest" → `/dashboard/playtests` (previously the owner saw "Sign Up to Test") |
| Shortlist / contact developer | publisher accounts only | hidden |

### 6. Project ↔ profile

Project → profile: top-bar back link and creator line (both `/dev/<username>`). Profile → project: unchanged from Phase 4 (current-project card, projects list, featured devlogs all link to the project/devlog URLs).

### 7. Project ↔ studio

Studio name(s) show in the creator line, linking to `/studios/<slug>`, only for `active` studios. Studio pages already list their projects. Reading `studio_projects` is public by existing policy; the *write* path is now ownership-checked (see RLS changes).

### 8. Devlog architecture

- Slug = permanent URL and is never changed by edit. `published_at` is stamped once (first publish) and kept on later edits so timeline order never shifts; unpublish sets it to null.
- Timeline on the project page: dated list (date, title, excerpt), newest first.
- Detail page: project context in the header, owner Edit link, draft banner with "Continue editing", previous/next among **published** siblings in publish order (drafts and future-dated posts never appear in prev/next), reactions and comments unchanged.

### 9. Devlog editing (previously missing)

New route `/dashboard/projects/[id]/devlogs/[devlogId]/edit` and server action `updateDevlog(devlogId, {title, content, published})`. Server enforces `author_id = auth user` **and** project owner = auth user, validates/sanitizes title and content, and never touches the slug. RLS independently enforces the same (migration 026 for update). `DevlogForm` now has create and edit modes with correct button labels and post-save routing (published → devlog page, draft → project page). Create no longer navigates to the dashboard list.

### 10. Playtesting

Restrained single row, only when a playtest is open. Viewer-contextual action (see table). Detail/sign-up flow untouched.

### 11. Collaboration

Open, unexpired collaboration posts attached to this project appear as a short list linking to `/collaborate/[id]`. Section is absent when there are none — no "not looking" placeholder. Profile-level collaboration (Phase 4) untouched.

### 12. Comments / reactions

Unchanged, still object-level on the devlog page (`ReactionsBar`, `CommentThread`, notification wiring from the earlier phase).

### 13. Visibility / security

Private project: 404 for everyone but the owner (page-level check + RLS). Unlisted: reachable by link, owner sees a notice. Draft devlogs: 404 for non-owners (page-level + RLS). The unlisted/private badge is no longer shown to visitors (previously every viewer of an unlisted project saw "Unlisted"). Media and link URLs are https-only: validated on save (`ProjectForm`) and re-filtered at render (`isHttpsUrl` in `lib/utils.ts`) so previously stored non-https values cannot render as `<img src>` / `<a href>`.

### 14. Database changes

No schema changes. Two policy-only migrations (below).

### 15. RLS changes

- **027 `fix_devlog_posts_insert_project_ownership`** — "Authors can insert devlogs" only checked `author_id`; user B could insert a published devlog into user A's project and it rendered on A's page. Now also requires the target project be owned by the author. Verified both directions.
- **028 `fix_project_link_ownership_rls`** — found because the page now renders studio and collaboration links. (a) `studio_projects_insert` checked studio membership only, so a studio admin could attach *any user's* project to their studio; (b) `collab_posts_insert` checked `author_id` only, so any user could create a collaboration post pointing at someone else's project; (c) `collab_posts_update` had no WITH CHECK, so `project_id` could be re-pointed after creation. All three confirmed exploitable with authenticated-role SQL, then fixed: the linked project must be owned by the acting user (collab posts may still have a null project). Re-tested: exploits blocked; attaching own project, creating own-project and project-less collab posts still work; re-pointing to another user's project blocked. Migrations 017–026 were not modified.

### 16. Routes

Added: `/dashboard/projects/[id]/devlogs/[devlogId]/edit`. Changed behavior only (no new URLs): `/p/<user>/<project>`, `/p/<user>/<project>/<devlog>`, `/dashboard/projects/[id]/edit` (now also takes `username` so it can return to the public page), `/dashboard/projects/[id]/devlogs/new`. All new links checked against existing route files.

### 17. Components

New: `components/project/DevlogTimeline.tsx`. Changed: `DevlogForm`, `ProjectForm`. `DevlogCard` is no longer used on the project page (still used elsewhere).

### 18. Responsive

Single column throughout, so the layout does not reflow between breakpoints. Touch targets on new controls are `min-h-11`. Live-checked at 375 and 1440 only (see verification).

### 19. Accessibility

Sections use `<section aria-labelledby>`; timeline is an `<ol>`; devlog prev/next is a labeled `<nav>`; cover and screenshots have descriptive alt text ("<title> cover art", "<title> screenshot N"); the creator avatar is decorative (`alt=""`) next to the visible name; edit pencils have `aria-label`; project form fields have `<label htmlFor>` and inline errors. Live check: one h1, all other headings h2, no horizontal overflow at 375, no interactive element under 40px tall on the anonymous project page. Screen-reader testing not performed.

### 20. Bugs found

1. Devlog insert RLS hole (027).
2. Studio link and collaboration-post RLS holes (028).
3. Devlog editing did not exist.
4. Project owners could not reach their own draft devlogs from anywhere in the UI.
5. Project owners saw "Sign Up to Test" on their own playtest.
6. Project cover image was never rendered.
7. No "Edit project" affordance on the project page.
8. `ProjectForm` could not set cover, screenshots, or external links, and the payload dropped them.
9. Every viewer of an unlisted project saw the "Unlisted" badge.
10. Changing a slug silently broke public URLs with no warning.
11. `ProjectForm` had a `react-hooks/set-state-in-effect` lint error (pre-existing).
12. Devlog page had no previous/next and no owner Edit link.
13. Some links on these pages were under the 44px touch-target convention.

### 21. Bugs fixed

All of 1–13 above.

### 22. Browser verification

Performed, unauthenticated only, on a freshly started dev server against real seeded data (`demo-nova/emberfall-keep`): project page renders cover, identity, creator, state line, tags, links, About, screenshots (all 4 images load), timeline of 3 published devlogs, and the open playtest row with the visitor action; no horizontal overflow at 375; no console errors beyond the pre-existing Vercel Analytics CSP block. Devlog detail: prev/next hrefs correct for the middle post; first post has only "Later", last post has only "Earlier"; no owner controls for a visitor. Private project `/p/demo-nova/private-orbit` → 404; nonexistent devlog → 404. Unauthenticated requests to both edit routes redirect (opaque redirect). **Not browser-verified:** every owner-state interaction (edit project, create/edit/publish/unpublish devlog through the UI, draft visibility in the timeline) and every signed-in-visitor interaction — blocked by the same email-OTP signup blocker as prior phases; no credential workaround attempted. 768px was not screenshotted.

### 23. Remaining limitations

- Owner-state UI is code-, tsc-, lint-, build- and SQL-verified, not browser-verified.
- Media is URL-only (no upload pipeline); `cover_image_url` and `cover_url` both still exist and the page reads whichever is a valid https URL.
- One legacy project row ("Nextwave") has a null `slug` and therefore has no public URL until its owner sets a slug in the edit form; data left untouched.
- Scheduled (future-dated) devlogs are treated as drafts by the owner view; there is no scheduling UI.
- No devlog delete/unpublish control other than the publish toggle in edit.
- `studio_projects` reads remain public by design (a private project's studio link is not itself sensitive, and the project row stays RLS-protected).
- Pre-existing dev-only console CSP error for Vercel Analytics.

### 24. Explicit Phase 6 deferrals

Not done and not started: any redesign of Feed, Explore, Search, Settings, Notifications, Dashboard, or Profile; a project-level community/discussion page; image upload/storage; devlog scheduling; devlog deletion UI; DMs; algorithmic feeds; gamification.

### Verification summary

`npx tsc --noEmit`: clean. `npx eslint app components lib --quiet`: zero errors (the repo-wide `npm run lint` also scans build output and reports thousands of unrelated problems). `npm run build`: succeeded (required network access to Google Fonts; `/p/[username]/[project-slug]`, its devlog child, and the new edit route are in the route list).

SQL role-impersonation tests (rolled-back transactions, real schema) — 23 checks, all as intended: user A cannot read B's private project or its devlogs, cannot read B's draft, cannot update/delete B's projects or devlogs, cannot insert a devlog into B's project, cannot move their own devlog into B's project; A can read B's public/unlisted project and published devlog and edit their own devlog; anon reads public project + published devlog, cannot read private project, drafts, or devlogs of private projects, cannot update; B reads own private project and draft, edits and publishes own draft. Plus the six studio/collaboration checks under 028.

---

## PHASE 6 — FEED + ACTIVITY (2026-09-21)

### Reconstruction (what the Feed actually was)

1. **Generator:** only `devlog_posts` (published, non-future, parent project `public`). Nothing else ever produced a feed row.
2. **Source:** the `feed_items` view (migration 004): `devlog_posts ⨝ projects ⨝ profiles ⨝ follows`. One row per (follower, devlog); the `follows` primary key makes duplicates impossible.
3. **Follow effect:** rows exist only for authors the viewer follows; unfollow removes them immediately. No Feed-specific graph; `follows` is the only relationship table.
4. **Own posts:** never appear (the `follows` CHECK forbids self-follow), so the Feed was already network-only by construction.
5. **Ordering / paging:** `published_at desc`, hard `limit(50)`, no cursor, no "more", no end marker — anything past the 50th was unreachable.
6. **Deleted/private:** deleted devlogs vanish (no row); private/unlisted projects and drafts/future posts are excluded by the view's WHERE.
7. **Block/mute:** **ignored** (the `user_blocks`/`user_mutes` tables were referenced only by the profile page and moderation actions).
8. **Reactions/comments:** not shown in the Feed at all.
9. **Empty state:** one state for "no follows" and "follows but nothing to show"; suggestions were "latest joiners", including people already followed, blocked users, and people with no devlogs.
10. **Backend not used:** none unused. Notifications do not overlap: producers are comment, reaction, follow, publisher and collaboration events; **no notification is created when a devlog is published**.

### 1. Feed product definition

**"What are the developers I follow building right now?"** A read-only, chronological window onto published devlogs from followed developers. It is not an activity log, a discovery surface, or a place to post.

### 2. Feed object types — decision

**Devlogs only.** Candidates considered:

| Candidate | Data model supports it? | Decision and reason |
|---|---|---|
| Devlog published | Yes | **In.** Core loop (Developer → Project → Devlog → Network). |
| Project milestone / "released" | No: `projects.stage` is a mutable column with no history, so there is no event to circulate | **Out.** Would need a stage-change event table (new infrastructure). Devlogs already carry milestone announcements. |
| Playtest opened | Rows exist (`playtest_requests`) | **Out.** A time-bounded request with open/full/closed state, not a dated record; already surfaced on the project page (Phase 5), the developer profile and `/playtests/browse`. Feed would need a UNION over another table and a follow-vs-project semantics decision. |
| Collaboration post opened | Rows exist | **Out.** Same reasoning; lives on `/collaborate`, the project page and the profile. Applications are Notifications. |
| Jam / event activity | Rows exist | **Out.** Community logistics, not core-object activity (Phase 2 reasoning). |
| Studio activity | No activity table | **Out.** No event source at all. |

Revisit only with a product decision: playtest/collaboration entries would need (a) a UNION or event table, (b) a rule for dedupe/expiry, (c) evidence that followers want them there rather than on Explore/Notifications.

### 3. Chronological vs curated

Strictly chronological by `published_at desc, id desc`. No ranking, trending, popularity or recommendation of any kind. The tie-break on `id` makes order total. Curated/featured content is a documented future concept only.

### 4. Feed item anatomy

`ACTOR published a devlog on PROJECT · TIME` → devlog title (the object, link) → 2-line excerpt → read-only reaction totals + comment link. Rows in a divided `<ol>`, not cards. Actor → `/dev/<user>`, project → `/p/<user>/<project>`, title → `/p/<user>/<project>/<devlog>`, comment link → devlog `#comments` (anchor added to the devlog page). Excerpts drop markdown heading lines (shared `markdownExcerpt`), which fixes "The honest post-mortem The original combat…" run-ons; the Phase 5 project timeline uses the same helper.

### 5. Follow relationship

Derived only from `follows`. SQL-verified: follow → items appear; unfollow → gone; existing follow does not override a block.

### 6. Own-content decision

**Network only.** Own devlogs live on the Dashboard and the Profile; keeping them out makes the Feed answer exactly one question. This is now stated in code and docs rather than incidental.

### 7. Empty state

Two distinct states. **No follows:** "Your feed is quiet." + how to fill it. **Follows but nothing visible:** "Nothing new from the developers you follow." + count. Both show *Developers who published recently* (rule printed on the page: ordered by latest public devlog, not personalised; excludes yourself, people you follow, and anyone with a block/mute in either direction) each with the real Follow control, then a link to `/explore`. Suggestions appear only when the feed is empty.

### 8. Loading / pagination

- Page size 20; keyset cursor `?cursor=<published_at>|<id>`; fetches 21 to detect the end; "Older devlogs" link, "Back to latest", end-of-feed line. Server-rendered links, no client state, no infinite-scroll framework — at current volume that would be unjustified complexity, and links keep pages linkable and back-button-safe.
- The cursor keeps PostgREST's raw microsecond timestamp (a `Date` round-trip would truncate and break ties) and is regex-validated; malformed/injection-style cursors parse to `null` (unit-checked).
- Stale cursor with no rows → "No older devlogs".
- `app/feed/loading.tsx` skeleton matches the row layout and respects reduced motion.
- Query failure → inline `role="alert"` with a Reload link; follows are not implicated.

### 9. Block / mute

Enforced in `feed_items` (migration 029), so every page, and the dashboard preview that shares the view, gets it. Hidden when: viewer blocked author; author blocked viewer; viewer muted author. Not hidden when the *author* muted the viewer (mute is the muter's preference). Unblock/unmute restores immediately. Direct object URLs still follow object privacy (unchanged).

### 10. Notifications vs Feed

Kept separate; no duplication. Verified by grep that no notification is produced on publish, and the Feed reads no notification data.

### 11. Project context

Project name is always shown and links to the canonical project; the devlog is never shown detached from it.

### 12. Search / Explore separation

Unchanged. Feed = people I follow; Explore = discover; Search = find; Notifications = aimed at me. Suggestions link out to Explore rather than trying to be it.

### 13. Filters — decision

None. With one object type and a chronological order there is nothing meaningful to filter; adding filters would be interface without function.

### 14. Security / RLS — migration 029

Findings (both reproduced with authenticated/anon SQL before the fix):
- **Anyone, including anon, could read any user's assembled feed** by passing another `follower_id` (the view was owner-privileged and relied on callers to filter).
- **Blocked/muted authors still appeared** in the follower's feed.
- The view returned full devlog bodies (up to 50,000 chars) though the feed shows an excerpt.

Fix: `feed_items` recreated as `security_invoker = true`, scoped to `follower_id = auth.uid()`, excluding block (both directions) and mute, returning `content_preview` (400 chars) instead of `content`; anon revoked, `authenticated` granted SELECT only. Migrations 017–028 untouched. Underlying RLS now applies to the caller.

SQL role-impersonation results (rolled-back transactions): A sees exactly the followed developer's public/published/past devlogs (4/4) and none of the private-project, unlisted-project, draft or future-dated fixtures; preview ≤ 400 chars; A asking for another `follower_id` → 0; non-follower C reading A's feed → 0; anon → `permission denied`; A blocked X → 0; X blocked A → 0; A muted X → 0; X muted A → still visible; unblock/unmute restores; unfollow → 0; X making all projects private → 0; self-follow rejected (own devlogs cannot be in own feed). Keyset walk with page size 2 over 10 rows including 4 identical timestamps: all 10 seen, 0 duplicates, 0 skipped.

### 15. Performance

Removed the biggest cost: full devlog bodies per row (view now returns 400 chars; on the fixture set a single 25,000-char post is cut to 400). Engagement for a page is two `IN (...)` queries (comments, reactions), not one per row; profile data comes from the view join. Feed-item images are only small avatars. Reaction/comment counts are counted in JS from the rows for one page's ids — fine at current volume; move to grouped counts if a page's comment volume ever becomes large.

### 16. Routes

`/feed` (now takes optional `?cursor=`), `app/feed/loading.tsx`. No new URLs. Devlog page gained `id="comments"` anchor.

### 17. Components

New: `components/feed/FeedItem.tsx`, `components/feed/SuggestedDevelopers.tsx`, `lib/feed/queries.ts`. Changed: `lib/utils.ts` (`markdownExcerpt`), `components/project/DevlogTimeline.tsx` (uses it), `components/social/FollowButton.tsx` (`min-h-11`, was 42px→44px target).

### 18. Database changes

Migration `029_feed_items_scoped_moderated_preview.sql` (view only; no table or policy changes).

### 19. Bugs found

1. Any user could read any other user's feed via `follower_id` (incl. anon).
2. Block/mute did not affect the Feed.
3. Feed fetched up to 50 full devlog bodies.
4. 50-item hard cap with no way to see older devlogs.
5. Empty state conflated "no follows" with "nothing to show"; suggestions were unfiltered (followed, blocked, no-content users).
6. Feed items had no reaction/comment context and no comment link.
7. Excerpts ran headings into body text.
8. No loading or error state; item cards were oversized "cards".
9. Follow button below the 44px target.

### 20. Bugs fixed

All of the above. Not a Feed bug, unchanged: dashboard `NetworkPreview` text says "posted" (Dashboard was not modified; it benefits from the view fix automatically).

### 21. Responsive

Verified live for all six widths (375/390/768/1024/1280/1440) against a temporary render harness (since deleted) that mounted the real `FeedItem`/`SuggestedDevelopers` components with real public rows plus one synthetic stress row (very long name, project title and an unbroken 100-char title token): no horizontal overflow at any width, no interactive target under 40px (Follow button now 44px). Density at 375 matches a list, not a card stack.

### 22. Accessibility

`<h1>Feed</h1>`, per-item devlog title `<h2>`, `<ol aria-label>` for the feed and `<nav aria-label="Feed pages">`; `<time dateTime>` for timestamps; comment link has an `sr-only` "on <title>" suffix; reaction summary has an `aria-label` with words ("3 likes, 1 helpful") while emoji are `aria-hidden`; avatars are decorative (`alt=""`); focus-visible styles on links; skeleton honors `motion-reduce`; loading region has `role="status"`, error has `role="alert"`; no tooltip-only information (the absolute timestamp `title` is supplementary). Screen-reader behavior and visual focus rings were not tested with assistive tech / real keyboard traversal.

### 23. Browser verification

**Actually performed:** unauthenticated `/feed` and `/feed?cursor=garbage` both redirect (opaque redirect) and produce no server errors; component render at six widths via a temporary harness (above). **Not performed (blocked by the email-OTP signup blocker; no credential workaround attempted):** the authenticated `/feed` page itself — real follow/unfollow through the UI, pagination clicks, empty-state and error-state rendering in the page, live block/mute effect, the Follow button inside suggestions. Those paths are CODE + SQL verified only.

### 24. Remaining limitations

- Authenticated `/feed` rendering, pagination navigation, empty/error states and Follow-in-suggestions are not browser-verified.
- Comments and reactions on a page's devlogs are counted without regard to block/mute (counts can include a blocked user's activity), and blocked users' comment/reaction notifications are not suppressed — outside Feed scope.
- `user_bans` are not enforced anywhere in the product (Feed included); a banned author's public devlogs still appear.
- Read-only reactions in the Feed by design (interaction happens on the devlog); no inline commenting.
- Old pages are reached by "Older devlogs" links, not infinite scroll.
- Dashboard `NetworkPreview` wording ("posted") unchanged.

### 25. Explicit Phase 7 deferrals

Not touched: Explore/Search redesign, Settings, Notifications redesign (including block/mute-aware notifications), Dashboard, Profile/Project redesign, playtest/collaboration/jam/studio entries in the Feed, an event/activity table, ban enforcement, email digests, DMs, algorithmic or trending feeds, gamification, generic posts.

---

## PHASE 7 — EXPLORE + SEARCH (2026-09-21)

### Inventory (what existed)

- **Routes:** `/explore` and `/search`, both public, both rendered in the marketing "plasma" shell — so a signed-in user who clicked **Explore in the sidebar lost the sidebar**. No AppShell, no persistent search entry anywhere; `/search` was reachable only from a link on `/explore`.
- **Explore:** three sections — "Developers" (latest *joiners*, onboarded, no filter for having any work, included the viewer and blocked/muted users), "Recent Projects" (public, by `created_at`), "Recent Devlogs" (published, **no project-visibility filter**). A type named `TrendingProject` existed but nothing was trending.
- **Search:** Postgres FTS (`fts` tsvector on profiles/projects/devlog_posts, migration 006, GIN-indexed, english config) queried via `textSearch(..., 'websearch')`; `type` = all|profiles|projects|devlogs; three result blocks; limit 20 each; **no ORDER BY, no paging, no counts, no prefix matching**; devlog visibility filtered in JS *after* `LIMIT`.
- **Dead links:** Explore's three "See all" links went to `/search?type=…` with no `q`, which renders "Start typing…" — all three were dead ends.
- **Filters / sorting / tags:** none. Tags are free-form (`godot` vs `Godot`, `designer` vs `Designer`, one occurrence each in current data); `stage` is a controlled vocabulary.
- **Curated infrastructure:** `featured_listings` (paid; public-read RLS; admin page; Stripe webhook) is not consumed by any public surface. `devlog_posts.is_featured` (Phase 4) is a per-author profile pin, not site curation. There is no editorial/curation table.
- **Other discovery surfaces already in nav:** `/playtests/browse`, `/collaborate`, `/studios/[slug]`, `/jams`, `/events`, `/publishers`.
- **Block/mute:** ignored by both pages. **Bans:** not enforced anywhere.

### 1. Discovery product definition

Three jobs, three surfaces. **Feed** = people I follow. **Explore** = things worth discovering, browsed with no query. **Search** = things I am intentionally looking for. Notifications = things directed at me. None of them is used to solve another's problem: Explore is not "Feed for everyone", Search does not browse.

### 2. Search product definition

Query string → developers, projects, devlogs. Matching, ordering, privacy and block/mute are implemented once, in SQL (migration 030), not in the page.

- **Matching:** every word must match as a *prefix* in the object's indexed text (existing english-stemmed `fts`), **or** the raw query occurs as a substring of a name/title/username (ILIKE). So `ember` → Emberfall/Emberreach, `dee` → deep/deeppatel, `fall` → Emberfall, `demo-nova` → the username. `%`, `_`, `\` are escaped (a `%` query returns nothing). Query trimmed and capped at 100 chars, at most 8 words. No fuzzy matching, no AI, no embeddings.
- **Ordering (deterministic, explained on the page):** tier 0 exact name/title → 1 starts-with → 2 contains → 3 matched only in description/body/tags; then most recent activity; then id. No popularity or engagement input.
- **Paging:** 20 per page via `?page=`; the sort is total so pages do not overlap or skip. "All" shows 5 per type with "See all N".
- **Empty query:** explains what is searchable and links to the three Explore lists. **No results:** `No … for “q”`, how matching works, links to search everything / Explore. No fake recommendations.

### 3. Searchable objects and 4. Explore objects — decision

| Candidate | Stable route | Enough real data | Decision |
|---|---|---|---|
| Developers | `/dev/[username]` | yes | **Search + Explore** |
| Projects | `/p/[user]/[slug]` | yes | **Search + Explore** (primary object) |
| Devlogs | `/p/…/[devlog]` | yes | **Search + Explore** |
| Playtests | `/playtests/[id]` | yes | **Neither.** Already a primary-nav destination (`/playtests/browse`) with its own list; a playtest is a request tied to a project, so it is surfaced *on* the project (an "Open playtest" marker on rows, and Phase 5 project page). Adding it would create a fourth, thinner kind of result. |
| Collaboration posts | `/collaborate/[id]` | yes | **Neither.** Same reasoning (`/collaborate` is a primary destination; open posts show on the project and profile). |
| Studios | `/studios/[slug]` | 1 studio | **Deferred.** No directory exists and too little data. |
| Publishers, Jams, Events | routes exist | — | **Deferred.** Business/logistics surfaces, discoverable from their own pages; would add noise. |

### 5. Result categories

Four link-tabs: **All · Developers · Projects · Devlogs**, each with a real count. Matches the three canonical objects exactly. They are plain links (`aria-current`), not ARIA tabs, because each is its own URL. The URL value `profiles` was kept for compatibility.

### 6. Result anatomy (dense rows, no cards)

- **Developer:** avatar, name · @username, role · *Working on <project>* · *Open to collaborate* (only when `collaboration_status = 'open'`) · last active, one-line bio, real Follow/Unfollow button (signed in, not self).
- **Project:** cover thumbnail (https only) or neutral initial tile, title, pitch, and one plain-text line: maker · stage · engine · genre · *Open playtest* (only when a playtest is genuinely open) · last activity.
- **Devlog:** title, project · author · date, two-line excerpt (heading lines skipped).
Every element links to its canonical page.

### 7. Privacy

Enforced in three `security_invoker` views (RLS of the caller still applies): `discoverable_developers` (onboarded profiles), `discoverable_projects` (`visibility = 'public'`, slug present), `discoverable_devlogs` (published, not future-dated, parent project public). Private and unlisted projects, drafts, future-dated devlogs and their authors' hidden state never appear. Deleted content is simply absent (no row). Banned users: not enforced anywhere in the product — unchanged and listed as a limitation.

### 8. Block / mute

Same semantics as Phase 6, via one helper `hidden_from_viewer(uuid)` used by all three views: hidden if the viewer blocked them, they blocked the viewer, or the viewer muted them. Not hidden if *they* muted the viewer. Unblock/unmute restores immediately. Applied on every page, so pagination cannot leak. Direct object URLs are unchanged (object privacy still governs).

### 9. Explore hierarchy and 10. content

Projects first (the canonical object), then Developers (the people behind them), then Recent devlogs — different row anatomies, not three identical cards. Six of each with "See all" → `/explore/projects|developers|devlogs` (new routes; they replace the dead links) with paging. Developers are only those with public work, ordered by their latest public devlog (else newest public project); the viewer is excluded.

### 11. Featured / curated — decision

**None used.** `featured_listings` is paid placement, and there is no public UI for it. Worse, audit found its insert policy is forgeable (below), so surfacing it would surface unpaid rows. `is_featured` is a per-profile pin. There is no editorial table, and Phase 7 does not invent one. Explore says what it is: ordered by latest activity.

### 12. Recency

"Recently active" only, defined concretely: developers/projects by latest published public devlog (project falls back to creation date, developer to newest public project), devlogs by publish time. No trending/popular/hot/top-creators anywhere.

### 13. Tags and 14. Filters

Tags are free-form and un-normalised (case variants, one use each) so they are **searchable but not filterable**. Genre/engine likewise. The only filter is **project stage** (controlled vocabulary of five values) on Explore → Projects and Search → Projects, with URL state. Deferred with reasons: playtest-available and collaboration-available (each has its own browse route and small data), genre/engine/platform/tag (un-normalised), role/location (thin data).

### 15. Pagination and 16. URL state

Explore lists and typed search results: page size 20, `?page=N`, fetch size+1 to detect the next page, order = (activity, id) so it is total. Every state is a URL: `/search?q=…&type=projects&stage=alpha&page=2`, `/explore/projects?stage=beta&page=2`. Invalid `page`/`type`/`stage` values fall back to defaults. Tab links keep `q` and reset `page`/`stage`; stage links keep `q`; Prev/Next keep everything. Past-the-end pages say "No further results" with a link back and keep truthful counts. Refresh/back/forward work as ordinary links (server-rendered, no client state).

### 17. Empty states and 18. Explore empty states

Search: no-query, no-results (all / per-type / stage-filtered), past-the-end, and error (`role="alert"`). Explore: a genuinely empty section says so in one sentence; list errors are `role="alert"`. No illustrations, no "coming soon".

### 19. Navigation

Explore and Search now render inside the app shell when signed in (sidebar retained — fixes the lost-sidebar bug) and in a plain public header when signed out. Search gets a persistent presence the way LinkedIn/GitHub do: a small search field in the app-shell top bar (desktop) and a magnifier link (mobile), submitting to `/search?q=`. It is hidden on `/search` itself, which already has the full box, so there is no redundant second search. Primary nav unchanged.

### 20. Mobile / responsive

Single-column rows; targets `min-h-11`; long names/titles wrap (`overflow-wrap:anywhere`). **Browser-verified (unauthenticated) at 375, 390, 768, 1024, 1280, 1440** for `/search?q=ember` — no horizontal overflow at any width (375 seen in a screenshot, the rest measured); interactive-target height measured at 390 and 768 only (none under 40px). `/explore` verified at 375 and 1440 (no overflow, one h1, h2 per section, three lists).

### 21. Accessibility

One `h1` per page; sections have headings (`h2`, sr-only where the visual label is a caption); results are `ul/li` with `h3` titles; search field has an accessible name and `role="search"`; result-type and stage links are labelled `nav`s with `aria-current`; the Follow button is a labelled control (44px); alerts use `role="alert"`, skeletons `role="status"` with reduced-motion handling; thumbnails are decorative (`alt=""`, the title link names the row); nothing is tooltip-only. Screen-reader and real keyboard traversal were not tested.

### 22. Performance

Removed: three unbounded `select`s with full devlog bodies (now a 400-char preview), the JS post-filter after `LIMIT`, and an Explore developers list that fetched profiles with no work. Per page: one query per list, follow state for a whole page in one `IN` query, tab counts from `count(*) over()` of the same call. No client-side filtering or slicing. ILIKE substring matching is a sequential scan of small tables today; add `pg_trgm` GIN indexes if the tables grow (not enabled now — the extension is not installed).

### 23. Security / RLS — migration 030

Findings (reproduced with anon SQL before the fix):
1. **Explore served devlogs from UNLISTED projects to anonymous visitors** (no visibility filter; RLS legitimately allows unlisted devlogs to be read by link). Search fetched them too and hid them only in JS after the limit.
2. Search matched whole stemmed words only (`ember`≠`Emberfall`, `dee`≠`deep`).
3. No ORDER BY / paging.
4. Block/mute ignored.

Fix: `hidden_from_viewer()`, three `security_invoker` views, three `security_invoker` search functions, `EXECUTE`/`SELECT` granted to `anon, authenticated` only. No table or existing policy changed; 017–029 untouched; Supabase advisors show only pre-existing findings.
**SQL role-impersonation results (rolled-back tx):** anon: unlisted/private-project devlogs, draft and future-dated devlogs, private and unlisted projects → 0 in search, and the view returns only the one public fixture; published public devlog → 1. `emberfall` → 1 project; `ember` → 2; `fall` → 1; `dee` → 3 developers; `demo-nova` → 1; empty/blank/`%`/`_`/quote-and-DROP-shaped queries → 0 rows, no error. Tier-0 for the exact title; `ember` order Emberfall, Emberreach; stage filter alpha → 1, released → 0. Paging size 2 over 6 rows: 6 seen, 0 duplicates. Block: A blocked X → 0 developers/projects/devlogs/explore rows for X; X blocked A → 0; A muted X → 0; **X muted A → A still sees X**; unblock/unmute restores; a third user is unaffected; anon `feed_items` still denied.
**Latent issue found, deliberately not surfaced:** `featured_listings_insert` (013) only checks `auth.uid() = payer_id`, so any signed-in user can insert a "paid" listing without paying (confirmed), and the Stripe webhook likely cannot insert one legitimately because it has no user session. Not fixed here (needs a service-role decision and is outside Search/Explore); flagged as a follow-up task.

### 24. Bugs found / 25. Bugs fixed

Found and fixed: unlisted-devlog leak on Explore; JS post-filter after LIMIT; no prefix/substring matching; no ordering; no paging; no tab counts; three dead "See all" links; Explore developers list was latest-joiners with no work (and included self/blocked/muted); block/mute ignored; Explore/Search dropped the app sidebar for signed-in users; no persistent search entry; `autoFocus` on a populated search box; a page-2-past-end state that read "No devlogs".
Found, not fixed: forgeable `featured_listings` insert (above); bans unenforced; `/explore/<bad-section>` returns HTTP 200 with the not-found UI (the route streams behind `loading.tsx`, so status is already sent — same Next behaviour as other dynamic routes).

### 26. Files changed / Database

New: `supabase/migrations/030_discovery_views_and_search_functions.sql`, `lib/discovery/queries.ts`, `components/discovery/{DiscoveryFrame,ProjectResult,DeveloperResult,DevlogResult,Pager,StageFilter}.tsx`, `app/explore/[section]/page.tsx`, `app/explore/loading.tsx`, `app/search/loading.tsx`. Rewritten: `app/explore/page.tsx`, `app/search/page.tsx`. Changed: `components/dashboard/AppShell.tsx` (search field/link, `hideSearch`), `lib/dashboard/identity.ts` (`getOptionalIdentity`, `getSidebarIdentity` now wraps it — behaviour unchanged).

### 27. Browser verification

**Performed (unauthenticated):** `/explore` renders the three sections with real data; `/explore/projects|developers|devlogs`, `?stage=beta|released`; `/search` (no query), `?q=emberfall|ember|fall|dee|zzznothing|%`, `type=projects&stage=alpha|released`, `type=profiles`, past-the-end page, invalid `type/page` values — tab counts, result rows, empty and past-end messages all matched expectations; six-width overflow/target checks for search; explore at 375 and 1440; zero server errors (only the pre-existing Vercel Analytics CSP console noise).
**Not performed (email-OTP blocker, no credential workaround attempted):** anything signed in — the app-shell rendering of Explore/Search, the header search field and mobile magnifier, Follow/Unfollow from a result row, and block/mute effects through the UI. Those are CODE + SQL verified only. The Pager UI was not seen rendered live (current data has ≤ 8 rows per list, so there is no page 2); the past-the-end state and SQL paging were exercised instead.

### 28. Remaining limitations

Signed-in rendering untested in a browser; pager not exercised on a multi-page list; substring matching is unindexed; no fuzzy/typo tolerance by design; bans unenforced; `featured_listings` forgeable and unused; stage is the only filter; stage list shows all five stages even when empty; search results show a 400-char preview, not a matched-term highlight.

### 29. Explicit Phase 8 deferrals

Studio/publisher/jam/event/playtest/collaboration as search or Explore objects; saved searches and alerts; recent-search history; typeahead suggestions; tag normalisation and tag/genre/engine filters; `pg_trgm` indexes; fixing `featured_listings` and any paid or editorial featured surface; ban enforcement; a public studios directory; Settings/Privacy work; notifications changes.

---

## PHASE 8 — COLLABORATION + PLAYTESTING (2026-09-21)

### Inventory (what existed)

**Collaboration.** Tables `collaboration_posts` (status open/filled/closed, `expires_at`, optional `project_id`) and `collaboration_applications` (`pending/accepted/rejected`, unique per post+applicant). Board `/collaborate` (open posts, three filters), post page `/collaborate/[id]`, create form. The post page **404'd for every closed post**, applicants could not see any state except "Application sent", owner review was a bare list (display name + message, Accept/Reject), nobody could withdraw, `filled` was never set by anything, accept/reject **notified nobody**, and the "application received" notification was faked as type `mention` ("X mentioned you"). No "my posts"/"my applications" view.

**Playtesting.** `playtest_requests` (open/full/closed, `requested_testers`, `current_testers`, `build_url`), `playtest_sessions` (requested/accepted/completed/skipped), `playtest_feedback` (one per session). Browse, detail, requester dashboard, feedback form (a client page with no server check). **`build_url` was never displayed to anyone** — an accepted tester had no way to reach the build. `current_testers` was updated by the *tester's* client, which RLS does not allow to update the request, so the counter never moved and capacity was never enforced (fixture data had drifted to 4 testers vs 1 real session). Withdraw reused `skipped`, so "developer skipped me" and "I withdrew" were the same state. No way for the developer to close a playtest. No playtest notifications at all.

### Security findings (all reproduced with authenticated-role SQL before the fix)

Collaboration: applicant could insert an application already `accepted`; applying to a closed/expired post or to your own post was blocked only in app code; applicant could not read the closed post they applied to; owners could rewrite any application column.
Playtesting: tester could insert a session already `accepted` or update it to any status (including un-skipping themselves); sign-up to `full`/`closed` playtests worked via the API; the counter never moved; **open playtests on PRIVATE projects, and `build_url`, were readable by anyone**; a tester lost read access to a request as soon as it filled/closed (404 on their own playtest); feedback could be inserted for a never-accepted session.
Notifications: type CHECK allowed only five social types; any signed-in user could insert any type for anyone.

Fix — migration **032** (+ **033**): the lifecycle lives in the database as guard triggers so a direct API call cannot skip what the UI enforces; the counter is *derived* by trigger (no client read-modify-write, no race — the request row is locked `FOR UPDATE` on every sign-up/accept); workflow notifications are created by the same triggers (atomic, cannot be forged: the client insert policy now allows only the five social types). Migrations 017–031 untouched. (031, the parallel `featured_listings` fix, is another session's work and was neither applied nor modified here; this phase used 032/033 to avoid a clash.)

### 1. Collaboration product model

A post says: **WHO** (role needed/offered), **WHY/WHAT** (description), **PROJECT** (linked project), **EXPECTATION** (contract type, remote, location, compensation, time — existing columns only; no fields invented), **STATUS** (open/filled/closed/expired). "Seeking" posts must link a project and name a role (new server-side check). "Available" posts are people offering to help; the same panel reads "Reach out / Send message".

### 2. Collaboration lifecycle

`OPEN → application (pending) → owner ACCEPTS or REJECTS (or applicant WITHDRAWS) → post FILLED or CLOSED`.
- Application states: `pending → accepted | rejected` (owner only), `pending → withdrawn` (applicant only). Everything else is rejected by the database: no self-accept, no changing the message/applicant/post, no flipping a decision.
- A closed/filled/expired post never accepts applications (DB-enforced, including the author's own post and either-direction blocks).
- Applicants still `pending` when a post closes see "This post closed before a decision was made" and are notified (`collab_closed`); decided applicants are not re-notified. No fake auto-rejection.
- "After acceptance" = the record. Glyph finds people; it does not replace Discord/Linear. The accepted applicant is told to follow up through the poster's profile.

### 3. Posting anatomy (canonical page `/collaborate/[id]`)

State label (text) · role title as `h1` · "For <project> · Posted by <creator> · when" · facts list (contract, work, location, compensation, time, expiry) · About · then exactly one of: applicant panel (apply / submitted / accepted / not selected / withdrawn / closed) or owner panel (manage, applicants). Not a card grid.

### 4. Discovery

Canonical object = the post page. Previews link to it: the board, the project page (Phase 5, open posts for that project), the profile (Phase 4), the dashboard attention list, notifications. Not added to Explore or Search (see 17).

### 5. Application flow

Panel states the role, project and who reviews it and that the applicant will be notified; on submit the panel switches to "Application submitted / Awaiting review" with the message echoed back and a `role="status"` line, so there is no doubt it worked. Duplicate applications are blocked by the unique key and shown as "You have already applied". Withdraw asks for one inline confirmation.

### 6. Applicant review / 7. Management

Owner sees applicants (waiting first, then decided) with avatar, name (link), role, one-line bio, applied time, a text status, the full message, Accept/Reject (Reject asks for confirmation), and "View profile and work". Header shows "N awaiting your decision". Owner controls: **Mark as filled** (found someone) or **Close post** (stopped looking), both with a confirmation that says how many waiting applicants will be told. The board gained **Your applications** (with status) and **Your posts** (with "N to review") for signed-in users — closing/finished posts are no longer unreachable. No scoring, ranking, ATS, or parsing.

### 8. Notifications (ACTOR → ACTION → OBJECT)

New types (no reuse of `mention`): `collab_application`, `collab_accepted`, `collab_rejected`, `collab_closed`, `playtest_signup`, `playtest_accepted`, `playtest_skipped`, `playtest_feedback`. Examples rendered: "Sam applied to your collaboration post for Rift Squad", "Sam accepted your application for Rift Squad", "Riley signed up to test Emberfall Keep", "Riley submitted feedback on Emberfall Keep". Rows now link to the object (or to the developer's review screen where they must act). Notifications are suppressed across a block. The old manual `mention` insert for applications was removed (it would have duplicated).

### 9. Playtest product model

WHAT (description, focus areas) · PROJECT · WHO (signed-in testers, developer decides) · CAPACITY (`requested_testers`) · STATUS · EXPECTATION (description) · BUILD ACCESS (`build_url`, developer + accepted testers only) · FEEDBACK (structured ratings + notes → the developer).

### 10. Tester lifecycle / state machine

Session: `requested → accepted → completed` (completed only by submitting feedback) · `requested|accepted → skipped` (developer; terminal) · `requested|accepted → withdrawn` (tester; may sign up again while the playtest is open). Request: `open ⇄ full` (derived from capacity) · `closed` (developer's choice; reopen allowed).
Tester panel (one state at a time): sign up (with what-happens-next copy) · full · closed · waiting for developer · **accepted → build access (browser link / download link / Steam key) + Submit feedback + Withdraw** · feedback submitted · not selected · withdrawn (+ "Sign up again" if open). The tester never touches the developer's management UI.

### 11. Requester lifecycle

`/dashboard/playtests` → "Testing your games": per playtest a status label, "N of M places taken · K waiting for you · J feedback received", tester rows (waiting first, then testing, then done), Accept/Skip with tester name in the accessible label, feedback expandable per tester, and **Close/Reopen sign-ups** (confirmation explains accepted testers keep access). The public playtest page shows the developer a summary, what accepted testers receive, and the same close/reopen control.

### 12. Capacity

`current_testers` = **confirmed testers** (accepted or completed); pending sign-ups form a queue and do not consume places (product decision, documented). `full` when confirmed ≥ requested; sign-up to full/closed is rejected by the DB; accepting beyond capacity is rejected ("at capacity"); withdrawing/skipping frees a place and the request returns to `open`; raising `requested_testers` reopens. Clients cannot write the counter. A tester may hold at most 3 active sessions. SQL-verified: OPEN+available, OPEN+full, CLOSED, already signed up, already accepted, already skipped.

### 13. Feedback

One feedback row per session (UNIQUE), accepted sessions only, tester must own the session (DB trigger), feedback can't be moved to another session, inserting it completes the session and notifies the developer atomically. Privacy toggle unchanged: private = tester + developer only; non-private stays readable (existing design, now explained in the form). Feedback form is now a server-checked page with game context, labelled fields, and a server redirect back to the playtest page showing "Feedback submitted".

### 14. Project integration / 15. Profile integration / 16. Dashboard integration

Project page (Phase 5) already lists open collaboration posts and the open playtest (owner: "Manage playtest"; visitor: "View & sign up") — all data flows verified unchanged; both detail pages link back to the project ("For <project>" / "View project"). Profile collaboration card (Phase 4) unchanged. Dashboard attention items (pending applications, waiting testers) already query exactly the `pending`/`requested` states this phase enforces; no dashboard code changed.

### 17. Explore / Search decision

**Not added.** Both are already primary destinations (`Collaborate`, `Playtests` in the main nav) with their own lists; each item is anchored to a project that Explore/Search already surface, and Explore rows already carry an "Open playtest" marker. Adding them as Explore/Search objects would create a fourth and fifth thin result type and split the workflow surface. Revisit only with evidence of discovery failure.

### 18. Block / mute

Block (either direction) prevents applying to a post and signing up to a playtest (DB-enforced), hides the other party's posts and playtests from the browse lists (`discoverable_collab_posts` / `discoverable_playtests` reuse Phase 6/7 `hidden_from_viewer`), and suppresses workflow notifications between them. Mute hides the muted party's items from the boards (same semantics as Feed/Explore) but does not stop a muted party from applying. Existing applications/sessions are not rewritten by a later block. Direct object URLs still follow object privacy.

### 19. Security / RLS summary (SQL-verified, rolled-back transactions)

Collaboration — 27 checks incl.: applicant pre-accepted insert blocked; closed and expired posts reject applications; own-post apply blocked; spoofed applicant blocked; self-accept blocked; stranger cannot read or decide applications; owner cannot edit message or flip a decision; forged `collab_accepted` notification blocked while `follow` still works; owner accept/reject notify the applicant; closing notifies only still-pending applicants; pending/rejected applicants can read the closed post, strangers cannot; applicant withdraws pending only.
Playtesting — 40+ checks incl.: duplicate/pre-accepted/self-accept blocked; private-project request unreadable and un-signup-able; direct `build_url` select denied for `authenticated` and `anon`; `get_playtest_build` returns the URL only to the developer and accepted/completed testers; tester cannot write the counter; capacity enforced on accept; sign-up to full blocked; accepted tester and skipped tester keep read access to a full/closed request; feedback only for own accepted session, second feedback rejected, completion + notification happen; withdraw frees the place; developer-skipped testers cannot re-request or un-skip; blocked either way cannot sign up; unblock restores; max-3-sessions limit; developer cannot move a request or write the counter. After 033, triggers still fire (full lifecycle re-run) and direct RPC calls to trigger/notify functions are denied.
Advisor: 033 removes the direct-RPC EXECUTE that 032's trigger functions inherited; the remaining findings are the pre-existing ones plus `is_collab_applicant`/`has_playtest_session` (must stay executable because RLS policies call them, same pattern as `is_studio_member`).

### 20. Responsive

Browser-verified (unauthenticated) at 375 for `/collaborate`, `/collaborate/[id]` and `/playtests/browse` + `/playtests/[id]`: no horizontal overflow, no target under 43px, one h1. A temporary state gallery (real components, literal props, since deleted) covering every applicant and tester state, both owner controls, the feedback form and every status label was measured at **375, 390, 768, 1024, 1280 and 1440**: no overflow at any width, no target under 43px, no unlabeled inputs; long role/project/person names wrap. Signed-in pages were not rendered.

### 21. Accessibility

`h1` per page and `h2` sections; results are `ul/li`; every workflow state is visible **text** (`StatusLabel`), colour is reinforcement only; state changes use `role="status"`, errors `role="alert"`; forms have `htmlFor` labels; destructive/irreversible steps use an inline labelled confirmation group (no `window.confirm`); Accept/Reject/Skip carry the person's name in `aria-label`; feedback ratings are range inputs with `aria-valuetext` and an `<output>`; the private-feedback switch is a real checkbox; external build link says it opens a new tab; filters are `nav` with `aria-current`. Screen-reader and real keyboard traversal were not tested.

### 22. Bugs found / 23. Bugs fixed

Found and fixed: applicant self-accept; playtest self-accept and status override; apply/sign-up bypass of closed/full/expired/own/blocked; dead capacity counter (+ drifted data); private-project playtest and build URL exposure; testers locked out of a full/closed playtest; feedback for un-accepted sessions; owner able to rewrite applications; forgeable/misleading notifications; closed posts 404 for applicants; no withdraw (both sides); `skipped` overloaded for withdrawal; `filled` never reachable; testers could not reach the build; no requester close/reopen; no "my applications/posts"; Collaborate/Playtests dropped the app shell for signed-in users; feedback page had no server-side check or game context; steam-key builds could not be entered (URL-typed input); `window.confirm` dialogs; sub-44px controls; accept/reject errors ignored.
Found, not fixed: `publisher_contact` notifications still use type `mention` (Phase 8 out of scope); non-private feedback is readable by anyone by existing design; `NewCollabForm` labels were not audited or changed; collaborate/playtest board lists are capped at 50 with no paging.

### 24. Files changed / 25. Database

New: `supabase/migrations/032_collaboration_playtest_state_machines.sql`, `033_revoke_direct_execute_on_workflow_triggers.sql`, `components/workflow/StatusLabel.tsx`, `components/collaborate/ApplicationPanel.tsx`, `components/playtests/{TesterPanel,PlaytestStatusControl,FeedbackForm}.tsx`.
Rewritten: `app/actions/collaboration.ts`, `app/actions/playtests.ts`, `app/collaborate/page.tsx`, `app/collaborate/[id]/page.tsx`, `app/playtests/browse/page.tsx`, `app/playtests/[id]/page.tsx`, `app/playtests/[id]/test/[session-id]/page.tsx`, `app/dashboard/playtests/page.tsx`, `components/collaborate/{ApplicationActions,ClosePostButton}.tsx`, `components/playtests/SessionActions.tsx`.
Changed: `app/notifications/page.tsx`, `components/playtests/{FeedbackDetail,NewPlaytestForm}.tsx`, `lib/supabase/types.ts`. Removed: `components/playtests/RequestSessionButton.tsx` (replaced by `TesterPanel`).
Database: constraints widened (application `withdrawn`, session `withdrawn`, 8 notification types); policies replaced (`collab_posts_read`, `collab_apps_update` → owner + applicant, `playtest_requests_read`, `playtest_sessions_update` with check, `playtest_feedback_update` with check, notifications insert); column-level SELECT revoked on `playtest_requests.build_url` + `get_playtest_build()`; 5 guard/derive/notify triggers on sessions/requests/feedback/applications/posts; 2 read views for the boards; helper functions. **Anything that does `select *` from `playtest_requests` now fails by design** — new columns need an explicit grant.

### 26. Browser verification

**Performed (unauthenticated):** `/collaborate` (and filter URL), `/collaborate/<open post>`, `/playtests/browse`, `/playtests/<id>`, 404 for a nonexistent playtest, `/explore`, `/explore/projects`, `/search`, project and profile pages (regression: "Open playtest" markers still work after the column-privilege change), no server errors; state gallery at six widths (above).
**Not performed — email-OTP blocker, no credential workaround:** every signed-in flow in the browser: apply, withdraw, accept/reject, close/fill, sign up, accept/skip, withdraw, build access, feedback submit, requester close/reopen, notification links, the new "Your posts/applications" lists. These are CODE + SQL verified only.

### 27. Remaining limitations

Signed-in flows unrendered in a browser; `NewCollabForm` accessibility unchanged; board lists cap at 50 without paging; pending sign-ups are unlimited (no queue cap); feedback stays readable to non-private-by-design; no email notifications; no in-product messaging after acceptance (profile link only); the `mention`-typed `publisher_contact` notification remains; playtest `build_url` is developer-typed text (https enforced for link builds, not verified reachable).

### 28. Explicit Phase 9 deferrals

Explore/Search objects for playtests and collaboration; email/digest notifications; messaging or contracts after acceptance; applicant ranking/scoring/tags; playtest scheduling, recurring rounds, tester reputation; feedback moderation; paginating the boards; notification redesign; Settings.

---

## PHASE 9 — STUDIOS + PUBLISHER (2026-09-21)

### Inventory (what existed)

**Studios.** Tables `studios`, `studio_members` (owner/admin/member), `studio_projects`. Public `/studios/[slug]`, my studios `/dashboard/studios`, manage `/dashboard/studios/[slug]`, create form. **"Invite" was a forced add** — an owner/admin inserted any developer by username, any role, no consent, no notification; there was no invitation, pending state, expiry or revocation. Role/removal/leave rules and the last-owner rule lived only in app code. The public Team list was **always empty for visitors** (membership was readable only by members). The public page showed **unlisted projects**, rendered `website` unvalidated as a link, had `href="#"` fallbacks and a `new URL()` that could throw. Admin studio verification updated 0 rows for any admin who was not a studio member and still reported success. Account deletion (a profile scrub) did not consider studios at all.
**Publisher.** `publisher_accounts` (company name only), `publisher_contacts` (developer, message, status — **no project**), `publisher_shortlists` (jsonb of project ids). `/publishers` directory, `/dashboard/publisher` (+register, contact page), shortlist button on project pages. The **directory could never show anyone** (accounts readable only by their own user) and there was **no admin path to verify a publisher**; contacts had no developer-side view (a notification faked as type `mention`, unlinked); no public publisher page exists in the data model (only a name).

### Security findings (all reproduced with authenticated-role SQL before the fix)

S1 admin promotes a member/self to owner · S2 admin removes the owner · S3 force-add with no consent · S4 admin or any user sets `verified`/`plan` (incl. inserting an already-verified studio) · S5 any user claims an empty studio as owner · S6 team invisible to visitors · S7 private project ids readable, unlisted projects shown · S8 last-owner rule bypassable, project owner who is a plain member cannot unlink · P1 self-register a publisher already verified · P2 directory empty / no verification path · P3 contact: no project, arbitrary status, allowed across a block, unlimited repeats · P4 developer could rewrite the message they received · P5 no developer inbox, misleading notification · P6 shortlists accepted junk, duplicates, private projects.
**A bug in my own first fix** was caught by the test suite: `invite_studio_member` used `actor_role NOT IN (...)`, which is NULL (not true) for a non-member, so a stranger could invite into any studio. Fixed in 035 before anything shipped; the "stranger invites" case is now part of the suite.

### Migrations 034 / 035 (017–033 untouched)

Database-enforced lifecycle: `create_studio()` (atomic studio + first owner), direct membership insert removed (only creation and invitation acceptance create members), `studio_invitations` + `invite_studio_member / respond_studio_invitation / revoke_studio_invitation` RPCs, `studio_members_guard` (role matrix + last owner) and `_after` (notifications; a studio with nobody left is retired), column-level privileges on `studios` and `publisher_accounts` (no client write to `verified`, `plan`, `status`, `slug`, stripe columns), https-only CHECKs on studio and publisher URLs, `admin_set_verified()` RPC (the only verification path), `studio_team` view (public team, viewer-relative block/mute), studio_projects read/delete policies, publisher read policy (verified are public; own; admin), `publisher_contacts.project_id` + unique per publisher/developer/project + guard/notify triggers, shortlist guard trigger, five new notification types. All trigger functions have EXECUTE revoked from clients.

### 1. Studio product model

A persistent identity for a group making games: **identity → members → roles → projects**. Not project management, chat, a feed or HR software. Everything else was left out.

### 2. Studio public page — `/studios/[slug]`

"The team behind these games": logo/initial tile, name, plain-text "Verified studio" label (only when an admin verified it), size · location · founded, website (https only), About, **Projects** (canonical rows, public projects only, via `discoverable_projects`), **Team** (avatar, name, role as text, linked profile), "Manage studio" for members, and a notice for a pending invitation. No hero, no metrics. Public shell for visitors; the app shell (sidebar kept) when signed in. Management is a separate screen.

### 3. Studio ↔ project

`studio_projects` links a canonical project; nothing is copied. Project page (Phase 5) → studio in the creator line; studio → project rows; profile → studio affiliation; member → own projects via the studio. Unlisted/private projects never appear through a studio (public page filters through the public-only view; RLS no longer leaks their ids to strangers). Management shows a member's non-public linked projects as "hidden from the studio page".

### 4–5. Membership and roles (final matrix, DB-enforced)

| Action | Owner | Admin | Member |
|---|---|---|---|
| Edit studio details | yes | yes | no |
| Invite as member | yes | yes | no |
| Invite as admin | yes | no | no |
| Cancel an invitation | yes | yes | no |
| Change roles | yes | no | no |
| Remove a member | anyone (not the last owner) | members only | no |
| Link a project | own projects | own projects | no |
| Unlink a project | any | any | own projects only |
| Leave | yes (not the last owner while others remain) | yes | yes |
Ownership transfer = promote another member to owner, then leave (multiple owners allowed). Deleting/archiving a studio is not supported as an action; when the last member leaves the studio is retired (`status = 'deleted'`). One owned studio per developer (existing rule, kept).

### 6. Owner safety

Last owner cannot leave, be removed or be demoted while others remain (trigger, race-safe via a studio row lock; tested through leave, remove and demote paths). Admins cannot touch owners or other admins. Nobody can claim a memberless studio (it is retired, and there is no client insert path). Account deletion: `prepareAccountDeletion()` runs first — refuses if you are the only owner of a studio that still has other members (message names the studio), otherwise removes you from your studios; the warning text says so. Deleting a project or profile cannot invalidate a studio (FKs cascade links only).

### 7. Invitations

`pending → accepted | declined | revoked`, expires after 14 days. Inviter needs owner/admin; only an owner invites admins; no duplicate pending invites; already-members and unknown/blocked users get the same non-leaking message; only the invitee can accept/decline (a stranger gets "Invitation not found"); revoked, expired and already-answered invitations cannot be used; acceptance creates exactly the invited role; the inviter is notified. Invitees see and answer invitations on `/dashboard/studios` (nav "Studios" appears for a pending invitation).

### 8. Member management UI

`/dashboard/studios/[slug]`: **Studio details** (owner/admin), **Members** (name, role as text, actions for the viewer's role), **Invitations** (pending/expired with cancel, invite form), **Projects** (link/unlink). Destructive or significant steps use an inline labelled confirmation naming the person and consequence ("Remove Alex from Studio? They lose their place on the team and will be told."; "Change Alex from Member to Owner? … Owners can manage everything, including removing you."; leave; cancel invitation; unlink). The last owner sees why they cannot leave instead of a disabled icon.

### 9. Studio navigation

Unchanged primary nav. Reached via More → My Studios (now also when an invitation is pending), the public studio page ("Manage studio"), project/profile links and notifications.

### 10. Profile / project integration

Profile shows "Owner at X" / "Admin at X" / "Developer at X" linking to the studio. Project page keeps its studio line. Membership does not imply project credits; none invented.

### 11. Studio activity — decision

No studio feed. Studio → projects → devlogs (the existing chronological record) is sufficient; the studio page links to canonical project pages where devlogs live.

### 12. Publisher product model

Publisher ≠ studio: **identity → find projects → contact developers → shortlist**. Publisher account = company name, description, website (new, both optional), verification status. `verified` and `plan` are server-only.

### 13. Publisher directory / public page

`/publishers`: verified publishers only (RLS-enforced), newest first, 20/page with prev/next, plain rows (name, "Verified" text label, 2-line description, website host). `/publishers/[id]`: identity, description, website, the publisher's Glyph profile, and a line that Glyph has no DMs. An unverified account's page is visible only to its owner (with a banner). No fake metrics or project lists.

### 14. Verification

Admin → **Publishers** (new) and Studios call `admin_set_verified()`; audit-logged. Directory listing and contacting both require verification (product decision: outreach requires a vetted account).

### 15. Discovery for publishers

Publisher dashboard → "Find projects" → `/explore/projects` (Phase 7: public only, stage filter). Projects reach the shortlist and contact flow from their canonical page.

### 16. Contact flow + lifecycle

`Publisher → project page → "Contact developer about this project"` → `/dashboard/publisher/contact/[developerId]?project=[id]` showing **From / To / About** above the message; the project stays attached (`project_id`). States shown: unverified (explained, no form), already contacted (with status), form, sent (what happens next). DB rules: verified publisher only, own publisher account only, not yourself, not across a block (generic "not available"), project must be the developer's own **public** project, one contact per publisher+developer+project, 20/day, new contacts start `sent`. Lifecycle `sent → read → replied → archived` (existing schema states); only the developer can move it, never edit message/project, no going back. Notification `publisher_contact` (real type, actor = the publisher's user, `entity_id` = the contact id, verified to join back to the row); the row reads "<Company> contacted you about <Project>" and links to the developer inbox.
**Developer inbox** `/dashboard/publisher-contacts` (nav "Publisher messages" once any contact exists): publisher (link), project, message, status text, links to reply through the publisher's website/profile (no DMs, stated), Mark read / I have replied / Archive.

### 17. Shortlist / dashboard

Private (RLS). DB guard: array of unique uuids, max 100, **public projects only when added**. Dashboard sections: identity + edit, find projects, shortlists (create, remove with confirmation, "no longer public" for projects that turned private), sent messages with project and status. Empty states for each. No CRM.

### 18. Notifications

New real types: `studio_invitation`, `studio_invite_accepted`, `studio_role_changed`, `studio_removed`, `publisher_contact` (all created by database triggers/RPCs, unforgeable by clients). Rows read "X invited you to join <Studio> as member", "X accepted your invitation to <Studio>", "X changed your role in <Studio>", "X removed you from <Studio>", "<Company> contacted you about <Project>", each with the correct link (`entity_id` → invitation / studio / contact). Notifications are suppressed across a block. No email.

### 19. Block / mute

Invite and contact across a block (either direction) are refused with non-leaking messages and produce no notification; blocked/muted members are hidden from the viewer's studio team; blocked/muted developers' projects do not appear through a studio; the contact page 404s for a blocked developer; mute has no effect on invites/contacts (same semantics as elsewhere).

### 20. Security / RLS results (rolled-back transactions)

Studio: create via RPC works, direct studio/member insert blocked; stranger/member cannot invite; admin cannot invite as admin, promote, or remove owner/admin; admin can edit details, cannot set `verified`/`plan`, cannot set http:/javascript: website; sole owner cannot demote, leave or self-remove; owner promotes/demotes; notifications for role change and removal; invitation flow (duplicate, existing member, unknown user, stranger cannot read or answer, revoke by admin, member cannot revoke, revoked/expired/repeat accept blocked, correct role granted, inviter notified); public team readable by anon; invitations unreadable by anon; anon sees only public+unlisted link rows (public page filters to public); owner sees all; blocked members hidden; project owner unlinks own project as plain member, cannot unlink others', stranger cannot; last member leaving retires the studio.
Publisher: pre-verified register and self-verify blocked (column privileges); URL CHECK; anon directory empty before and exactly the verified account after an admin verifies; non-admin cannot verify; unverified cannot contact; verified contact works with notification pointing at the contact row; duplicate, unlisted/private/other-developer project, preset status, self, foreign publisher account, blocked developer all rejected; developer can read, mark read/archive, cannot edit message/project, cannot go backwards; publisher cannot update; other developer / other publisher read 0; shortlist junk/duplicate/private rejected, others' shortlists unreadable and uneditable.

### 21. Responsive / accessibility

Browser-verified (signed out): public studio page, publishers directory, 404s for bad ids, profile with studio affiliation, redirects for all protected routes. A temporary state gallery (real components: owner/admin/member/last-owner management, invitation actions, publisher dashboard, contact form, status actions, shortlist button; since deleted) was measured at 375, 390, 768, 1024, 1280 and 1440: no horizontal overflow at any width, with a very long studio name, member name, project title, publisher name; form controls raised to 44px and re-measured at 375/1440 with none under 43px; confirmation state clicked and read at 375. Accessibility: one h1, section headings, `ul/li` lists, `htmlFor` labels on every form (including the create-studio form), roles as text not colour, confirmations are labelled groups (no `window.confirm`), `role="status"`/`"alert"`, aria-labels naming the person/company on every row action. Screen-reader and keyboard traversal not tested.

### 22–23. Bugs found / fixed

All items in "Security findings" and "Inventory", plus: `href="#"` fallback and throwing `new URL()` on the public studio page; admin studio verification silently doing nothing; `NewStudioForm` labels not associated; publisher shortlist dropdown had no button semantics and sub-44px targets; contact link lacked project context; publisher notification was unlinked. Found, not fixed: `DeleteAccountForm` copy still says projects/devlogs are removed although the flow only scrubs the profile (Settings, out of scope); publisher accounts are not removed on account deletion; no trusted server path sets `studios.plan` / `publisher_accounts.plan` (before this phase only the client exploit could; billing is outside this phase).

### 24. Files changed / 25. Database

New: migrations 034, 035; `components/studios/InvitationCard.tsx`; `components/publisher/ContactStatusActions.tsx`; `components/admin/AdminPublisherVerifyClient.tsx`; `app/publishers/[id]/page.tsx`; `app/dashboard/publisher-contacts/page.tsx`; `app/admin/publishers/page.tsx`.
Rewritten: `app/actions/studios.ts`, `app/actions/publisher.ts`, `app/studios/[slug]/page.tsx`, `app/dashboard/studios/page.tsx`, `app/dashboard/studios/[slug]/page.tsx`, `components/studios/StudioManageClient.tsx`, `app/publishers/page.tsx`, `app/dashboard/publisher/page.tsx`, `components/publisher/{PublisherDashboardClient,ContactDeveloperForm,PublisherRegisterForm}.tsx`, `app/dashboard/publisher/contact/[id]/page.tsx`.
Changed: `app/actions/admin.ts`, `app/admin/page.tsx`, `app/notifications/page.tsx`, `lib/dashboard/identity.ts` (+ nav flags in `AppShell`, `SecondaryNav`), `components/profile/ProfileHeader.tsx`, `app/dev/[username]/page.tsx`, `app/p/[username]/[project-slug]/page.tsx`, `components/publisher/AddToShortlistButton.tsx`, `components/studios/NewStudioForm.tsx`, `components/settings/DeleteAccountForm.tsx`.

### 26. Browser verification

**Performed (unauthenticated):** `/studios/phase1-test-studio` (team now visible, "Owner" role, empty-projects state), `/studios/<missing>` 404, `/publishers` (empty state), `/publishers/<bad>` 404, `/dev/deep` (shows "Owner at Phase1 Test Studio"), `/p/…`, `/explore`, protected routes redirect (`/dashboard/studios`, `/dashboard/publisher-contacts`, contact page, `/admin/publishers`); six-width gallery (above).
**Not performed — email-OTP blocker, no credential workaround:** every signed-in flow (create/edit studio, invite, accept, role change, remove, leave, link/unlink, publisher register/verify/contact/shortlist, developer inbox, admin verification, account-deletion guard). These are CODE + SQL verified only. The publisher directory was verified populated only in SQL (no verified publisher exists in the data).

### 27. Remaining limitations

Signed-in UI unrendered; no studio delete/archive action; no ownership-transfer UI beyond promote-then-leave; no invitation email; no publisher contact/reply channel inside Glyph (by design); publisher account is not deleted with the user; studio plan/billing writes need a trusted server path (not built); logo/banner have no upload or edit UI (URL columns only, https-checked); contacts limited to 20/day per publisher.

### 28. Explicit Phase 10 deferrals

Settings/Privacy work (including the account-deletion copy and full deletion semantics), studio billing/plan server path, studio archive/delete, invitation and contact email, in-product messaging, studio activity feed, team credits per project, publisher analytics/CRM, public shortlists, and Explore/Search objects for studios and publishers.


---

## PHASE 10 — SETTINGS, PRIVACY, ACCOUNT + NOTIFICATIONS (2026-09-21)

Full detail: `docs/glyph-phase10-recon.md`, `glyph-settings-pattern-research.md`, `glyph-phase10-settings.md`, `glyph-phase10-verification.md`. Migrations **036** (notification preferences + gate, read_at-only updates, deletion RPCs) and **037** (https-only profile links); 017–035 untouched.

Status: **PARTIAL.** Backend and logic COMPLETE and SQL/unit verified; signed-in UI NOT TESTABLE (email-OTP blocker).
- Settings IA: Profile · Account · Privacy · Notifications · Delete account — COMPLETE (code).
- Account deletion: real permanent deletion with ownership gate and named confirmation — COMPLETE (SQL), UI NOT TESTABLE. Replaces a flow whose copy contradicted its behaviour.
- Privacy: truthful visibility table + block/mute lists with undo — COMPLETE (code); no fake switches.
- Notification center: actor→action→object, merge rule, deep links, deleted-object handling, block/mute filtering, per-row read — COMPLETE (code + unit).
- Notification preferences: 5 in-product categories enforced in the database — COMPLETE (SQL). Email: MISSING by design (no sender exists).
- Security: profile links https-only (stored-XSS closed), notification writes limited to `read_at`, blocked/muted actors no longer notify.
- Removed dead landing footer links. No Terms/Privacy Policy pages exist (MISSING).
