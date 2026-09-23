# Glyph — Neuform redesign plan

Source of art direction: `ecosystem-visualization-DESIGN.md` ("Ecosystem Visualization," a feature-section/bento/chart template). Product foundation: current Glyph architecture, data model, RLS, and workflows — unchanged. This document is the required plan-before-code artifact; R0 begins only after this is written.

Grounding: read in full — `glyph-entire-application-ui-ux-audit.md`, `glyph-final-audit.md`, `glyph-visual-product-audit.md`, `glyph-visual-redesign-blueprint.md`, `glyph-design-system.md`, `glyph-phase-l-visual-reassessment.md` (via a research pass) — plus direct inspection of `app/globals.css`, the live route tree (74 routes), and `components/ui/`.

## 0. Ground truth correction

`glyph-design-system.md` is stale. The **live** `app/globals.css` (as of commit `d0ac98c`, "Adopt Visitors design tokens") already implements a prior rebrand — Carbon/Paper White/Lavender — not the gray/indigo system the docs describe. This plan treats `app/globals.css` as current ground truth and replaces its color role values with the Neuform palette below, while keeping the *shape* of the token system (semantic names, radius scale structure, type-scale structure) that the Visitors pass already established, since that structure is sound and not what's being redirected.

Also per the synthesis: the audits identify real still-open gaps beyond color — sameness across discovery pages (Explore/Collaborate/Playtests/Jams/Events/Publishers all resolve to the same `Section`/hairline-row anatomy via `DiscoveryFrame`), no project-identity marker traveling across surfaces, Dashboard has no single dominant resumptive action, Search is narrow/no typeahead, notifications are flat dot+text. These are **UX-structure gaps**, not just color gaps — this redesign's page-family work (§4) is where they get addressed, not merely retextured.

## 1. Visual thesis

