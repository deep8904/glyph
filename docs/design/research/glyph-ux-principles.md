# Glyph — UX principles in use

Not a textbook. Each principle is tied to a concrete Glyph decision. Format: **problem → principle → how the design answers it.** Names never appear in the UI.

## Discovery (Explore / Search)

- **Dead 768px content strip on a 1440 canvas.** → *Aesthetic-Usability + use of space.* A discovery surface that wastes half the screen reads as unfinished regardless of content quality. Explore goes full-width: an inline facet/sort region + a broad grid.
- **"What can I look at / do right now?"** → *Von Restorff.* Lead with ONE currently-active project (most-recently-active with an open playtest) as a distinct wider block, so the eye lands somewhere with intent before scanning the grid. Not "trending" — a real condition on real data.
- **Four object types rendered identically = nothing differentiated.** → *Law of Similarity (inverse).* Identical treatment implies identical function; Glyph's projects, developers, devlogs and opportunities are different jobs, so they must look different. Distinct compositions per type.
- **Genre/engine/stage as gray middot text competes with the title.** → *Selective Attention + Chunking.* Promote them to typed visual chips grouped with the object; demote pure chronology to a quiet corner. The title and the opportunity win the glance.
- **Too many competing sort/filter controls.** → *Hick's + Tesler's.* The system owns the taxonomy (a small set of facet chips), not a 12-control filter bar. Fewer, structured choices.

## Identity (Profile / Project / Devlog)

- **"Who is this and what are they building?" must land in one glance.** → *Von Restorff + Serial Position.* Current Work dominates and sits first; supporting sections (about, links) recede.
- **A devlog detached from its project is a blog post.** → *Law of Common Region + object identity travels.* The project identity unit (crop/monogram + title + stage) rides the devlog masthead, Feed row, collaboration post — same unit everywhere, so "this belongs to that" is compositional, not a breadcrumb string.
- **Media poverty.** → *Aesthetic-Usability.* A cover-less project still must look composed: a characterful typographic/structural fallback the project's own data generates, never a gray box.

## Operate (Dashboard)

- **"What do I do next?"** → *Fitts's + Serial Position.* The single next action is large and early, inside Current Work, not buried in a list.
- **Decisions vs. FYI blurred together.** → *Chunking + Common Region.* Items waiting on a decision (applications, playtest sign-ups) group as "Needs attention" with an explicit per-item action; passive activity (comments) stays a quiet list.

## Cross-cutting

- **Jakob's Law:** search, nav, back, and form conventions stay conventional — invention is spent on composition and identity, not on relearning basic interactions.
- **Common Region discipline:** a container (border/surface) appears only where the boundary earns comprehension — Current Work, an opportunity block, a media group. Never around About text, never around every row, never around every section.
- **Doherty threshold:** interactions feel immediate — optimistic UI where it already exists (follow, react), skeletons that match final composition, motion in the 140–350ms bands from R1.
- **No fabricated signal:** no popularity, player counts, ratings, revenue, or fake activity — every number on screen is a real timestamp or a real count.
