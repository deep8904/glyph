# Glyph Architecture

## Overview

Glyph is a Next.js 16 App Router application. Every page is a React Server Component by default; client interactivity is added with `'use client'` boundaries. All mutations use Server Actions (`'use server'`) — this provides automatic CSRF protection and ensures sensitive logic never executes client-side.

## Request Flow

```
Browser
  ↓ HTTP
proxy.ts (Next.js middleware)
  → auth session refresh via Supabase SSR
  → redirect unauthenticated requests to /login
  → attach security headers (CSP, X-Frame-Options, etc.)
  ↓
Next.js App Router
  → Server Component renders, calls createClient() → Supabase
  → Client Component hydrates, uses createBrowserClient()
  ↓
Supabase (PostgreSQL)
  → RLS enforces every query at the DB level
```

## Auth Pattern

Supabase Auth with `@supabase/ssr`:
- `createServerClient()` in server components and server actions (reads cookies from request)
- `createBrowserClient()` in client components (reads cookies from browser)
- `proxy.ts` refreshes the session on every request, preventing stale tokens
- After OAuth or magic link: `app/auth/callback/route.ts` exchanges the code for a session, then checks `profiles.is_onboarded` and redirects to `/onboarding` or `/dashboard`

## Database

16 migrations, applied in order from `supabase/migrations/`:

| Migration | Tables |
|---|---|
| 001 | profiles |
| 002 | projects |
| 003 | devlog_posts |
| 004 | comments |
| 005 | follows, notifications |
| 006 | reactions |
| 007 | rate_limit (in-memory, not DB) |
| 008 | playtest_requests, playtest_sessions, playtest_feedback |
| 009 | events, event_rsvps, event_demo_slots |
| 010 | collaboration_posts, collaboration_applications |
| 011 | game_jams, jam_entries, jam_votes |
| 012 | studios, studio_members, studio_projects |
| 013 | subscriptions, featured_listings |
| 014 | publisher_accounts, publisher_shortlists, publisher_contacts |
| 015 | admin_users, moderation_queue, audit_log, feature_flags, security_events |
| 016 | user_blocks, user_mutes, user_bans |

All tables have Row Level Security enabled. The pattern:
- Public tables (`profiles`, `projects`, `devlog_posts`, `events`, etc.): `SELECT` is public, write is owner-only
- Private tables (`subscriptions`, `publisher_*`): owner-only for all operations
- Admin tables (`moderation_queue`, `audit_log`, `feature_flags`, `user_bans`): `is_admin()` function gate

## Server Actions

All mutations are Server Actions in `app/actions/`. They follow this pattern:

```ts
'use server'
export async function doSomething(input): Promise<{ error: string } | { success: true }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')  // or return { error: '...' }

    // 1. Validate input (length, format, enum)
    // 2. Strip dangerous unicode
    // 3. Authorize (RLS + explicit ownership check)
    // 4. Execute mutation
    // 5. Return result
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}
```

CSRF protection is implicit — server actions only accept POST from the same origin.

## Security Headers

Set by `proxy.ts` on every response:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy`: allowlist of known origins

## Email

`lib/email/index.ts` — thin wrapper around the Resend API using `fetch`. No native library required. Templates are hand-authored HTML in `lib/email/templates/`. Falls back to `console.log` in development when `RESEND_API_KEY` is absent.

## Analytics

`lib/analytics.ts` — supports Plausible and Umami without cookies. Configure via `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` or `NEXT_PUBLIC_UMAMI_WEBSITE_ID`. The script is injected in the root layout with `strategy="afterInteractive"`.

## Rate Limiting

`lib/rate-limit.ts` — in-memory Map-based rate limiter, keyed by IP. Sufficient for MVP. For production scale, replace with Upstash Redis.

## i18n

Message files in `messages/en.json` and `messages/es.json`. Ready for `next-intl` integration — `npm install next-intl` and wrap the root layout.

## Performance

- All pages are React Server Components (no client JS unless needed)
- Images: use `next/image` with appropriate `sizes` props
- Fonts: `next/font/google` with `display: swap` built in
- Static pages (`/login`, `/signup`, `/pricing`) are pre-rendered
- Dynamic pages use `force-dynamic` only when auth state is required

## Deployment

`vercel.json` configures the Vercel deployment. See `RUNBOOK.md` for deployment procedures.
