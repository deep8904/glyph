# Glyph UI/UX Inspiration Kit

This folder is a redesign brief, reference catalog, and implementation prompt for Glyph. It covers both the public marketing site and the signed-in product.

## Start here

1. Read [DESIGN_DIRECTION.md](./DESIGN_DIRECTION.md) for the synthesized visual thesis.
2. Review [MOODBOARD_REFERENCE_CATALOG.md](./MOODBOARD_REFERENCE_CATALOG.md) for cited sources and extraction notes.
3. Use [Landing/README.md](./Landing/README.md) and [App/README.md](./App/README.md) for page-specific patterns.
4. Use [Patterns/COMPONENTS_AND_MOTION.md](./Patterns/COMPONENTS_AND_MOTION.md) as the interaction and component contract.
5. Give [CLAUDE_CODE_REDESIGN_PROMPT.md](./CLAUDE_CODE_REDESIGN_PROMPT.md) to Claude Code from the real Glyph repository.
6. Open [Visual_References/moodboard.svg](./Visual_References/moodboard.svg) for a copyright-safe, transformed visual summary of the eight preferred references.

## Design thesis

**Glyph is the living build record for indie games:** unfinished work is presented with editorial confidence, while collaboration and operations remain calm, legible, and fast.

The system has two coordinated registers:

- **Expressive public/editorial:** landing, Explore, Project, Profile, and Devlog surfaces use authentic game media, strong typography, asymmetric editorial rhythm, and intentional breathing room.
- **Quiet operational:** dashboard, collaboration, playtesting, notifications, search, settings, and onboarding use compact structure, visible status, predictable controls, and minimal decoration.

Both registers must share the same tokens, object identities, accessibility rules, and interaction grammar.

## Non-negotiable guardrails

- Do not turn Glyph into a generic gaming site: no neon haze, cyberpunk chrome, ornamental HUDs, or gamer clichés.
- Do not turn Glyph into a generic AI/SaaS landing page: no repeated bento-card wallpaper, giant vague headings, fake metrics, decorative blobs, glassmorphism, or constant gradients.
- Real project art supplies visual color. Platform color communicates action, selection, warning, success, and state.
- Preserve the visible chain **Developer → Project → Devlog / Collaboration / Playtest**.
- Do not redesign from screenshots alone. Audit the actual repository, routes, data states, responsive behavior, accessibility, and current component contracts before editing.
- Motion must explain cause, continuity, hierarchy, or system status; it must be interruptible where practical and reduced when `prefers-reduced-motion` is set.

## Evidence labels

- **DIRECTLY REVIEWED:** the cited page or documentation was opened during this research pass.
- **PUBLISHER DESCRIPTION:** notes come from the creator's own project description; they are not proof of production usability or claimed outcomes.
- **OFFICIAL DOC:** first-party product or design-system guidance.
- **REFERENCE INDEX:** a discovery library; use it to find examples, not as proof that a pattern works.
- **NOT VERIFIED:** the supplied URL could not be reliably inspected in this pass.

## Asset and copyright note

No third-party artwork is redistributed in this package. The included SVG moodboard is a transformed analytical summary using extracted palettes, composition labels, and source links. Visit the linked source pages to inspect the original work and confirm current licensing before reusing any asset.

## Recommended redesign order

1. Verify repository, branch, route inventory, running app, and product truth.
2. Correct contradictions before styling, especially pricing or upgrade language that conflicts with Glyph's product commitment.
3. Establish tokens and composition primitives.
4. Redesign Project, Profile, and Devlog as the canonical identity system.
5. Carry project provenance into Feed, Explore, Search, Collaboration, Playtesting, Notifications, and management surfaces.
6. Redesign the landing page from real product proof.
7. Validate responsive behavior, keyboard access, contrast, reduced motion, empty/loading/error states, and data realism.

