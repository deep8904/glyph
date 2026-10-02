---
version: "glyph-graphite-bone-ember-1"
name: "Glyph — the living build record"
design_system: "Graphite & Bone + Ember"
description: "Glyph is the home base for indie game developers who are still building: profiles, projects, devlogs, playtesting, collaboration, jams, events, studios, publishers. This document describes the design system actually implemented across the six approved greenfield surfaces (Global Shell, Explore, Project, Profile, standalone Devlog, Dashboard overview) — superseding the earlier warm-paper/indigo world below."
mode: theme-dual
themes:
  bone: "Light. Near-neutral warm-cast surface; editorial/paper register. First-class, not a fallback."
  graphite: "Dark. Near-neutral warm-cast surface; operational/confident register. First-class, chosen per surface, not a default-dark-mode afterthought."
colors:
  bone:
    paper: "#f6f4ef"
  graphite:
    paper: "#121312"
  ember: "#e8552a"          # light theme; #ff6a3d in Graphite
  ember-press: "#c8461f"
  ember-ink: "#bf461e"      # accent-as-text, AA on Bone; #ff7a52 on Graphite
  ember-quiet: "rgb(232 85 42 / 0.12)"   # selected-row / soft fill tint
  ember-line: "rgb(232 85 42 / 0.34)"
  note: "Ember is the ONLY brand color, and only ever marks action, live state, selection, or focus — never decoration, never a heading color, never a background fill outside a selected/active state. Real project/game media supplies visual chroma everywhere else. No gradients-as-decoration, no glass, no neon, no purple."
tokens:
  prefix: "--gg-*"
  scope: ".gg-scope"
  note: "Isolated from the legacy (non-gg) token layer in app/globals.css, which not-yet-migrated routes still use — the two systems intentionally coexist during migration and must never be mixed within one surface."
typography:
  family: "Geist (display + body), JetBrains Mono (data only: dates, counts, versions, shortcuts — never a decorative 'technical' costume, never an eyebrow)"
  scale: "text-display / text-h1 / text-h2 / text-h3 / text-body / text-small / text-micro — named tokens, not ad hoc sizes"
  hierarchy: "Exactly one h1 per page. Section headings are h2; object/entry titles inside a section are h3. No skipped levels. Heading scale is chosen per surface's actual identity, not applied uniformly — e.g. a Devlog entry's title is entry-scale (h1, but text-h1 not text-display) because it is one dated record inside a larger one, not a masthead."
shell:
  pattern: "One quiet top bar (wordmark · Home · Explore · ⌘K search/command · Create · Notifications · account) + ⌘K command menu (real combobox/listbox semantics, focus restoration) + mobile slide-over sheet."
  explicit_bans: "No persistent left rail. No baked-in contextual tab row. No mobile bottom bar. No peek inspector. A surface that genuinely needs sub-modes composes them inline (e.g. Explore's own facets) rather than the shell imposing structure everywhere."
  home: "Resolves to / signed-out, /feed signed-in."
media:
  rule: "Real project/game media is the chroma. A missing cover degrades to an honest compact identity treatment (initials/monogram) — never a fabricated or procedurally generated substitute. Sample/seed imagery is always labeled as such (a solid, opaque tag, never translucent). A failed image is recovered both pre- and post-hydration, never left as a broken box or permanently reserved dead space."
object_anatomy:
  rule: "Every object type gets its own composition, not a shared Card. A Project is not a Profile is not a Devlog is not an Explore tile is not a Dashboard status row — each is built from that object's own product question, not a resized copy of another object's anatomy."
  examples:
    - "Project: full-bleed hero, this object's own page."
    - "Profile: masthead identity + a fused 'build snapshot' object (current project + latest evidence + cadence, fused, not three separate widgets) + a work-record timeline + a purpose-grouped ecosystem panel."
    - "Devlog: a quiet monospace log-line (provenance + date) above an entry-scale title — reads as one dated record in a larger record, not a blog article or a small Project page."
    - "Explore: honest-cover tiles / compact no-cover identity, never a uniform card grid pretending every object is the same shape."
    - "Dashboard: one prioritized decision object (Next), not a portfolio grid or an equal-widget dashboard. Nothing is included that doesn't help the user act today; no fabricated counts, deadlines, or 'recommended' actions."
