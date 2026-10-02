# Old UI removal inventory

Tracks legacy visual systems being eliminated in the ground-up redesign. Status is one of **removed** (deleted), **replaced** (deleted + new build), or **rebuilt** (data/behavior contract kept, presentation fully redesigned). Backend, routes, auth, RLS, mutations, and business logic are preserved throughout.

Legend: ▢ pending · ◐ in progress · ✔ done

| Old component / system | Why it conflicts with the new direction | Disposition | Replacement | Status |
|---|---|---|---|---|
| `DESIGN.md` (Auralis "Neural Audio Engine" world) | Wrong product entirely; cool indigo/white, prism, gradient hero — not Glyph's living-build-record thesis | replaced | New `DESIGN.md` "Glyph — the living build record" (warm editorial + operational) | ✔ |
| `components/auralis/*` (GradientField prism, primitives) | Auralis visual language, decorative WebGL/gradient banned by new direction | removed | None (game media supplies energy, not abstract gradients) | ◐ (Waveform/SynthesisPanel/Nav/Footer already removed; `GradientField` + any leftovers to delete once Landing is rebuilt R9) |
| Landing prism/gradient hero + mono eyebrows + gradient headline (`components/landing/Landing.tsx`) | Auralis carryover; gradient text + eyebrow-above-heading are craft-floor bans; not built from product proof | replaced (R9) | New landing from proven app language: living Project hero, loop, devlog slice, discovery, honest CTA | ▢ |
| Cool indigo/white token values (R1 interim) | Cool palette fought the warm editorial thesis | replaced | Warm paper canvas + warm near-black + one controlled accent (`app/globals.css`) | ✔ |
| Old shell chrome — `Shell`/`ShellNav` rail, `ContextBar` tab row, `BottomBar` | Left rail + contextual tab row + mobile bottom bar; chrome competes with content | replaced (data/behavior reused: `getOptionalIdentity`, `activeGlobal`, `meLinks`, `CREATE_ITEMS`) | New **top-bar** shell (`GlyphShell` + `GlyphTopNav`) + **⌘K command menu** + mobile **slide-over sheet**. No rail, no tab row, no bottom bar. | ✔ (new surface) · old shell still used by not-yet-migrated routes |
| Generic project/dashboard card patterns (`ProjectMark` procedural cover, equal-card grids) | "Card soup" — same rectangle for every object; weak project identity; procedural cover art stands in for real media | rebuilt | Object-specific anatomy: `ProjectTile`/`ProjectIdentityMarker` presenting real project media; editorial bands, rows, timelines instead of uniform grids | ▢ (R3+) |
| `ObjectHeader` composition | Useful provenance data contract, weak composition | rebuilt | Keep data contract → redesign as ProvenanceHeader (`Developer/Studio → Project → object` + state) | ▢ (R3) |
| Dashboard widget/overview composition | Equal-weight widget grid; generic SaaS dashboard | replaced | `ResumptiveWork` + needs-action vs recent-activity separation | ▢ (R4) |
| `.prism`, `.bg-plasma`, `.text-gradient`, `.bg-gradient-brand`, `.border-gradient-brand` utilities in `globals.css` | Decorative gradients/glass banned; gradient text is a craft-floor refusal | removed after last consumer migrates | none | ▢ (remove during R9 landing rebuild once no consumers remain) |

## Rule

No obsolete component is left hidden in the tree. Before deleting, `grep` usage; migrate consumers; then remove the component, its variants, and its dead tokens/CSS. Update this table's status as each lands.

---

## Deletion ledger — correction pass (2026-09-25)

Deleted **components/routes** carried no product contracts (grep confirmed zero importers; fixtures were prototype-only). Deleted **documents** were another matter: several mixed durable technical/product/state/security/accessibility facts with obsolete visual prescription. Those were **not** discarded blindly — see the classification ledger below; technical evidence was extracted into `docs/contracts/`.

**Deleted — components (superseded prototype presentation):**
- `components/glyph/shell/GlyphNav.tsx` — first-attempt rail shell (unused; replaced by top-bar `GlyphTopNav`).
- `components/glyph/shell/SectionNav.tsx` — first-attempt discovery tab row (unused; dropped — Explore composes its own sub-nav).

