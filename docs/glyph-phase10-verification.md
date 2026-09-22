# Glyph Phase 10 — Verification record

## Static checks
`npx tsc --noEmit` clean; `npx eslint app components lib --quiet` zero errors; `npm run build` succeeds (needs Google Fonts network access) with `/settings`, `/settings/{profile,account,privacy,notifications,danger}` in the route list.

## SQL (rolled-back transactions, real schema, role impersonation)
Notification preferences: insert own ok / other's blocked; other user reads 0, updates 0 rows; category off drops a client-inserted follow notification and a trigger-created studio notification; on delivers. Block (either way) and mute of the actor drop client-inserted notifications. Notifications: recipient marks read; rewriting `type` or `recipient_id` → `permission denied`; another user's rows → 0 rows read / 0 updated; anon reads 0. Account deletion: see the matrix in `glyph-phase10-settings.md` (D1–D18, N19–N21).
Not tested in SQL: password re-authentication (server action), because there is no second real credential.

## Unit
`lib/notifications/present.ts` executed with Node on 12 fixture rows: merging, plural/singular actor list, deleted-object copy, deep links for comment (`#comments`), reaction, follow, collaboration, studio invitation/removal, publisher contact.

## Browser
Signed out only, dev server, fetch with `redirect:'manual'`: `/settings`, `/settings/{profile,account,privacy,notifications,danger}`, `/notifications` and the non-existent `/settings/nope` all return an opaque redirect; following `/settings/privacy` lands on `/login` (200). `/` and `/explore` return 200. Landing footer has 0 `href="#"` links and 5 real Browse links. Console: one error — dev-only Vercel Analytics `script.debug.js` from `va.vercel-scripts.com` is blocked by the CSP `script-src` (`proxy.ts:68`). On Vercel the production script is served from the app's own origin (`/_vercel/insights/script.js`), which the CSP allows, but this was **not verified**; the privacy page's one-line analytics mention depends on it.
**Not performed — signup requires an email OTP that this environment cannot read; no credential workaround was attempted:** every signed-in settings page, the deletion flow, notification list, preference save, block/mute list, mobile settings, keyboard/Escape behaviour. These are CODE + SQL verified only. No responsive or accessibility measurement of the new settings pages was possible for the same reason; the earlier state-gallery technique was not repeated here.

## Sweep classification
`href="#"` ×7 in landing footer — REAL BUG, fixed (replaced with real routes; social placeholders removed). `lib/email` console stub — INTENTIONAL (dev only, no callers) / DEAD CODE. `todo` variable name in admin client — FALSE POSITIVE.
