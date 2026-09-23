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

### Review outcome (3 independent agents, scored cold)

| Direction | Visual director | Product/UX | Indie-dev target user |
|---|---|---|---|
| A Studio | 7 | **best for Explore job** (clear hero + object bands) | 6–7 |
| B Showcase | **8, strongest** (media-as-product) | 8 clarity but weak focal/responsive, media-dependent | **9, clear winner** |
| C Console | 7 | **chassis generalizes best** to operate/manage | 3–4 ("spreadsheet/admin, wouldn't return") |

**Convergent findings:** B is the emotional winner — makes games feel alive and flatters the work (target user 9; "for devs"). But B's weaknesses are product-critical: it **collapses when media is missing** (and Glyph is media-poor — ~1 in 6 real projects has a cover), weak focal hierarchy, **Builders-as-object disappears**, worst responsive risk, tiny search. A supplies the missing structure (one hero focal object + labeled bands games→builders→devlogs + Builders with Follow + refined left nav). C supplies the chassis that scales to dense operate/manage surfaces (nav + content + right **context rail** + "Needs you" queue + filters + ⌘K + a **list-view toggle**), which B's mosaic can't. C's own list amputates media to favicons — rejected as the discovery model.

### FINAL DIRECTION — "Showcase-led, structured by Studio, chassis from Console"

1. **Chassis (from C/A):** refined left global nav (project pinning, New project, Opportunities badge) + main content + a right **context rail** that appears on return-user/operate surfaces. Generalizes discovery → management.
2. **Explore celebration (from B):** a cinematic **feature hero** (scrim + overlaid identity + CTA) then a **large editorial media grid** — cover'd projects get big media with overlaid titles; **cover-less projects get a strong characterful title-plate** (media-poverty must not break it — B's grey tiles were its weakest point).
3. **Structure (from A):** labeled object bands so **games / builders / devlogs stay visually distinct**; Builders is a first-class object with inline Follow.
4. **Retrieval (from C):** ⌘K search, surfaced filter chips, and a dense **list-view toggle** for scanning.
5. **Craft bar:** off-white/near-black/cool-neutral + one restrained warm accent used for a *single signature moment*, subtle depth + hover motion, tighter display tracking.

**Next:** apply this to the real production Explore + global shell (start there per the directive), then Project/Profile/Dashboard, then the rest — each surface designed for its job, reusing the chassis.

**Backend:** frozen during the visual proof (no B3/B4, no migrations, no storage buckets) per the directive.