**Deleted — dev-only prototype/design routes (`app/design/*`, incl. `_proto`):**
`app/design/page.tsx`, `DesignInteractive.tsx`, `_proto/fixtures.ts`, `shell/`, `graph/`, `workflows/`, `objects/`, `dashboard/`, `account/`, `direction-a|b|c/`. Not linked from product nav, no importers outside `app/design`. Fixtures were prototype-only (no runtime contracts).

**Deleted — obsolete design docs (no durable non-visual facts):**
- `design/GLYPH_UI_REDESIGN.md` (R1 warm-paper era → superseded by `NEW_GLYPH_PRODUCT_DIRECTION.md`).
- the proof-set wireframes doc (prescribed discarded shell/section anatomy) — deleted.

**Document classification ledger — `docs/design/*.md` (was 22 files):**
- The mixed technical/visual docs were **not** kept as raw copies. Their durable non-visual facts (route inventory, auth/RLS/permission rules, lifecycle/state rules, data relationships, loading/error/accessibility contracts, architecture/perf findings, verification debt) were **extracted into concise contract files** and the raw copies deleted. Extracted files now present under `docs/contracts/`: `routes-and-visibility.md`, `authentication-permissions-privacy.md`, `lifecycle-and-state-rules.md`, `data-relationships.md`, `loading-error-accessibility-contracts.md`, `architecture-performance-findings.md`, `verification-debt.md` (+ `README.md`). No raw-copy subdirectory remains.
- **Deleted outright (purely visual prescription, nothing extracted):** `glyph-visual-redesign-blueprint`, `glyph-visual-direction`, `glyph-design-system`, `glyph-design-decisions`, `glyph-responsive-system`, `glyph-neuform-redesign-plan`, `glyph-phase-l-visual-reassessment`, `redesign-progress`, `auralis-design-system`.
- Kept untouched: `docs/design/research/`, `docs/design/screenshots/`.

**Removed from the new surface (clean-room):** `lib/tint` (legacy pastel/`ProjectMark` presentation system) — no longer imported by any `components/glyph/*` file; coverless projects use a new namespaced compact identity panel instead.

**Kept (authority / current):** `DESIGN.md`, `PRODUCT.md`, `design/NEW_GLYPH_PRODUCT_DIRECTION.md`, `OLD_UI_REMOVAL.md`, `REDESIGN_CHANGELOG.md`, `ASSET_REQUESTS.md`, `DEPENDENCIES.md`, `design/research/glyph-ui-inspiration/`, `docs/contracts/`.

**Still legacy (used by old, not-yet-migrated routes; not imported by the new surface):** `components/shell/*`, `components/ui/*`, `DiscoveryFrame`, `ProjectTile`/`ProjectMark`/`ProjectRow`, `DeveloperRow`, `DevlogRow`. Removed only as each route migrates to the new system.

---

## Convergence-audit correction pass (six-surface gate)

Row 9 above recorded the Auralis → warm-editorial `DESIGN.md` replacement as historical fact at the time it happened — that record stands, unedited. Since then, `DESIGN.md` has been revised **again**: the warm-editorial "two-register / warm paper / indigo `#4F46E5`" world it described is itself now superseded by the system actually shipped across the six approved surfaces — **Graphite & Bone + Ember, `--gg-*` tokens**. `DESIGN.md` now describes that system. Row 12's "warm paper canvas + one controlled accent" replacement is unaffected by this note — it correctly describes the legacy (non-`gg`) token block in `app/globals.css`, which not-yet-migrated routes still use and will continue to use until each is migrated.

The "Kept (authority / current)" line above naming `DESIGN.md` remains accurate — it is still the authority file — but its *content* is now the Graphite/Bone/Ember system, not the warm-editorial one this table originally pointed to.

Rows 14–16's `▢`/`◐` statuses are stale planning-stage entries from before Project, Profile, and the Dashboard overview shipped; they are not rewritten here (out of scope for this audit — a presentation/status correction, not a design-authority one) but should not be read as current. Project and Profile anatomy (row 14/15) and the Dashboard overview (row 16) are done; the Dashboard's actual shipped components are `GlyphNextStep`/`GlyphAttentionList`/`GlyphBuildStatus`/`GlyphProfileNudge`, not the planning-stage name `ResumptiveWork` row 16 names.
