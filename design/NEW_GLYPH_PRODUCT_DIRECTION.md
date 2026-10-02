# New Glyph — product direction (greenfield)

Designed from the product requirements, the Codex research (`design/research/glyph-ui-inspiration/`), and the eight supplied references — **not** from any existing Glyph screen. The backend, data, and capabilities exist; this defines the first real interface.

Thesis: **Glyph is the living build record** — the place a game is visibly *being made*. Not a storefront, not a social feed, not a portfolio gallery, not an enterprise dashboard. A serious creative-development product with technical discipline.

---

## 1. Product feeling

Glyph should feel like a **workshop with the lights on** — you can see the work in progress, the tools are precise, and the maker's hand is visible. Confident, current, a little raw where the raw is the point (unfinished games are the hero). Expressive through the games; disciplined in the chrome.

Held in tension, never collapsed to one pole:

`creative ↔ technical` · `editorial ↔ operational` · `expressive media ↔ restrained chrome` · `individual dev ↔ studio ecosystem`

## 2. Visual principles (7)

1. **The work is the color.** Game media supplies chroma and energy. Chrome is a near-neutral graphite/bone system so covers, screenshots, and clips carry the visual load. Platform color is reserved for action, selection, and live state.
2. **One ember.** A single warm signal accent ("Ember") marks what is *alive* — the primary action, the selected object, a live playtest, unread state, "building now." Used sparingly it becomes Glyph's signature; sprayed everywhere it becomes decoration. No second brand color competes.
3. **Provenance is always legible.** Every surface answers whose work, which project, what object, what state — in seconds, without reading prose. The `Developer/Studio → Project → Devlog/Playtest/Collaboration` chain is a visible, recurring grammar.
4. **Composition before container.** Hierarchy comes from type, scale, media, alignment, rule, and space — not from wrapping everything in a bordered card. A card is earned by elevation or grouping, never the default.
5. **Two registers, one system.** Editorial surfaces breathe and let media lead; operational surfaces are dense, aligned, and scan-first. Same tokens, type, and motion grammar across both.
6. **Precision in the details.** Tabular numerals for data, optical alignment, themed browser surfaces (caret, selection, scrollbars, focus), consistent icon stroke. The craft signals a serious tool.
7. **Motion explains, never performs.** Movement carries cause, continuity, and state — press feedback, cover→detail continuity, peek, insertion. No scroll spectacle, no ambient float, reduced-motion honored.

## 3. Color — "Graphite & Bone + Ember"

A near-neutral system with a faint warm cast (creative, not sterile; not the heavy beige of the earlier attempt). Theme-dual: **Bone** (light) reads editorial/paper; **Graphite** (dark) reads operational/confident — both first-class, chosen per surface use-scene, not by default.

Light ("Bone"):
- `canvas #F6F4EF` · `surface #FFFFFF` · `surface-sunken #EEEBE3` · `ink #191817` · `ink-2 #56534C` · `ink-3 #86827A` · `line #E4E0D6` · `line-strong #CFC9BB`

Dark ("Graphite"):
- `canvas #121312` · `surface #1A1B1A` · `surface-raised #212220` · `ink #F3F1EC` · `ink-2 #ADA99F` · `ink-3 #7C7970` · `line rgb(255 250 240/0.10)` · `line-strong rgb(255 250 240/0.20)`

Accent — **Ember**:
- `ember #E8552A` (action/live) · `ember-press #C8461F` · `ember-quiet` = 12–16% tint for selected rows/soft fills · `ember-ink` (accent-as-text, AA) `#C2481F` light / `#FF7A52` dark. On dark media overlays, Ember stays vivid.

State (semantic, never color-alone — always paired with icon/label): success `#2E9E5B` · warning `#C8811E` · danger `#D5423B` · info uses a cool slate `#4B72B8` (informational only, never a second brand accent).

**Rules:** media is the chroma; Ember is the only brand color and only marks live/action/selection; state colors are muted and paired with a glyph; no gradients-as-decoration, no glass, no neon, no purple.

## 4. Typography

