# Glyph UI dependencies

Redesign is **library-first**: proven primitives underneath, Glyph presentation on top. The stack below was already present and is sufficient for the redesign — no redundant additions.

## Already present, used by the redesign

| Package | Purpose | Where | Why not custom |
|---|---|---|---|
| `radix-ui` | Accessible primitives (dialog, popover, menu, tabs, tooltip, slot) | `components/ui/*`, shell | Focus trap, keyboard, ARIA solved + audited |
| `framer-motion` / `motion` | Presence, shared-layout, spring | editorial transitions, feed insert, cover→detail | Correct interruptible motion is hard to hand-roll |
| `gsap` | Justified landing choreography **only** | landing (scoped) | Not shipped to app routes |
| `class-variance-authority` + `tailwind-merge` + `clsx` | Variant + class composition | `Button`, primitives | Standard, tiny |
| `lucide-react` | Icon system (one set, consistent stroke) | app-wide | One coherent set; no invented icons |
| `react-hook-form` + `zod` + `@hookform/resolvers` | Forms + validation | settings, create flows, auth | Accessible, typed, battle-tested |
| `@tanstack/react-query` | Server-state caching | data fetching | Avoids ad-hoc fetch state |
| `zustand` | Small client state | shell/command palette | Minimal, no boilerplate |
| `@supabase/ssr` + `supabase-js` | Data + auth (unchanged) | server/actions | Backend authority; not modified for UI |
| `@react-three/fiber` + `drei` + `three` | Optional 3D **only where justified** | reserved | Not used for decorative filler |
| `marked` / `react-markdown` + `rehype-sanitize` + `isomorphic-dompurify` | Devlog long-form rendering (sanitized) | devlog | XSS-safe markdown |
| `@tailwindcss/typography` | Prose base for devlog reading | `.prose-glyph` | Mapped to tokens |

## Added this redesign

_None._ Foundation (R1) needed no new dependency.

## Policy

Introduce a dependency only where it materially improves accessibility, maintainability, interaction quality, performance, or execution — and never a second library that solves an existing one's job. Document any addition here with package · purpose · where · why-not-custom.
