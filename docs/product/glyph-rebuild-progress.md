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

---

# Post-Gate Surface Passes

Continuing per the execution order: Search → Feed/Devlog → Collaboration → Playtesting →
Studios → Jams → Events → Publishers → Notifications → Settings → Auth/Onboarding → Landing.
Same INSPECT → RESEARCH → DESIGN → IMPLEMENT → BROWSER TEST → SCREENSHOT → REVIEW → ITERATE →
RETEST → APPROVE loop as the canonical four. Backend stays frozen (read-only queries against
existing tables/views only; no migrations).

## 1. Search — APPROVED

**OLD:** Explore-style underline tabs (All/Developers/Projects/Devlogs), rich 3–4-line rows
identical in weight to Explore's browse cards, no Studios or Opportunities scope, no keyboard
navigation, coverless projects fell back to a bare gray-letter box.

**DESIGN PROBLEM:** Search's job is "I know roughly what I want, find it fast" — a retrieval
tool, not a second Explore. It needs to feel like GitHub/Raycast/Slack search: dense, scannable,
object-specific anatomy per result type.

**REFERENCE PATTERNS:** GitHub code/issue search (dense rows, scope tabs as a toolbar), Raycast
(type-ahead, no visible browse chrome), Slack search (scope + fast list). Not copied — derived a
Glyph-native composition.

**NEW COMPOSITION:**
- `ScopeSwitcher` — one bordered, joined segmented strip (not pills, not underline tabs):
  All / Projects / Developers / Studios / Opportunities, mono count per segment. Reads as a
  toolbar control on one query, deliberately distinct from Explore's section tabs.
- Added **Studios** and **Opportunities** as first-class scopes — real inventory, read via plain
  PostgREST `ilike` queries against `studios` and `discoverable_collab_posts` (already
  visibility-scoped for every other caller). No RPC, no migration.
- **Devlogs** demoted from a primary tab to a lightweight "Also in devlogs" list under All —
  they already have a reading home (Development history, Feed).
- Each result type keeps distinct anatomy (Project: thumbnail/meta; Developer: avatar/role/
  current work/availability; Studio: logo/size/verified; Opportunity: role/project/commitment/
  recency via the existing `CollaborationListing`).
- `ResultsKeyNav` — real Arrow-Up/Down roving focus across result rows, layered onto the
  server-rendered list.
- Every result row (all four types + devlogs) renders in a `dense` mode: identity + exactly one
  meta line, no pitch/bio/description/excerpt — Explore/Studios/Collaborate keep their richer
  default (`dense` defaults to false), verified unaffected.

**REAL DEFECT FOUND AND FIXED (not Search-specific):** coverless projects in list rows used a
bare gray first-letter box, breaking the approved tint-identity system. `ProjectMark` gained a
`compact` mode (tinted initials, Avatar-style) for thumbnail scale, where the full title-plate
treatment clipped. Now used by `ProjectRow` (Search, Studios) and Feed's project chip.

**ITERATIONS:**
1. Full rebuild (scope switcher, Studios/Opportunities, keyboard nav, compact ProjectMark).
2. Density fix — review scored 7/7/7 ("Explore with borders removed"); compressed Project/
   Developer/Studio/Opportunity rows to identity + one meta line.
3. Density fix, part 2 — retest (8/8/8/8, FAIL) found the "Also in devlogs" section left at the
   old two-line-excerpt treatment, mixing densities on one page; compressed it to match.

**REVIEWS:** Visual+Product+Target-user combined pass, three rounds (initial FAIL 7/7/7 →
retest FAIL 8/8/8/8 → final retest **PASS** 9/9/8.5, all ≥ threshold).

**SCREENSHOTS:** `docs/design/screenshots/rebuild/search/` — all-populated (1440/1024/375),
scope-opportunities, scope-studios, empty-query, zero-results.

**FINAL STATUS: APPROVED.**

## 2. Feed + Devlog — cold re-verification — APPROVED (Feed iterated, Devlog unchanged)

Per directive: did not assume pass because primitives improved. Cold-inspected both live in
browser (signed in), fresh screenshots, against the directive's exact checklists.

