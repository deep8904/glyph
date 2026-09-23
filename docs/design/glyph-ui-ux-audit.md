# Glyph — UI/UX Repository Audit (pre-overhaul)

Date: 2026-09-21. Method: direct reading of the repository plus `grep` counts over `app/` and `components/` (155 `.tsx` files). No application code was changed to produce this document. Numbers are counts of class-string occurrences, not rendered instances. Earlier audits (`docs/glyph-ui-ux-audit-2026-09-16.md`, `docs/glyph-product-design-blueprint.md`) were read as context; where they disagree with the code, the code is used.

Verification tags: **COUNTED** (grep over source), **READ** (file read), **PRIOR** (from earlier phases of this engagement, not re-read in this pass).

---

## A. Current architecture

| Area | Fact | Tag |
|---|---|---|
| Framework | Next.js 16.2.7 App Router, React 19.2, TypeScript 5, Tailwind CSS 4 (config lives in `app/globals.css`, no `tailwind.config`) | READ |
| Routing | 81 route files: 66 `page.tsx`, 6 `route.ts`, 3 `loading.tsx`, 2 `error.tsx`, 1 `not-found.tsx`, 3 `layout.tsx` (root, dashboard, settings) | COUNTED |
| Route protection | `proxy.ts` redirects signed-out users away from `/dashboard*`, `/onboarding`, `/settings*`, `/notifications`, `/feed`, `/collaborate/new`, `/events/*/manage`, `/admin*`. Everything else is public. Also sets security headers and a CSP. | READ |
| Layout structure | **Three different page shells plus bespoke pages** (see below). No shared root chrome: `app/layout.tsx` renders only the skip link and `{children}`. | READ |
| Component structure | `components/` has 17 feature folders plus `ui/` (one component: `Badge`) and `workflow/StatusLabel`. Server components fetch; small `'use client'` leaves handle interaction. | READ |
| Styling | Tailwind utility classes written inline. **No component primitives**: 0 `Button`, 0 `Input`, 0 `Dialog`. 3 `@theme` tokens (three font families) and nothing else. | READ / COUNTED |
| Design tokens | None for color, spacing, radius, shadow or type scale. Only `--font-sans/mono/display`. | READ |
| Installed but unused UI packages | `radix-ui` (0 imports), `class-variance-authority` (0 imports in components), `shadcn` (CLI only, no `components.json`), `tw-animate-css`, `@lottiefiles/react-lottie-player`, `@react-three/*`, `three` (landing/decorative only), `gsap`, `lenis`, `framer-motion`/`motion` (landing + AppShell only), `react-icons` (only `components/watermelon/*`). | COUNTED |
| Icons | `lucide-react` — 80 import sites. This is the existing icon pack and the only one used in product UI. | COUNTED |
| Fonts | `next/font/google`: Geist (sans), JetBrains Mono (mono), Space Grotesk (display). | READ |
| State patterns | Server components read Supabase directly; mutations via server actions (`app/actions/*`) with `revalidatePath`; client leaves keep local `useState`. `@tanstack/react-query`, `zustand`, `react-hook-form`, `zod` are installed; the Phase 5–10 forms use plain `useState`. | READ / PRIOR |
| Data fetching | `lib/supabase/server.ts` (SSR client), `lib/dashboard/identity.ts` (one shared identity fetch: profile, admin, publisher, studio, unread count, pending invites, contacts — 7 queries per authenticated page), `lib/discovery/queries.ts`, `lib/feed/queries.ts`. | READ |
| Supabase | Project `adiovtzggkpzrfqmevyx`. RLS everywhere; guard triggers, definer RPCs, `security_invoker` views, column-level grants. Migrations 001–037 (031 belongs to a parallel session). | PRIOR |
| Auth | Supabase email OTP + OAuth. Signed-in browser verification is not possible in this environment (OTP). | PRIOR |
| Responsive architecture | Tailwind default breakpoints (`sm/md/lg`); global rule in CSS forces `min-height:44px` on every `button`, `a`, `[role=button]` below 768px. Authenticated shell = left sidebar (desktop) + top bar with hamburger drawer (mobile). **No bottom navigation.** | READ |

