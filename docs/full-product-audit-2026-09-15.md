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

*This report reflects only what was actually exercised in a real browser session or verified by direct code/schema inspection this pass. Where something was not tested, it is marked as such rather than assumed to work.*