motion:
  press: "80-140ms"
  menu: "120-180ms, origin-aware"
  panel: "180-260ms"
  reduced_motion: "Global @media (prefers-reduced-motion: reduce) rule in app/globals.css zeroes animation/transition duration for every element — this is enforced site-wide by construction, not opted into per component."
focus:
  rule: "Every interactive element gets a visible 2px Ember focus ring on :focus-visible. Never suppressed, never replaced with only a color change."
responsive:
  breakpoints: "375 / 768 / 1024 / 1440 all verified with zero horizontal overflow on every approved surface."
  touch_targets: "Minimum 44×44px for any real interactive control on mobile (sm: breakpoint may shrink to a compact desktop size). Inline text links within continuous prose are the one accepted exception, per WCAG's own inline-target exception — not a loophole for standalone buttons or icon-only controls."
accessibility:
  rule: "Skip-to-content link, single shell landmark, keyboard-reachable command menu and all page actions, meaningful alt text (or explicit empty alt for decorative media), correct heading hierarchy, external-link 'opens in new tab' announcement, clean console."
contracts:
  rule: "Every rebuild preserves product truth exactly — Supabase queries/columns, visibility and lifecycle rules, permissions, RLS-backed exclusions, server actions, sanitizer schemas, canonical routes and destinations — and discards only presentation. Data/behavior contracts are the one thing inherited from the legacy implementation; its JSX, class names, component tree, and page anatomy are not."
migration:
  status: "Six surfaces approved and shipped under this system: Global Shell, Explore hub/directories, Project, Profile, standalone Devlog, Dashboard overview. All other routes still run the prior (non-gg) presentation layer and its own token block in app/globals.css, coexisting intentionally until each is migrated in turn. See design/OLD_UI_REMOVAL.md for the per-surface disposition ledger."
bans:
  - "The warm-paper canvas + indigo (#4F46E5) 'editorial/operational two-register' world this file described before this revision — superseded, see design/OLD_UI_REMOVAL.md"
  - "The Auralis gradient/prism world before that — superseded"
  - "gradient text for emphasis (use weight/size)"
  - "eyebrow/kicker above headings"
  - "same-size icon+heading+text card grids as page structure"
  - "glass/blur as decoration"
  - "fabricated games, screenshots, metrics, testimonials, activity, or urgency"
---

# Glyph — the living build record

**Design system: Graphite & Bone + Ember.**

**Thesis:** Glyph is the living build record — real, in-progress game work, presented as dated evidence and true current state, inside a calm professional workspace. The interface frames the work; it never overpowers it, and it never invents facts the data doesn't support.

This is the design authority for every route built under `components/glyph/**`. It supersedes this file's own prior warm-paper/indigo content (dated before this revision) and the Auralis world before that — see `design/OLD_UI_REMOVAL.md` for the disposition history of both. `design/NEW_GLYPH_PRODUCT_DIRECTION.md` remains a valid, consistent product-direction companion to this file; nothing here contradicts it.

## What "approved" means right now

Six surfaces are built and verified against this system: the Global Shell (`GlyphShell`/`GlyphTopNav`/command menu), Explore, Project, Profile, the standalone Devlog page, and the Dashboard overview. Everything else in the app still runs the prior token layer and legacy component tree, on purpose, until migrated — that is not a regression, it is the current, intentional state of an in-progress migration. Do not treat any not-yet-migrated route's presentation as this system's authority.

## Two-register instinct, one token system

Even though this file no longer names formal "editorial" and "operational" modes, the underlying instinct survives in how each surface is built: a reading/discovery surface (Explore, Project, Devlog) leans on media and generous space; an operational surface (Dashboard) leans on compact, prioritized, truthful state. Both draw from the same `--gg-*` tokens and the same Ember discipline — never a second, competing visual language.
