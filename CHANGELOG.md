# Changelog

## V2 — Feature 1: Developer Profile + Onboarding

### Database (Supabase, applied to project `glyph`)
- `supabase/migrations/001_profiles.sql` — `profiles` table: `@username` (unique, format-checked), identity fields (role, engine, experience, collaboration status), social links, `is_onboarded`, RLS (public read, owner write), `updated_at` trigger, username index.
- `supabase/migrations/002_projects.sql` — `projects` table: owner-linked, title/desc/engine/genre/stage/cover, `is_primary`, RLS, owner index.

### Features
- **Onboarding wizard** (`app/onboarding/page.tsx`) — 4 steps (Identity → About → Project → Socials), progress bar, debounced real-time username availability, skippable optional steps, back preserves data, writes `profiles` (+ optional primary `projects` row), sets `is_onboarded`, redirects to `/dashboard`. Guards already-onboarded users back to the dashboard.
- **Public profile** (`app/dev/[username]/page.tsx`) — server-rendered; `notFound()` on miss; avatar/initials, identity badges, social links (shown only when set), current-project card or empty state, "member since".
- **Dashboard** (`app/dashboard/page.tsx` + `components/dashboard/DashboardClient.tsx`) — now server-fetches the profile, redirects to `/onboarding` if not onboarded, shows "View your public profile", and a "Complete your profile" prompt listing missing fields.
- **Auth-aware landing** — `app/page.tsx` is now a server component; header shows **Dashboard →** when authenticated (landing UI moved to `components/landing/Landing.tsx`).

### Components / API / types
- `components/ui/Badge.tsx`, `components/UsernameInput.tsx`, `components/ProfileCard.tsx`.
- `app/api/profile/check-username/route.ts` — format-validates + checks availability.
- `lib/supabase/types.ts` — `Profile`/`Project` types + shared option lists (`ROLES`, `ENGINES`, `EXPERIENCE_LEVELS`, `PROJECT_STAGES`, `COLLAB_STATUS`) and `labelFor()`.

## V1 — hardening
- `app/auth/callback/route.ts` — routes first-time users to `/onboarding` (checks `profiles.is_onboarded`).
- `proxy.ts` — protects `/onboarding` in addition to `/dashboard` (Next 16 uses `proxy.ts`, not `middleware.ts`).
- `components/auth/AuthForm.tsx` — Google OAuth now sends `access_type: offline` + `prompt: consent`.
- `.env.example` added (documents `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, incl. the 2025 `sb_publishable_…` format).
- Docs: `AUDIT.md`, `SETUP.md`, `V2_RESEARCH_REPORT.md`, `NEXT_FEATURE.md`.

### Earlier this cycle
- Fixed Vercel `ERESOLVE` by removing unused React-18-only `@studio-freight/react-lenis`; added `.npmrc` `legacy-peer-deps=true`.
- Added `@vercel/analytics` to the root layout.