### The three shells (and what is outside them)
| Shell | Used by | Look |
|---|---|---|
| `AppShell` (`components/dashboard/AppShell.tsx`, 272 lines) | 24 authenticated pages directly; `DiscoveryFrame` (10 pages) when signed in; dashboard and settings indirectly | Light gray canvas, white sidebar, top bar |
| `DiscoveryFrame` | Explore, Search, Collaborate, Playtests, Publishers, Studios | `AppShell` when signed in; a separate plain header (`max-w-3xl`) when signed out |
| `PageShell` (`components/layout/PageShell.tsx`) | Admin (9), Events (3), Jams (5), Pricing | White `rounded-[2rem]` panel on `bg-gray-50`; its own header with breadcrumb |
| Bespoke "plasma" pages | `/dev/[username]` (+followers, following), `/p/.../[project]`, `/p/.../[devlog]`, `/onboarding` | Dark `bg-plasma` backdrop with a light floating panel; layered translucent right-edge panels with custom inline shadows, duplicated verbatim between files |
| Landing, auth | `/`, `/login`, `/signup` | Own layouts |

**Result:** the same signed-in user sees four different chromes while moving Feed → profile → jam → admin. Signed out, Explore/Search use a fourth header. Public developer/project/devlog pages (the flagship content) sit outside the app shell entirely.

---

## B. Current visual system (extracted values)

**Fonts.** Sans = Geist. Mono = JetBrains Mono (`font-mono` 246 uses — used for metadata, badges, counts, and email in the sidebar). Display = Space Grotesk (`font-display` 33 uses; wordmark, some H1s).

**Type sizes (class counts).** `text-sm` 585, `text-xs` 163, `text-[11px]` 102, `text-[10px]` 73, `text-xl` 41, `text-base` 41, `text-2xl` 30, `text-lg` 25, `text-3xl` 14, `text-4xl` 8, `text-[13px]` 4, `text-6xl` 2, `text-[9px]` 1. → **180 uses of 9–11px text** (`text-[9px]` 1, `[10px]` 75, `[11px]` 104) .

**H1 recipes (7 different).** `text-xl font-medium tracking-tight` (14+), `text-2xl font-display font-medium` (11), `text-xl font-semibold tracking-tight mb-6` (8), `text-2xl font-light tracking-tighter` (4), … no shared heading component.

**Weights.** medium 443, semibold 93, normal 23, light 9, bold 7.

**Colors.** Palette-family class counts: **gray 1570, indigo 641**, white 282, red 170, amber 49, green 48, yellow 8, blue 4, orange 2. One accent (indigo-600 `#4f46e5`) — this is consistent; red/amber/green are used for status. Raw hex in components: only `#4f46e5`, `#0f0e13` (plasma), indigo tints in selection, and Google logo colors. No dark theme: 0 `dark:` or `prefers-color-scheme` rules. The `<body>` background is dark `#0f0e13` even though most pages paint a light canvas over it.

**Radius.** `rounded-full` **203**, `rounded-xl` 81, `rounded-2xl` 73, `rounded-3xl` 18, `rounded` 17, `rounded-[2.5rem]` 9, `rounded-md` 6, `rounded-lg` 3, plus one-offs `[2rem] [22px] [1.75rem]`. → 8 distinct radii; most surfaces are pills or ≥16px.

**Shadows.** `shadow-lg` 31, `shadow-sm` 18, `shadow-md` 12, `shadow` 12, `shadow-2xl` 3, and 21 uses of three near-identical hand-written `shadow-[-15px_0_30px_-10px_rgba(255,255,255,…)]` strings (the plasma right-edge panels).

**Spacing.** Tailwind's 4px scale, used freely; arbitrary pixel values: `[11px]` 105, `[10px]` 75, `[18px]` 10, `[2.5rem]` 9, `[13px]` 4, and a handful of one-off widths. No spacing tokens or documented rhythm.

**Borders.** Almost entirely `border-gray-100/200`; the newer phase-5–10 pages use `divide-y divide-gray-100 border-y` (flat editorial lists), older pages use bordered `rounded-2xl` cards.

**Touch targets.** `min-h-11` 119 uses (44px) on the newer pages plus the global 44px mobile rule.

**Focus.** Global `:focus-visible` outline 2px `#4f46e5`, offset 2px. Good; applies to everything.

**Motion.** GSAP `ScrollTrigger` reveals (`.reveal`), CSS hero entrance, `transition-all duration-300`, `hover:-translate-y-0.5` on primary buttons, Lenis smooth scroll and Three.js on the landing page. `prefers-reduced-motion` is honored in CSS.

