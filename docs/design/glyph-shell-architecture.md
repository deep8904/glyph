# Glyph global shell — architecture (Phase B)

Files: `components/shell/{Shell,ShellNav,ContextBar,FocusedShell}.tsx`, `lib/shell/nav.ts`. Compatibility wrappers: `components/dashboard/AppShell.tsx`, `components/discovery/DiscoveryFrame.tsx`, `components/layout/PageShell.tsx`. Dev-only fixture: `/design/shell` (signed-in chrome without authentication; 404 in production).

## Structure
Three frames, not one:
| Frame | Used for | Contains |
|---|---|---|
| **Shell** (`ShellFrame`) | everything with a product surface | left rail (≥768px), top bar, optional context bar, `<main id="main-content">`, bottom bar (<768px) |
| **FocusedShell** | `/login`, `/signup`, `/onboarding` | brand only; no navigation; plain canvas |
| none (marketing) | `/`, `not-found`, root `error` | own layout; only carry `id="main-content"` for the skip link |

Signed-in and signed-out visitors use the **same Shell**; only the items differ. Identity is read from `getOptionalIdentity()`, now memoised per request (React `cache`), so a page that already fetched identity adds no queries.

### Responsive tiers
| Width | Navigation | Search |
|---|---|---|
| <768 | top bar (brand, search icon) + fixed **bottom bar** (5 items signed in / 4 signed out, ≥56px tall); Create and Me open bottom sheets | icon → `/search` |
| 768–1023 | **compact rail** 96px (icon over 12px label) | top-bar field |
| ≥1024 | **full rail** 240px | top-bar field |
Main content has bottom padding for the bar (`5rem + safe-area`).

### Global navigation
Signed in: **Home** (`/feed`) · **Explore** · **Create** (menu / sheet: Project, Devlog, Collaboration post, Playtest, Event, Game jam, Studio) · **Notifications** (unread badge) · **Me** (menu / sheet: Your profile, Dashboard, Your projects, Studios*, Publisher tools*, Publisher messages*, Settings, Admin*, Sign out; *role-gated by the existing flags). Signed out: Home (`/`), Explore, Log in, Sign up. Search is the top-bar utility for both. The mobile label for Notifications is "Alerts" (space), its accessible name starts with "Alerts".
Contextual navigation is **not** in the rail: it is a bar under the top bar, from either (a) a `breadcrumb` prop that canonical-object pages pass (project → owner; devlog → owner → project), or (b) `sectionNav(pathname)` for route groups: *Explore sections* (Explore, Collaborate, Playtests, Jams, Events, Publishers), *Your workspace* (`/dashboard*`: Overview, Projects, Playtests, Studios, Publisher messages*, Publisher tools*, Billing), *Admin*.

## Route-to-shell matrix
| Route type | Desktop | Mobile | Global nav | Contextual nav | Notes |
|---|---|---|---|---|---|
| Landing `/` | own marketing layout | own | own header | — | **Not migrated** (Persuade surface with GSAP/Three; retains plasma). Decision needed. |
| Login / Signup | FocusedShell | FocusedShell | none | — | |
| Onboarding | FocusedShell (wide), brand not a link | same | none | — | code-verified only (auth required) |
| Feed, Notifications | Shell | Shell | Home / Notifications active | — | via `AppShell` wrapper |
| Explore, Search, Collaborate (board + post), Playtests browse/detail, Publishers, Studios (public) | Shell (signed-out too) | Shell | Explore active (Search: none) | Explore sections | via `DiscoveryFrame` |
| Jams, Events, Pricing | Shell | Shell | Explore active (jams/events); pricing none | Explore sections (jams/events) | via `PageShell`; old rounded panel and brand header removed; `PanelHeader` = breadcrumb |
| Profile `/dev/[u]` | Shell | Shell | Me active if own profile | none (top-bar label "Developer profile") | plasma removed; content unchanged |
| Followers / Following | Shell | Shell | as profile | breadcrumb: person → Followers | |
| Project `/p/[u]/[p]` | Shell | Shell | none | breadcrumb: owner → project | plasma removed; cover + content unchanged |
| Devlog `/p/…/[devlog]` | Shell | Shell | none | breadcrumb: owner → project → devlog | |
| Dashboard `/dashboard*` | Shell | Shell | Me active | Your workspace | `DashboardClient` no longer renders a shell; the server page does |
| Settings | Shell | Shell | Me active | (SettingsNav inside content) | |
| Admin | Shell | Shell | Me active | Admin | via `PageShell` |
| Playtest test session, Collaborate new, forms under `/dashboard/*` | Shell | Shell | Me (dashboard) / none (collaborate/new = Create) | as group | via `AppShell` wrapper |

## What was removed
`.bg-plasma`, translucent "glass slice" layers, `panel-shadow`, `rounded-[2.5rem]` page panels, per-page brand headers and top-bar back links from `/dev`, `/p`, followers/following, onboarding, auth, `PageShell`. The old `AppShell` (sidebar, hamburger drawer) and `SecondaryNav` ("More" accordion) are deleted. The CSS classes remain in `globals.css` only for the landing page.

## Known limitations
- The shell is rendered by each page (not a shared layout), so it remounts on navigation and a `loading.tsx` inside a shell page paints the shell twice during streaming. A route-group layout is the fix (later phase).
- "Create → Devlog" goes to `/dashboard/projects` (choose a project) because a devlog needs a project id.
- `headerLabel` on desktop duplicates page headings on some pages (e.g. "Explore"); cleaned up when pages are migrated.
- Signed-in behavior was verified only through the `/design/shell` fixture and code; no real session was possible.
