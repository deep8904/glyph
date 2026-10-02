# Glyph redesign changelog

Concise, current-state record. This file is **not** implementation authority — design authority is `DESIGN.md` + `design/NEW_GLYPH_PRODUCT_DIRECTION.md`; product truth is `PRODUCT.md`; extracted technical contracts are in `docs/contracts/`.

## Current system (authoritative summary)

- **Identity:** "Graphite & Bone + Ember" — near-neutral theme-dual surfaces (Bone light / Graphite dark) so game media supplies chroma; one Ember accent (`#e8552a` / `#ff6a3d` dark) reserved for action, live state, and selection. Geist (display+body), JetBrains Mono (data only). Tokens: `--gg-*` under `.gg-scope`, isolated from legacy tokens.
- **Shell:** one quiet **top bar** (wordmark · Home · Explore · ⌘K search/command · Create · Notifications · account) + **⌘K command menu** (combobox/listbox → `/search?q=`) + mobile **slide-over sheet**. No side rail, no contextual tab row, no bottom bar, no peek inspector. Home → `/` signed-out, `/feed` signed-in.
- **Isolation:** new surfaces live under `components/glyph/**` and import no legacy presentation (`components/ui/*`, `Shell`, `DiscoveryFrame`, `ProjectMark`/tiles, `lib/tint`) — only headless/query/type/permission helpers are reused.

## Built so far (greenfield proof)

- Token layer + `.gg-scope` (Ember focus + selection); themed browser surfaces (caret, scrollbars, form accent).
- `GlyphShell` + `GlyphTopNav` + `CommandMenu` (combobox a11y + focus restoration).
- New object language under `components/glyph/explore/` (feature, project tile with honest cover / compact no-cover identity, developer card + directory row, devlog moment + reading row, filter chips, pager) + new empty/error states.
- **Explore journey rebuilt end to end:** `/explore` hub and `/explore/[section]` (`projects`/`developers`/`devlogs`) — one shell boundary at `app/explore/layout.tsx`; URL filter + paging + viewer-relative following behavior preserved; real Supabase data.

## Product/data preserved throughout

Supabase schema, RLS, auth, permissions, queries, mutations, routes, lifecycle and business rules are unchanged; only presentation is rebuilt. Superseded design docs and dev-only prototype routes were removed; durable technical facts were extracted to `docs/contracts/` (see `design/OLD_UI_REMOVAL.md` for the deletion/classification ledger).

## Not started

Project, Profile, Devlog, Dashboard, and remaining routes — pending independent recheck of the Explore journey.
