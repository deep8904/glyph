# Glyph — Competitive UX Comparison Tables

**Date:** 2026-09-16
**Companion to:** `docs/glyph-competitive-product-research.md` (full citations and methodology live there — this file is the concise working-table version for quick reference). Evidence tiers: OBSERVED/CODE VERIFIED (Glyph, this engagement) vs. RESEARCHED (competitor, cited in the companion doc) vs. RECOMMENDED (proposal, not validated with users).

## Table 1 — Area Comparison

| Area | Glyph Today | Competitor Pattern | Problem | Recommendation |
|---|---|---|---|---|
| Landing nav | In-page anchors only (`#features`,`#community`,`#events`,`#jobs`) — never links to real `/explore` | itch.io's top nav links directly to Browse Games, a real catalog | A visitor can't reach real content without guessing the `/explore` URL | Link real discovery from the marketing header, not just anchors |
| Dashboard first-run | Three equal-weight empty cards (Projects/Events/Collaborations), no prioritized action | itch.io: "Upload Game" is a single first-class nav action | New user has no obvious single next step | Pick one winning first action (post first devlog) and subordinate the rest visually |
| Empty states | One identical template everywhere (icon-square + heading + gray subtext + CTA) | N/A (competitors mostly don't share Glyph's empty-state-heavy surface count) | Feels generic/templated; no game-dev-specific personality | Differentiate copy/visuals per feature area |
| Profile activity signal | None — only "Member since" | GitHub: contribution graph (gameable); Letterboxd: activity feed (unpersonalized) | A "still building" product shows no visible momentum | Add an artifact-tied momentum signal, learning from both competitors' documented flaws |
| Project page | Structured badges + embedded live playtest CTA + devlog list | itch.io: free-text credibility fields, no playtest integration | N/A — Glyph is ahead here | Protect this; don't regress toward free text |
| Discovery/browse | Flat grid, no filters (`/explore`) | itch.io: 25+ filter dimensions across genre/platform/price/etc. | itch's model would overwhelm Glyph's much smaller catalog | Don't copy itch's filter depth; Are.na's recency-based, non-algorithmic model fits Glyph's catalog size better |
| Navigation completeness | Studios/Publisher/Jams absent from primary sidebar despite being real features | N/A | Glyph's actual feature surface is wider than its nav admits | Add to primary nav once features are finished (see Studios caveat below) |
| Collaboration | Structured post/apply board; applicant-review UI missing | itch.io/Game Jolt/forums: ad-hoc forum threads only | Glyph's model is structurally ahead already | Finish applicant-review UI rather than redesigning the concept |
| Playtesting | Structured tag-based request, embedded on project page; tester-side flow untested | No researched competitor has a structured equivalent (r/GamePlayTest is the real-world workaround) | Real user pain (§18 of companion doc) is follow-through, not discovery — Glyph's structure already targets this | Prioritize finishing/testing the tester-side flow; it's the most differentiated flow in the product |
| Studios/Teams | Solo-only in practice — no invite/role/leave UI | No researched competitor has this concept at all | Biggest gap between competitive ambition and shipped reality | Needs original product design, not competitive benchmarking |
| Jam voting | Untested this pass; admin-approval gate exists | Ludum Dare: documented vote-manipulation trust failure led to a cancelled rating phase | Voting/rating has real historical failure modes | Design anti-abuse consideration in before first real use, not after an incident |
| Dashboard density | Rounded-card-everywhere, generous gaps, equal visual weight throughout | Linear: flush/bordered density, visual weight matches task centrality | Task-oriented authenticated surface uses showcase-surface visual language | Reduce card/gap decoration on dense, task-oriented pages; keep it on showcase pages (project/profile) |

## Table 2 — User Journey Comparison

