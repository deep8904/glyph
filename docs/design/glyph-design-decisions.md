# Glyph — Design Decisions

Date: 2026-09-21. Inputs: `docs/design/glyph-ui-ux-audit.md` (repository facts), the attached research specification (`compass_artifact_…_text_markdown.md`), the earlier product docs in `docs/`, and the web research cited below. The specification's `[VERIFY-IN-REPO]` claims were checked against the repository; results are in §1.

## Rules from the product owner (binding)
1. Icons come from an existing pack. **Lucide** (`lucide-react`, already installed and used at 80 sites). No hand-made SVGs or icon files.
2. Look for inspiration; do not assume.
3. Use popular font pairings for this kind of site.
4. No custom graphics. Anything visual that is not type, color, or an icon is sourced (real user media only). Concretely: no illustrations, blobs, generated art, or hand-drawn SVG. The existing landing-page Three.js/GSAP/Lottie decoration is not extended, and is a removal candidate in Phase B.

## 1. Verification of the specification's repo hypotheses
| Hypothesis | Result |
|---|---|
| (a) nav differs from Home/Explore/Search/Create/Notifications/Me | **Confirmed.** Sidebar has ~10 entries; no Create; no bottom nav. |
| (b) project page separates metadata from narrative | **Partly.** Project page has structured metadata (stage, engine, tags), but it sits on the plasma layout, outside the app shell. |
| (c) state coverage | **Confirmed gap.** 3 of 66 pages have loading; errors often render as empty. |
| (d) fake metrics | **Not found.** No invented scores or charts. (Good; keep it that way.) |
| (e) component duplication | **Confirmed.** 13 avatar-initials copies, ≥12 button recipes, 7 H1 recipes, 5 devlog and 6 project representations. |
| (f) mobile nav pattern | **Confirmed.** Hamburger drawer only. |
≥3 confirmed → the specification's rule applies: **foundation first (Phase A + B) before feature surfaces.**