- **Display + body:** Geist (self-hosted via `next/font`) — neutral-technical, excellent at large optical sizes; one voice, used with intent. Not Inter.
- **Technical metadata:** JetBrains Mono — versions, build IDs, dates, counts, tags, shortcuts, tabular data. Never a decorative "technical" costume, never an eyebrow above a heading.
- Scale (fluid): display `clamp(2.25rem, 1.2rem+3vw, 3.5rem)` · h1 `clamp(1.6rem,1.2rem+1.6vw,2.25rem)` · h2 `1.375rem` · h3 `1.0625rem` · body `1rem` (reading `1.0625–1.125`) · small `.875` · micro `.75`. Tracking tightens as size grows (floor −0.03em); reading measure 64–72ch.
- Hierarchy from **weight + size + space**, not gradient fills or all-caps paragraphs.

## 5. Layout & grid

- 12-col desktop / 8-col tablet / 4-col mobile as composition aids, not card generators.
- **Editorial surfaces** (Landing, Explore, Project, Profile, Devlog reading): content max ~1200–1360px, big media allowed to go full-bleed within the content frame, asymmetric rhythm, one dominant subject per view.
- **Operational surfaces** (Dashboard, Collaboration mgmt, Playtest ops, Search, Settings): use more viewport width, dense aligned rows/tables/timelines. A side inspector is not part of the current system; introduce one only on a specific surface that proves it earns non-destructive side inspection.
- Space is structural: more space above a heading than below; tight groups, generous separation.

## 6. Media

Real or clearly-labeled fixture media only. Crop rules by context: **16:9 cinematic** for lead project media and hero clips; **3:2 / 4:3** for discovery tiles; **1:1** only for avatars/marks. A few large images beat a wall of thumbnails. Controls always sit on stable, readable surfaces over media (scrim or plate). Object-position preserved where known. No decorative banner assets invented to fill space — if a slot needs bespoke art, it goes to `ASSET_REQUESTS.md`.

## 7. Navigation — top bar + command menu (as built)

Reconsidered from the product's jobs, not inherited from old Glyph (which used a left rail + a contextual tab row + a mobile bottom bar). The shipped model:

