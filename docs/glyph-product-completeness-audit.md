# Glyph Product Completeness Audit

**Date:** 2026-09-16
**Nature of this document:** An ongoing product-development audit, not a release check. It exists to answer "what does Glyph actually contain right now, and what's left to build" — not to declare the product finished. It supersedes nothing in `docs/full-product-audit-2026-09-15.md` (the earlier QA-focused audit); it draws on that work's evidence where still valid and goes substantially further into backend/frontend integration gaps, half-built subsystems, and unreachable code.

**Method:** Full repo re-read (migrations, actions, API routes, components, lib) as the source of truth — not the previous audit's memory of it. Every finding below is either (a) grep/read evidence with a file path, (b) a live browser test with a described result, or (c) a live database query. Where something is carried forward from an earlier pass in this engagement without being re-tested today, it's labeled as such.

---

## Product Surface

Glyph is a pre-launch community platform for indie game developers. Confirmed feature areas, from the actual schema (21 migrations) and route tree (58 pages): authentication, developer profiles + follow graph, projects, devlogs (with comments/reactions), a global feed, full-text search/explore, playtesting, local events, a collaboration board, game jams, studios, publisher tooling, a moderation/admin layer, Stripe-based monetization (subscriptions + featured listings), and email notifications. All of it targets one primary user type — an individual developer — plus secondary roles (studio member/admin/owner, publisher, admin/moderator).

## Complete Feature Inventory

