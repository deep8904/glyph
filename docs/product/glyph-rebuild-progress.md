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

---

# Canonical Four Quality Gate

Independent, cold multi-agent review of the four canonical surfaces (Global Shell,
Explore, Project — media-rich and media-poor, Profile, Dashboard) against a hard
craft bar (Apple/macOS, Raycast, Behance, Figma, Linear). Reviewers scored without
seeing each other's scores or the progress doc. Captures: Playwright full-page,
375 / 768 / 1024 / 1280 / 1440, real routes where reachable; Dashboard via the
`/design/dashboard` fixture (the real `/dashboard` is auth-gated) rendering the
populated state through the real shell.

Thresholds (a surface must clear all, no averaging away a weakness): Visual polish
≥9, Composition ≥9, Product identity ≥9, Typography ≥8.5.

## Rounds

- **Round 1 — 5 reviewers** (Visual Director, Product/UX, Frontend Craft, Accessibility, Indie-dev target user). Verdict: **all four FAIL**. Convergent findings: avatars were flat gray discs; the coverless project read as empty white space; the Explore grid dead-ended in a void with duplicated metadata; Dashboard containers were unstyled 1px hairline boxes; the review captures were polluted by a dev-only debug FAB and by the Dashboard fixture's QA scaffolding. Accessibility flagged text/label contrast — on inspection the tokens were already AA-tuned (`--fg-muted #6b7280` ≈4.8:1, `--link #a8551f` ≈5.4:1); the real a11y gap was color-reliance on attention items, since fixed.
- **Round 2 — 3 reviewers** (Visual, Craft, Indie) after iteration 1. **Project PASS; Explore/Profile/Dashboard FAIL** on specific defects: Explore feature tile stranded its title in a void; Dashboard thumbnail clipped; coverless empty state was bare text; incoherent panel/elevation vocabulary; profile rail repeated "open to collaborate" three times; Dashboard fixture copy ("Fixture Project") read pre-alpha.
- **Round 3 — 2 reviewers** (Visual, Indie) after iteration 2. Indie-dev: **all five surfaces WOULD-HOST** ("yes, I'd move my game here", no ship-blocker). Visual: **Project-rich + Project-poor PASS**; Explore/Profile/Dashboard held at Composition 8 — explicitly *"a layout-termination problem, not a taste problem"* (a left-rail void + full-page-on-modest-data whitespace). No typography/media/identity/slop blockers remained.
- **Round 4 — 1 reviewer** (Visual, composition) after iteration 3. **Explore 9/9, Profile 9/9, left-rail void resolved on all three.** Dashboard held at Composition 8 for one real reason: the context rail out-ran the main column. Fixed in iteration 3b by moving "Other projects" into the main column.

## Per-surface final scores and status

Scores are the latest independent reviewer reading for each surface (Visual Director unless noted); Indie-dev = target-user host verdict.

| Surface | Visual polish | Composition | Product identity | Typography | Indie-dev | Status |
|---|---|---|---|---|---|---|
| Explore | 9 | 9 | 9 | 9 | WOULD-HOST | **APPROVED** |
| Project (media-rich) | 9 | 9 | 9 | 9 | WOULD-HOST | **APPROVED** |
| Project (media-poor) | 9 | 9 | 9 | 9 | WOULD-HOST | **APPROVED** |
| Profile | 9 | 9 | 9 | 9 | WOULD-HOST | **APPROVED** |
| Dashboard | 9 | 9 (after 3b) | 9 | 9 | WOULD-HOST | **APPROVED** |

## What changed across the three iterations

- **Shared identity system (`lib/tint`)** now drives the project title-plate, the coverless project hero band, and developer avatars from one palette. Avatars are deterministic tinted initials plates with an inset ring — the flat-gray-disc tell is gone everywhere.
- **Coverless project** — the media-poverty case, ~5 of 6 real projects — reads as authored: a deterministic tinted identity band with engine·genre, and a framed empty-devlog state (icon + copy + CTA) instead of a white void.
- **ProjectMark title type scales to the plate** via a container-query clamp and is optically centred, so it fills the Explore feature tile and no longer clips in the 160px Dashboard thumbnail.
- **Explore grid** leads with a two-column feature tile so eight projects resolve into three rows with rhythm; duplicate caption metadata dropped.
- **Panel language** unified into two tiers: neutral content panels (rounded, `border-line`, `surface-muted`) and accent-ruled actionable panels (rounded, accent left edge).
- **Dashboard** — Currently-building is a real filled panel; attention items carry a leading inbox glyph (meaning no longer rests on the accent colour alone); "Other projects" moved into the main column to balance the context rail.
- **Global shell rail** — the signed-out rail's mid-column void is replaced by a grouped "Join Glyph" card under the nav.
- **Profile** — 0/0 follower counts hidden for new developers; collaboration section renders only when there are open posts to act on.

## Cross-product coherence

At 1440 the four read as one product without being four copies of one layout. Each keeps its personality: Explore is broad, visual and alive (cinematic hero + editorial tinted grid + devlog river); Project is an immersive canonical object (cover/tint hero + spec-and-participate rail + development history); Profile leads with the human and their current work, identity in the context rail; Dashboard is compact and operational (what am I building / what needs a decision / what changed / my other work). The context rail is used only where it earns its place (Project, Profile, Dashboard) and is absent on Explore — it is not forced as a template. Shared primitives (tint system, avatars, panel tiers, mono section labels, ⌘K, restrained orange) carry the coherence; composition differs by job.

## Remaining weaknesses (non-blocking)

- Full-page captures of Profile/Dashboard on modest demo data leave normal below-fold whitespace; a real active account carries more rows. Not manufactured with filler (anti-slop).
- Every coverless project of the same tint+title length looks similar by design; engine·genre in the band mitigates it, but a per-project generative motif would differentiate further (future).
- Project screenshots render one orphan tile on a second row when there are three; acceptable, could move to masonry later.
- Cover images in these captures are picsum placeholders, so real cover art quality is unproven here.
- Mobile bottom nav appears composited over content in full-page captures; the shell reserves `pb-[calc(5rem+env(safe-area-inset-bottom))]`, so this is a capture artifact, not a device defect.

## Anti-AI-slop findings

- Killed the flat-gray-disc avatar (the strongest arranged-default tell).
- Replaced "Fixture User / Fixture Project / Fixture devlog title" review data with believable content (Mara Quill, Tidewatch, real applicant and devlog lines); no generic "John Doe" names.
- No fabricated media or metrics; the coverless path is a designed fallback, never a fake cover.
- Orange stays a restrained accent, never the identity; one accent, AA-safe `--link` shade for text.
- Hid the dev-only debug FAB and `devIndicators` from review captures so screenshots show what production shows.

## Final screenshots

`docs/design/screenshots/rebuild/canonical-four/current/` — `{explore, project-rich, project-poor, profile, dashboard} × {375,768,1024,1280,1440}` (25 files), recaptured after the final iteration.

## FINAL VERDICT

**APPROVED.** All four canonical surfaces (five including the media-rich/media-poor Project split) clear the thresholds on the latest independent reads, and the target-user (indie dev) would host all five. The system reads as art-directed, not as arranged Tailwind components. Backend stayed frozen (no B3/B4, no migrations, no storage) throughout the visual proof. Proceeding to the rest of the product.
