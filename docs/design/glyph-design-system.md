# Glyph design system — as implemented (Phase A)

Source of truth: `app/globals.css` (tokens), `components/ui/*` (primitives), `/design` (living reference, development only — `notFound()` in production). Decisions and reasons: `glyph-design-decisions.md`. This file describes what exists now.

## Tokens
Two tiers. **Primitives** are Tailwind's palette and 4px spacing scale (unchanged). **Semantic tokens** are CSS variables on `:root` in `globals.css`, exposed to Tailwind through `@theme inline` under *new* names only (Tailwind's own `gray-*`, `rounded-md`, `text-sm` etc. are not overridden, so unmigrated pages render as before).

| Category (spec name) | CSS var → utility | Value |
|---|---|---|
| background | `--canvas` → `bg-canvas` | `#f9fafb` |
| surface | `--surface` → `bg-surface`; `--surface-muted`; `--surface-elevated` | `#fff`; `#f3f4f6`; `#fff` |
| border / border-strong | `--line`, `--line-subtle`, `--line-strong` → `border-line*` | `#e5e7eb`, `#f3f4f6`, `#d1d5db` |
| text-primary / secondary / muted | `--fg`, `--fg-secondary`, `--fg-muted` → `text-fg*` | `#111827`, `#4b5563`, `#6b7280` (≥4.5:1 on surface and canvas) |
| accent | `--accent`, `--accent-hover`, `--accent-subtle`, `--accent-line`, `--fg-on-accent` | `#4f46e5`, `#4338ca`, `#eef2ff`, `#c7d2fe`, `#fff` |
| link | `--link` → `text-link` | `#4338ca` |
| focus-ring | `--focus-ring` (global `:focus-visible`, `outline-focus`) | `#4f46e5` |
| success / warning / danger / info | `--{tone}`, `--{tone}-subtle`, `--{tone}-line` (+ `--danger-hover`) | green-700 / amber-700 / red-700 / blue-700 families |
| radius | `--r-badge/control/media/panel` → `rounded-badge/control/media/panel` | 4 / 6 / 8 / 12 px; `rounded-full` for avatars only |
| elevation | `--elev-popover`, `--elev-dialog` → `shadow-popover`, `shadow-dialog` | menus/popovers/toasts; dialogs/drawers. No other shadows. |
| motion | `ui-fade-in`, `ui-pop-in`, `ui-slide-in-*`, `ui-toast-in` (150–200 ms, keyed on Radix `data-state`) | global `prefers-reduced-motion` rule shortens all to ~0 |

Dark mode: not built (see decisions §4). Components use only semantic tokens, so a remap is possible later.

## Typography
Inter (variable, `next/font/google`, self-hosted) + JetBrains Mono. `font-display` is a legacy alias for Inter. Scale utilities: `text-display` 32/40, `text-h1` 24/32, `text-h2` 20/28, `text-h3` 16/24, `text-body` 15/24, `text-small` 13/20, `text-micro` 12/16 (letter-spacing tightened only for display/h1/h2). Weights 400/500/600 (`font-normal/medium/semibold`). Mono only for technical values. Nothing new below 12px; **180 legacy `text-[9–11px]` uses remain** until each surface is migrated.

## Spacing
Tailwind scale, restricted to 4/8/12/16/20/24/32/40/48/64 (`1,2,3,4,5,6,8,10,12,16`). Control heights: 36/40 px pointer; 44 px coarse pointer (`pointer-coarse:`). Arbitrary values are not used in the new primitives.

## Icons
`lucide-react`, `strokeWidth={1.75}`, sizes `size-3.5/4/5`. Decorative icons `aria-hidden`; icon-only controls use `IconButton` (required `label`).

## Global CSS changes in Phase A
- Fonts swapped: Geist + Space Grotesk → Inter; JetBrains Mono kept. (Affects every page's text metrics.)
- `:focus-visible` no longer forces `border-radius: 4px` (it flipped pill/6px controls to 4px on focus); outline color now `var(--focus-ring)`.
- Left untouched on purpose: `body` dark backdrop, `.bg-plasma`, `.bg-grain`, `.panel-shadow`, `.reveal*`, the ≤768px blanket `min-height:44px` rule. They are removed/replaced when the surfaces that use them are migrated (Phase B/C/H).

## Compatibility
`Badge` keeps its legacy `variant` names (`default/secondary/solid/success/muted`) mapped to tones so its 10 existing callers keep working; its look changed (no uppercase/pill/10px). `StatusLabel` is now a thin wrapper over `Badge`. `Toaster` is mounted in the root layout.

## Phase B changes
- Plasma/grain/glass backdrops and `panel-shadow` panels are removed from every route except the landing page; the shell uses `bg-canvas` + hairline borders only.
- `#main-content` moved from a root wrapper to each frame's `<main>`; the root skip link targets it. Landing, `not-found`, and error pages carry the id on their outer element.
- `AuthForm` no longer carries the dead `reveal active` classes (they left the sign-in/sign-up form at `opacity: 0` since commit 5f58dd8 — see Phase B report).