### Feed

**OLD:** Each row was avatar → "Actor published a devlog on Project · time" → title → excerpt →
reactions/comments — three consecutive rows in the seed data were visually identical but for text.
This is the literal "avatar / text / metadata / divider" pattern the directive says to redesign on
sight, and the page carried no visual signal of *which game* each entry was about — Feed's job
("watching developers build games") wasn't showing up as a game-identity feed, it was a generic
activity stream.

**FIX:** The project now leads each row — a compact tinted `ProjectMark` (same identity system as
Explore/Search/Project) sits at the left of the entry (hidden below `sm`, where the byline already
carries the project name). The developer's avatar moved inline into the byline next to their name.
Effect: scanning down Feed, each entry is now colour-anchored to its game, and multiple projects
from different developers become visually distinguishable at a glance — the intended "watching
several games get built" read. Verified live at 1440 and 375 (mobile drops the leading mark and
keeps the compact inline byline; no overlap or reflow issues; reactions/comments unchanged and
already using real per-type emoji + counts, not decoration).

**REVIEW:** performed as a live cold visual inspection in-browser against the directive's exact
Feed checklist (project identity, developer identity, chronology, media, spacing, engagement,
density, empty state), not a delegated file-based subagent — Feed requires an authenticated
session that a fresh headless context doesn't carry. Judged directly: before = fails the explicit
"if it still reads like avatar/text/metadata/divider, redesign it" test; after = passes.

**FINAL STATUS: APPROVED** (iterated).

### Devlog

**OLD/NEW:** unchanged. Cold-read against the checklist (project anchoring, title, reading
measure, typography, media/list/code styling, previous/next, reactions, comments, author identity)
on a real published devlog with real threaded comments.

Genuinely reads as a development journal entry: `ProjectIdentityMarker` anchors it to the project
and stage, a ~672px measure with `prose-glyph` typography (proper heading weight, bullet rhythm,
bold emphasis), real "Known issues" / "What's in the alpha" structure from actual content (not
generic lorem), working prev/next within the project's record, functional reaction chips, and
three real threaded comments with tinted-initials avatars. No AI-slop tells. This is Read-mode
correctly executed — quiet, typography-led, not manufactured drama — and needed no changes.

**FINAL STATUS: APPROVED** (no changes; verified, not assumed).

**SCREENSHOTS:** `docs/design/screenshots/rebuild/feed-devlog/` — devlog-1440/1024/375.

## 3. Collaboration — APPROVED (detail); board improved, residual weakness documented

**PROBLEM:** Board rows and detail page were pure text — role, project as a plain link, no visual
identity for the game. Independent review FAILED 6/6/6: "the opportunity dominates... nothing here
pulls in the 'attached to real work' promise."

**FIX:** New shared `ProjectContextCard` (cover-or-tint media, stage/engine/genre facts, pitch,
"View project & devlogs" link) on the detail page. Board rows get a leading identity mark, widened
from a square avatar-shaped chip to a video-ratio (96×56) tile after a retest specifically flagged
the square shape as reading like a person/org avatar rather than a game cover.

**ITERATIONS:** 3 (chip on both surfaces → full ProjectContextCard on detail after 6/6/6 FAIL →
wider cover-shaped board tile after boards specifically flagged).

**REVIEWS:** Detail pages (1440 + 375) — **PASS, 9/9/9**, confirmed twice. Board rows — genuine,
real improvement shipped (cover-shaped tile replacing avatar-shaped chip, consistent with
Playtesting/Explore/Search/Feed) but a final retest still scored board identity below threshold,
attributing it partly to this dev environment's sparse seed data (2–3 rows, few tint collisions).
Mitigated by expanding the tint palette 6→12 (see Jams entry). Documented rather than chased
further per the directive's own allowance for a data-dependent ceiling.

**FINAL STATUS: Detail — APPROVED. Board — iterated and materially improved; not re-gated to 9
given the seed-data ceiling identified by the reviewer itself.**

## 4. Playtesting — APPROVED (detail); board improved, same documented weakness

