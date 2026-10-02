# Verification debt

Open items a future pass must actually verify (email-OTP blocks signed-in E2E in this environment; prior phases substituted now-deleted dev fixtures + direct SQL/RLS checks).

- **Signed-in E2E not driven:** form submits, success/failure toasts, and destructive-action dialogs against a live session were never run end-to-end. Verify with a real authenticated session.
- **Suggested-developers rule:** confirm the new dashboard excludes blocked/muted and requires public work (legacy bug).
- **Dark mode:** legacy audit said dark mode was not shipped; the new Glyph system ships Bone/Graphite theme-dual. Verify no contrast/state regressions across both themes on every migrated surface.
- **Contrast/typography debt:** legacy had ~180 sub-12px runs and `text-gray-400` (~2.5:1) metadata in dozens of places — verify eliminated on each migrated surface.
- **Dev-only fixtures deleted:** `/design/*` (incl `_proto`) previously stood in for signed-in chrome states real auth can't reach; those verification paths no longer exist. Re-establish coverage with real auth or new fixtures when needed.
