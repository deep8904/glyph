# Glyph — design inspiration library

Curated, not exhaustive. Each entry: what works, why, which Glyph problem it solves, what NOT to copy. Live-inspected sources are marked ✅; sources applied from established, well-documented patterns are marked ◑ (the brief allows this once real references anchor the direction — itch.io was inspected live as the closest competitor).

## The single most important finding: Glyph's real data is media-poor

Measured against the live DB (6 public projects): **1 has a cover image, 0 of the other 5 have any cover or screenshot.** Developers are avatar-optional. This is not a temporary seed gap — indie devs mid-build rarely have polished key art.

**Consequence that governs every direction below:** a design that leans on lush cover grids renders as one real image beside five broken gray boxes. The visual material Glyph actually has in quantity is **structured text** — project title, one-line pitch, genre, engine, stage, developer name, activity recency, and opportunity state (open playtest / open to collaborate). The redesign must make *that* the design material, treat real media as an enhancement that slots in when present, and give cover-less objects a **deliberate, characterful fallback** (typographic/structural — never a gray placeholder, never a fake gradient blob).

This reframes "add big media" (rejected — there is none) into "make genre/stage/engine/developer into visual identity, and use the full canvas width."

---

## 1. itch.io — Browse Games ✅ (live: https://itch.io/games)

**Screen:** game discovery grid.

**What works**
- **Left faceted filter rail (~200px) + full-width main grid.** No dead canvas — the whole viewport does a job.
- Main is a **3-column card grid**: cover (≈4:3) → bold title → one-line pitch → author → genre + platform chips + an action tag ("Play in browser").
- **Sort tabs** (Popular / New & Popular / Most Recent) + a quick **tag-chip row** sit above the grid.
- Crucially, **many covers were still solid-color blocks (lazy-loaded)** and the cards *still read fine* — title + author + genre carry identity without the image.

**Why it works**
- Faceted rail = Hick's/Tesler: the system holds the taxonomy so the user narrows by recognition, not by typing.
- Card metadata is a fixed reading order (Serial Position) → scannable at a glance.
- Media is enhancement, not load-bearing — proven by the color-block cards.

**Which Glyph problem it solves**
- Explore's dead 768px strip → full-width grid + rail.
- "Every object is a text row" → project tile with genre/stage/engine as chips.
- Media poverty → the color-block cards are the live proof a good tile survives no cover.

**What NOT to copy**
- itch is a *storefront* (buy/play finished games, popularity-sorted). Glyph is *games in progress*, activity-sorted, no popularity. The equivalent of "Play in browser" is **stage (alpha/beta) + opportunity (Open playtest / Open to collaborate)**, not price/sales.
- Dense commercial chrome (sale badges, "On Sale", ratings) — Glyph has none of that and must not fake it.

---

## 2. Steam — discovery/store ◑

**What works:** a *featured/hero* moment (one thing worth looking at now) above the browsable grid; genre tags as first-class navigation; capsule art at consistent aspect ratios.

**Glyph application:** Explore can lead with **one currently-active project** (the most-recently-active with an open playtest) as a wider feature block, then the browsable grid below — Von Restorff: make the lead distinctive because it matters, without inventing "trending."

**Do NOT copy:** wishlist/price/review-score mechanics; "Popular New Releases" ranking (Glyph is explicitly activity-ordered, no ranking).

## 3. GitHub — repository + Explore ◑ (Primer)

**What works:** a mostly-*text* object (a repo) still feels alive via **structured metadata that means something** — language dot+name, stars, "Updated N days ago", topics as chips. No cover art anywhere, yet never feels empty.

**Glyph application:** this is the proof that media-poor can look intentional. Engine → GitHub's language dot; genre/tags → topics; "last activity" → "Updated N ago"; stage → a status the object owns. Project tiles borrow this discipline, not the visuals.

**Do NOT copy:** Primer's exact gray palette / density; star/fork social-proof metrics (Glyph has none, must not fabricate).

## 4. Letterboxd — member + activity ◑

**What works:** identity built from *what you're engaged with right now*; activity reads as "people doing things with works," poster-forward but text-legible; consistent object identity (a film) travels everywhere it appears.

**Glyph application:** Developer identity = "currently building THIS" (already the Profile thesis); the object-identity-travels principle → a project's title/stage/dev must be recognizable in Explore, Feed, a devlog, a collaboration post — one identity unit, many contexts.

**Do NOT copy:** star ratings, review social graph.

## 5. Linear — home / operational surfaces ◑

**What works:** dense operational hierarchy with *near-zero chrome* — no cards around everything, grouping by hairline + strong typographic weight, one clear primary action per view, restraint with color (accent = action/status only).

**Glyph application:** the *Operate* family (Dashboard, management) — but the lesson for Explore is the opposite: Explore should NOT look like Linear (that's the current failure — operational rows for a discovery surface). Discovery wants recognition and browse energy; operation wants density and scan. Different jobs → different composition. (This is the core "page personality" argument.)

---

## Synthesis → what Explore must become

1. **Full width.** Kill `max-w-3xl`. Left/inline facets + a broad main region.
2. **Object types get different compositions**, not one shared row: a **project tile** (media-or-fallback + genre/engine/stage/dev), a **developer identity line** (avatar + name + role + current project), a **devlog editorial row** (title + project + excerpt), an **opportunity** (playtest/collab) as a distinct actionable block.
3. **One characterful cover fallback** driven by the project's own data (title monogram + genre/engine treatment) so the 5 cover-less projects look deliberate, not broken.
4. **Lead with one currently-active thing** (Von Restorff), then browse.
5. **Genre / engine / stage become visual identity**, not middot-separated gray text.
6. No popularity, no fake metrics, no gray placeholder boxes, no pastel gradient blobs.
