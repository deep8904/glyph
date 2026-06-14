# V2 Completion Checklist

Audited 2026-06-14. All items verified by reading source code and running `npm run build` + `npx tsc --noEmit`.

## Authentication

- [x] GitHub OAuth login + signup — `handleOAuth('github')` in `components/auth/AuthForm.tsx` with `redirectTo: origin + '/auth/callback'`
- [x] Google OAuth login + signup — same handler, adds `queryParams: { access_type: 'offline', prompt: 'consent' }`
- [x] Email + password login — `signInWithPassword` with generic `'Invalid email or password.'` error (never reveals which field is wrong)
- [x] Email + password signup with OTP verification — `signUp` → OTP verify screen → `verifyOtp({ type: 'signup' })` → sign out → `/login?signup=success`; resend with 45s cooldown; expired/wrong OTP shows inline error
- [x] Sign out — `supabase.auth.signOut()` → `router.push('/')` in `DashboardClient.tsx`
- [x] `proxy.ts` (Next.js 16 middleware) — protects `/dashboard` and `/onboarding` (unauthenticated → `/login`); bounces authenticated users away from `/login` and `/signup`; session cookies refreshed via `setAll` callback. Note: `/settings` not yet guarded — settings pages are a V3 feature.
- [x] `app/auth/callback/route.ts` — exchanges code for session via `exchangeCodeForSession`; checks `profiles.is_onboarded`; first-time users → `/onboarding`, returning users → `/dashboard`

## Developer Profile + Onboarding

- [x] `profiles` table — exists in Supabase (`supabase/migrations/001_profiles.sql`); RLS enabled with public select + self-only insert/update; username format constraint; `updated_at` trigger; username index
- [x] `projects` table — exists (`supabase/migrations/002_projects.sql`); RLS enabled with public select + owner all; `owner_id` index; `updated_at` trigger
- [x] 4-step onboarding wizard at `/onboarding` — Step 1: username + display name; Step 2: bio + location + role + engine + experience; Step 3: project (skippable); Step 4: social links (skippable). Progress bar, back/next, submit inserts both `profiles` and `projects` rows
- [x] Real-time debounced username availability check — `components/UsernameInput.tsx` debounces 400ms, hits `/api/profile/check-username`, shows green check / red X / loading spinner; derives display state during render (no synchronous `setState` in effect body)
- [x] Public profile at `/dev/[username]` — server component; `notFound()` on missing username; renders avatar (initials fallback), display name, `@username`, location, collab status, bio, role/engine/experience badges, social links, primary project card or dashed empty state, member-since footer
- [x] Dashboard redirects to `/onboarding` if not onboarded — `app/dashboard/page.tsx` checks `profile.is_onboarded` and calls `redirect('/onboarding')`; `app/dashboard/layout.tsx` double-guards auth

## Responsiveness

- [x] Landing page — responsive at 375px / 768px / 1024px / 1280px; no horizontal scroll; `text-4xl sm:text-6xl lg:text-[80px]` hero heading; `grid-cols-2 lg:grid-cols-4` stats; `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` bento
- [x] Mobile hamburger — in-flow dropdown (not `absolute`), pushes hero down; body scroll-lock via `useEffect`; links close menu on click; hamburger↔X icon swap
- [x] Auth pages — `w-full max-w-[480px]` card centered on desktop, full-width on mobile; `px-6 py-8 sm:px-8 sm:py-10 md:px-10 md:py-12` padding
- [x] Dashboard sidebar drawer — fixed-position slide-in, rendered outside the `backdrop-blur` panel (avoids CSS `filter` containing-block trap); `bg-black/50` overlay; body scroll-lock; `lg:flex` sidebar on desktop
- [x] Onboarding wizard — `max-w-[560px]` centered card; `flex-col-reverse sm:flex-row` nav buttons; Back button hidden on step 1; `grid-cols-1 sm:grid-cols-2` for role/engine selects

## Build & Type Safety

- [x] `npx tsc --noEmit` — 0 errors
- [x] `npm run build` — success; all 11 routes compile; no warnings
- [x] No `// @ts-ignore`, no `// @ts-nocheck`, no untyped `any` — confirmed via grep
- [x] No `dangerouslySetInnerHTML` — confirmed via grep

## Pending Commit

Responsive design pass + hamburger fix from previous session are locally modified but uncommitted. Commit pushed immediately after this checklist.
