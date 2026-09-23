# Glyph rebuild progress

## Major visual redesign — art direction

**Status:** three complete art-direction prototypes built on dev-only routes; independent multi-agent review in progress.
**User job (surfaces prototyped):** Explore (browse games being built) at high fidelity, plus Project/Profile/Dashboard preview blocks, per direction.
**Research used:** [glyph-premium-visual-references.md](../design/research/glyph-premium-visual-references.md) — Behance (live), Linear, Raycast, Apple/App Store, GitHub/Primer, Figma. Quality bar: credible beside Apple/Raycast/Linear/Behance/Figma/GitHub.
**Direction brief (user):** off-white/white canvas + near-black type + cool-neutral surfaces + one *restrained* warm accent (not the identity) + large game media + polished shell + subtle material depth.

**Old problem:** production Explore reads as a wireframe / DB query result — dead right canvas, narrow center column, 48px covers, repeated text-row anatomy, flat, weak typography, no focal object, chrome without character.

**Prototypes (dev-only, 404 in prod; `app/design/direction-{a,b,c}`; shared fixtures in `app/design/_proto/fixtures.ts`; media = picsum placeholders to demonstrate media-rich composition, never production):**

- **A "Studio"** — Apple/macOS clarity + dev-tool precision. Refined grouped sidebar (subtle selected pill, soft shadow), App-Store editorial **feature card** (large cinematic cover + scrim + identity + CTA), **media shelves** (3-up large tiles), builders rows, editorial progress. Balanced media + structure; calm; one warm accent; subtle elevation.
- **B "Showcase"** — Behance editorial. Slim top-bar nav (media gets full width), big expressive display masthead, **full-bleed hero + ambitious asymmetric media grid with overlaid project titles**, editorial devlog strip. Maximum "games as visual objects."
- **C "Console"** — Raycast/Linear polish. **Three columns** (nav · dense polished game list with thumbnails + mono metadata + selected row · contextual right rail with playtest spotlight + "needs you" queue + filters). Command search (⌘K), keyboard affordances, layered panel depth. Maximum density + context; small media.

Screenshots: `docs/design/screenshots/rebuild/directions/direction-{a,b,c}-1440.png`.

**Review:** 3 independent agents (visual director, product/UX, indie-dev target user) scoring all three cold. Synthesis + winning-elements decision to follow; the final direction may combine A's feature-card+shelves, B's large media celebration, and C's context rail / density where each surface's job calls for it.

**Backend:** frozen during the visual proof (no B3/B4, no migrations, no storage buckets) per the directive.
