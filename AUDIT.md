# Glyph — Codebase Audit

Snapshot taken at the start of the V1-hardening + V2-Feature-1 work. Stack: **Next.js 16 (App Router)**, React 19, **Tailwind v4**, TypeScript, Supabase (`@supabase/ssr`).

## Stack reality vs. common assumptions
- **Next.js 16**, so request middleware is **`proxy.ts`** at the project root (the `middleware` convention was renamed). A `middleware.ts` file would **not run**.
- **Tailwind v4** — configured via `@theme` in `app/globals.css`; there is **no `tailwind.config.ts`**. Design tokens: `.bg-plasma`, `.panel-shadow`, `.reveal`, `.delay-*`.
- Supabase publishable key env var is **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** (not `..._ANON_KEY`).

## What's built and working
- Landing page (`app/page.tsx` → `components/landing/Landing.tsx`) — plasma + glass-panel design system.
- Auth (`app/(auth)/login`, `/signup` → `components/auth/AuthForm.tsx`): GitHub + Google OAuth, magic link, 6-digit OTP verify.
- `app/auth/callback/route.ts` — code exchange.
- `lib/supabase/{client,server}.ts` — browser + server clients.
- `proxy.ts` — session refresh + route protection.
- Dashboard shell with sidebar + empty states.
- `@vercel/analytics` wired in root layout. Vercel build green (fixed an `ERESOLVE` from an unused React-18-only `react-lenis`).

## What was scaffolded but not implemented (now built in this pass)
- **Developer profile + onboarding** — did not exist. Now: `profiles`/`projects` tables, 4-step onboarding wizard, public `/dev/[username]` page, dashboard profile state, callback profile routing.

## What was broken / gaps (now fixed)
- Auth callback didn't route first-time users to onboarding → now checks `profiles.is_onboarded`.
- `proxy.ts` only protected `/dashboard` → now also `/onboarding`.
- Google OAuth lacked `access_type/prompt` query params → added.
- No `.env.example` → added.

## What's still missing (future features)
- Project pages & devlogs, playtesting, events/RSVP, collaboration board, community feed, avatar upload (Supabase Storage), full-text search/discovery.

## Environment variables
Required (in `.env.local`, see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (new `sb_publishable_…` format or legacy anon JWT)

Linked Supabase project: **`glyph`** (`ref adiovtzggkpzrfqmevyx`). Tables: `waitlist`, `profiles`, `projects` (all RLS-enabled).

## Build health
- `npx tsc --noEmit` → 0 errors. `npm run build` → success. ESLint → clean (generated/worktree dirs ignored).