## 2. Research: what each product teaches (interaction grammar, not visuals)
Sources actually retrieved this pass: GitHub Docs (pinned items, profile README, repository About) — [Pinning items](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/pinning-items-to-your-profile); itch.io — [Introducing devlogs](https://itch.io/updates/introducing-devlogs), [Devlogs: post types](https://itch.io/updates/devlogs-post-types-enhanced-browsing-and-more); Linear — [How we redesigned the Linear UI](https://linear.app/now/how-we-redesigned-the-linear-ui); Vercel Geist (secondary summaries only); Stripe — [empty state pattern](https://docs.stripe.com/stripe-apps/patterns/empty-state); Read.cv (secondary summary, [Hack Design](https://www.hackdesign.org/toolkit/read-cv/)); font and icon comparisons cited in §5–6. LinkedIn, Behance, Steam, Reddit, Figma, Notion: not re-fetched this pass; their grammar is taken from the specification and `docs/glyph-platform-pattern-library.md` and is marked *(prior)*.

| Product | What it teaches | Glyph decision |
|---|---|---|
| GitHub | Pinned items are capped (six); the profile leads with identity then curated work; repo "About" = compact structured metadata beside a narrative README. | Featured = capped, curated; metadata bar beside narrative on Project. |
| itch.io | Devlog is a first-class post type; posts appear in followers' feeds and on the project page; comments optional; the devlog page uses the project's layout. | Devlog = flagship object; Featured ≠ Devlogs; devlog page inherits project context. |
| Linear | Navigation and supporting chrome "recede" while task content stays in focus; dense but with consistent gaps; Inter with a small weight range. | Quiet chrome, one type family, one gap scale. |
| Vercel/Geist | Semantic tokens and a neutral scale; color reserved for state; mono for technical text. | Semantic tokens; functional color. |
| Stripe | Empty states tell you what to do next, they do not apologize; skeletons for loading; error with a primary retry and an escape hatch. | `EmptyState`, `Skeleton`, `ErrorState` shapes. |
| Read.cv | Editorial, narrative profile rather than a keyword/endorsement list. | Profile = identity → current work → featured → devlogs. |
| LinkedIn *(prior)* | Application lifecycle, black-hole applications are the anti-pattern; bell + actor-action-object. | Show real application state; notifications already actor→action→object (Phase 10). |
| Steam *(prior)* | Request → admit → feedback playtest; lifecycle labels. | Two playtest flows; no store mechanics. |
| Reddit *(prior)* | Threading, collapse. | Comment thread (Phase C). No karma. |

## 3. Product character (decision)
Professional, editorial, developer-oriented, restrained, information-rich. **The work is the identity:** projects and devlogs carry personality; chrome is quiet. Not a game store, neon site, generic SaaS, AI startup, portfolio template, or engagement feed.

## 4. Visual language (decisions)
| Topic | Decision | Reason |
|---|---|---|
| Accent | Keep **one** accent, the existing indigo (`#4f46e5`, 641 uses), defined once as `--accent`. Used for primary action, links, focus, active nav. | Continuity with the 641 existing uses; the brief bans *gradients/glow*, which are removed, not the hue. One token makes a later hue change a one-line edit. |
| Neutrals | Existing Tailwind `gray` scale, mapped to semantic tokens (`bg`, `surface`, `surface-elevated`, `border`, `border-strong`, `fg`, `fg-secondary`, `fg-muted`). Muted text darkened to ≥4.5:1 on white. | 1570 uses; already cohesive. |
| Status color | success = green, warning = amber, danger = red, info = blue — each as a `fg`/`bg`/`border` triple. | Existing use is already status-only. |
| Radius | 4 (badges, kbd), **6 (buttons, inputs, rows)**, 8 (media, menus), 12 (dialogs, panels), full (avatars only). Pills retired for buttons and badges. | 203 `rounded-full` and 8 distinct radii read as templated; spec asks for restrained. |
| Elevation | Structure by 1px borders. Two shadows only: `--shadow-popover` (menus/popovers) and `--shadow-dialog`. No colored/glow shadows, no hover lift. | Removes the glow-button signature. |
| Backgrounds | Flat. `plasma`, grain, gradients are removed in Phase B/C. Existing classes are left in place in Phase A (nothing deleted before the pages that use them are migrated). | Phase order. |
| Dark mode | **Not built.** Tokens are CSS variables under `:root`, so a `[data-theme=dark]` remap is possible later; there is no existing dark UI to preserve (0 `dark:` rules), and the current dark `<body>` is only a backdrop. | Spec: don't invent a theme system unless architecture makes it sensible. |
| Motion | 120–200 ms `ease-out` for state changes; menus/dialogs fade+translate 4px; no lift, no springs; `prefers-reduced-motion` respected (already global). Landing GSAP/Three/Lenis left alone until Phase B. | Motion communicates state. |

## 5. Typography (decision)
**Inter (variable) + JetBrains Mono.** Space Grotesk removed. `--font-display` becomes an alias of Inter so the 33 existing `font-display` uses keep working until they are migrated.
- Evidence: Inter + JetBrains Mono is described as "the most common pairing in modern enterprise UI" and Inter as the leading UI typeface of 2026 ([Made Good Designs — Inter pairings](https://madegooddesigns.com/inter-font/), [coding-font roundup](https://crackr.dev/blog/best-coding-fonts)); Linear's UI is built on Inter ([Linear](https://linear.app/now/how-we-redesigned-the-linear-ui)). Geist + Geist Mono is the alternative for a single-vendor system; Glyph currently pairs Geist with a *non-Geist* mono, so switching to the mainstream pair is cleaner than keeping the mixed one.
- Loaded with `next/font/google` (self-hosted at build), which satisfies the CSP `font-src 'self'`.
- Mono is used only for: build/version strings, timestamps in dense lists, counts beside headings, code, technical identifiers, `@usernames` in metadata — **not** for badges' body text or whole sections (246 current `font-mono` uses will be reviewed per phase).
- Scale (px / line-height / weight): Display 32/40/600, H1 24/32/600, H2 20/28/600, H3 16/24/600, Body 15/24/400, Small 13/20/400, Micro 12/16/500. Nothing below 12px. Reading measure for devlog body ≈ 68ch. Headings use tight tracking (−0.01em to −0.02em) only at Display/H1.
- Weights limited to 400/500/600.

## 6. Icons (decision)
`lucide-react` only, `strokeWidth` 1.75 (default 2 is heavy at 16px), sizes 14/16/20. Lucide chosen because it is already the product's pack and matches Radix/shadcn ([comparison](https://www.pkgpulse.com/guides/lucide-vs-heroicons-vs-phosphor-react-icon-libraries-2026), [bundle benchmark](https://medium.com/codetodeploy/the-hidden-bundle-cost-of-react-icons-why-lucide-wins-in-2026-1ddb74c1a86c)). `react-icons` stays only in the unreferenced `watermelon` demo, which is a deletion candidate. Icon-only controls always get `aria-label` + tooltip/title.

## 7. Spacing (decision)
4px base: 4/8/12/16/20/24/32/40/48/64, exposed through Tailwind's existing scale (`p-1 … p-16`). Page gutter 16px mobile / 24px desktop; section gap 32px; row padding 12px; control heights 36 (sm) / 40 (md) on desktop and 44 on touch. Arbitrary `[Npx]` values are not allowed in new code; legacy ones are removed as each phase migrates a surface.

## 8. Components (decision)
Build on **`radix-ui`** (installed, unused) for behavior (Dialog, Tabs, DropdownMenu, Popover, Tooltip, Toast) and **`class-variance-authority`** (installed, unused) for variants — no new dependencies. Components live in `components/ui/`, one file each, variants not copies: `Button`, `IconButton`, `Field`/`Input`/`Textarea`/`Select`, `Badge`, `Avatar`, `Tabs`, `Menu`, `Popover`, `Dialog`, `Drawer`, `Toast`, `Skeleton`, `EmptyState`, `ErrorState`, `MetadataBar`. Domain components (`ProjectRow`, `DevlogRow`, `ProfileHeader`, `ActivityItem`, `NotificationItem`, `CollaborationListing`, `PlaytestListing`, `CommentThread`) are Phase C+ and are compositions of these. A living reference at `/design` (non-production only) shows every primitive in every state.

## 9. Shell and navigation (decision, implemented in Phase B)
Global destinations: **Home (Feed), Explore, Search, Create, Notifications, Me.** Desktop: left rail + content (+ optional context rail). Tablet: compact rail. Mobile: top utility bar + 5-item bottom bar (Home, Explore, Create, Notifications, Me; Search in the top bar) with matching bottom padding. Role-gated destinations (Studios, Publisher, Jams, Events, Admin) move under "Me" and the Create menu rather than the primary bar. One shell for signed-in and signed-out use, including the public profile/project/devlog pages.

## 10. Phase plan and boundaries
Phases A–I as in the master prompt; each ends with a report and a stop. This phase (A) is additive: tokens, fonts, primitives, `/design`. No page is migrated in Phase A, so no route's behavior changes except the global font swap. All changes classified `visual` / `frontend-architecture`. **No backend change.**

## 11. Open risks recorded
- Font swap changes text metrics everywhere at once (widths may shift slightly); verified by build and by visual pass on the public pages that can be viewed signed-out.
- The blanket 44px mobile `min-height` rule on `a`/`button` (in `globals.css`) inflates inline links; it is replaced by component-level sizing when pages migrate (tracked for Phase H).
- Signed-in surfaces cannot be browser-verified here (email OTP); new primitives are verified on `/design`, which is public in development.
