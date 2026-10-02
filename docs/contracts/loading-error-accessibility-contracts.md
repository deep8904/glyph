# Loading, error & accessibility contracts

## Loading / error boundaries
- Every list surface has a `loading.tsx`; every dynamic detail route that can 404 keeps `notFound()` returning a real 404 (no ancestor `loading.tsx` — see routes-and-visibility.md). `app/error.tsx`, `app/dashboard/error.tsx`, `app/not-found.tsx` exist.
- Loading shows a stable skeleton/progress promptly (no pulsing glare); a skeleton must not imply hierarchy the loaded data may not have (e.g. no featured span when the first item may be coverless).

## Accessibility contract (target WCAG 2.2 AA)
- Exactly one working skip link per surface; visible focus ring on every interactive element; `aria-current` on active nav.
- Meaning never by color alone (pair status with icon/label). Text contrast ≥ AA — **do not** use `text-gray-400`-class (~2.5:1) for meaningful metadata (legacy defect to avoid); avoid sub-12px text for meaningful content.
- Touch targets ≥ 44px on mobile (inline text links in sentences excepted).
- External links carry explicit "opens in a new tab" text; content images have descriptive `alt`, decorative images empty `alt`.
- Menus/dialogs/comboboxes: focus trap, Escape, focus return to trigger; reduced-motion honored (`prefers-reduced-motion` → opacity/instant). Prefer accessible primitives (Radix/React Aria) over hand-rolled — legacy app hand-rolled these (0 Radix, no focus-trap util); the new system uses Radix.