Legend for STATUS: **COMPLETE** (real UI + real backend + verified working), **PARTIAL** (works but with a real gap), **BROKEN** (reachable but fails), **UI-ONLY** (renders, no real backend behavior), **BACKEND-ONLY** (server code/schema exists, no UI reaches it), **MISSING** (neither exists), **NOT TESTABLE** (needs infrastructure this environment doesn't have).

| Feature | User Type | Routes | Server Actions/API | DB Tables | Status | Test Status |
|---|---|---|---|---|---|---|
| Signup/login (email + Google OAuth) | anon | `/login`, `/signup`, `/auth/callback` | `AuthForm.tsx` (client-side Supabase calls) | `auth.users`, `profiles` | **COMPLETE** | Live-tested across this engagement (real Google OAuth click-through in an earlier pass) |
| Password recovery | anon | — | — | — | **MISSING** | No forgot-password link or flow found anywhere in `AuthForm.tsx` or `app/(auth)/` |
| Onboarding wizard | authenticated, not yet onboarded | `/onboarding` | inline Supabase calls | `profiles` | **COMPLETE** (code-reviewed this pass, live-tested in an earlier pass of this engagement) | Not re-tested today |
| Developer profile (view) | anon/authenticated | `/dev/[username]` | — | `profiles`, `projects`, `follows` | **COMPLETE** | Live-tested today |
| Developer profile (edit) | owner | `/settings/profile` | `EditProfileForm.tsx` | `profiles` | **COMPLETE** | Live-tested earlier this engagement |
| Follow / unfollow | authenticated | (button on profile) | `FollowButton.tsx` (client) | `follows`, `notifications` | **COMPLETE** for the follower's own action; cross-account effect **NOT TESTABLE** (needs a second session) | Structurally correct, not re-verified live this pass |
| Block / Mute | authenticated | (button on profile, **new this pass**) | `app/actions/moderation.ts` | `user_blocks`, `user_mutes` | **FIXED this pass** — was BACKEND-ONLY (component built, never rendered). Now **COMPLETE** | Live-tested today: blocked a real profile, confirmed DB row, unblocked, confirmed removal |
| Report content | authenticated | (button, part of BlockMuteButtons) | `reportContent` in `app/actions/admin.ts` | `moderation_queue` | **COMPLETE** for the reporting side; admin review side see Moderation row below | Not live-tested this pass (component newly wired; report button only appears with `entityType`/`entityId`, not passed on the profile page since profile-level reports aren't scoped to a specific piece of content) |
| Projects: create/edit | owner | `/dashboard/projects/new`, `/dashboard/projects/[id]/edit` | `ProjectForm.tsx` (client) | `projects` | **COMPLETE** | Live-tested across this engagement |
| Projects: delete | owner | (Danger Zone on edit page) | `app/actions/projects.ts` `deleteProject` | `projects` | **COMPLETE — added in this engagement** (was MISSING) | Live-tested: create → delete → confirm gone → direct URL 404s → DB row + cascaded devlog actually removed |
| Project public page | anon | `/p/[username]/[project-slug]` | — | `projects`, `devlog_posts` | **COMPLETE** | Live-tested today (screenshots, devlog list, playtest card all real) |
| Devlogs: create/publish | owner | `/dashboard/projects/[id]/devlogs/new` | `DevlogForm.tsx` (client) | `devlog_posts` | **COMPLETE** | Live-tested across this engagement |
| Devlogs: edit/delete | owner | — | — | — | **MISSING** — no edit or delete path exists for a published devlog post once created | Confirmed by absence: no route, no server action, no button anywhere references updating/deleting `devlog_posts` |
| Devlog comments | authenticated | (on devlog page) | inline in `CommentThread.tsx` | `comments` | **COMPLETE** | Live-tested today (posted a real comment) |
| Devlog comment → author notification | authenticated | — | `CommentThread.tsx` | `notifications` | **FIXED this pass** — was MISSING despite full schema support | Live-tested today: real notification row created with correct recipient/actor/type |
| Devlog reply → parent-author notification | authenticated | — | `CommentThread.tsx` | `notifications` | **FIXED this pass** — was MISSING | Code-verified (same pattern as comment, applied and typechecked); not separately live-clicked this pass |
| Devlog reactions | authenticated | (on devlog page) | inline in `ReactionsBar.tsx` | `reactions` | **COMPLETE** | Live-tested today |
| Devlog reaction → author notification | authenticated | — | `ReactionsBar.tsx` | `notifications` | **FIXED this pass** — was MISSING | Live-tested today: real notification row created |
| Global feed | authenticated | `/feed` | — | `feed_items` (view) | **COMPLETE** for the populated case (verified via a followed-author's devlog appearing); empty-state suggested-developers list has a known content-correctness issue (A-05, see Technical Debt) | Live-tested across this engagement |
| Notifications inbox | authenticated | `/notifications` | `MarkAllReadButton.tsx` | `notifications` | **PARTIAL → improved this pass.** Reading/mark-all-read always worked; the *creation* side was missing 3 of 5 types until this pass (comment/reply/reaction), and the `publisher_contact` creation path was actively broken until this pass | Live-tested |
| Explore (developer/project/devlog discovery) | anon/authenticated | `/explore` | — | `profiles`, `projects`, `devlog_posts` | **COMPLETE** | Live-tested across this engagement |
| Search | anon/authenticated | `/search` | inline, Postgres full-text search (`.textSearch`) | `profiles`, `projects`, `devlog_posts` (fts columns) | **COMPLETE** | Live-tested today with a real query (`?q=dev`), returned real, correct results |
| Playtesting: request testers | owner | `/dashboard/playtests/new` | `NewPlaytestForm.tsx` | `playtest_requests` | **COMPLETE** | Live-tested across this engagement |
| Playtesting: browse/join as tester | authenticated | `/playtests/browse`, `/playtests/[id]` | inline | `playtest_sessions` | **PARTIAL** — page renders and a real signup exists in seed data (confirmed via `/playtests/ee...` link on a project page), but the join flow itself wasn't clicked through this pass | Not re-tested this pass; join/leave and tester-management were BLOCKED in the prior pass for needing a second account |
| Playtest feedback | tester | `/playtests/[id]/test/[session-id]` | inline | `playtest_feedback` | **NOT TESTABLE** — requires an accepted tester session, which requires a second account | Code exists and is structurally complete |
| Events: browse | anon/authenticated | `/events`, `/events/[id]`, `/events/city/[city]` | — | `events` | **COMPLETE** for browsing (correct empty state verified; zero real events currently seeded) | Live-tested |
| Events: create | authenticated | `/dashboard/events/new` | `NewEventForm.tsx` | `events` | **COMPLETE** (code-reviewed; form renders and validates; not submitted to avoid creating an uncleanable real dated event) | Not submitted this engagement |
| Events: RSVP | authenticated | (button on event page) | `rsvpToEvent` via `RsvpButton.tsx` | `event_rsvps` | **COMPLETE** by code (fully built, correct states for going/maybe/cancel) | **NOT TESTABLE this pass** — zero real events exist to RSVP to |
| Events: manage/cancel | owner | `/dashboard/events/[id]/manage` | inline | `events` | Not inspected this pass | Carried forward as untested |
| Collaboration board: post/browse | authenticated | `/collaborate`, `/collaborate/new` | `NewCollabForm.tsx` | `collaboration_posts` | **COMPLETE** | Live-tested across this engagement |
| Collaboration: apply | authenticated | (button on listing) | `app/actions/collaboration.ts` `applyToPost` | `collaboration_applications`, `notifications` | **COMPLETE by code** — notification insert uses correct columns/valid type (`mention`, repurposed) | Not live-clicked this pass; code-verified correct (unlike the publisher-contact bug, this one was already right) |
| Collaboration: review applicants | post author | — | `updateApplicationStatus` in `app/actions/collaboration.ts` | `collaboration_applications` | **BACKEND-ONLY** — action exists; **no UI was found that lists applicants or calls this function** | Confirmed by grep: `updateApplicationStatus` has zero callers outside its own file |
| Game jams: browse | anon/authenticated | `/jams` | — | `game_jams` | **COMPLETE** | Live-tested across this engagement |
| Game jams: host | authenticated | `/dashboard/jams/new` | `NewJamForm.tsx` | `game_jams` | **COMPLETE** — was briefly BROKEN earlier in this engagement (missing migration), now fixed and re-verified | Live-tested (created, admin-approved, confirmed public) |
| Game jams: admin approval | admin | `/admin/jams` | `app/actions/jams.ts` | `game_jams` | **COMPLETE** | Live-tested |
| Game jams: edit/cancel/delete (host) | owner | — | — | — | **MISSING** — confirmed no route or UI exists for a host to manage a jam after creating it, despite `game_jams_delete` RLS policy existing at the DB layer | Confirmed by route inventory: no `/dashboard/jams/[id]` of any kind exists |
| Game jams: submit entry | participant | `/jams/[slug]/submit` | inline | `jam_entries` | Code exists, not live-tested this engagement | **NOT TESTABLE** without a running jam + a project to submit |
| Game jams: vote | participant | `/jams/[slug]/vote` | inline | `jam_votes` | Code exists, not live-tested | **NOT TESTABLE** — needs a jam in its voting window and multiple entries |
| Game jams: results | anon | `/jams/[slug]/results` | — | `jam_entries`, `jam_votes` | Code exists, not live-tested | Not testable without a completed jam |
| Studios: create | authenticated | `/dashboard/studios/new` | `createStudio` in `app/actions/studios.ts` | `studios`, `studio_members` | **COMPLETE** — was BROKEN earlier this engagement (RLS bug), fixed and re-verified | Live-tested (create → manage → edit → save → public view, full lifecycle) |
| Studios: manage/edit | owner/admin | `/dashboard/studios/[slug]` | `updateStudio`, `addStudioProject`, `removeStudioProject` | `studios`, `studio_projects` | **COMPLETE** | Live-tested |
| Studios: archive/delete | owner | — | (attempted, reverted) | `studios.status` | **BROKEN, unresolved** — schema clearly implies soft-delete via `status`, but any update to that specific column is rejected by an unexplained RLS anomaly. See Technical Debt. | Attempted and reverted this engagement rather than ship a non-functional button |
| Studios: invite members | owner/admin | — | — | `studio_members` | **MISSING** — the only way a `studio_members` row is created is the creator's own bootstrap self-insert (enforced by migration 019's "zero existing members" restriction). There is no invite flow, no accept/decline, no way to add a second member at all | Confirmed by code: `studio_members_insert` RLS only permits self-insert-into-empty-studio or an existing owner/admin inserting — but no UI form exists to insert *another* user |
| Studios: roles (promote/demote) | owner | — | — | `studio_members` | **MISSING** — no UI to change a member's role after joining | No `role` update path found anywhere |
| Studios: leave | member | — | — | `studio_members` | **MISSING** — no "leave studio" button found, despite RLS (`auth.uid() = user_id`) already permitting a member to remove themselves | Confirmed by grep: no delete call against `studio_members` outside the (also-missing) member-management UI |
| Publisher: register | authenticated | `/dashboard/publisher/register` | `PublisherRegisterForm.tsx` | `publisher_accounts` | **COMPLETE** | Live-tested across this engagement |
| Publisher: dashboard | owner | `/dashboard/publisher` | — | `publisher_accounts`, `publisher_shortlists` | **COMPLETE** | Live-tested |
| Publisher: shortlists | owner | (on dashboard) | inline | `publisher_shortlists` | **PARTIAL** — creating a shortlist works (live-tested); adding a *project* to a shortlist was never exercised (no UI button for it was found on the shortlist card itself) | Live-tested creation only |
| Publisher: contact a developer | publisher | (button, likely on dev profile — not confirmed reachable) | `contactDeveloper` in `app/actions/publisher.ts` | `publisher_contacts`, `notifications` | **FIXED this pass** (notification insert), but **the calling UI button was never located** in this audit — grep found the action, not its caller | Notification-insert bug fixed and structurally verified; the UI entry point itself needs a follow-up check |
| Publisher directory | anon | `/publishers` | — | `publisher_accounts` | **COMPLETE** for the empty/unverified state | Live-tested (correct empty state, pending-verification publisher correctly absent) |
| Pricing page | anon/authenticated | `/pricing` | — | — | **COMPLETE** as a static page | Live-tested |
| Stripe checkout (initiate) | authenticated | — | — | — | **MISSING** — confirmed zero occurrences of `stripe.checkout`, `createCheckoutSession`, or `new Stripe(...)` anywhere in the codebase | Grep-confirmed |
| Stripe webhook (receive) | system | `/api/webhooks/stripe` | `route.ts` | `subscriptions`, `featured_listings` | **COMPLETE, well-built** — real HMAC signature verification via Web Crypto, handles subscription lifecycle + featured-listing payment events correctly | Code-reviewed; cannot be live-tested without a real Stripe account sending events |
| Billing page | authenticated | `/dashboard/billing` | — | `subscriptions` | **FIXED this pass** — was a dead end for anyone arriving from "Start Pro"/"Start Team" (silently ignored the `?plan=` param, showed Free with no explanation, exposed raw `STRIPE_SECRET_KEY` setup instructions to end users). Now honestly acknowledges the requested plan isn't purchasable yet | Live-tested (`?plan=pro` case) |
| Subscription cancel/manage | subscriber | — | (disabled button, "coming soon") | — | **UI-ONLY** | Confirmed: disabled button, explicit "not available" tooltip |
| Admin dashboard | admin | `/admin` | — | `admin_users`, `moderation_queue`, `game_jams` | **COMPLETE** | Live-tested across this engagement |
| Admin: users list | admin | `/admin/users` | — | `profiles` | Renders (code-reviewed); **no ban action wired to it** | Confirmed: zero references to `banUser` on this page |
| Admin: ban/unban users | admin | — | `banUser`/`unbanUser` in `app/actions/moderation.ts` | `user_bans`, `audit_log` | **BACKEND-ONLY** — fully correct server action (auth check, audit logging) with **zero UI callers anywhere** | Grep-confirmed |
| Admin: moderation queue | admin | `/admin/moderation` | `app/actions/moderation.ts`-adjacent (`admin.ts`) | `moderation_queue` | **COMPLETE** (code-reviewed; not live re-tested this pass) | Carried forward |
| Admin: studios verification | admin | `/admin/studios` | — | `studios.verified` | Not inspected this pass | Untested |
| Admin: featured listings | admin | `/admin/featured` | — | `featured_listings` | Not inspected this pass | Untested |
| Admin: feature flags | admin | `/admin/flags` | — | `feature_flags` | Renders (verified via screenshot in an earlier pass); no code checked this pass for whether flags actually gate anything | Untested this pass |
| Admin: audit log | admin | `/admin/audit` | — | `audit_log` | Not inspected this pass | Untested |
| Settings: profile/account | owner | `/settings/profile`, `/settings/account` | `EditProfileForm.tsx`, `AccountForm.tsx` | `profiles`, `auth.users` | **COMPLETE** | Live-tested across this engagement |
| Settings: notification preferences | owner | `/settings/notifications` | — | — | **UI-ONLY** — page literally says "Email preferences coming soon" | Confirmed by reading the page source |
| Settings: danger zone (delete account) | owner | `/settings/danger` | client-side Supabase call in `DeleteAccountForm.tsx` | `profiles` | **PARTIAL, and the UI overstates what it does.** The confirm-by-typing safeguard is real. But the copy says "This will remove your public profile, all your projects, devlogs, comments, and reactions. This cannot be undone" — the actual implementation only clears a handful of profile fields (`display_name` → `'[deleted]'`, clears bio/avatar/links) and signs the user out. Projects, devlogs, comments, and reactions are **not deleted**. The `auth.users` row is explicitly retained per the code's own comment ("30 days per Supabase's data retention") | Code-reviewed this pass (not re-executed — it's real user data destruction, correctly not touched) |
| Email sending | system | — | `lib/email/index.ts` + 4 templates | — | **BACKEND-ONLY, fully built, zero integration.** `sendEmail()` correctly implements Resend with proper dev-mode no-op and production error handling. Templates exist for welcome, notification, playtest request, and publisher contact. **Confirmed via grep: zero callers anywhere in `app/`** | Grep-confirmed |
| 404 page | anon | any unknown route | — | — | **COMPLETE** — added this engagement (was the raw Next.js default before) | Live-tested |
| Error boundaries | anon/authenticated | any runtime error | — | — | **COMPLETE** — added this engagement (public + authenticated contexts) | Live-tested with disposable throwing test routes |
| Footer legal/social links | anon | (landing page footer) | — | — | **MISSING** — About, Press, Privacy Policy, Terms of Service, X, Discord, GitHub all point to `href="#"`. No corresponding pages exist anywhere in the route tree | Grep-confirmed; not fabricated with placeholder pages (see Technical Debt) |

## Route Inventory

58 page routes (`find app -name page.tsx`), confirmed from disk across this engagement. Route-by-route render/reachability/auth-gating was verified for the ~30 routes explicitly exercised in the browser across all passes of this engagement (listed in the Feature Matrix above and in `docs/full-product-audit-2026-09-15.md`). The remaining ~28 — mostly jam sub-pages (`submit`/`vote`/`results`), event sub-pages (`city/[city]`, `manage`), studio public pages beyond the one created this pass, and several admin sub-pages (`audit`, `featured`, `flags`, `moderation`, `studios`) — were confirmed to exist and compile (via `npm run build` succeeding for all of them) but were not individually opened and interacted with in this pass. Marked NOT TESTED rather than assumed passing.

## Feature Matrix

See Complete Feature Inventory above — it *is* the feature matrix, structured per-feature with FEATURE/USER TYPE/ROUTES/SERVER ACTIONS/DB TABLES/STATUS/TEST STATUS as requested.

## Missing Features

1. Password recovery / forgot-password flow — no route, no UI, no server action found anywhere.
2. Devlog editing and deletion — a devlog can be created but never changed or removed once published.
3. Studio member invitations, role changes, and leaving — the entire "team" half of studios beyond the solo creator is unbuilt.
4. Jam management for hosts (edit/cancel/delete a jam after creating it).
5. Real Stripe checkout initiation — the pricing page has nothing to actually click through to a real payment.
6. Footer legal pages (About, Press, Privacy Policy, Terms of Service) and social links.
7. Applicant review UI for collaboration posts (`updateApplicationStatus` exists, nothing calls it).

## Partial Features

1. Notifications — creation was missing for 3 of 5 schema-supported types until this pass; still missing a UI entry point for at least one type (`publisher_contact`, now correctly typed but its trigger button wasn't located).
2. Publisher shortlists — creation works, adding items to a shortlist doesn't have a found UI path.
3. Playtesting — request creation is solid; the tester-side join/participate/feedback loop is genuinely untestable without a second account but is code-complete.
4. Account deletion — the confirmation UX is real; the actual data-removal claims in its own copy are overstated relative to what the code does.

## Broken Features

1. **Studio archiving** — attempted, hit a genuine unexplained Postgres RLS anomaly specific to the `status` column, reverted rather than ship a failing button. Documented in detail in Technical Debt.
2. **Publisher-contact notification** (fixed this pass) — was broken on every single call (wrong column, nonexistent column, invalid enum value), always failed silently.
3. **Pricing → Billing dead end** (fixed this pass) — "Start Pro"/"Start Team" led to a page that ignored which plan was requested.

## Backend/Frontend Gaps

This is the most consequential category this pass surfaced — three fully-built backend subsystems that no UI ever reaches:

1. **Email sending** (`lib/email/`) — a complete, correct Resend integration with 4 real templates (welcome, notification, playtest request, publisher contact), never called from anywhere in the app. Every notification a user gets is in-app only; nobody ever receives an email from Glyph regardless of environment configuration, because nothing invokes `sendEmail()`.
2. **User blocking/muting UI** (`components/moderation/BlockMuteButtons.tsx`) — fully built component, correct server actions, was never imported into any page until this pass wired it into the public profile.
3. **Admin ban/unban** (`banUser`/`unbanUser` in `app/actions/moderation.ts`) — fully correct, including audit logging, with zero UI callers. `/admin/users` lists users but cannot ban them.

Also: `updateApplicationStatus` (collaboration applicant review) exists server-side with no UI caller found.

## UX Problems

1. The Danger Zone's account-deletion copy makes claims ("removes... all your projects, devlogs, comments, and reactions") that the implementation doesn't fulfill — a trust problem if a user reads the code or later notices their content is still there.
2. Before this pass's fix, clicking "Start Pro" silently dropped the user onto a page showing them they're on the Free plan, with internal environment-variable setup text visible to end users.
3. Devlogs have no edit path — a typo or mistake in a published devlog is permanent.
4. Studios currently function as solo-only despite being explicitly positioned (`size: '2-10'`, `'11-50'`, `'50+'` options in the creation form) as a multi-person feature — there's no way to actually add a second person.

## UI Problems

Carried forward from `docs/full-product-audit-2026-09-15.md` (not re-audited this pass): the landing-page reveal-animation flash (fixed), a dashboard heading-hierarchy skip (fixed), footer dead links (documented above, not fixed — no real pages to link to).

## Accessibility

Carried forward from the two prior passes in this engagement: keyboard navigation and focus visibility verified working; mobile-drawer Escape-to-close was found broken and fixed; heading hierarchy fixed. Not independently re-tested in this pass. No formal screen-reader or contrast-ratio audit has been performed at any point in this engagement — no tooling available in this environment.

## Responsive

Carried forward from the two prior passes: zero horizontal overflow found across all 6 requested breakpoints (375/390/768/1024/1280/1440px) on every page tested. Not re-tested in this pass; nothing touched today changes layout in a way that would be expected to regress it.

## Performance

Carried forward from the Release Readiness Pass: real production-build numbers (274KB JS, 382KB total transfer, measured via the browser Performance API against an actual `next start` build). Not re-measured this pass.

## Security

Migrations 017–021 (the RLS authorization fix) remain in place and were not touched or weakened this pass. No new RLS policy was added or modified today — today's fixes were entirely in application code (notification inserts, a new UI wiring) and did not require any database policy change. The `publisher_contact` notification fix changes what data gets written, not who's allowed to write it — the existing `"Authenticated users can insert notifications" with check (auth.uid() = actor_id)` policy already covered it correctly.

## Authentication

Unchanged this pass. Google OAuth + email/password both previously verified working; session redirects correct.

## Authorization

Unchanged this pass. Verified in the prior pass via a live 12-test (then 21-test cumulative) cross-tenant authorization matrix at the actual database layer.

## Multi-User Workflows

Still genuinely blocked in this environment — no safe way to create or access a second authenticated session (no password on file for the primary account, and its Google OAuth link required a one-time interactive human step earlier in this engagement). Every multi-account-dependent item in this document (playtest tester flows, collaboration applicant review from the applicant's side, studio invitations, follow's effect on the followed account, cross-account notification delivery) is marked NOT TESTABLE rather than assumed passing, consistent with every prior pass in this engagement.

## Database Findings

- The `notifications` table's `type` check constraint (`follow`, `comment`, `reply`, `reaction`, `mention`) does not include a value for publisher contacts, collaboration applications, or several other events the product clearly wants to notify about. The current approach of repurposing `mention` for collaboration applications (correct, already in the code) versus the previously-broken attempt to use a nonexistent `publisher_contact` value shows this constraint needs a deliberate decision: either broaden the enum or keep repurposing existing types. Not changed this pass — the fix applied (`type: 'mention'`) matches the existing precedent rather than introducing a new migration for a single call site.
- `studios.status` having a `'deleted'` enum value with no corresponding `studios_delete` RLS policy is strong, direct evidence of an intended soft-delete lifecycle that was never fully wired up at the RLS layer — see Technical Debt for the specific anomaly blocking it.
- `game_jams` has a `game_jams_delete` RLS policy with no UI ever calling it — the database is more permissive than the product currently exposes.

## Technical Debt

1. **Studio archiving RLS anomaly (unresolved).** Updating `studios.status` to any non-`'active'` value is rejected by RLS with `new row violates row-level security policy`, even though: the identical `is_studio_member(id, ['owner','admin'])` check evaluates `true` when called directly; updates to every other column on the same row (`name`, `size`, `description`) succeed under the identical policy; the anomaly reproduces consistently across a fresh diagnostic session. Isolating it further requires temporarily weakening the policy to test in isolation, which this environment's own safety controls correctly declined. Needs a session with either direct Postgres log access or explicit permission to test with a weakened policy.
2. CSP defined in two places (`next.config.ts` and `proxy.ts`) with different allowlists — config drift, not a live bug.
3. A handful of Supabase-linter advisories (`function_search_path_mutable`, RPC-callable security-definer functions) on functions added during the RLS fix, matching an already-accepted pattern in this codebase (`is_admin()` had the same property before this engagement started).
4. The pre-existing `ProjectForm.tsx` `set-state-in-effect` lint error, present before any session in this engagement touched the file.
5. Footer dead links — not fixed, since fixing them properly means writing real legal-page content (Privacy Policy, Terms of Service) or a real About/Press page, which this pass declined to fabricate.

## Fixed During This Audit

1. `app/actions/publisher.ts` — corrected the publisher-contact notification insert (wrong column, nonexistent column, invalid type → correct columns and a valid, precedent-matching type). Verified structurally; the calling UI button itself wasn't located to click-test end to end.
2. `components/devlog/CommentThread.tsx`, `ReactionsBar.tsx`, and the devlog page that renders them — wired up comment, reply, and reaction notifications to the content owner, which never existed despite full schema support. Live-verified for comment and reaction with real DB writes; reply verified by code (identical pattern).
3. `components/moderation/BlockMuteButtons.tsx` wired into `app/dev/[username]/page.tsx` — a built-but-unreachable component is now reachable. Live-verified: block → DB row → unblock → row removed.
4. `app/dashboard/billing/page.tsx` — fixed the pricing→billing dead end; now honestly acknowledges a requested plan isn't purchasable yet instead of silently ignoring it, and removed end-user-facing internal environment-variable instructions.

## Remaining Work

Ordered roughly by how foundational each gap is to the product working as designed, not by difficulty:

1. Studio member invitations, roles, and leaving (studios are currently solo-only in practice).
2. Fix or route around the studio-archiving RLS anomaly.
3. Jam host management (edit/cancel/delete).
4. Devlog editing (currently permanent once published).
5. Collaboration applicant review UI (backend exists).
6. Admin ban UI on `/admin/users` (backend exists).
7. Decide the email-sending question: either wire `sendEmail()` into the notification-creation call sites that now exist, or explicitly decide Glyph is in-app-only for now and remove/park the unused email infrastructure so it doesn't look half-finished.
8. Password recovery flow.
9. Real Stripe checkout initiation (needs real Stripe product/price configuration this environment doesn't have — infrastructure-blocked, not a code gap).
10. Footer legal pages or removal of the dead links.
11. Correct the Danger Zone's account-deletion copy to match what the code actually does (or, alternatively, implement real cascading deletion to match the copy — a product decision, not made here).

## Blocked / Not Testable

- All genuine multi-account workflows (see Multi-User Workflows above).
- RSVP, event management — zero real events exist to test against.
- Jam submission/voting/results — need a jam actually in the right lifecycle window with multiple real entries.
- Stripe checkout (initiate or complete) — no test payment method, and no checkout code exists to test in the first place.
- Real email delivery — no test inbox, and (see above) nothing currently calls `sendEmail()` regardless.
- Full accessibility audit (screen reader, contrast ratios) — no tooling available in this environment.

## Recommended Development Order

**MUST BUILD** (the product doesn't function as designed without these):
- Studio member invitations/roles/leaving
- Fix studio archiving (or find the RLS root cause properly)
- Devlog editing

**SHOULD BUILD** (backend exists, clearly intended, currently a dead end without it):
- Admin ban UI
- Collaboration applicant review UI
- Jam host management (edit/cancel)
- A decision + follow-through on email (wire it up or remove it)

**NICE TO HAVE**:
- Password recovery
- Footer legal pages
- Corrected Danger Zone copy

**NOT CURRENTLY SUPPORTED** (infrastructure-blocked, not a code task):
- Real Stripe checkout (needs actual Stripe product configuration)
- Real email delivery testing (needs a test inbox)
- Multi-account QA (needs a second real session/credentials)
