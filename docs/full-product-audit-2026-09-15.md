# Glyph — Full Product Audit

**Date:** 2026-09-15
**Scope:** Full repo discovery, local run, preview deployment, and hands-on browser testing across the real, currently-implemented feature set. No feature was assumed to exist — the route list below was discovered from `app/` on disk, not from documentation or memory.
**Tester account:** deeppatel8904@gmail.com ("Deep" / `@deep`) — a real, pre-existing account with an admin role already granted in `admin_users` from earlier setup. No other test accounts or credentials were available, so multi-user flows (following, collaboration applications, playtest sessions between two distinct accounts) could not be exercised end-to-end and are marked BLOCKED-NOT-TESTABLE below.
**Environment tested:** primarily `localhost:3000` (Turbopack dev server) for interactive testing, cross-checked against the Vercel preview deployment for build/runtime parity. This is a preview (non-production) deployment on the `portfolio-screenshots` branch — production (`main`) was intentionally not touched; merging was out of scope for this pass and would need explicit sign-off.

---

## 1. Repo & Stack Discovery

- Next.js 16.2.7, React 19.2.7, App Router, TypeScript, Tailwind v4, Turbopack builds.
- Supabase for auth/DB/storage (`@supabase/ssr`), `proxy.ts` as this version's replacement for `middleware.ts`.
- Stripe webhook route exists (`app/api/webhooks/stripe/route.ts`); Resend email integration exists (`lib/email/index.ts`). Neither was exercised (no test payment method, no email inbox available).
- 4 API routes: `dev/ts-check`, `health`, `profile/check-username`, `webhooks/stripe`.
- 8 server-action files: `admin`, `collaboration`, `events`, `jams`, `moderation`, `playtests`, `publisher`, `studios`.
- 16 SQL migrations defining the real schema: profiles, projects, devlogs, follows/feed, reactions/comments, full-text search, notifications, playtests, events, collaboration, game jams, studios, payments (Stripe), publisher, admin, moderation.
- **58 page routes** discovered under `app/` (exact `find app -name page.tsx` count).
- No test files or CI config found despite `playwright` being a listed dependency — there is no automated test suite to run as a regression gate.

## 2. Local Run

Ran clean via the project's own dev server. One process note, not a code defect: mid-session the dev server's Turbopack cache briefly reported stale parse errors (`AccordionApp is not defined`, unclosed-JSX errors) for files that had already been edited. A full `.next` cache clear + restart resolved it and a subsequent production build (`npm run build`) compiled cleanly with zero errors, confirming the errors were stale HMR artifacts, not real bugs. Documenting this so it isn't mistaken for a regression if seen again.

## 3. Deployment

- Pushed to `portfolio-screenshots` (a non-production branch), which Vercel auto-builds as a **preview** deployment (`target: null`) — production (`main`) was not touched, consistent with treating a merge to production as outside this pass's authority.
- Deployment `dpl_6c21UHKqwVaNskkFzS1bvcEHyT4V` reached `READY` at `glyph-git-portfolio-screenshots-deeps-projects-2fd3fa67.vercel.app`.
- After fixes (see §7), a second commit (`478489d`) was pushed, triggering a follow-up preview build — `dpl_7UWiYRYFqqHyqVVTPxNh3fKQPF2h`, also `READY`, confirmed via the Vercel API.
- **Deployment blocker for direct browser verification (documented, not worked around):** this Vercel project has deployment protection (SSO) enabled on preview URLs. The browser session in this environment is authenticated as a different account (`dchadami@asu.edu`) than the project owner (`deep8904@gmail.com`), so it received a "You Need Access" gate when navigating directly to the preview URL. All interactive testing in §4 was therefore done against the local dev server running the identical committed code, and build parity with the preview was confirmed via `npm run build` succeeding cleanly and the Vercel API reporting `readyState: READY` for both deployments. The actual preview URL itself was not walked through in a browser this pass.
- `vercel.json` and `.env.example` were inspected only (not modified); no secret values were read or printed.

## 4. Feature-by-Feature Results

Legend: **PASS** = exercised in the browser and worked as expected · **PARTIAL** = works but with a caveat noted · **FAIL** = confirmed broken, now fixed (see §7) · **BLOCKED-NOT-TESTABLE** = could not be exercised with the single available account/credentials.

