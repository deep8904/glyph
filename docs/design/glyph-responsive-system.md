# Glyph responsive system

Status: Phase A defined primitives; **Phase B implemented the responsive shell** (`glyph-shell-architecture.md`). Per-route hardening is Phase H. Signed-in routes were verified only through the `/design/shell` fixture (email-OTP limitation).

## Breakpoints (Tailwind defaults, unchanged)
`sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280. Tiers: **mobile** <640 (single column, top utility bar + bottom bar in Phase B), **tablet** 640–1023 (compact rail, no context rail), **desktop** ≥1024 (rail + content + optional context rail).

## Touch targets
House rule 44×44 px. Primitives: pointer 36/40 px, `pointer-coarse:` 44 px (Button, IconButton, Input, Select, Menu items, Tabs, Dialog close). Legacy blanket CSS rule (`≤768px: button,a,[role=button]{min-height:44px}`) remains until Phase H replaces it with component-level sizing.

## Overlays
Dialog `side="center"` becomes a `calc(100vw-2rem)` panel on narrow screens; `side="bottom"` is the mobile sheet (max 85dvh, scrolls inside); `side="right|left"` is the drawer (`calc(100vw-3rem)`, max 24rem). Toasts sit bottom-right on desktop and above the future bottom bar (`max-md:bottom-20`).

## Verified in Phase A (browser, `/design`)
375 px: no horizontal overflow (`scrollWidth` 375), 0 interactive elements shorter than 44 px, bottom sheet renders and scrolls. Desktop (≈925 px pane): renders, no overflow. **Not verified:** tablet width, real-device touch, any product route signed in.

## Phase B verification (browser, dev server)
- **375px** (signed-in fixture and signed-out public pages): no horizontal overflow (`scrollWidth` 375); bottom bar 5/4 items each 58×75 px; last content element clears the bar by 21px; Create/Me sheets open (focus inside, Escape returns focus to the trigger); rail hidden. On `/dev/*`, `/p/*`, devlog, login: no element under 44px except in-content items listed in the Phase B report.
- **768px** (fixture): compact rail (96px after fixing a 80px rail that clipped "Notifications"), no bottom bar, top-bar search field, no overflow.
- **~925px pane and 1280px**: full rail 240px, sticky, Create/Me menus position inside the viewport.
- Not verified: 1024/1440 visually, real devices, landscape phones, iOS safe-area inset (CSS `env()` only).