**Buttons (COUNTED).** The primary button is hand-written, ≥12 distinct class strings, e.g. `rounded-full bg-indigo-600 px-6 py-3 … shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5` (with a glow shadow and lift), `rounded-full bg-gray-900 px-5 py-2.5`, `rounded-full bg-indigo-600 px-3 py-1.5 text-xs`, `min-h-11 … px-4`. Secondary/ghost buttons: another set. 55 files contain `<button`.

**Inputs (COUNTED).** 76 `<input>`, 26 `<select>`, 23 `<textarea>` elements, each with its own class string; no shared field/label/error component.

**Badges/status.** `components/ui/Badge` (uppercase, mono, `rounded-full`, 10–11px, imported by 10 files) and `components/workflow/StatusLabel` (16 files). Two systems for the same job.

**Cards.** No shared card. Older screens: white `rounded-2xl`/`rounded-3xl` bordered/shadowed blocks. Newer screens: flat rows. Landing: bento-style `rounded-[2.5rem]`.

---

## C. Current UX problems

**Hierarchy.** Seven H1 recipes; 180 sub-12px text uses; the pill-everywhere radius and glow shadow make every button equally loud, so the one primary action per view is not distinguished from secondary ones.

**Navigation.**
1. Four chromes (above); public flagship pages (profile/project/devlog) have no app shell, no way back into Feed/Explore except a back link.
2. No global search entry outside the sidebar; the mobile header has search only if `hideSearch` is false.
3. No bottom navigation on mobile; a hamburger drawer holds everything (Home, Explore, Search, Notifications all one tap deeper than needed).
4. Desktop sidebar carries ~10 primary + secondary entries; the "Create" action does not exist as a single global affordance (new project, devlog, collaboration post, playtest, event, jam, studio each live on separate pages).
5. Signed-out header is a different component from the signed-in shell.

**Duplication.** See section E.

**Terminology.** Consistent nouns (project, devlog, playtest, studio) — a real strength. Inconsistent: "Sign Out" vs "Log in"; "Dashboard" (route) vs "Home" (label) vs "Feed" (destination).

**Missing states.**
- Loading: only `/feed`, `/explore`, `/search` have `loading.tsx`. **Every other route (~63 pages) shows nothing until server render completes** — including the dashboard, profile, project and devlog pages.
- Error: one global `error.tsx` and one for `/dashboard`. Data-fetch failures inside pages (e.g. a Supabase error) are mostly treated as "empty" (`data ?? []`) — an error looks identical to no content on many surfaces. (Phase 5–10 pages were corrected to show a distinct error line; older pages were not.)
- Empty: 14 files hand-write "No X yet" text with 3+ different templates (icon-square+CTA, plain sentence, dashed box).
- No skeleton component; 4 files use ad-hoc `animate-pulse`.

**Mobile.** Shell drawer works; no bottom nav; 44px min height enforced globally by a blanket CSS rule (which also inflates inline text links inside paragraphs — a side effect, PRIOR observation); tables/lists mostly reflow because they are list-based.

**Accessibility.** Positive: skip link, global focus ring, `aria-current` in newer navs, `min-h-11`, labels + `aria-describedby` in the Phase 10 forms, reduced-motion CSS. Gaps: **0 `role="tab"` (no real Tabs)**; **0 Radix**, so every menu/dialog/drawer is hand-rolled (`AppShell` drawer, `AuthForm`); no focus trap component; no toast/live-region utility (each form builds its own `role=status`); 180 sub-12px text runs; text contrast of `text-gray-400` on white (≈2.5:1) is used for meaningful metadata in ≥ dozens of places (not counted).

**Excessive decoration.** Glow shadows on primary buttons, hover lift, grain overlay, plasma gradient backdrop, layered translucent panels, Three.js/GSAP on the landing page, `rounded-[2.5rem]` containers around low-information states.

**Unnecessary containers.** `PageShell` wraps every admin/jam/event/pricing page in a `rounded-[2rem]` panel inside a `max-w-3xl` column (the content is narrower than the viewport at every width).

**Density.** Newer pages are dense flat lists; older pages are padded card grids. Same object (project) appears at very different densities depending on route.

