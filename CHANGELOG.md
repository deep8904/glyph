# Changelog

All notable changes to Glyph are documented here.

## [V7] — 2026-06-14 — Production Hardening

### Added
- `/api/health` endpoint: database + env checks, returns 503 on failure
- Security headers via `proxy.ts`: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Extended `proxy.ts` protected routes: `/admin`, `/dashboard/publisher`, `/dashboard/studios`, `/dashboard/billing`
- `vercel.json`: framework config + 5-minute health check cron
- `README.md`: complete project overview, stack, structure, version checklist
- `ARCHITECTURE.md`: request flow, auth pattern, DB schema map, security header docs
- `RUNBOOK.md`: deploy, rollback, env vars, migrations, incident response, Stripe webhook setup
- `THREAT_MODEL.md`: OWASP A01–A10 mitigations, attack surface, known acceptable risks
- `CONTRIBUTING.md`: code conventions, PR checklist, design system rules

## [V6] — 2026-06-14 — Email, Analytics, Moderation, Accessibility

### Added
- Migration 016: `user_blocks`, `user_mutes`, `user_bans` tables
- Email infrastructure (`lib/email/`): Resend via fetch, dev stub, 4 HTML templates
- Server actions: `blockUser`, `unblockUser`, `muteUser`, `unmuteUser`, `banUser`, `unbanUser`
- `BlockMuteButtons` client component with inline report form
- `lib/analytics.ts`: Plausible + Umami integration (cookie-free), `trackEvent()` helper
- Analytics script in root layout via `next/script` `afterInteractive`
- Skip-to-content link in root layout
- `globals.css`: `prefers-reduced-motion`, WCAG AA `:focus-visible`, 44px mobile touch targets
- i18n: `messages/en.json` + `messages/es.json` (full UI string coverage)

## [V5] — 2026-06-14 — Studios, Payments, Publisher Tools, Admin

### Added
- Migrations 012–015: studios, subscriptions/featured_listings, publisher tools, admin system
- Studio pages: `/studios/[slug]`, `/dashboard/studios/new`, `/dashboard/studios/[slug]`
- Pricing page: 3-tier Free/Pro/Team
- Billing page: subscription status
- Publisher flow: directory, dashboard, registration
- Admin dashboard: 7 sections with live counters
- Stripe webhook: `/api/webhooks/stripe`
- Server actions: studios, publisher, admin (all mutations write audit_log)
- `EmptyState` icon prop updated to `React.ReactNode`

## [V4] — 2026-06-13 — Playtesting, Events, Collaboration, Game Jams

### Added
- Migrations 008–011: playtests, events, collaboration, game jams
- 20 new routes across 4 feature areas
- `PageShell`, `PanelHeader`, `PanelBody`, `EmptyState` shared layout components
- iCal feed: RFC 5545 VCALENDAR export for events
- Anti-abuse limits: max 5 active playtest requests, max 3 concurrent tester sessions
- Admin approval flow for game jams

## [V3] — 2026-06-12 — Community Features

### Added
- Migrations 005–007: follows, notifications, reactions
- Follow/unfollow with follower counts
- Notification system with real-time-ready structure
- Reaction types: like, helpful, inspiring, question
- `SECURITY.md`: OWASP A01–A10 inventory

## [V2] — 2026-06-11 — Developer Profiles, Projects, Devlogs

### Added
- Migrations 001–004: profiles, projects, devlog_posts, comments
- 4-step onboarding wizard
- Developer profile pages at `/dev/[username]`
- Project pages at `/p/[username]/[slug]`
- Devlog with Markdown rendering and comment threads
- Username availability API

## [V1] — 2026-06-09 — Auth Baseline

### Added
- Next.js 16 App Router project
- Supabase Auth: magic link + GitHub/Google OAuth
- `proxy.ts` middleware for route protection
- Plasma background design system
- Waitlist landing page