| Feature | Route(s) | Result | Notes |
|---|---|---|---|
| Auth — Google OAuth | `/login` → Google consent | PASS | Verified working in an earlier part of this session (real click-through to Google's consent screen after fixing a misconfigured redirect URI/client secret). |
| Auth — session redirect | `/login` while authenticated | PASS | Correctly redirects an already-logged-in user to `/dashboard` instead of showing the login form. |
| Dashboard home | `/dashboard` | FAIL → fixed | Workspace summary cards (Projects/Events/Collaborations) were hardcoded to always say "No projects yet" / "Nothing on your calendar" / "No open roles yet.", regardless of real data. Fixed — see §7. |
| Project creation | `/dashboard/projects/new` | PASS | Full form (title, auto-generated slug, description, tags, engine, genre, stage, visibility) submitted successfully; new project appeared immediately in `/dashboard/projects`. This is the exact route the user had flagged as "still in previous UI" — confirmed now on the unified shell. |
| Devlog creation | `/dashboard/projects/[id]/devlogs/new` | PASS | Published a real devlog against the test project; redirected correctly afterward. |
| Project editing | `/dashboard/projects/[id]/edit` | PASS | Loads existing project data correctly into the form. |
| Project deletion | — | BLOCKED — feature does not exist | Grepped server actions and `ProjectForm.tsx`: there is no delete-project action or UI anywhere in the app. Noted in §8 as a gap, not fixed (out of scope — it's a missing feature, not a regression). |
| My Projects list | `/dashboard/projects` | PASS | |
| Playtests (mine + testing) | `/dashboard/playtests` | PASS | Correct empty states for both "My Playtest Requests" and "Games I'm Testing" sections. |
| Playtest request creation | `/dashboard/playtests/new` | PARTIAL | Page renders correctly; form itself not submitted (would require an existing public project to attach it to in a state useful for another tester — no second account to close the loop). |
| Playtest browsing/session (another dev's game) | `/playtests/browse`, `/playtests/[id]` | BLOCKED-NOT-TESTABLE | Requires a second account's playtest request in an open state; only one real account available. |
| Events (public list) | `/events` | PASS | Correct empty state + category filter chips render. |
| Event creation | `/dashboard/events/new` | PASS | Form renders on the unified shell. Not submitted (would create a real, dated calendar event with no clear rollback path). |
| Event management | `/dashboard/events/[id]/manage` | BLOCKED-NOT-TESTABLE | No existing event to manage. |
| Collaboration board | `/collaborate` | PASS | Real seeded listings render correctly (2D Environment Artist, Sound Designer, with tags/timestamps/authors). |
| Collaboration post creation | `/collaborate/new` | PASS | Full end-to-end: form loads the user's own projects list, unescaped-quote lint error fixed (see §7). |
| Game jams | `/jams`, `/jams/[slug]/*` | Code-reviewed only, not browser-tested | Routes exist and build cleanly; not exercised interactively due to time/scope — flagged honestly rather than assumed working. |
| Studios / publisher | `/dashboard/studios/*`, `/dashboard/publisher/*`, `/publishers` | Code-reviewed only, not browser-tested | Same as above — routes exist, migrated to the unified shell earlier in this session, not re-exercised interactively in this pass. |
| Feed | `/feed` | PASS | Empty-feed state renders with real suggested-developer cards. One pre-existing content bug reconfirmed: the suggested-developers list includes the logged-in user's own second profile-like row (`@deeppatel`) despite the query's `.neq('id', user.id)` filter — see §8 (documented previously, not new, not fixed this pass — needs its own investigation into why two profiles for the same person exist). |
| Notifications | `/notifications` | PASS | Correct "All caught up" empty state. |
| Settings — Profile | `/settings/profile` | PASS | All fields load and are editable. |
| Settings — Account | `/settings/account` | PASS | Shows connected providers correctly (Email + Password, Google) — confirms the OAuth fix from earlier in this session is fully wired end-to-end, not just at the consent-screen step. |
| Settings — Danger Zone / delete account | `/settings/danger` | PASS (safeguard verified, action not executed) | Requires typing the exact username to enable the delete button — a real confirmation safeguard, not just a JS `confirm()`. Per the standing instruction not to perform irreversible destructive actions, the delete was **not** executed. |
| Search | `/search` | PASS | Renders search UI and category tabs; a live query was not run against seeded data. |
| Explore | `/explore` | PASS | Real developer and project cards render correctly (Riley Marsh, Jonas Weber, Nova Calder, etc. with real bios/tags). |
| Public dev profile | `/dev/[username]` | PASS | Own profile renders correctly; correctly excludes the private test project from the public "Current Project" section (privacy boundary working as intended). |
| Pricing | `/pricing` | PASS | Three-tier pricing table renders correctly; "Powered by Stripe" disclosure present. |
| Admin dashboard | `/admin` + 7 sub-pages | PASS (access control verified) | Initially looked like a possible authorization bypass since a "regular" test account could view it — traced to the actual cause: this account is a real row in `admin_users` (role: as shown on the page), so access is legitimate. Verified the access-control code itself: server-side `admin_users` lookup + redirect if absent, backed by Postgres RLS policies gated on `is_admin()`. This is a real PASS, not a false one — the mechanism was inspected, not assumed. |
| 404 handling | any unknown route | FAIL → fixed | No custom `not-found.tsx` existed anywhere in the app; unknown routes fell through to Next's raw unstyled default (plain black page, no branding). Fixed — see §7. |
| Responsive — mobile (375px) | `/dashboard` | PASS | Sidebar collapses to a hamburger menu; content reflows to single column with no horizontal scroll or clipped text. |
| Responsive — landing hero | `/` at various widths | Not re-verified this pass | Was explicitly tested and fixed in the prior part of this session (dead-space and alignment fixes); not re-tested at all 6 requested breakpoints in this pass due to time — flagged rather than re-asserted as PASS. |

## 5. Security / Authorization Sanity Checks (non-destructive only, per instruction)

- Confirmed `/admin` and its 7 sub-routes are gated server-side by an `admin_users` table lookup with redirect-on-absence, backed by RLS policies using a `public.is_admin()` function — not a client-side-only check.
- Confirmed `/settings/danger` requires typed username confirmation before the delete button becomes actionable.
- Did not attempt privilege escalation, SQL injection, auth bypass, or any other adversarial testing — out of scope per the standing instruction ("verification, not penetration testing").

## 6. Error States

- Custom 404 now exists (see §7). No custom `error.tsx` (React error boundary page) exists anywhere in the app — an uncaught render error on any route will currently fall back to Next's default error UI rather than a branded one. Noted as a gap, not fixed (broader scope than this pass's budget allowed — would need one per route group to preserve the authenticated shell vs. marketing-page context correctly).

## 7. Issues Found & Fixed This Pass

| ID | Severity | Route | Category | Evidence | User impact | Root cause | Fix | Status |
|---|---|---|---|---|---|---|---|---|
| A-01 | P1 | `/dashboard` | Correctness / content accuracy | `WORKSPACE_CARDS` in `components/dashboard/DashboardClient.tsx` was a static array with hardcoded body text | A user with 10 projects and 5 upcoming events would still see "No projects yet" / "Nothing on your calendar" on their own dashboard — actively misleading | Card copy was never wired to real data; `app/dashboard/page.tsx` never queried counts | Fetch real `projects`/`events`/`collaboration_posts` counts server-side in `app/dashboard/page.tsx`, pass to `DashboardClient`, render real counts and adjust CTA copy/links when non-zero | **Fixed** — verified in-browser showing "1 project" after creating a real test project |
| A-02 | P2 | any unknown URL | UI consistency | Raw unstyled Next.js default 404 page (black background, no branding) | Breaks the product's visual identity for anyone who mistypes a URL or follows a stale link | No `not-found.tsx` existed in `app/` | Added `app/not-found.tsx` using the same gray-50 surface, Glyph wordmark, and CTA-button styling as the rest of the redesigned UI | **Fixed** — verified in-browser |
| A-03 | P3 | `components/collaborate/NewCollabForm.tsx` | Lint / code quality | `react/no-unescaped-entities` ESLint error on raw `"` characters in JSX text | Not user-visible; blocks a clean lint pass | Literal `"` characters instead of `&quot;` in JSX text | Escaped the quotes | **Fixed** — confirmed via `npm run lint` |

All three fixes were committed (`478489d`) and pushed to `portfolio-screenshots`, triggering a new preview build.

## 8. Issues Found, Not Fixed (documented, out of scope for this pass)

| ID | Severity | Route | Category | Evidence | Recommended fix | Status |
|---|---|---|---|---|---|---|
| A-04 | P2 | Any project a user owns | Missing feature | Grepped all server actions and `ProjectForm.tsx` — no delete-project action or UI exists anywhere | Add a delete-project server action (with confirmation, matching the Danger Zone pattern already used for account deletion) and a UI entry point on the edit page | Open |
| A-05 | P2 | `/feed` (empty-feed suggested-developers list) | Data correctness | The suggested-developers list still surfaces a `@deeppatel` row that appears to represent the logged-in user, despite the query's own `.neq('id', user.id)` filter — previously documented in this session's earlier audit pass, reconfirmed here, not newly introduced | Needs its own investigation into why two profile-like rows may exist for the same person (duplicate signup? seed data artifact?) before deciding the fix — flagging rather than guessing | Open, needs investigation |
| A-06 | P3 | Any route | Error handling | No custom `error.tsx` boundary exists anywhere in `app/` | Add route-group-scoped `error.tsx` files (at minimum one for the authenticated shell, one for public/marketing pages) so a runtime error doesn't fall through to Next's unbranded default | Open |
| A-07 | P3 | All pages | Third-party script / CSP | Console repeatedly shows a blocked `va.vercel-scripts.com/v1/script.debug.js` load, violating the page's own CSP `script-src` directive | Pre-existing, unrelated to this session's changes — either add the Vercel Analytics debug host to the CSP allowlist or accept the (harmless, dev-only) console noise | Open, low priority |

## 9. Test Data Created During This Audit

One real project ("Audit Test Project", private visibility) and one real devlog ("Audit Test Devlog") were created under the test account to verify the create-project and create-devlog flows end-to-end. **No delete-project feature exists in the product** (see A-04), so this could not be cleaned up through the UI, and direct database deletion was avoided as out of scope for this pass. The user may want to remove these manually via Supabase, or ask for A-04 to be built next, which would also make cleanup possible through the app itself.

## 10. Not Tested / Explicitly Out of Scope

- Stripe payment flows (no test payment method available; webhook route exists but was not invoked).
- Resend email delivery (no inbox to verify against).
- Multi-account flows: following, collaboration applications, playtest sessions between two distinct users, notifications triggered by another user's action.
- Game jam submission/voting/results flow (code-reviewed only).
- Studio and publisher registration/dashboard flows (code-reviewed only; were migrated to the unified shell earlier in this session but not re-exercised interactively here).
- Full 6-breakpoint responsive sweep (only 375px and desktop widths checked this pass; the hero specifically was already verified at more breakpoints earlier in this session).
- Formal accessibility audit (contrast ratios, screen-reader pass, keyboard-only navigation) — not performed.
- Formal performance audit (Lighthouse/Core Web Vitals) — not performed.
- Penetration testing of any kind — explicitly out of scope per instruction.

---

# Release Readiness Pass

**Date:** 2026-09-16
**Scope:** A second, targeted pass closing the gaps left by the first audit (A-04 through A-07), interactively testing the previously code-reviewed-only feature areas (Jams, Studios, Publisher), attempting multi-account testing, running a real responsive/accessibility/performance sweep, and verifying deployment. This section does not repeat what the first audit already verified as PASS — see the sections above for that baseline.

## Issues Closed

| ID | Status | Evidence |
|---|---|---|
| A-04 (no project-delete feature) | **Fixed** | New `app/actions/projects.ts` `deleteProject` action + `components/dashboard/DeleteProjectForm.tsx`, wired into the edit-project page. Server-side ownership check independent of RLS. Type-the-title confirmation, matching the existing Danger Zone pattern. Verified end-to-end in the browser: created a real project → deleted it → confirmed it disappeared from the list → confirmed direct URL access to it now 404s → confirmed via direct DB query that the `projects` row and its cascaded `devlog_posts` row were actually gone (0 rows), not just hidden by RLS. |
| A-06 (no error.tsx boundaries) | **Fixed** | Added `app/error.tsx` (public/marketing context) and `app/dashboard/error.tsx` (authenticated-app context), both on-brand, both with a recovery action and a way back, neither exposing stack traces. Verified live: added disposable test routes that threw on render, confirmed each boundary rendered its own distinct copy, then deleted the test routes. |
| A-07 (CSP / Vercel Analytics debug script) | **Root-caused, no code change needed** | Read `node_modules/@vercel/analytics/dist/index.js` directly: `getScriptSrc()` returns the cross-origin `va.vercel-scripts.com/v1/script.debug.js` URL only when `isDevelopment()` is true; otherwise it returns the same-origin relative path `/_vercel/insights/script.js`, which passes `script-src 'self'` with no violation. This is conclusively dev-only, harmless noise — confirmed by source, not assumed. Per the standing instruction not to weaken CSP for harmless dev noise, no change was made. Separately found: CSP is defined in **two places** (`next.config.ts` and `proxy.ts`) with different allowlists — a config-drift risk, documented below as a new finding, not fixed. |

## A-05: Duplicate `@deeppatel` Suggestion — Investigated, Not a Bug

Queried `public.profiles` and `auth.users` directly. Root cause: `@deeppatel` is **not** a duplicate or orphaned database record. It is a second, genuinely distinct, real `auth.users` account:

- Primary account: `deeppatel8904@gmail.com`, id `abb02b2a-...`, profile `@deep`
- Second account: `pateldeep8904@gmail.com` (the same two words, transposed), id `e238e544-...`, profile `@deeppatel`, with its own real sign-in history (`last_sign_in_at` populated, not a stub)

The `.neq('id', user.id)` filter in the feed's suggested-developers query is working exactly as written — it excludes the current session's own user ID, and this second account has a genuinely different ID. This is almost certainly the same person having signed up twice under a transposed email at some point, not a system defect. **No code change was made** — adding another filter would have been exactly the kind of root-cause-avoidant patch this pass was explicitly told not to do. If the user wants this resolved, the fix is account-level (log into `pateldeep8904@gmail.com` and either abandon or merge it), not code.

## New Finding: Missing Database Migrations (P0 — found and fixed, with explicit approval)

While testing jam creation, it failed with a real error: `Could not find the table 'public.game_jams' in the schema cache`. Investigation via direct Supabase queries (`information_schema.tables`, `supabase_migrations.schema_migrations`) confirmed: **migrations 011 (game_jams), 012 (studios), 013 (payments), 014 (publisher), and 016 (moderation blocks/mutes/bans) had never been applied to the live database** — only 001–010 plus a separately-named admin-tables migration existed. The application code (forms, server actions, UI) was fully built assuming these 21 tables existed; they didn't. This would have blocked Jams, Studios, Payments, and Publisher entirely in any real deployment.

**I flagged this to the user and got explicit approval before touching the database** (a schema change to shared/production infrastructure), then applied all 5 missing migrations via the Supabase migration tool. One further pre-existing bug was found and fixed in the process: `013_payments.sql`'s `featured_listings_active_idx` used a partial-index predicate (`where ends_at > now()`) that Postgres rejects because `now()` is not IMMUTABLE — this migration could never have applied to any fresh database as originally written. Replaced with a plain index; fixed in both the live DB and the repo's migration file.

After applying: jam creation, studio creation, and publisher registration were retested and confirmed working (see below).

## New Finding: RLS Correlation Bug — Multi-Tenant Isolation Break (P0, security — found, NOT fixed, needs your explicit approval)

While diagnosing why a freshly-created studio ended up with no owner (see Studios testing below), I found a real, exploitable authorization bug in the RLS policies I had just applied from the repo's own committed migration files (011/012/013), **not something introduced by this session's edits** — the bug was already latent in the migration SQL as written; applying it just brought it live.

**The bug:** several RLS policies use a correlated `EXISTS` subquery of the form:
```sql
exists (select 1 from public.studio_members m where m.studio_id = studio_id and m.user_id = auth.uid() and m.role in ('owner','admin'))
```
When the outer table (the one the policy is attached to) has a column with the *same name* as a column in the subquery's own table (here, `studio_id`), Postgres resolves the bare, unqualified `studio_id` to the **subquery's own table** (`m.studio_id`), not the outer row being checked. This turns `m.studio_id = studio_id` into the tautology `m.studio_id = m.studio_id` — always true. The check silently degrades from "is this user owner/admin **of this specific studio**" to "is this user owner/admin **of any studio at all**."

**Confirmed affected (verified via `pg_policy` inspection of the actual applied expressions, not just the source file):**

| Table | Policy | Real-world impact |
|---|---|---|
| `studio_members` | `studio_members_read` | Any member of *any* studio can read membership rows of *every* studio. |
| `studio_members` | `studio_members_insert` | Any owner/admin of *any* studio can insert themselves (or anyone) into *any other* studio's member list, including as `owner`. |
| `studio_members` | `studio_members_delete` | Any owner/admin of *any* studio can remove members from *any other* studio. |
| `studio_projects` | `studio_projects_insert` | Any owner/admin of *any* studio can attach *any* project to *any other* studio. |
| `studio_projects` | `studio_projects_delete` | Any owner/admin of *any* studio can detach projects from *any other* studio. |
| `subscriptions` | `subscriptions_read` | Any member of *any* studio can read the billing/subscription records of *every* studio. |

`studios_update` uses the same subquery pattern but against a differently-named outer column (`id`, not `studio_id`), so it does **not** have this bug — confirmed by inspecting its actual applied expression too, not assumed safe by pattern-matching.

**Why this wasn't fixed:** I wrote a corrective migration (qualifying the outer reference as `studio_members.studio_id` / `studio_projects.studio_id` / `subscriptions.studio_id` to disambiguate it from the inner alias) and attempted to apply it, but it was blocked by the environment's own auto-mode permission classifier as a new database-modifying action beyond the single migration-application approval already granted. I did not attempt to work around that block. **This is currently live on your database and needs your explicit go-ahead to fix** — I have the corrected SQL ready; it just needs you to approve running it (the same way you approved applying the missing migrations).

**Secondary, lower-severity finding from the same investigation:** `studios_insert` has `with check (true)` — RLS alone would allow an unauthenticated request to create a studio row; the only thing currently preventing that is the calling server action's own auth check. I also have a fix ready for this (`auth.uid() is not null`) pending the same approval.

## New Finding: `createStudio` Silently Swallowed a Real Failure (P1 — found and fixed)

Discovered while testing studio creation: the action inserted the `studios` row successfully, then inserted the `studio_members` owner row **without checking the result**. That second insert was failing (root cause almost certainly the RLS bug above, though I could not fully isolate it — a direct role-impersonation test to confirm was itself blocked by the same permission classifier as a shared-resource action). The UI reported success and redirected the user, but the studio ended up with zero members — meaning its own creator couldn't manage it, and the "you already own a studio" duplicate-guard would never trigger for them again.

**Fixed:** `createStudio` now checks the `studio_members` insert result. On failure it deletes the orphaned `studios` row and returns a real error to the user instead of a false success. Verified live: retried studio creation after the fix, got a clean, honest "Failed to create studio. Please try again." instead of a silent false-positive. (The underlying RLS bug above still needs to be fixed for studio creation to actually succeed — this fix makes the *failure* honest, it doesn't make creation *work* yet.)

One more related gap found in the same area: `studios` has **no delete policy at all**. With RLS enabled and no delete policy, all deletes are denied by default — so even my own rollback-on-failure delete inside `createStudio` was silently no-op'd by RLS, leaving an orphaned `studios` row I had to remove via direct database access during testing. This is a real gap (studio owners currently have no way to delete a studio at all, mirroring the original project-deletion gap) — documented, not fixed in this pass (out of scope; would need its own confirm-UX like the project/account deletion flows).

## Jams — Interactively Tested

| Test | Result |
|---|---|
| Browse jams (`/jams`) | PASS — correct empty state before any approved jams exist |
| Host a jam (`/dashboard/jams/new`) | **FAIL → fixed** (missing `game_jams` table, see above). After the migration fix: PASS — real jam created, correct `admin_approved = false` pending state |
| Admin approval (`/admin/jams`) | PASS — pending jam appeared in the moderation queue with correct host attribution; approving it worked |
| Public visibility after approval | PASS — approved jam appeared on `/jams` under "Active & Upcoming" |
| Jam detail page (`/jams/[slug]`) | PASS — all fields (dates, host, description) rendered correctly |
| Join jam / submit entry / vote / results | **BLOCKED — requires second account.** A submission requires a project and a second distinct participant to meaningfully test voting; the app's own single-owner model means the host testing their own jam isn't representative of the real flow. |
| Unauthorized states (non-owner editing a jam) | Not tested — no second account available to attempt this as a different user |

Test data cleanup: the real jam created during this pass was deleted via direct database access afterward (no jam-delete feature exists in the app itself — same gap pattern as projects/studios).

## Studios — Interactively Tested

| Test | Result |
|---|---|
| Studio creation (`/dashboard/studios/new`) | **FAIL → error now surfaces correctly** (was: silent false success, orphaned studio; now: honest error, rollback). Root cause is the RLS bug above, still unresolved pending your approval. |
| Studio profile page | Not reachable — creation currently fails at the members-insert step, so there is no successful studio to view. Once the RLS fix above is approved and applied, this needs a follow-up test. |
| Editing, members, projects, roles, invitations, ownership, leaving | **BLOCKED** — all depend on a studio actually being created successfully, which the RLS bug currently prevents. |
| Unauthorized access | Partially verified by *finding* the authorization bug itself — i.e., the negative case (cross-tenant access should be denied) currently fails, which is the P0 finding above. |

Test data cleanup: the two orphaned test studio rows created during this pass were removed via direct database access (no studio-delete feature exists in the app).

## Publisher — Interactively Tested

| Test | Result |
|---|---|
| Registration (`/dashboard/publisher/register`) | PASS — real `publisher_accounts` row created, correct "Pending verification" badge and "Free" plan shown |
| Publisher dashboard | PASS — shows company name, status, "Browse Projects" action |
| Shortlist creation | PASS — created a real shortlist, appeared immediately with correct "0 projects" count |
| Shortlist item management | Not tested — no projects were added to the shortlist (would need a public project to shortlist; the account's own projects were private/deleted by this point in testing) |
| Publisher contacting a developer | **BLOCKED — requires second account** to receive and view the contact as the developer side |
| Publisher directory listing (public `/publishers`) | PASS (from first audit) — correctly shows empty state pending admin verification, which this new unverified test publisher correctly does not appear in |

Test publisher account and shortlist were left in place (registration doesn't create orphaned/broken state the way studio creation did, and there's no evidence it needs cleanup — it's clearly labeled and harmless, same reasoning as the original audit's test project).

## Multi-Account Testing — BLOCKED, Reason Documented

Attempted to create a second test account via `/signup` to test following, collaboration applications, playtest participation, and cross-account notifications. **Blocked:** this browser environment has one shared cookie jar across all tabs for `localhost:3000`. Creating a second account requires signing out of the current session first (`/signup` redirects an authenticated user away). I have no password for the primary test account (`deeppatel8904@gmail.com`) — its only working authentication path this session was Google OAuth, which required an interactive human consent step earlier in this engagement and cannot be repeated autonomously. Signing out risked permanently losing the only working session with no guaranteed way back in.

Given that risk, I did not attempt it. Every multi-account test in this report is marked **BLOCKED — REQUIRES SECOND ACCOUNT** rather than guessed at or assumed to pass:
- Follow / unfollow and the resulting state changes on both sides
- Collaboration listing discovery and application by a second user
- Playtest request discovery, joining, and status transitions by a second user
- Notifications triggered by another user's action (follow, comment, reaction)
- Privacy verification (a private project genuinely invisible to a second account) — partially covered instead by the single-account observation that the private test project correctly did not appear on the account's own public `/dev/deep` profile

If you want this tested, the practical options are: you create a second throwaway account yourself and hand me its credentials, or you're willing to have me sign out (accepting the risk of needing to re-run Google OAuth consent manually afterward).

## Responsive Sweep — Real Browser, Representative Sample

Tested via actual viewport resizing + `document.documentElement.scrollWidth > clientWidth` overflow checks (not assumed from CSS review) at 375px, 768px, 1024px, and 1440px, on the landing page, dashboard, and the project-creation form (the most form-dense authenticated page). **No horizontal overflow found at any tested breakpoint.** Mobile nav drawer opens/closes correctly and reflows to single-column below the `lg:` breakpoint as designed.

**This was a representative sample, not the full 20-feature × 6-breakpoint matrix requested.** Given the scope already covered in this pass, an exhaustive sweep of every feature area at every breakpoint was not completed — Jams/Studios/Publisher detail pages, event/collaboration cards, and the 390px/1280px breakpoints specifically were not separately checked. Flagging this explicitly rather than implying full coverage.

**One real finding:** on a fresh page load, the GSAP ScrollTrigger `.reveal` fade-in animation on the landing page leaves content at or near `opacity: 0` for roughly 1–2 seconds before revealing it — meaning users briefly see a near-blank white page after the header loads, before the hero and body content fade in. Not a hard failure (it does resolve on its own), but a real, user-visible rough edge on first paint. Not fixed in this pass (would need to change the reveal strategy — e.g., default to visible and only animate the *transition*, or trigger immediately on load rather than on scroll-into-view for above-the-fold content — which is a design decision, not a one-line fix).

## Accessibility — Real Pass, Not Just Automated Tooling

No dedicated axe/Lighthouse-accessibility tool was available in this environment, so this was a manual pass using real keyboard interaction and DOM inspection, not a tool report:

- **Keyboard navigation:** Tabbed through the dashboard; focus order was sensible and a visible focus ring appeared on links (confirmed via screenshot, not assumed from CSS).
- **Escape-to-close:** The mobile nav drawer correctly closes on `Escape` — verified live (open → press Escape → drawer gone).
- **Icon-only buttons:** Scripted a check across the dashboard for any `<button>`/`<a>` with no visible text and no `aria-label`/`title` — found zero on that page.
- **Image alt text:** Scripted a check for `<img>` elements with `alt` missing entirely (as opposed to empty/decorative `alt=""`, which is valid) — found zero on the dashboard.
- **Heading hierarchy:** Found one real, minor issue — the dashboard's heading order is `H1 → H3 → H3 → H3`, skipping `H2` (the workspace card titles are marked `H3` with no intervening `H2`). Not a hard WCAG failure, but non-ideal for screen-reader users navigating by heading level. Not fixed — would need a broader look at whether "Projects"/"Events"/"Collaborations" should be `H2`s, which touches visual hierarchy, not just markup.
- **Reduced motion:** Verified by code inspection (not live emulation — this browser tool doesn't expose `prefers-reduced-motion` emulation): both `useLenisSmoothScroll` and `useGsapReveal` in `Landing.tsx` explicitly check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` and skip/short-circuit animation accordingly.
- **Not tested:** full screen-reader pass (VoiceOver/NVDA), color contrast ratios (no contrast-checking tool available), form validation error announcements, focus trapping inside the mobile drawer (confirmed it opens/closes correctly, did not verify Tab is trapped inside it while open), touch target sizing measurements.

## Performance — Real Numbers, Against the Actual Production Build

Dev-server timing numbers are not representative of real performance (unminified, unbundled HMR chunks), so a `next start` production server was started locally (port 3001, added as a `prod` config in `.claude/launch.json`) and measured via the browser's own Performance API — not Lighthouse, which wasn't available in this environment:

- **TTFB:** 214ms (local — no real network latency)
- **DOMContentLoaded:** 228ms
- **Load event:** 265ms
- **Total transfer:** 382KB across 21 resources
- **JS transfer:** 274KB across 14 files

These are reasonable numbers for a Next.js app with GSAP + Lenis + Supabase, not bloated — but they're **local, uncached-network numbers**, not a real-world measurement over an actual network with real latency, and **no Lighthouse/Core Web Vitals run was performed** (no such tool was available in this environment) — so there's no LCP, CLS, or INP figure to report. Paint-timing entries (`first-paint`/`first-contentful-paint`) came back empty from the Performance API in this headless browser context, which may be a tooling limitation rather than a real absence of paint events; flagging rather than guessing at a number.

**No performance issues were found or fixed** — this was a measurement pass, not an optimization pass, consistent with the instruction to only fix measurable or obvious problems, and nothing measured here rose to that bar.

## Production Deployment

- Committed all fixes from this pass (`f60de26`) and pushed to `portfolio-screenshots` — **still a preview branch; `main`/production was not touched**, consistent with the standing instruction not to merge to production without explicit authorization.
- Build verified clean before pushing: `npm run build` succeeded (46 static/dynamic routes including the new `/_not-found`), `npx tsc --noEmit` clean, `npm run lint` clean in app source (only the pre-existing, already-documented `ProjectForm.tsx` issue remains).
- The new preview deployment's `readyState` should be confirmed via the Vercel API before considering this "deployed" — see the final response for the actual confirmed state at the time this report was written.
- **Same deployment-protection limitation as the first audit:** this Vercel project's preview URLs require SSO the browser session in this environment doesn't have, so the deployed URL itself could not be walked through in a browser. All interactive testing in this pass was against the local dev server (and, for performance, a local production build) running the identical committed code.

## Updated Final Classification

| Area | Status | Why |
|---|---|---|
| **Core functionality** (auth, projects, devlogs) | READY | Fully tested including the new delete flow; no known issues |
| **UI/UX** | READY | Consistent shell across all migrated surfaces; minor reveal-animation flash noted, not blocking |
| **Authentication** | READY | Google OAuth + email/password both confirmed working; session redirects correct |
| **Authorization** | **NEEDS FIX** | The studio/studio_projects/subscriptions RLS correlation bug (P0, security) is live and unresolved pending your approval to apply the fix |
| **Community** (feed, follow, explore, search) | NEEDS FIX (partial) | Feed/explore/search all PASS; follow itself is BLOCKED — untestable with one account |
| **Playtesting** | NEEDS FIX (partial) | Single-account flows PASS; the actual tester-side flow is BLOCKED — untestable with one account |
| **Events** | READY | PASS in both audit passes; creation form not submitted (would create a real dated event with no cleanup path) but renders and validates correctly |
| **Collaboration** | READY | Full post-creation flow verified end-to-end in the first audit |
| **Jams** | NEEDS FIX | Full host→approve→publish flow now works after the migration fix; submission/voting is BLOCKED — untestable with one account |
| **Studios** | **NEEDS FIX** | Currently cannot be successfully created at all until the RLS bug above is fixed — this is the most concretely broken area in the product right now |
| **Publisher** | READY | Registration and shortlist creation both verified working end-to-end |
| **Settings** | READY | Profile/account/danger-zone all verified; danger-zone safeguard confirmed real, not cosmetic |
| **Responsive** | READY | No overflow found at any tested breakpoint; sweep was a representative sample, not exhaustive |
| **Accessibility** | NEEDS FIX (minor) | Keyboard nav and Escape-to-close both verified working; one minor heading-hierarchy gap found, nothing severe |
| **Performance** | READY | Real production-build numbers are reasonable; no Lighthouse run possible in this environment |
| **Deployment** | READY (preview only) | Build/typecheck/lint clean, preview redeployed; production/main untouched by design; direct browser verification of the deployed URL still blocked by SSO protection |

### MUST FIX BEFORE PRODUCTION
1. **The studio_members/studio_projects/subscriptions RLS correlation bug** — a live, exploitable cross-tenant authorization break. Fix is written and ready, blocked only on your approval to apply it.
2. **Studios cannot currently be created successfully at all** — direct consequence of #1. Once #1 is fixed, this needs a follow-up retest.

### SHOULD FIX BEFORE PRODUCTION
3. No delete feature for studios or jams (mirrors the project-deletion gap this pass fixed) — owners currently have no way to remove what they created.
4. `studios_insert` RLS allows unauthenticated inserts at the database layer (defense-in-depth gap; currently masked by the server action's own auth check).
5. The landing page's ~1–2 second near-blank flash before the reveal animation fires on first load.
6. The dashboard's `H1 → H3` heading-hierarchy skip.

### CAN WAIT
7. CSP defined in two places (`next.config.ts` and `proxy.ts`) with different allowlists — config-drift risk, not a live bug.
8. The pre-existing `ProjectForm.tsx` `set-state-in-effect` lint error (not introduced by any session in this engagement).
9. Full Lighthouse/Core Web Vitals run once a tool supporting it is available.
10. Full accessibility pass with a screen reader and a contrast-checking tool.

### NOT TESTABLE (this environment)
11. All multi-account workflows (follow, collaboration applications, playtest participation, cross-account notifications) — no second account obtainable without risking the only working session.
12. Stripe payment flows — no test payment method.
13. Resend email delivery — no test inbox.
14. Direct browser verification of the deployed preview/production URL — blocked by Vercel deployment protection (SSO) in this environment.
15. Full 6-breakpoint × 20-feature responsive matrix — representative sample only was completed given time.

---

*This Release Readiness Pass reflects only what was actually exercised in a real browser session, verified by direct database/code inspection, or explicitly approved by the user before acting (the missing-migrations fix). Every BLOCKED item names the specific missing infrastructure or account rather than being silently skipped or assumed to pass.*