**Dead ends.** Signed-out visitors on public profile/project pages see no path to sign up except the plasma header (PRIOR); settings pages are reachable only from the sidebar/footer of AppShell; several role-gated destinations (studios, publisher, admin) were not primary-nav entries (partly fixed in Phase 9 via `SecondaryNav`).

---

## D. Route inventory

Shell: AS = AppShell, DF = DiscoveryFrame (AS when signed in), PS = PageShell, PL = bespoke plasma, — = own layout. Loading = route has `loading.tsx`. Error = route-segment `error.tsx` (root one covers all others). "Mobile" = drawer nav + reflow, no bottom nav (all routes). Owner/Visitor from code read in Phases 5–10.

| Route | Purpose | Shell | Owner | Visitor | Loading | Empty | Error | Notes |
|---|---|---|---|---|---|---|---|---|
| `/` | Marketing | — | — | signed-in or out | — | n/a | root | Three.js/GSAP/Lenis; footer links fixed Phase 10 |
| `/login` `/signup` | Auth | — | — | signed out | — | n/a | inline | redirects signed-in users |
| `/onboarding` | Create profile | PL | self | — | — | n/a | inline | |
| `/dashboard` | Post-login home | AS | self | redirect | — | first-use | dashboard | 7-query identity fetch |
| `/feed` | Followed devlogs | AS | self | redirect | ✅ | first-use / no follows | root | chronological |
| `/explore`, `/explore/[section]` | Discovery | DF | — | public | ✅ (`/explore`) | no-results | root | |
| `/search` | Query | DF | — | public | ✅ | no-query / no-results | root | |
| `/dev/[username]` | Profile | PL | edit, drafts, featured toggle | public; block/mute | — | per-section | root | |
| `/dev/[username]/followers` `/following` | Lists | PL | — | public | — | yes | root | |
| `/p/[u]/[project]` | Project | PL | edit, drafts | public; playtest CTA | — | no devlogs | root | |
| `/p/[u]/[project]/[devlog]` | Devlog | PL | edit | public; comments/reactions | — | no comments | root | flagship reading page |
| `/dashboard/projects` (+new, [id]/edit, devlogs new/edit) | Project mgmt | AS | self | redirect | — | first-use | dashboard | forms |
| `/collaborate`, `/collaborate/[id]`, `/collaborate/new` | Collab board | DF / AS | post owner, applicants | apply | — | empty board | root | |
| `/dashboard/playtests`, `/new`; `/playtests/browse`, `/playtests/[id]`, `/playtests/[id]/test/[session]` | Playtesting | AS / DF | developer | tester | — | yes | root | build URL gated by RPC |
| `/studios/[slug]`; `/dashboard/studios` (+new, [slug]) | Studios | DF / AS | owner/admin | public | — | yes | root | |
| `/publishers`, `/publishers/[id]`; `/dashboard/publisher*`, `/dashboard/publisher-contacts` | Publisher | DF / AS | publisher / developer | public | — | yes | root | |
| `/jams`, `/jams/[slug]` (+submit, vote, results); `/dashboard/jams/new` | Jams | PS / AS | host | public | — | yes | root | vote page unvalidated `submission_url` href (PRIOR) |
| `/events`, `/events/[id]`, `/events/city/[city]`; `/dashboard/events/*` | Events | PS / AS | organizer | public | — | yes | root | `.ics` route |
| `/notifications` | Notification list | AS | self | redirect | — | yes | inline | Phase 10 |
| `/settings/*` (profile, account, privacy, notifications, danger) | Settings | own layout | self | redirect | — | n/a | inline | Phase 10; `SettingsNav` is the one good local-nav pattern |
| `/dashboard/billing`, `/pricing` | Plans | AS / PS | self | public | — | n/a | root | no real checkout |
| `/admin/*` (9 routes) | Moderation | PS | admin | redirect | — | yes | root | |
| `not-found` | 404 | — | — | — | — | — | — | |

Auth/API routes (`/auth/callback`, `/api/*`, `.ics`) are not visual.

---

## E. Design-system duplication (recommended consolidation)

