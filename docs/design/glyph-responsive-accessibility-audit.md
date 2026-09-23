# Phase H/I — Responsive, accessibility and visual-polish audit

Written before further code changes, updated as fixes land. Covers Phase H (responsive) and Phase I (keyboard, screen reader, semantics, touch targets, anti-slop). "Verified" below means hands-on in the browser this pass, at the stated width, with real or fixture data; "code-reviewed" means read but not driven in a browser; blank/"—" means not checked this pass and not to be assumed correct.

## How this was tested
- **Hands-on, signed-out, real data:** `/explore`, `/collaborate`, `/playtests/browse`, `/jams`, `/events`, `/publishers`, `/studios/phase1-test-studio`, `/dev/deep`, `/p/demo-nova/emberfall-keep`, at 1440 → 1024 → 768 → 375, with `scrollWidth`/`innerWidth` diffed for overflow at each stop.
- **Hands-on, dev-only fixtures** (cover signed-in chrome and states real auth can't reach): `/design/shell` (rail, Create/Me, bottom bar, skip link), `/design/graph` (Studio/Jam/Event/Publisher components), `/design/account` (Settings, Notifications, every state) — 375 / 768 / 1024, plus keyboard through the delete-account `Dialog`.
- **Not driven this pass:** any real signed-in page (`/feed`, `/dashboard`, project/devlog editors) — still blocked by email-OTP, same limitation as every prior phase. Their *markup* was read, not exercised in a viewport.
- **Screen reader:** no NVDA/VoiceOver run this pass either. "Screen reader" column below means the accessibility tree was inspected (roles, names, `aria-*`) with `read_page`, which catches missing labels and wrong roles but not everything a real screen reader user would notice (verbosity, announcement order, timing).

## Matrix

Legend: ✅ verified · 🔧 code-reviewed only · ⛔ real gap found (see notes) · — not checked.

| Surface | 375 | 768 | 1024 | 1440 | Keyboard | Screen reader | State coverage |
|---|---|---|---|---|---|---|---|
| Profile (`/dev/[u]`) | ✅ | 🔧 | 🔧 | ✅ | 🔧 | 🔧 tree only | populated ✅; empty current-work/devlogs seen (real data); no-avatar seen |
| Project (`/p/[u]/[p]`) | 🔧 | 🔧 | 🔧 | ✅ | 🔧 | 🔧 tree only | populated ✅ only; empty/error not hit (no empty project in DB) |
| Devlog (`/p/…/[d]`) | — | — | — | — | 🔧 | 🔧 | not driven this pass |
| Feed (`/feed`) | — | — | — | — | 🔧 | 🔧 | signed-in only; not reachable |
| Dashboard (`/dashboard`) | — | — | — | — | 🔧 | 🔧 | signed-in only; not reachable |
| Explore (`/explore`) | ✅ | 🔧 | 🔧 | ✅ | 🔧 | 🔧 tree only | populated ✅ |
| Search (`/search`) | — | — | — | — | 🔧 | 🔧 | not driven this pass |
| Collaboration (`/collaborate`) | 🔧 | 🔧 | 🔧 | ✅ | 🔧 | 🔧 tree only | open posts ✅; no empty/no-results hit |
| Playtesting (`/playtests/browse`) | 🔧 | 🔧 | 🔧 | ✅ | 🔧 | 🔧 tree only | open requests ✅ |
| Studios (`/studios/[slug]`) | ✅ | ✅ | ✅ | ✅ | 🔧 | ✅ tree | populated header/team ✅; empty Projects section ✅ (real: studio has none) |
| Jams (`/jams`, `/jams/[slug]`) | 🔧 | 🔧 | 🔧 | ✅ | 🔧 | 🔧 | list empty ✅ (real: 0 jams); detail only via fixture (no live jam) |
| Events (`/events`) | 🔧 | 🔧 | 🔧 | ✅ | 🔧 | 🔧 | list empty ✅ (real: 0 upcoming); detail verified in Phase F, not re-run here |
| Publishers (`/publishers`) | 🔧 | 🔧 | 🔧 | ✅ | 🔧 | 🔧 | list empty ✅ (real: 0 verified) |
| Settings (`/settings/*`) | ✅ fixture | 🔧 | ✅ fixture | 🔧 | ✅ dialog | ✅ tree | every state via `/design/account`: normal/incomplete profile, privacy lists, prefs, delete flow ×3 |
| Notifications (`/notifications`) | ✅ fixture | 🔧 | ✅ fixture | 🔧 | 🔧 | ✅ tree | populated/unread/all-read/empty/failed/unavailable-target, all via fixture |

No horizontal overflow (`scrollWidth === innerWidth`) found on any hands-on-tested surface at any tested width.

## Findings

### 1. Section nav breadcrumb hidden below 640px — documented, not a defect
`ContextBar`'s small "Studios" / "Explore" breadcrumb line (above the search bar) is `display: none` under `sm:`. This is not a bug: the page's own `<h1>` (e.g. "Phase1 Test Studio") states the same thing one line down, and the "Explore sections" horizontal nav (Explore/Collaborate/Playtests/Jams/Events/Publishers) stays visible and scrollable at every width. **Where it's still reachable:** the `<h1>`, the section nav, and the URL itself. No fix needed; noting per the "don't just hide it" rule.

### 2. 1440px: content column reads narrow, not stretched — but the space around it does nothing
`DiscoveryFrame` and most object pages cap at `max-w-3xl`/`max-w-2xl` (Section 7 of the design system, editorial reading width). At 1440 with the 240px rail, that leaves roughly 500–600px of untouched canvas background to the right of the content on Explore, Collaborate, Playtests, Jams, Events, Publishers, Studios, and Settings. It does **not** stretch line length (good — avoids the "stretched mobile page" failure mode the brief warned about), but it also doesn't do anything editorial with the space; it just ends. **Classification: Keep, with a caveat.** The reading-width cap is correct per Phase A/D's own rules and per accessibility guidance (long lines hurt readability). Turning that space into a working secondary column (e.g. metadata rail, related items) is a real design decision with its own information-architecture questions per surface — that is new-feature-shaped work, not a hardening fix, so it is **not done in this pass** and is named here as backlog rather than silently left unexamined.

### 3. Everything else checked was clean
No accidental double navigation, no clipped dialogs, no rows that lost scannability, no forms that broke, at any width tested. Long names/titles were exercised via `/design/account` and `/design/graph` fixtures (long display names, long devlog titles) and wrapped correctly (`[overflow-wrap:anywhere]` on every row component).

## Keyboard audit (this pass)
Skip-to-main-content confirmed as the first tab stop (`/design/shell`). Dialog focus/Escape/return-to-trigger and `aria-pressed` were re-confirmed this pass on the account-deletion dialog (`/design/account`) at 375. The remaining keyboard surfaces (Create/Me sheets, filters, tabs, popovers, comment forms) were verified in Phases B–G as each shipped (see those phase reports) and not re-driven end-to-end in this pass; nothing regressed by anything changed in H so far (no shell/menu code touched).

## Anti-AI-slop audit

Every occurrence of the flagged patterns (`rounded-2xl`, `rounded-3xl`, `shadow-lg`, gradients, `backdrop-blur`, glow/blur decoration, arbitrary hex colors, tiny/uppercase meta text) was found and classified. Nothing was removed by blind regex.

| Pattern | File | Classification | Action |
|---|---|---|---|
| `rounded-2xl` cards, `shadow-lg`/`shadow-md` hover | `app/dashboard/projects/page.tsx` | Migrate | **Fixed this pass** — rebuilt as a token row list (`Badge`, `IconButton`, `Button`, `EmptyState`) |
| `rounded-2xl` boxes, `uppercase tracking-widest` labels | `app/dashboard/billing/page.tsx` | Migrate | **Fixed this pass** — `MetadataBar`, token colors, `Button` |
| `rounded-2xl` rows, ad hoc avatar/initials | `app/dev/[username]/followers/page.tsx`, `.../following/page.tsx` | Migrate | **Fixed this pass** — `Avatar`, `EmptyState`, token rows |
| `rounded-3xl` card, ad hoc avatar | `components/ProfileCard.tsx` | Migrate | **Removed this pass** — zero callers anywhere in the codebase; dead code, not a live surface |
| `rounded-3xl` danger box, ungated destructive button | `components/dashboard/DeleteProjectForm.tsx` | Migrate | **Fixed this pass** — same `Dialog`-confirmed pattern as account/studio deletion |
| `rounded-full` + `shadow-lg shadow-indigo-600/20` submit buttons | `components/dashboard/ProjectForm.tsx`, `components/dashboard/DevlogForm.tsx`, `app/onboarding/page.tsx`, `components/auth/AuthForm.tsx` | Migrate — **deferred** | Real, working, high-traffic forms (project/devlog editors, onboarding, login/signup) not touched by any prior phase. A full token migration here touches loading/error/disabled states throughout large forms; doing it as a drive-by risks the exact forms people use to create content. Flagged as its own follow-up, not attempted in this pass. |
| `rounded-2xl`/`3xl`, `shadow-lg`, gradients, `backdrop-blur`, hex background | `components/landing/Landing.tsx` | **Exception** | Landing (`/`) is the marketing surface; the user has repeatedly said it stays untouched (GSAP/Three.js/plasma) |
| `rounded-2xl`/`3xl`, `shadow-lg` | `app/pricing/page.tsx` | **Exception** | Explicitly out of scope since Phase C ("admin + pricing still on `PageShell`") |
| `rounded-2xl`, `shadow-lg` | Admin pages (`app/admin/**`), `components/admin/*Client.tsx` | **Exception** | Explicitly out of scope every phase to date; admin is an internal tool, not part of the public redesign |
| `rounded-2xl`, `backdrop-blur`, hex color | `components/DevDebugPanel.tsx` | **Exception** | Dev-only debug overlay, not shown in production |
| `bg-[#0f0e13]` | `app/layout.tsx` `<body>` | **Keep** | Pre-hydration fallback background matching the landing page's dark canvas before CSS loads; not visible on any app route (app routes set their own `bg-canvas`) |
| `rounded-full` on `Avatar`, `Badge` pill, `Button`, `IconButton` | design-system primitives themselves | **Keep** | Justified: these are the intentional pill/circle shapes of the system, not legacy leftovers |

**Not found anywhere in app/components (production code):** decorative background blobs, unexplained animation loops, oversized display headings outside the landing page, excessive uppercase body copy outside the two deferred legacy forms, duplicated one-off component styles (every touched surface uses the shared primitives).

## Backend/architecture items explicitly parked (per direction)
- `events.rsvp_count` trigger drift — UI already counts `event_rsvps` directly; not touched here.
- Public demo-slot visibility — product/RLS decision, not made here.
- `loading.tsx` + 404 architecture — separate cleanup phase, after I.
- Dashboard query count / `fetchEngagement` performance — separate performance audit, after I.

## Open follow-ups from this pass
1. `ProjectForm` / `DevlogForm` / `AuthForm` / onboarding still carry pre-Phase-A button styling (see table). Recommend a dedicated pass, not bundled with hardening.
2. The 1440 "empty right column" (finding 2) is a real product-design question (secondary content vs. deliberate whitespace) — worth an explicit decision, not a mechanical fix.
3. Full keyboard and screen-reader passes on `/feed`, `/dashboard`, project/devlog editors, and comment threads remain blocked by the lack of a real signed-in session; still the standing limitation stated in every phase report since Phase C.