| Journey | Glyph Today | Best Observed/Researched Pattern | Recommended Glyph Flow |
|---|---|---|---|
| Visitor → understands product | Landing hero states audience/purpose clearly (OBSERVED) | itch.io: browse page is the front door itself | Keep the hero's clarity; also surface one real, live piece of content (a real project/devlog) before signup, not just a mock screenshot |
| Visitor → finds real content | Must discover `/explore` on their own; not linked from marketing nav (OBSERVED) | itch.io: Browse Games is a primary nav item | Add a direct, discoverable path from the public site to real projects |
| New developer → first action | Three equal empty-state cards, no clear priority (OBSERVED) | itch.io: "Upload Game" nav item | Prioritize one first action (post a devlog) in the UI |
| Developer → posts progress | Solid, live-tested, devlog creation → comments/reactions/notifications all wired (OBSERVED, fixed this engagement) | itch.io: 42,000+ devlog posts published (RESEARCHED) — validates the core mechanic at scale | No significant change — this flow already works and matches the strongest researched precedent |
| Developer → gets feedback | Comments/reactions work; no structured "ask for specific feedback" mechanism found on devlogs themselves (only on dedicated playtest requests) | Real user complaint (RESEARCHED): generic feedback mechanisms produce low-value responses | Consider whether devlog-level feedback needs the same structured-ask mechanic playtest requests already have |
| Developer → finds a collaborator | Structured collaboration board; requester can post and applicants can apply; review UI not located (per completeness audit) | itch.io/forums: ad-hoc threads, documented "is finding a team really this hard" complaints (RESEARCHED) | Finish the review side — the differentiator already exists on paper |
| Developer → finds a playtester | Structured, tag-based, embedded on project page; tester side untested | No structured competitor equivalent found; real pain is follow-through not discovery (RESEARCHED) | Finish and verify the tester-side experience specifically — highest-leverage unfinished flow found in this research |
| Studio owner → builds a team | Cannot add a second member in practice (per completeness audit) | No competitor precedent | Needs new product design work |
| Jam participant → submits/votes | Full loop verified working this engagement; voting untested for abuse-resistance | Ludum Dare's documented trust failure (RESEARCHED) | Review voting flow specifically for anti-abuse design before real-community use |
| Publisher → contacts a developer | Registration/dashboard work; contact notification just fixed this engagement; no researched competitor has this feature at all | N/A — novel among researched set | Finish shortlist UI; this is a genuine differentiator if completed |

## Table 3 — UI Pattern Comparison

| UI Pattern | Glyph Today | Reference Product(s) | Recommendation |
|---|---|---|---|
| Empty states | Single shared template, feature-agnostic copy | N/A (most competitors don't foreground empty states this heavily) | Write per-feature copy; consider per-feature illustration |
| Dashboard cards | Symmetric 3-column grid, equal visual weight regardless of content | Linear: visual weight matches task centrality, not layout symmetry (RESEARCHED) | Let real data/priority drive weight, not a fixed grid |
| Activity/momentum signal | Absent | GitHub contribution graph (gameable, RESEARCHED critique); Letterboxd activity feed (unpersonalized, RESEARCHED critique) | Add one, but tie it to real artifacts (devlog/playtest), not raw activity count |
| Project page structure | Badges + embedded playtest CTA + devlog list (structured) | itch.io: free-text credibility fields (RESEARCHED) | Keep Glyph's structured approach; it's already ahead |
| Devlog vs. project split | Two distinct content types already in the schema/UI | Behance (deep case study) vs. Dribbble (quick shot) dual-surface model (RESEARCHED) | Lean into the existing split visually — devlogs as quick/scannable, projects as full case studies |
| Discovery/browse filters | None | itch.io: 25+ filter dimensions (RESEARCHED); Are.na: no filters, curation/recency-based (RESEARCHED) | Follow Are.na's simpler model given Glyph's current catalog size, not itch's filter depth |
| Command/search access | Full-page `/search` destination only | Linear: command-palette (Cmd+K) as a core philosophy, not a feature (RESEARCHED) | Consider a persistent, lightweight search affordance as the object graph grows |
| Settings navigation | Working sub-nav pattern (Profile/Account/Notifications/Danger Zone) | N/A — this is a Glyph strength | Replicate this contextual sub-nav pattern in other multi-page sections instead of inventing new patterns per section |

---

*All Glyph-side claims in this document are OBSERVED or CODE VERIFIED from direct testing/source review during this engagement. All competitor claims are RESEARCHED with full citations in the companion document. No visual/aesthetic recommendation here has been implemented — this document is research and comparison only, per this phase's explicit scope.*
