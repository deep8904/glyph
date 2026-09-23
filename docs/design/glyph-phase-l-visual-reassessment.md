# Phase L — Visual regression & design reassessment

Comparison method: the entire A–K redesign is an uncommitted working-tree diff against a single base commit (`git diff HEAD`), so "old" and "new" are exact — every file's prior version is `git show HEAD:<path>`, not a reconstruction. Verified live in the browser at 375 / 768 / 1024 / 1440 against real signed-out data (`/dev/deep`, `/p/demo-nova/emberfall-keep`, `/studios/phase1-test-studio`, `/collaborate`, `/publishers`, `/notifications` fixture, `/login`).

## 1. Pages reviewed
`/dev/[username]` (profile), `/p/[username]/[project-slug]` (project), `/p/…/[devlog-slug]` (devlog), `/login` + `/signup`, `/collaborate` (list + detail), `/studios/[slug]`, `/explore`, `/search`, `/playtests/browse` + detail, `/jams` + detail, `/events` + detail, `/publishers` + detail, `/notifications`, `/feed`, plus a mobile pass (375) on profile and project as a control.

## 2. Old vs current, by page
- **Profile**: old = a single centered "glass card" (rounded-[2.5rem], backdrop-blur, plasma background, drop-shadow) containing everything, avatar 80×80 rounded-2xl, `font-light tracking-tighter` display type. New = flat sections in the app shell (`ProfileHeader`, `Section`, `MetadataBar`, `ProjectRow`/`DevlogRow`), `text-display` (32/40, 600) name, hairline dividers, `mx-auto max-w-3xl`. The glass-card treatment is the AI-slop pattern this whole redesign exists to remove (explicitly banned again in this phase's own instructions) — not a bar to preserve. Title weight (32px/600) is comparable to old's visual size; **actually centered correctly** (verified via `getBoundingClientRect`: content 456–1224 inside a 240–1440 main, i.e. true center).
- **Project / Devlog**: same pattern as profile — already `mx-auto`. Devlog article width (`max-w-2xl`, 672px) is a defensible editorial reading width, comparable in effective line length to the old single-column card.
- **Login / Signup**: old = same plasma-card language. New = `FocusedShell`, already centered, comparable visual weight (badge, `text-display` heading, stacked OAuth + email form). No regression.
- **Collaborate, Studios, Explore, Search, Playtests, Jams, Events, Publishers (list and detail)** — all built on the shared `DiscoveryFrame`: old versions of these pages did not exist in the current form (Collaborate/Playtests/Studios/Jams/Events/Publishers are Phase E/F work, replacing an earlier, simpler or absent version), so there is no true "old" screenshot for most of them — the comparison here is against the profile/project pages that got this right, and against the base Shell/`<main>` geometry.
- **Notifications, Feed** — old versions were plain lists on the pre-shell layout; new versions are `Section`/row-based lists inside the shell, same content, same information.

## 3. Regressions found

### R1 — Discovery/object pages are not centered at ≥1024px (real, confirmed)
Directly measured, signed-out, live: on `/collaborate` and `/studios/phase1-test-studio` at 1440px, `<main>` spans 240–1440 (1200px available), but the page content (`max-w-3xl`) renders at 272–1040 — flush against `<main>`'s own left padding, not centered in the 1200px available width. The identical container one level up on `/dev/deep` (profile) *is* centered (456–1224) because that page's own wrapper already carries `mx-auto`. So this is an inconsistency, not a deliberate choice: one family of pages got the centering, the sibling family didn't.

**Effect at 1024–1440:** roughly half the available canvas — everything right of the 768px column — sits empty with nothing in it, on every Explore/Collaborate/Studios/Playtests/Jams/Events/Publishers/Search page (list and detail) and on Notifications and Feed. Combined with the shared `Section`/`MetadataBar`/row markup, this is what makes an object page (a studio), a browse list (Collaborate), and a settings-adjacent page (Notifications) read as visually the same shape from a glance — "pages indistinguishable," per the brief's specific concern. It is worse than the old plasma-card version not because the new flat style is wrong (it isn't — that's the whole point of Phases A–K), but because the *old* version at least used the full viewport width intentionally (decorative side panels either side of a centered card); the *new* version has a correct, restrained content width but forgot to center it, so the imbalance reads as unfinished rather than as a considered edge-to-edge layout.

### R2 — `NotificationsView` and Feed have the same missing `mx-auto`
Same root cause as R1, different call site (`components/notifications/NotificationsView.tsx`, `app/feed/page.tsx`), not routed through `DiscoveryFrame`.

### Not a regression (checked, ruled out)
- **Typography scale** — object-page `h1`s are `text-display` (32/40/600), identical in weight to the old design's heading; only the surrounding chrome changed. No fix needed.
- **Mobile composition (375)** — checked profile and project: clean single-column stack, avatar → name → facts → sections, no overflow, good rhythm. No regression.
- **Button/control flatness** (no shadow-lg glow, no hover-lift, no gradient) — this is Phase A's own anti-slop rule working as intended, re-confirmed as correct by this same phase's brief ("do not add gradients… decorative effects"). Not a regression; reverting it would violate this phase's own constraints.
- **Section/MetadataBar reuse across object types** — the brief warns against pages becoming "visually indistinguishable," but reuse of a hairline-section primitive across a studio, a jam, and an event is the intended coherent system (per the brief's own "not maximum uniformity, but a coherent visual language" — the two are compatible: each object still leads with its own `ObjectHeader`/`ProfileHeader`, its own facts, its own actions; only the section *scaffolding* is shared, which is correct reuse, not genericism). Once R1 is fixed, the true differentiator (each page's actual content and header) gets the visual room it needs; today it's the empty-space imbalance, not the shared primitives, doing the damage.

## 4. Root cause
Layout-level, single point each: `components/discovery/DiscoveryFrame.tsx` and the two independent call sites (`NotificationsView`, Feed) apply a max-width without `mx-auto`, while the pages that predate `DiscoveryFrame` (profile, project, devlog, `FocusedShell` pages) already do it correctly. Not a token problem, not a primitive problem, not a page-content problem.

## 5. Proposed fix
Add `mx-auto` to the one container in `DiscoveryFrame` and to the two independent call sites. Three files, one class each. No component API changes, no new primitive, no token change, no visual-language change — purely centers existing content in existing available space.

Left alone, deliberately: Settings (has a persistent side nav — a form-with-sidebar layout is correctly left-set, not a lone reading column) and Dashboard/edit-form pages (Operate mode; left-aligned near navigation is the conventional, correct pattern there, same reasoning Settings already uses).

## 6. Affected shared components
`components/discovery/DiscoveryFrame.tsx` (Explore, Search, Collaborate list+detail, Playtests browse+detail, Jams hub+detail+results+submit+vote, Events list+city+detail, Publishers list+detail, Studios detail — 22 route files consume it), `components/notifications/NotificationsView.tsx`, `app/feed/page.tsx`.

## 7. Risk
Very low. `mx-auto` on a `max-w-*` block only repositions it horizontally; it cannot cause overflow, cannot change any child's width, cannot affect mobile (where the column already fills the viewport and centering is a no-op), cannot affect any interactive element's position relative to its own container. The one thing to verify: pages that put something *outside* that max-w div but still expect shared left alignment with it (e.g. a "← Back" link above the card) — checked, in every case the back-link is inside the same `children(viewer)` render prop, so it moves with the content, not against it.

## 8. Pages requiring browser verification
Every `DiscoveryFrame` consumer at 1024 and 1440 (spot-check a representative subset, not all 22, per the low blast radius of a one-line layout fix): `/explore`, `/collaborate`, `/collaborate/[id]`, `/studios/[slug]`, `/jams`, `/publishers`, `/events`. `/notifications` and `/feed` at 1024/1440 (fixture/signed-in-limited as usual). All of the above plus profile/project at 375 to confirm mobile is unaffected (it should be, since centering is a no-op at full-bleed mobile width).

---

## Verification performed
- `tsc --noEmit`, `eslint app components lib --quiet`, `npm run build` — all clean.
- Live, signed-out, measured via `getBoundingClientRect`: `/studios/phase1-test-studio` at 1440 — content now spans 456–1224 inside a 240–1440 `<main>`, mathematically centered (was 272–1040, flush left).
- Visual re-check at 1440: `/studios/phase1-test-studio`, `/collaborate`, `/publishers` — all now balanced, no more dead right-hand void; each object's identity (studio header, opportunity rows) reads as the page's actual subject instead of a strip of text beside empty canvas.
- 1024 (`/studios/phase1-test-studio`) and 768 (`/collaborate`): no horizontal overflow (`scrollWidth === innerWidth`), content fills the narrower available width naturally — centering has no visible effect there since the column is close to the full available width already.
- 375 (`/publishers`): no overflow, layout identical to before the fix — centering a full-bleed mobile column is a no-op, confirmed.