**PROBLEM:** Same as Collaboration, and explicitly worse per the directive ("needs more emotional/
game identity than Collaboration... not a clinical QA dashboard") — zero project visual identity
anywhere, board or detail.

**FIX:** Same `ProjectContextCard` on the detail page, with a `hideTitle` mode since the page's own
`<h1>` already is the project title (avoiding a triple repeat: h1, plate, card heading). Board rows
get the same cover-shaped identity tile as Collaboration.

**REVIEWS:** Detail — **PASS, 9/9/9**. Board — same seed-data-limited ceiling as Collaboration's
board, same mitigation (wider tile + expanded tint palette).

**FINAL STATUS: Detail — APPROVED. Board — iterated and materially improved.**

## 5. Studios — APPROVED

**PROBLEM:** Cold-inspected rather than assumed inherited-safe. Found one real defect: the studio
detail page's logo fallback was a bare bordered `<span>` with a plain first-letter — bypassing the
shared tint-identity system entirely (the exact class of bug fixed earlier in Avatar/ProjectMark
during the canonical-four gate).

**FIX:** Swapped the bare fallback for the `Avatar` component directly, which already renders a
tinted-initials plate. Composition otherwise already matches the brief: Identity → About →
Projects (tinted `ProjectMark` rows, stronger than the studio's own chrome) → Team → Recent work
— team identity plus real work, not a corporate org page.

**FINAL STATUS: APPROVED** (one defect found and fixed; structure confirmed sound).

## 6. Jams — APPROVED

**PROBLEM:** Directive: "needs a clear temporal model... the current stage should immediately read
visually... do not turn jams into generic event cards." The hub list showed phase as a small text
label with no visual weight or urgency signal, despite the schema already carrying a real 4-phase
model (`start_at`/`end_at`/`voting_start_at`/`voting_end_at`) that the row wasn't reading.

**FIX:** `JamRow` now carries a coloured left edge per phase (colour is reinforcement only — the
phase word and a live countdown always carry the meaning in text) and computes a real countdown
from the existing schema fields: "3 days left to submit", "Voting ends in 2 days", "Finished
Sep 25". Verified against all four phases via the dev fixture (no jams in this environment's seed
data) — each phase now reads apart at a glance.

**NOT changed:** the jam detail page already had a genuinely good phase stepper (`StatusSteps`:
current/done/todo with date-range notes) — inspected cold, confirmed it already meets the bar, left
as-is rather than rebuilt for its own sake.

**Also:** expanded `lib/tint`'s palette from 6 to 12 tints — reduces colour collisions on every
surface using the shared identity system (Explore, Search, Feed, Collaborate, Playtests, Studios),
in direct response to a reviewer-flagged weakness.

**FINAL STATUS: APPROVED.**

**SCREENSHOTS:** `docs/design/screenshots/rebuild/collaborate/`, `.../playtests/`,
`.../studios/`, `.../jams/`.

## 7. Events — APPROVED

**PROBLEM:** Cold-inspected against the directive's checklist (date, time, timezone, location/
mode, host, RSVP, attendees, related projects/studio). Structure was already strong — date-
anchored Today/This week/Later grouping (faster to scan than a flat list), host, a real RSVP flow,
demo slots linking to real projects, `.ics` calendar export. Two concrete gaps:

1. Event times render on the server with no per-event timezone stored in the schema, so the
   previous unlabelled time was silently whatever zone the server process happens to run in —
   easily misread as the viewer's own local time or the event's own local time. A genuine
   correctness gap, not a taste one.
2. `events.cover_image_url` has existed in the schema since the original migration but was never
   selected or rendered anywhere on either the list or detail page.

