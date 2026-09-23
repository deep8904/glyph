# Glyph state matrix

Two parts: (1) the rules the shared state components enforce (built in Phase A), (2) per-surface coverage as found in the repository (audit) — the target for later phases. Coverage below is from code reading, not signed-in browser testing.

## 1. State components and rules
| State | Component | Rule |
|---|---|---|
| Loading | `Skeleton*` + `LoadingRegion` + per-route `loading.tsx` | Skeleton mirrors final layout; one `role=status` announcement; no spinner-only pages; motion off under reduced-motion |
| Empty: first-use | `EmptyState kind="first-use"` | Says what the thing is for + one CTA |
| Empty: cleared | `kind="cleared"` | States what changed; way back |
| Empty: no-results | `kind="no-results"` | Echoes the query; offers to loosen filters |
| Restricted/private | `kind="restricted"` | Says it is hidden and who can see it; never displayed as "empty" |
| Error | `ErrorState` | `role=alert`; plain language; "may be temporary"; retry; no codes/stack; distinct color and copy from empty |
| Field error | `Field error=` | Text under the field, `aria-invalid`, `aria-describedby`; input preserved |
| Async result | `toast()` | Confirmation or recoverable failure only; errors use the assertive type |
| Destructive/permission | `Dialog` | Title required; focus trapped, Escape closes, focus returns |

## 2. Current coverage (from the audit; target for Phases C–G)
| Surface | Loading | Empty | Error | Owner vs visitor | Notes |
|---|---|---|---|---|---|
| Feed, Explore, Search | ✅ skeletons (Phase D) | ✅ first-use / cleared / no-results distinct | ✅ `ErrorState` with retry link | n/a | Explore section pages have no loading (keeps 404 for unknown sections) |
| Dashboard | ✅ generic skeleton (shared by `/dashboard/*`) | ✅ per section (first-use vs cleared) | ✅ inline `ErrorState` per failed section + `dashboard/error.tsx` | self only | Phase D |
| Profile | ❌ (see note) | ✅ `EmptyState` (owner CTA / visitor plain) | inline `ErrorState` on project query failure | ✅ same skeleton; owner: Edit, Featured toggles | Phase C |
| Project | ❌ (see note) | ✅ no devlogs (`EmptyState`, owner CTA) | inline `ErrorState` on devlog query failure | ✅ same skeleton; owner: Edit, Write devlog, drafts | private → 404 (no existence leak). Phase C |
| Devlog | ❌ (see note) | ✅ no feedback (`EmptyState`) | inline `ErrorState` on comments query failure; write failures inline | ✅ owner: Edit, draft banner | draft → 404 for others. Phase C |
| Collaboration, Playtests | ✅ board skeletons (`(board)` group, `/playtests/browse`); detail pages none (keeps 404) | ✅ first-use / cleared / no-results per surface | ✅ `ErrorState` on board/dashboard loads; inline `role=alert` on writes | ✅ different pages for applicant vs poster and tester vs developer | Phase E; full state→UI map in `glyph-phase-e-workflows.md` |
| Studios, Publisher | ❌ | ✅ | inline | ✅ | |
| Notifications, Settings | ❌ | ✅ | inline alert | self | Phase 10 |
| Jams, Events, Publishers, Studios (Phase F) | Jams hub skeleton (`(hub)`); others none (keeps 404) | ✅ per section (first-use / cleared / no-results / restricted) | ✅ `ErrorState` on list loads; inline `role=alert` on writes | ✅ host/member vs visitor differ by action layer | `glyph-phase-f-architecture.md` |
| Admin | ❌ | ✅ | root | ✅ | untouched (still `PageShell`) |
"❌" = no `loading.tsx` (63 of 66 pages). Errors on older pages often fall through as empty (`data ?? []`); each phase must surface a real error state where the query can fail.

**Note (Phase C):** `loading.tsx` was deliberately *not* added to `/dev/[u]`, `/p/[u]/[p]`, `/p/…/[devlog]`: a segment `loading.tsx` streams a 200 before `notFound()` runs, so unknown slugs stopped returning 404 (verified). Correct 404s were kept; skeleton primitives (`Skeleton`, `LoadingRegion`) remain available for a layout-level existence check later.

| Notifications, Settings (Phase G) | `loading.tsx` skeletons (list, settings) | first-use empty; unread filter no-results; block/mute lists empty | `ErrorState` for list load; `role=alert` on save | unread / all read; target unavailable (gone or hidden); deleted actor | `glyph-phase-g-account-architecture.md`, fixture `/design/account` |