Glyph is a live build record for indie developers who are still building. The Neuform reference's real contribution isn't its orange — it's **disciplined operational density with one warm accent used sparingly, and a dark slate surface used as a structural contrast tool, not decoration**. Translated: Glyph's white/neutral canvas stays dominant everywhere; the warm accent (#E48B59/#ED7B46 family) marks the one primary action per view; the slate (#53617A family) becomes a deliberate dark surface reserved for Operate-mode density (dashboards, management panels) and inverse moments (dark feature cards, code/mono blocks) — not a global dark mode and not random panel decoration.

Two registers persist from prior phases, restated under the new palette: an **editorial register** (Identity/Work family — Profile, Project, Devlog, Studio) where typography and media carry the work, and an **operational register** (Operate family — Dashboard, management pages) where compact hierarchy and state clarity win. The Neuform reference's "compact nested operational panels" become the operational register's model; its "feature section" bento language does **not** become a template stamped across the whole app.

## 2. Translation: reference → Glyph

| Reference concept | Literal source | Glyph translation |
|---|---|---|
| Primary/accent orange | #E48B59 / #ED7B46 | One accent role (`--accent-primary`), used for the single primary action per view and for `text-accent`/`border-accent` emphasis. Never a background fill for large areas. |
| Slate surface | #53617A | `--surface-inverse` — dark card/panel background for: Operate-mode "needs attention" panels, one inverse feature moment on Landing, code/mono blocks, Studio/dark-context avatars. Not a page background. |
| White background | #FFFFFF | `--surface-primary` / `--canvas` — stays the dominant surface everywhere except the inverse moments above. |
| Text primary/secondary | #111827 / #4B5563 | `--text-primary` / `--text-secondary`, close to current Carbon (#181925) — minor delta, keep current near-black for continuity rather than churn. |
| Border | #D8DADF | `--border-subtle`, lighter than current `--line` (#e8e8e8) by a hair — adopt literally. |
| Inter display/body, JetBrains Mono metadata | typography block | Keep exactly — this matches what's already shipped (Inter everywhere, JetBrains Mono for metadata/dates/stage labels). No font change needed. |
| 64px display | display-lg | Scale down for app use per §3 — 64px only for Landing hero; app `--text-display` becomes ~40–48px context-dependent, not a blanket bump. |
| Compact nested operational panels | Components section | Becomes the Operate family's composition model (Dashboard, management pages) — nested surfaces with mono metadata, not the Identity/Work family. |
| Bento/chart grid | Composition | Explicitly **not** copied. No fake metrics, no chart-as-decoration. Feature-grid language is reserved for Landing only, and even there, real content (not invented stats). |

## 3. Token system (target `app/globals.css`)

Semantic names carried over from the current Visitors pass; **values redirected** to Neuform roles. New names added where the brief calls for a role the current system doesn't have (surface-inverse, focus-ring already exists as `--focus-ring`).

```
--accent-primary:   #E48B59   (was --accent #918df6)
--accent-hover:     #D97A46   (darkened primary, was --accent-hover)
--accent-secondary: #ED7B46   (was unset — new: secondary emphasis, e.g. secondary CTA underline)
--accent-subtle:    #FDF2EA   (10% accent tint on white, was --accent-subtle)
--accent-line:      #F3D9C4   (was --accent-line)

--surface-primary:   #FFFFFF  (was --surface)
--surface-secondary: #FAFAFA  (was --surface-muted)
--surface-raised:    #FFFFFF  (elevated card, shadow-differentiated, was --surface-elevated)
--surface-inverse:   #33394A  (darkened from source #53617A for AA text contrast — see §9; was unset)
--surface-inverse-raised: #3D4459 (one step lighter, nested panel on inverse)

--text-primary:   #181925  (kept — negligible delta from #111827, avoids re-touching every component)
--text-secondary: #53617A  (repurposed: the reference's "surface" slate becomes Glyph's secondary-text role on light backgrounds — this is the deliberate "structural contrast tool" use the brief asks for)
--text-tertiary:  #8A93A6  (new — lighter slate step, was --fg-muted #999)
--text-on-accent: #FFFFFF
--text-on-inverse: #FFFFFF
--text-on-inverse-secondary: #C4C9D4

--border-subtle: #D8DADF  (was --line #e8e8e8 — literal adoption)
--border-strong: #B7BCC7  (was --line-strong)
--border-on-inverse: rgb(255 255 255 / 0.12)

--status-success: #2FA35C  (kept close to current mint, minor desaturation for AA on white)
--status-warning: #C97A2E  (recast in the warm family so it doesn't compete with accent — was amber #ffa600, too close to accent hue-wise; shift toward brown-amber)
--status-danger:  #D64545  (kept close to current)
--status-info:    #3B6FB0  (kept close to current, desaturated)

--focus-ring: #E48B59  (accent-primary)

--radius-control: 8px   (kept)
--radius-panel:   16px  (kept — matches reference card radius exactly)
--radius-pill:    9999px (kept, used only where semantically a pill: filter chips, status pills, avatars — NOT default button shape; see §5)
--radius-table:   16px  (was 24px — bring in line with panel radius, 24px read as over-rounded on dense data)

--elev-raised:  0 1px 2px rgb(24 25 37 / 0.04), 0 1px 1px rgb(24 25 37 / 0.03)
--elev-popover: 0 4px 16px -2px rgb(24 25 37 / 0.10), 0 0 0 1px rgb(24 25 37 / 0.05)
--elev-dialog:  0 16px 40px -8px rgb(24 25 37 / 0.20), 0 0 0 1px rgb(24 25 37 / 0.05)
```

Type scale (application-adapted, not literal 64px everywhere):

```
--text-display: 2.75rem (44px) / 1.1  / -0.02em   — Landing hero only, and Profile/Project name at its largest
--text-h1:      1.875rem (30px) / 1.2 / -0.015em  — page-level H1
--text-h2:      1.5rem (24px) / 1.25  / -0.012em  — section H2
--text-h3:      1.125rem (18px) / 1.3 / -0.01em   — object title (row/card level)
--text-body:    1rem (16px) / 1.6
--text-small:   0.875rem (14px) / 1.45
--text-micro:   0.75rem (12px) / 1.35             — JetBrains Mono, metadata/dates/stage/status
```

Radius discipline (§4 of the brief, explicit anti-slop rule): panel radius (16px) applies to genuine surfaces — cards that are visually distinct containers (feature cards, media, dialogs). It does **not** apply to every row, list item, or metadata chip. Rows stay hairline-divided, not boxed. Pills are reserved for: filter/status chips, avatars, and true call-to-action buttons where a pill reads as an affordance (Landing, entry-family primary CTAs) — Operate-mode buttons use `--radius-control` (8px), not pill, because dense management UI reads better with a tighter control shape (this deviates from a literal "buttons = pill" rule for exactly the reason §4 of the brief warns about — don't apply one geometry everywhere without purpose).

## 4. Page-family strategy

Eight families per the brief, mapped to existing routes:

| Family | Routes | Composition model |
|---|---|---|
| **A. Identity/Work** | `/dev/[username]`, `/p/[username]/[project-slug]`, `/p/.../[devlog-slug]`, `/studios/[slug]` | Editorial. Bigger anchors (cover media, project identity), asymmetric layout, chronological history rail. `text-display`/`text-h1` weight. No dashboard rows. |
| **B. Operate** | `/dashboard/**`, studio/event/publisher management pages | Compact nested panels. This is where `--surface-inverse` appears selectively (a "Needs attention" panel, e.g.) for hierarchy, not everywhere. Mono metadata for state/dates. |
| **C. Activity** | `/feed`, `/notifications` | Chronological, actor→project→action grammar. Notification rows get typed/priority visual triage (gap identified in audit — not previously built), not a uniform dot. |
| **D. Discovery** | `/explore`, `/search` | Explore: visually rich, mixed card sizing per content type (projects more visual, developers identity-oriented, devlogs editorial). Search: dense single-column, filter-forward, no card decoration. These currently both route through `DiscoveryFrame` and read identically — this family's work is explicitly to break that sameness, per the audit gap. |
| **E. Opportunity** | `/collaborate`, `/playtests/browse`, `/publishers` | Task-oriented, distinct row anatomy per type (role+project+arrangement vs. project+dev-state+participation vs. business context) — currently near-identical row components; differentiate deliberately. |
| **F. Temporal** | `/jams`, `/events` | Time as the primary visual axis — phase/deadline for jams, date/time/location for events. Distinct from the generic list rows used elsewhere. |
| **G. Utilitarian** | `/settings/**` | Deliberately unchanged in spirit — narrow forms, strong labels, minimal motion, keep as-is under new tokens only. |
| **H. Entry** | `/`, `/login`, `/signup`, `/onboarding`, `/reset-password` | Most expressive family — ambient motion allowed, but must preview the real (now-Neuform) product, not a separate visual world. This directly fixes the audit's "landing is a separate AI-template world" finding. |

## 5. Component strategy

Classification per the brief's KEEP/REFINE/REWORK/REMOVE:

- **KEEP** (token-driven already, inherit new values automatically): `Button`, `IconButton`, `Field`, `Input`/`Select`/`Textarea`, `Avatar`, `Tabs`/`TabLinks`, `Menu`, `Popover`, `Toast`, `Skeleton`, `EmptyState`, `ErrorState`.
- **REFINE**: `Badge` (needs a `size`/`tone` combination for notification-priority triage), `MetadataBar` (needs a mono-metadata variant for Operate/Temporal families), `SectionHeader`, `Dialog`/`Drawer` (motion timing only, §7).
- **REWORK**: `DiscoveryFrame` (currently the single cause of Explore/Search/Collaborate/Playtests/Jams/Events/Publishers/Studios looking identical — needs per-family composition slots, not one shared shell), row components (`ProjectRow`, `DevlogRow`, `EventRow`, `JamRow`, `CollaborationListing`, `PlaytestListing`) — differentiate anatomy per family per §4.
- **NEW** (composition gaps the audits flagged as never built): `ProjectIdentityMarker` (already exists per earlier session — verify still present and extend usage into Devlog/Feed/Collaboration/Playtest/Search/Notifications so project identity travels), `ResumptiveWork` (Dashboard's single dominant "pick up where you left off" module).
- **REMOVE**: `components/watermelon/card-split-accordian.tsx` (confirmed unreferenced dead code).

## 6. Motion strategy

Per family, matching the brief's timing bands (100–160ms micro, 140–180ms controls, 180–240ms drawer/dialog, 250–450ms page reveal):

- Entry (Landing/auth): full reveal treatment, staggered hero entrance — already exists (`.reveal-hero*`), keep.
- Identity/Work: small media transitions only (image load fade), no scroll-triggered reveal on every card.
- Discovery: subtle stagger on first paint only, not on every navigation.
- Operate/Utilitarian: minimal to none — state changes (save, toast) get micro-interaction timing, nothing else.
- Activity: none beyond existing toast/notification-arrival cues.
- All motion respects `prefers-reduced-motion` (existing global rule in `globals.css` stays).

## 7. Responsive strategy

Test matrix: 375 / 768 / 1024 / 1440, per family:
- 375: bottom-nav shell (already exists per current shell), sheets over dropdowns, full-width media, reduced decorative surface (no `surface-raised` shadows on mobile rows).
- 768: not a stretched mobile layout — Discovery family gets 2-column where content allows; Identity/Work stays single-column with wider media.
- 1024: Operate family introduces the contextual rail; Identity/Work introduces a secondary info column (About/Links) beside primary content.
- 1440: deliberate width use — Discovery family goes multi-column; Operate stays capped (dense data doesn't benefit from stretching); Identity/Work caps prose width even as the canvas widens.

## 8. Rollout phases (per user's spec, unchanged ordering)

R0 Product truth → R1 Visual foundation (tokens/primitives) → R2 Global shell → R3 Core identity (Profile/Project/Devlog) → R4 Daily product (Dashboard/Feed/Notifications) → R5 Discovery (Explore/Search) → R6 Participation (Collaborate/Playtest) → R7 Ecosystem (Studios/Jams/Events/Publishers) → R8 Forms/Account → R9 Landing → R10 Responsive+motion pass → R11 Final QA.

Each phase stops for report before the next begins, per instruction.

## 9. Elements preserved

- Entire data model, RLS, server actions, auth flow, notification logic, collaboration/playtest lifecycle, ownership rules — untouched, per explicit instruction §30.
- Current shell architecture (rail nav, mobile bottom nav, `DiscoveryFrame` mounting points) — restructured internally (§5) but route/URL structure unchanged.
- Pricing truth (`/pricing` states "Glyph is free," no fake tiers) — already correct, verified in R0 below, no change needed.
- Font stack (Inter + JetBrains Mono) — unchanged, already matches the reference.
- `text-fg`/`Carbon` near-black text — kept over the reference's literal `#111827` (negligible visual delta, avoids unnecessary token churn across every component).

## 10. Elements removed

- Current Lavender/`#918df6` accent role and its subtle/line variants — replaced by the Neuform accent family.
- `--r-table: 24px` — reduced to 16px (over-rounded for dense tables per this brief's own anti-slop caution).
- Any remaining literal hex/gray-* Tailwind utility classes discovered during the primitive audit (R1) — swept to tokens as encountered, same discipline as the prior Visitors pass.
- Fake-metric-shaped UI if found during Dashboard/R4 (none currently confirmed present — Dashboard already uses real work objects per the final audit; verify, don't assume, during R4).

## 11. Technical risks

- **Contrast risk**: the reference's literal slate `#53617A` fails AA for body text on white at 16px (~3.9:1). Mitigated in §3 by using it only as `--text-secondary` (large/short text contexts) and by darkening the true inverse-surface value to `#33394A` for panel backgrounds, verified against AA in R1 verification.
- **Accent-orange overuse risk**: explicit brief warning against "mechanically painting the app orange." Mitigated by restricting `--accent-primary` to one-action-per-view usage, enforced during R1 primitive audit and R11 anti-slop review.
- **DiscoveryFrame rework blast radius**: 22+ route files consume this one component (per phase-L doc). Differentiating per-family composition (§5) must be additive (new slots/variants) not a breaking rewrite, to avoid re-triggering the centering regression phase L already fixed. Flagged for careful diffing in R5.
- **No backend changes anticipated** for this plan. If R3–R7 surface a genuine need (e.g., broader search requiring new indexing, a Studios directory requiring a new query), that stops per §30's explicit backend-change protocol — documented, not silently implemented.

## 12. Verification plan (every phase)

TypeScript (`tsc --noEmit`) → ESLint → `npm run build` → browser check at 375/768/1024/1440 on representative routes for that phase → hover/focus/keyboard nav spot-check → anti-slop self-review (§34 of the brief) before declaring the phase done.

---

## R0 — Product truth: status

**Checked, not changed.** `/pricing` (`app/pricing/page.tsx`) already states "Glyph is free," lists real included features, contains no paid-tier language, no checkout CTA. `/dashboard/billing` (`app/dashboard/(overview)/billing/page.tsx`) already surfaces an honest "checkout isn't available yet" state when a `?plan=` param arrives, and states plainly "Glyph is free... no paid tiers" with no functioning upgrade button. No misleading UI found. This was resolved in an earlier session pass (blueprint R0) and remains correct under the current token system — confirmed live, not just by reading the code (grep confirmed no other `checkout`/`Stripe`/`subscription` UI-facing strings exist outside these two files).

R0 requires no code changes. Proceeding to report.
