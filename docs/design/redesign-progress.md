# Glyph ground-up redesign — progress log

Working model: continuous RESEARCH → DIRECTION → PROTOTYPE → CRITIQUE → ITERATE → BUILD. Not the R1–R10 phase workflow. Quality gate: 14 categories scored 1–10 by independent reviewers; a surface passes only if no critical category < 8 and average ≥ 8.5.

Research: [glyph-design-inspiration.md](research/glyph-design-inspiration.md), [glyph-ux-principles.md](research/glyph-ux-principles.md).

## Governing constraint (from live data)

Glyph is **media-poor**: 1 of 6 public projects has cover art, 0 have screenshots beyond that one. The art direction cannot depend on lush media. The design material is **structured text + typed metadata (genre / engine / stage / developer / activity / opportunity)**; media is an enhancement; cover-less objects get a **characterful deterministic fallback (ProjectMark)**, never a gray box.

## Art-direction proposals

### A — "Build Log": developer-tool precision + editorial ✅ SELECTED (spine)
- **Thesis:** Glyph is a living build record. Confident typography and structured metadata carry identity; media enhances. Calm, dense, credible — a tool serious indies would keep open.
- **References:** GitHub/Primer (text object that feels alive), Linear (chrome-free density), itch (discovery grid + facet rail).
- **Type:** Inter throughout; large weighted titles do the work; JetBrains Mono for stage/engine/dates/counts.
- **Color:** Neuform warm accent = action/opportunity/active only; slate = structural secondary + rare inverse; genre/engine become quiet typed identity, not gray middot text.
- **Layout:** full-width; discovery = facet/sort region + broad grid with a feature lead; identity = asymmetric main + context.
- **Media:** slots in at fixed ratios when present; ProjectMark fallback (flat tinted tile + display monogram + mono genre/engine keyline) otherwise.
- **Why it fits game devs:** survives real media poverty, respects their time, makes the *work and its state* the hero.
- **Risk:** could read dry — mitigated by the feature lead, the ProjectMark's character, and stage/opportunity color.

### B — "Storefront": cover-forward visual grid ❌ REJECTED
- itch/Steam capsule grid. **Rejected on data:** 1/6 covers → mostly fallback tiles → looks broken. Only viable if media were plentiful; it is not. Its *full-width grid + facet rail* is borrowed into A.

### C — "Zine": editorial/magazine asymmetry ◑ PARTIAL
- Big type, mixed column widths, feature-led. Distinctive but high per-page effort and risks fighting the Operate areas' required calm. **Borrowed selectively:** the feature-lead moment on Explore (Von Restorff), not the whole system.

**Decision:** Build on A. Borrow B's grid+rail for discovery and C's feature-lead for Explore's top. Evidence: media data forces A's text-first foundation; itch (live) proves grid+rail; Steam proves the lead.

## Surface status

| Surface | Status | v1 avg | Notes |
|---|---|---|---|
| Explore | iterated v1→v2 | 7.0 (v1) | v2 addresses all v1 P0/P1; extending language to Project/Profile |
| Profile | R3 (pre-cycle) | — | apply ProjectMark/tile language |
| Project | R3 (pre-cycle) | — | apply ProjectMark cover/fallback |
| Dashboard | R4 (pre-cycle) | — | later |

Screenshots: `docs/design/screenshots/redesign/<surface>/<version>/`.

## Explore — review record

**New components:** `ProjectMark` (cover-or-title-plate, deterministic tint, the media-poverty answer), `ProjectTile` (grid tile, stretched primary link + independent dev link). `DiscoveryFrame` gained a `width` prop so Explore uses `max-w-6xl` (was `max-w-3xl` — the dead-canvas bug). Composition rebuilt from scratch: wide feature-lead → project tile grid + stage facets → developer identity rows → editorial devlog rows. Four object types, four compositions.

**v1 — 5 independent reviewers (Visual, UX, Frontend, A11y, Target-user), scored cold, no shared verdicts:**

| Category | Avg (v1) | | Category | Avg (v1) |
|---|---|---|---|---|
| Visual hierarchy | 7.5 | | Info density | 6.75 |
| Composition | 6.75 | | Responsiveness | 7.75 |
| Typography | 7.75 | | Accessibility | **5.6** |
| Media use | **5.25** | | Interaction | 6.5 |
| Product identity | 6.75 | | Originality | 6.5 |
| Clarity | 8.25 | | Anti-AI-slop | 7.0 |
| Discoverability | 6.5 | | Target-user | 7.8 |

Overall v1 ≈ **7.0** — below the 8.5 gate. Two critical fails: **Media use (5.25)** and **Accessibility (5.6)**.

**Consolidated findings → v2 fixes:**
- **P0 Media use** — single-letter monogram tiles read as *missing avatars* ("the one thing that made me think unfinished CMS" — target user). → Reframed the cover-less fallback from a big letter to a **title-plate**: the project's own title set large as a title card + stage + engine·genre. Reads as a designed cover, not a gap. No fabrication (real data is media-poor; 1/6 covers).
- **P0 Accessibility** — measured: `--fg-muted #8a93a6` = 3.1:1 on white (pervasive fail, used for all tile metadata); moss keyline 2.8:1, steel 4.4:1. → tile/lead metadata moved `fg-muted → fg-secondary` (6.3:1); ProjectMark now uses one dark `ink` per tint (all ≥4.5:1 on their pale bg), killing the low-contrast keyline.
- **P1** — broken `aria-labelledby` (`BlockHead` `<h2>` had no id) → ids added; no filters on a discovery page → **stage facet chips**; 4-col grid stranded 1 tile → **3-col** (3+2, bigger tiles = more media presence); duplicated engine·genre (mark + caption) → caption shows it only when a cover exists; lead `after:inset-0` made the whole section one unselectable link → lead is no longer a stretched card (explicit title + CTA links); lead cover was lazy (LCP) → `eager` + `fetchPriority`.
- **P2** — nested dev link tap target → explicit `py`; cover scale → `motion-safe:`; cover-less tiles → `group-hover:shadow-raised`.

**Deferred (documented, not fabricating):**
- Lead hero cover is a generic stock sky (real seed data on Emberfall Keep) — will not fabricate game art; the lead composition is sound regardless of the specific photo a developer uploads.
- `font-display` is aliased to Inter (monograms/plate titles are bold Inter) — shipping a distinct display face is a separate cross-app decision, not this slice.
- `DeveloperRow` repeats "Open to collaborate · active" — shared component, minor; folded into a later developer-focused slice.

v2 screenshots: `screenshots/redesign/explore/v2/explore-{375,768,1024,1280,1440}.png`.