| Pattern | Evidence | Consolidate into |
|---|---|---|
| Primary/secondary/ghost buttons | ≥12 primary class strings; 55 files with `<button` | `Button` (variant: primary/secondary/ghost/danger/link; size sm/md) + `IconButton` |
| Form fields | 76 input / 26 select / 23 textarea, each styled ad hoc | `Field` (label, hint, error, aria) + `Input`/`Textarea`/`Select` |
| Badge / status | `ui/Badge` + `workflow/StatusLabel` | one `Badge` with tones; keep `StatusLabel` as a thin wrapper until migrated |
| Avatar / initials | `initials()` re-implemented in 13 files; 44 `avatar_url` renders | `Avatar` (sizes, initials fallback, `alt`) |
| Project representation | `ProjectResult`, `CurrentProjectCard`, `CurrentWork`, `ProjectsList`, inline in `dashboard/page`, `dev/[username]`, `p/…`, `studios/[slug]` | `ProjectRow`/`ProjectCard` with variants (Phase C) |
| Devlog representation | `DevlogRow` (profile), `DevlogResult` (search), `DevlogCard`, `FeedItem`, `DevlogTimeline` | `DevlogRow`/`DevlogCard` with variants (Phase C) |
| Empty states | 14 hand-written | `EmptyState` (kinds: first-use, cleared, no-results, restricted) |
| Loading | 3 `loading.tsx` + 4 ad-hoc pulses | `Skeleton` primitives + per-route `loading.tsx` |
| Errors | root/dashboard `error.tsx`, inline `role=alert` boxes | `ErrorState` (+ inline variant) |
| Shells | AppShell / DiscoveryFrame / PageShell / plasma / signed-out header | One shell (Phase B) |
| Plasma right-edge panel | identical block in `dev/[username]/page.tsx` and `p/.../[devlog-slug]/page.tsx` | removed with shell unification (Phase B/C) |
| Page headings | 7 H1 recipes | type scale classes / `PageHeader` |
| Dialogs, menus, tabs, popovers, toasts | none exist as components; hand-rolled or missing | Radix-based primitives |
| Pagination | `Pager` (discovery only) | keep; restyle with tokens |
| Section headers with count | repeated `h2 … font-mono text-xs text-gray-400` pattern (≥10 files) | `SectionHeader` |

---

## F. Backend preservation audit (must not be broken)

The overhaul is frontend-only. These behaviors are enforced in the database or server actions and every UI change must keep calling them the same way:

1. **RLS on all user data.** Do not switch queries to service role; `SUPABASE_SERVICE_ROLE_KEY` is not configured. Keep using `@/lib/supabase/server` (anon key + user session).
2. **Viewer-relative views** `discoverable_projects`, `discoverable_developers`, `discoverable_devlogs`, `feed_items` (block/mute/visibility filtering). Explore/Search/Feed/Studio pages must keep reading these views, not base tables.
3. **Column privileges.** `projects.build_url`, `profiles.verified`, `profiles.plan`, notification `read_at` only, studio privileged fields. UI must not attempt to write them.
4. **Definer RPCs:** `create_studio`, `invite_studio_member`, `respond_studio_invitation`, `revoke_studio_invitation`, `admin_set_verified`, `get_playtest_build`, `account_deletion_summary`, `delete_my_account`. Keep the same call sites and error handling (`P0001` messages are surfaced deliberately).
5. **State-machine guard triggers** (playtest sessions, applications, studio members, last-owner rule). UI should keep showing the messages the DB raises.
6. **Playtest build access:** build link only through `get_playtest_build` for accepted testers/owner.
7. **Notifications:** `notifications_gate()` trigger drops blocked/muted/pref-off inserts; the client still inserts comment/reaction/follow notifications.
8. **Auth boundary:** `proxy.ts` protected-route list, `getSidebarIdentity()` redirect, login redirect for signed-in users, CSP header. The CSP `font-src 'self' data:` means fonts must be self-hosted via `next/font` (not `<link>` to Google).
9. **Security fixes from Phases 5–10:** https-only profile links (DB CHECK + `isHttpsUrl` guards), sanitized markdown (`rehype-sanitize`, DOMPurify), `stripDangerousUnicode`. Any new rendering of user URLs must go through `isHttpsUrl`.
10. **URL/route contracts** used by notifications and server actions (`revalidatePath` targets, `/p/[u]/[project]/[devlog]`, `/dashboard/studios/[slug]`, `/dev/[username]`).

Change classification for the whole overhaul: `visual`, `UX/layout`, `frontend-architecture` only. No `data-model`, `backend/RLS` or `new-feature` change is planned; if one becomes necessary it will be flagged before it is made.