- **One quiet top bar** — wordmark, the two global destinations (Home, Explore), then the search/command entry, Create (Ember action), Notifications, and the account menu. Home resolves to `/` signed-out and `/feed` signed-in. Ember marks the active destination + live counts. Chrome recedes; content dominates.
- **Command menu (⌘K / "/")** — the acceleration layer and the real search entry: a combobox+listbox that filters destinations and create actions and submits a full-text search to `/search?q=`. Visible pointer/touch trigger, not keyboard-only.
- **Mobile** — the top bar collapses to wordmark + search + a **slide-over sheet** (not a bottom tab bar) holding destinations and account actions.
- **No persistent left rail, no baked-in contextual tab row, no bottom bar.** A surface that genuinely needs sub-modes composes them inline (e.g. Explore's own facets), rather than the shell imposing a tab row everywhere.
- **Peek / right inspector are not part of the current system.** They may be introduced later *only* where a specific operational surface (e.g. Dashboard, playtest ops) proves it earns non-destructive side inspection — not adopted by default.

Chrome recedes; content dominates. The top bar is the only persistent frame; everything else is content.

## 8. Object language (archetypes)

Each object has its **own anatomy** and belongs to one system. Never start from a generic `Card`; start from the object.

| Object | Lead signal | Anatomy (core) | Where it differs |
|---|---|---|---|
| **Project** | game media | cover (16:9) · title · stage · owner/studio · latest activity · lifecycle | the one object that goes cinematic; media-dominant |
| **Developer** | person + their work | avatar · name · one-line positioning · availability · current work + build cadence | identity through work, not stats; no cinematic cover |
| **Devlog** | the update itself | project provenance strip · title · date/build · body+media · prev/next in the record | reading-first *inside* a project's timeline, not a blog |
| **Studio** | collective identity | mark · name · members · projects grid · public vs manage split | groups people + projects; quiet management area |
| **Collaboration** | the opening | role · scope · stage · commitment · comp truth · lifecycle/next-action | structured opportunity row, not a chat bubble or gig card |
| **Playtest** | the ask + evidence | build/version · audience · tasks · deadline · results (themes/severity) | operational setup + evidence, never a vanity score |
| **Jam** | date + phase | TemporalAnchor (phase/countdown) · theme · entries (as Projects) | time dominates; entries stay Projects |
| **Event** | when + where | date/time/place · phase · attendees | temporal + local; compact |
| **Publisher** | discovery context | fit · evidence · contact boundary | lightweight, not a CRM pipeline |

Recurring markers reused across all: **ProjectIdentityMarker** (media fragment/monogram + name + stage, 24px→hero), **ProvenanceHeader** (`Dev/Studio → Project → object` + state), **LifecycleSummary** (state · owner · next action · date · blocker), **TemporalAnchor**, **TypedResult**.

## 9. Interaction

- Resting states are quiet; controls respond on interaction. Hover = subtle surface/border shift + cursor; selection = Ember-quiet fill + Ember marker; focus = 2px Ember ring, always visible.
- Progressive disclosure: inline for light actions, menus for secondary, a **drawer/sheet** for adjacent context, dialog only for focused interruption, full page for real workflows. No modal for a task that needs neither interruption nor protected focus.
- Creation is first-class (top-bar Create action + ⌘K), never buried.
- Optimistic, local state changes ("Saving…"→"Saved" in place, no toast storm).

## 10. Motion

Apple principles (response, continuity, brevity, precision, interruptibility, reduced-motion). Vocabulary: press 80–140ms · menu/popover 120–180ms origin-aware · panel/peek 180–260ms · **project cover → detail shared-element 240–360ms** (the signature continuity) · list insertion/reorder local. One authored moment per surface, not an entrance on every section. `prefers-reduced-motion` → opacity/instant, state still legible. Libraries: `motion`/`framer-motion` for presence+shared-layout, `gsap` only for justified landing choreography, view-transitions as progressive enhancement.

## 11. Density

- **Editorial** (Landing/Explore/Project/Profile/Devlog): low-to-medium density, media-led, generous rhythm.
- **Operational** (Dashboard/Feed/Collab-mgmt/Playtest-ops/Search/Notifications/Settings): medium-to-high density, compact rows, tabular data, inspector panels. Borrow ClauseOS/Raktor/Linear discipline — signal + state + next action, not KPI wallpaper or HUD cosplay.

## 12. Responsive philosophy (behavioral, not just breakpoints)

Design each of 375 / 768 / 1024 / 1440 intentionally. Rules: top bar → wordmark + search + slide-over sheet on mobile; any future side inspector → bottom sheet; dense tables → stacked object rows or horizontal scroll with a frozen identity column; editorial full-bleed media stays edge-to-edge and keeps focal point; reading order re-sequenced by task priority (value → primary action → proof), never a mechanical desktop stack; touch targets ≥44px; primary action always reachable.

## 13. What Glyph is not (guardrails)

No neon/cyberpunk/HUD/controller-iconography gaming skin. No bento-everything, feature-card-grid, purple-gradient, glass-panel, fake-terminal, giant-orb SaaS skin. No Attio-for-games / Linear-for-games / Behance-with-game-covers clone. No fabricated games, media, metrics, testimonials, or activity. No pay-to-rank discovery or engagement-ranked feed.

## 14. Success test

Remove the word "Glyph" from a screenshot; a viewer should still say *"that indie game-development platform."* That recognizability must come from consistent original decisions in media treatment, provenance, project identity, progress representation, the Ember signal, typography, and spatial composition — not from a logo.

---

**Implementation isolation:** the new system is built under `components/glyph/` with fresh `--gg-*` tokens and a `.gg-scope` focus/selection boundary; no legacy presentation (old `components/ui/*`, `Shell`, `DiscoveryFrame`, `ProjectMark`/tiles, `lib/tint`) is imported into new surfaces — only headless/behavior/query/type/permission code is reused. Old UI is removed as each surface reaches parity — see `design/OLD_UI_REMOVAL.md`. Recovered technical evidence from superseded docs lives in `docs/contracts/` (non-authoritative).