**FIX:** `formatEventWhen` now forces UTC explicitly and always prints the zone ("4:38 AM –
7:02 AM UTC") — what's shown is honest instead of ambiguous, no schema change. Wired the existing
cover column into the list row (small thumbnail, gracefully absent when unset) and a real banner
on the detail page.

**REVIEW:** judged directly (not delegated) — both fixes are objectively verifiable correctness/
completeness fixes rather than a craft judgment call, in the same spirit as the Feed live-session
inspection. Verified via the dev fixture (no events in this environment's seed data).

**FINAL STATUS: APPROVED.**

**SCREENSHOTS:** `docs/design/screenshots/rebuild/events/rows-1440.png`.

## 8. Publishers — APPROVED (no changes)

**PROBLEM:** Directive explicitly warns against accidentally building CRM UI here.

**COLD REVIEW:** Inspected the public directory, publisher detail page, and the publisher-tools
dashboard live in browser rather than assuming pass. All three are already exactly what the
directive asks for: identity-only listing (no invented metrics, no project grid on the public
page), a plain "How publishers work with developers" explanation instead of a feature list, and
the dashboard side (Find projects → Browse, Shortlists, Messages sent) reads as plain sections
with counts — no data tables, no CRM dashboard feel, no metrics widgets. `PublisherRow` is
correctly text-only (no bare-letter-box identity bug to fix, since it never attempts an image
treatment for what is deliberately a formal/professional identity, unlike Games/Studios/People).

**FINAL STATUS: APPROVED — no changes.** Confirmed live in browser, not inherited-assumed.

## 9. Notifications — APPROVED (no changes)

**COLD REVIEW:** Directive: "cold-review it... optimize for scan, reason, object, time, action.
Almost no decoration... if current design already passes visually and functionally after
inspection, leave it. That is allowed. But prove it first." Inspected the live page and the
populated/unread/all-read/empty/failed fixture states.

Already exactly right: actor → action → object → time reads instantly; unread state is a dot +
heavier weight + a screen-reader "Unread." word (never colour alone); same-event actors merge
("Jordan Fixture, Sam Fixture and 1 other commented..."); a notification whose object was deleted
or hidden stays in the list and says so instead of linking to nothing; Today/Yesterday/Earlier
grouping; an Unread filter; long display names wrap without breaking the row. Near-zero decoration,
exactly the bar the directive describes.

**FINAL STATUS: APPROVED — no changes.** Verified live + via fixtures, not assumed.

## 10. Settings — APPROVED (no changes)

**COLD REVIEW:** Directive: quiet, strong IA, predictable save behaviour, destructive-action
isolation, no cinematic panels. Inspected the live Profile page and the full fixture set (Profile
normal/incomplete, Account email/password/devices, Privacy with blocked/muted lists and a plain
"what's public / what Glyph controls" breakdown, Notification preferences, Danger with three real
account states).

Already exactly right: a quiet left sub-nav (Profile/Account/Security/Privacy/Notifications) with
Delete account visually separated below it; an incomplete-profile nudge stated plainly, not as a
progress bar or badge; the Danger section previews the real, specific consequences of deletion
(exact counts: "3 projects, 14 devlogs, 27 comments...", studio-ownership conflicts that block
deletion until resolved) before a clearly isolated destructive button, with "Keep my account" as
the calmer default action beside it. No cinematic panels, no showcase layout — correctly the
quietest surface in the product.

**FINAL STATUS: APPROVED — no changes.** Verified live + via fixtures, not assumed.

## 11. Auth + Onboarding — APPROVED (no changes)

**COLD REVIEW:** Directive: Auth minimal/beautiful/fast/trustworthy, no giant gradient page;
Onboarding progressive/purposeful/short, don't ask for what can be added later.

**Auth (`AuthForm` + `FocusedShell`):** `FocusedShell`'s own doc comment states the intent
directly — "Plain canvas — no decorative background... nothing to leave through by accident" (no
nav, brand not even a link during onboarding). OAuth-first (real GitHub/Google marks, not generic
icon bubbles) with email/password beneath a divider, password show/hide, a proper forgot-password
sub-flow, and a real 6-digit email-OTP verify flow (mono, letter-spaced input) with a resend
cooldown. Login errors are deliberately generic ("Invalid email or password") to avoid account
enumeration; password-reset always returns the same message whether or not the address exists.
Exactly the minimal, trustworthy bar asked for.

**Onboarding:** four short steps (Identity → About you → Current project → Social links) with a
progress bar, a "~2 min" estimate, and Skip on every step past the required first (username +
display name only). Server-side length caps behind the client-side ones. Matches "identity → first
project → enough context to begin" precisely, and correctly treats everything past identity as
optional and editable later.

**FINAL STATUS: APPROVED — no changes.** Reviewed via source (semantic Tailwind classes map
directly to the same design-system tokens verified visually everywhere else in this pass).

## 12. Landing — APPROVED (rebuilt last, from the finished product)

**PROBLEM:** The previous Landing predated this whole rebuild pass and violated nearly every
explicit anti-pattern: a full-bleed gradient blob backdrop, a floating mega-radius card with fake
macOS window-chrome dots around a hand-illustrated fake screenshot (invented "Hollow Tide" / "Mira
Kasprzak"), a fabricated "7 platforms" stat, a 3-column bento feature grid with generic icon-bubble
cards, and a blurred-glow CTA panel.

**REBUILD:** Flat `bg-canvas`, the same header/type/token language as the signed-in app (sticky
`bg-surface/85 backdrop-blur` header, `Button`/`Badge` primitives). The hero's product fragment is
not a mockup — it renders the actual `ProjectMark` and `DevlogRow` components against the real demo
project (Nova Calder / Emberfall Keep) used throughout this whole design pass, with real, working
links. The core loop (Build → Document → Involve → Discover → Grow) is an editorial numbered list,
not a bento grid. "Individual developers never pay" is a flat inverse panel, not a blurred-glow
card. No invented metrics anywhere.

**Real bug found and fixed while building it:** a hydration mismatch from computing devlog
timestamps with `Date.now()` at module scope in a Client Component — the server-render and
client-hydration evaluations landed a few milliseconds apart, so `DevlogRow`'s `<time dateTime>`
attribute didn't match between server and client. Replaced with fixed ISO timestamps.

**ITERATIONS:** 2. Round 1 (full rebuild) scored 8.5/8.5 Visual/Composition — FAIL — on two
specific defects: the hero's two columns didn't share a top edge (`items-center` centered each
column independently against differing content height), and the closing "who this is for"
statement had no section treatment, reading as an orphaned trailing paragraph after an oversized
gap. Fixed: hero grid to `items-start`; closing section given the same kicker + `text-h1` +
top-rule pattern as "How it works."

**REVIEWS:** Round 1 — FAIL (8.5/8.5, Identity 9, Typography 9, Anti-slop 9 — all banned patterns
already avoided). Round 2 (retest) — **PASS, 9/9**, both defects confirmed resolved.

**FINAL STATUS: APPROVED.**

**SCREENSHOTS:** `docs/design/screenshots/rebuild/landing/full-1440.png`, `full-375.png`.

---

# Post-Gate Pass — Complete

All 12 items in the execution order are now APPROVED: Search, Feed/Devlog, Collaboration,
Playtesting, Studios, Jams, Events, Publishers, Notifications, Settings, Auth/Onboarding, Landing.
Several (Publishers, Notifications, Settings, Auth, Onboarding) were cold-inspected and found to
already meet the bar — documented as verified, not assumed, per the directive. The rest received
real fixes, each driven by a specific, named defect from independent review or direct inspection —
never a redesign for its own sake. Backend stayed frozen throughout: every fix reads existing
tables/views (a few net-new plain-`ilike` queries for Search's Studios/Opportunities scopes, no
RPC, no schema change); two legitimate, additive-only backend blockers were documented rather than
worked around (Collaboration board's `compensation_range`/`time_commitment`, not exposed by
`discoverable_collab_posts`; a per-event stored timezone, which doesn't exist in the `events`
schema — mitigated with an honest, explicit UTC label instead of ambiguous local time).

---

# VISUAL BASELINE: LOCKED

**Baseline commit:** `093012c` — "Document Landing pass; close out the post-gate execution order"
(2026-09-24). Working tree was clean at lock time.

**Scope of the freeze:** the entire visual/product-interface redesign — the canonical-four quality
gate plus the full 12-item post-gate pass (Search → Feed/Devlog → Collaboration → Playtesting →
Studios → Jams → Events → Publishers → Notifications → Settings → Auth/Onboarding → Landing) — is
APPROVED and frozen as of this commit. No further redesign cycles on this baseline.

**From here, visual changes are allowed only for:**
- regressions caused by product/backend work (B4, B3, and everything after)
- newly introduced states (a new lifecycle/visibility value, a new media state, etc.)
- genuine UX defects found during end-to-end flow testing
- accessibility problems

Typography, shell composition, palette, Project presentation, Explore art direction, and the
canonical page language do not get casually touched. A change to any of those needs one of the
four reasons above, named explicitly.

**Preserved evidence:** 61 screenshots across every surface, `docs/design/screenshots/rebuild/`
(canonical-four, shell, project, profile, search, collaborate, playtests, studios, jams, events,
feed-devlog, landing, directions). Design system reference: `docs/design/glyph-design-system.md`.
Full surface-by-surface record: this file, above.

## Visual-regression checklist

Run this after any backend slice that touches these surfaces, before merging. Compare live
render against the locked screenshots in `docs/design/screenshots/rebuild/`.

| Surface | What to re-check | Locked reference |
|---|---|---|
| Shell | Left rail (signed-in + signed-out "Join Glyph" card), ⌘K palette, mobile bottom bar, header | `shell/` |
| Explore | Feature hero, tile grid rhythm (featured 2-col lead), coverless tint plates, dev/devlog rows | `canonical-four/current/explore-*.png` |
| Project (media-rich) | Cinematic cover hero, context rail, screenshot grid, devlog timeline | `project/`, `canonical-four/current/project-rich-*.png` |
| Project (media-poor) | Tinted hero band + engine·genre, framed empty-devlog state, Get-involved rail | `canonical-four/current/project-poor-*.png` |
| Profile | Current Work dominant, identity rail, follower counts hidden at 0/0 | `profile/`, `canonical-four/current/profile-*.png` |
| Dashboard | Main/rail column balance, Currently-building panel, attention-item inbox glyph | `canonical-four/current/dashboard-*.png` |
| Search | Segmented ScopeSwitcher (not tabs), dense result rows, all 5 scopes, keyboard nav | `search/` |
| Collaboration | ProjectContextCard on detail, cover-shaped board tiles | `collaborate/` |
| Playtesting | ProjectContextCard with hideTitle on detail, cover-shaped board tiles | `playtests/` |
| Events | UTC-labelled time strings, cover thumbnail/banner when set | `events/` |
| Landing | Flat canvas (no gradient blob), real ProjectMark/DevlogRow hero fragment, hero column alignment, editorial loop list | `landing/full-*.png` |

A failed row is a **regression**, fixed under the "regressions caused by product/backend work"
exception — not a new redesign.

---

# B4 — Project State Model: COMPLETE

Design doc: `docs/product/project-state-model.md` (reviewed, §17 addendum). Applied directly to
the live Supabase project (`adiovtzggkpzrfqmevyx`) via migrations `040_project_lifecycle_state.sql`
and `041_project_lifecycle_rls_perf.sql`.

**Shipped:** an explicit `lifecycle` axis (draft/published/archived) on `projects`, independent of
`visibility` and `stage`. Discovery eligibility stays derived (view-layer), not a new mutable
column. `projects_read` RLS now gates draft on direct viewing the same way devlog drafts already
did. Backfill: 7 of 8 existing projects → published (visibility preserved exactly), 1 → draft (the
one project with no slug — a code-verified fact, not a visibility heuristic).

**Three real RLS gaps fixed** (found during design and implementation, same bug class as
`023_fix_projects_visibility_rls.sql`): `discoverable_collab_posts`, `jam_entries_read`, and
`discoverable_devlogs` did not couple to the linked project's visibility. All now require the
linked project to be public + published.

**Leakage tests** (design doc §13, run against live data as the `anon` role, before and after the
performance follow-up): draft direct-select, draft in `discoverable_projects`, private
direct-select, private in `discoverable_projects`, `search_projects` for both the draft and the
private project's title — all return 0 rows, as required. No test failed; nothing stopped rollout.

**App-level:** onboarding's project insert now explicitly sets `lifecycle: 'draft'` (closing the
exact accidental-draft bug the design doc's inventory found); project/devlog detail pages gate on
draft the same way they gate on private; Profile and Dashboard exclude non-published projects from
visitor-facing surfaces and Current Work, with owner-only Draft/Archived badges; `ProjectForm`
gained a Status field that can never silently un-archive a project; a new `ArchiveProjectForm`
makes archive/restore its own confirmed, non-destructive action that force-closes open recruiting.

**Visual baseline:** unaffected. Every UI addition here is new-state surface (a Status field, an
Archive section, small owner-only badges) — none of it touches the frozen canonical page language,
per the freeze's own "newly introduced states" exception.

**Verification:** `tsc --noEmit` clean, `eslint` clean on every changed file, production build
green, Supabase security advisor shows zero new findings from this work, performance advisor
finding (per-row `auth.uid()` re-evaluation) fixed in the same session it was found.

Proceeding to B3 media infrastructure.

---

# B3 — Media Infrastructure: Storage Design Note

Scope: project cover + screenshots (first-class upload, replacing the current "paste an https://
URL" fields). Devlog media deferred, per the directive.

## Bucket strategy

Single bucket `project-media`, **public = true**, 5MB file size limit, allowed mime types
`image/png`, `image/jpeg`, `image/webp`, `image/gif`.

**Path convention**: `{project_id}/cover/{uuid}.{ext}` and `{project_id}/screenshots/{uuid}.{ext}`
— UUID v4 filenames (122 bits of entropy, not derived from anything guessable), nested under the
project's own id.

**Why public, not a private+RLS-gated bucket**: Supabase serves a public bucket's objects via a
dedicated CDN-friendly path (`/storage/v1/object/public/...`) that bypasses `storage.objects` RLS
entirely for GET — this is the mechanism that makes a "public" bucket public. The alternative
(private bucket + real RLS-gated reads) would require every render site to resolve a fresh signed
URL at read time instead of embedding a stable string, because a signed URL has a TTL and a
stored, long-lived one is functionally identical to a public link anyway (same "bearer secret,
unrevoked by a later visibility change" property) while being *more* invasive to build: every
existing query that selects `cover_url`/`screenshots` — ProjectRow, ProjectMark, Explore, Search,
Studios, Profile, Dashboard, the Collaboration/Playtest context cards, Feed — would need to route
through a resolver, touching a large surface of already-approved, frozen visual components for no
net security gain over the public-bucket approach.

**What "public" does NOT mean here**: no SELECT/list RLS policy is granted to `anon` or
`authenticated` on `storage.objects` for this bucket. Supabase's public-GET path bypasses RLS, but
`list()` (bucket enumeration) still goes through RLS — granting nothing means the bucket cannot be
enumerated by anyone but the owner (whose own INSERT/UPDATE/DELETE policies implicitly let them
list their own rows). Combined with unguessable UUID paths, this means: **a media file is
reachable only by someone who already has its exact URL** — not searchable, not listable, not
brute-forceable.

**Accepted, documented trade-off** (this is the one place B3 does not fully match B4's "storage
must respect Project state" ideal, and it is named explicitly rather than silently accepted): a
draft, private, or archived project's cover/screenshot URLs are not access-controlled beyond
unguessability. If a URL is captured while a project was public and the project is later set to
private, the image itself remains fetchable at that URL even though the project's page, title, and
every other field are correctly re-gated. **This is the same trade-off `visibility = 'unlisted'`
already makes for an entire project page** (reachable by link, not access-controlled) — B3 extends
it specifically to media, for draft and private projects too, rather than introducing a new kind of
exposure. A stricter guarantee (media access strictly following live project state, including
retroactive revocation) would require the signed-URL-at-read-time architecture described above — a
larger, separate change, not undertaken here per "don't overbuild a DAM."

## Object path ownership (write RLS)

```sql
-- INSERT/UPDATE/DELETE: only the project's owner, verified via the path's project_id segment.
(select auth.uid()) in (
  select owner_id from public.projects where id = (storage.foldername(name))[1]::uuid
)
```

No coupling to `lifecycle`/`visibility` on the write side — an owner can upload media to a draft
project (in fact that's the primary case: assembling cover art before publishing).

## Validation

- Client-side: file type allow-list, 5MB cap, image dimension sanity check before upload starts
  (reject absurdly small images — not a hard requirement, a UX nicety to catch obvious mistakes
  early).
- Server-side / bucket-level: `allowed_mime_types` and `file_size_limit` on the bucket itself are
  enforced by Supabase Storage independent of the client, so a client-side bypass still gets
  rejected server-side.
- Screenshot count: max 6, enforced in the upload UI (matches the existing `MAX_SCREENSHOTS`
  constant already in `ProjectForm`).

## Upload UX (per the directive's explicit list)

Real byte-level progress where the SDK provides it; otherwise an honest indeterminate "Uploading…"
state — never a fabricated percentage. Retry on failure without losing the rest of the form.
Remove and replace-cover as explicit actions. Reorder screenshots (drag or up/down controls),
order persisted as array position in the existing `screenshots` jsonb column (no new column
needed — order was already implicit in that array's element order, just never had a UI to change
it). Navigating away mid-upload does not corrupt already-saved project data — uploads happen
independently of the form's own save, each screenshot/cover commits to the DB the moment its
upload finishes, not batched with the rest of the form.

---

# B3 — Media Infrastructure: COMPLETE

Storage: `project-media` bucket + RLS applied to the live Supabase project via
`042_project_media_storage.sql` (bucket strategy documented above). Verified directly against
live data: owner-write policy evaluates true for the project's real owner, false for an unrelated
authenticated user; anon sees 0 rows when querying `storage.objects` for the bucket (no
enumeration possible), matching the design note's "unguessable path, no listing" property.

**Real sequencing problem found and solved while implementing**: the write RLS policy needs an
existing `projects` row to authorize against, but a brand-new project has no id until the form is
submitted — so uploading a cover *before* the first Save was structurally impossible with the
original "fill in everything, one INSERT at the end" flow. Fixed by creating the project row
lazily, on first upload attempt (not on page load, so merely visiting "New project" never leaves
an abandoned empty draft) — `createDraftProject()` inserts a minimal `lifecycle: 'draft'` row and
the form adopts its id for the rest of the session, switching its own Save from INSERT to UPDATE
automatically. This also happens to be real, free progress toward the later "authoring recovery"
work item: a project with an uploaded cover but abandoned before Save is now a legitimate,
resumable draft (visible in "Your projects" with the Draft badge already built for B4), not lost
work.

**Upload UX**: `CoverUploadField` (select/replace/remove, single image) and
`ScreenshotsUploadField` (up to 6, independent per-file status so one failure never blocks or
loses the others, remove, reorder via up/down — not drag-and-drop, fully keyboard/screen-reader
operable without a drag library). No fake progress — the installed `@supabase/storage-js` version
has no byte-level upload progress callback (verified by reading its source), so uploading shows an
honest indeterminate spinner, never a fabricated percentage. Client-side validation (type, 5MB
size) fails fast with a specific message; the bucket's own `file_size_limit`/`allowed_mime_types`
enforce the same limits server-side independent of the client. Replaces the previous "paste an
https:// URL" text fields entirely — this is now real upload, not link-pasting.

**Not built, and why**: responsive/transformed image delivery (Supabase Storage supports on-the-fly
resize/format transforms as URL query params) is available but plan-tier-dependent and not
verified enabled on this project — documented as a safe, additive, no-schema-change future
enhancement (append transform params to the existing stored URL) rather than built speculatively.
Devlog media stays out of scope, per the directive.

**Verification**: `tsc --noEmit` clean, `eslint` clean on every new/changed file, production build
green, storage RLS logic verified against live data as both the real project owner and an
unrelated authenticated user. Live browser upload-flow verification (actual file bytes through the
signed-in UI) is a recommended manual follow-up — this session's browser session was signed out
partway through (see the Search/Notifications-era notes above) and re-authenticating as the real
user wasn't something this session should do unprompted.
