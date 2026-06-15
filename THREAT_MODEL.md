# Glyph Threat Model

## Scope

This document covers the Glyph web application, its API surface, database, and third-party integrations.

## Assets

| Asset | Sensitivity | Impact if Compromised |
|---|---|---|
| User credentials | Critical | Account takeover |
| Personal data (email, bio, location) | High | Privacy breach, GDPR violation |
| Studio/publisher data | High | Business exposure |
| Payment data | Critical | Financial fraud (mitigated: Stripe handles card data) |
| Devlog content | Medium | Reputational damage |
| Admin access | Critical | Full platform takeover |

## Threat Actors

1. **Anonymous attackers** — automated bots, credential stuffing
2. **Malicious users** — authenticated users abusing the platform (spam, harassment)
3. **Compromised accounts** — legitimate users whose credentials are stolen
4. **Insider threats** — admin users with elevated access

## OWASP Top 10 Mitigations

### A01 — Broken Access Control
- Row Level Security on every Supabase table
- Server actions re-verify ownership before mutations
- Admin routes gated by `is_admin()` Postgres function + `admin_users` table
- Middleware rejects unauthenticated requests to protected routes

### A02 — Cryptographic Failures
- Passwords managed by Supabase Auth (bcrypt)
- Session tokens in HTTP-only cookies via `@supabase/ssr`
- All traffic HTTPS-only (enforced by Vercel)
- No sensitive data stored in client-side storage

### A03 — Injection
- Supabase JS client uses parameterized queries — no raw SQL from user input
- `stripDangerousUnicode()` applied to all user text before storage (strips zero-width + bidi chars)
- `rehype-sanitize` used in MarkdownRenderer — no raw HTML from user content
- Input length caps enforced at server action layer + DB CHECK constraints

### A04 — Insecure Design
- Security reviewed at architecture level (see ARCHITECTURE.md)
- Minimal data collection principle
- Feature flags for gradual rollout of sensitive features
- `audit_log` for all admin actions

### A05 — Security Misconfiguration
- CSP header allowlists known origins
- `X-Frame-Options: DENY` prevents clickjacking
- `X-Content-Type-Options: nosniff` prevents MIME sniffing
- `.env.local` gitignored; secrets never committed
- Dependabot weekly scans (`.github/dependabot.yml`)

### A06 — Vulnerable and Outdated Components
- Dependabot configured for weekly npm PRs
- `npm audit` run before each release

### A07 — Identification and Authentication Failures
- Email login flow: magic link only (no password to steal)
- OAuth providers (GitHub, Google) with `access_type: offline` + `prompt: consent`
- No "forgot password" — magic link is the recovery path
- Failed logins return generic messages (no username/password distinction)
- Rate limiting on auth endpoints via `lib/rate-limit.ts`

### A08 — Software and Data Integrity Failures
- Server Actions provide implicit CSRF protection (same-origin POST only)
- Stripe webhook signature verified with `stripe.webhooks.constructEvent()`
- Package-lock.json committed (reproducible builds)

### A09 — Security Logging and Monitoring Failures
- `audit_log` table records all admin actions with actor, target, metadata
- `security_events` table for rate limit violations, suspicious patterns
- `/api/health` endpoint for uptime monitoring
- Vercel deployment logs retained

### A10 — Server-Side Request Forgery (SSRF)
- No user-controlled URL fetching server-side
- All external fetches use hardcoded URLs (Resend API, Stripe API)
- Webhook URLs validated by Stripe signature before processing

## Known Acceptable Risks

| Risk | Acceptance Reason |
|---|---|
| In-memory rate limiter resets on restart | Acceptable for MVP; upgrade to Redis for scale |
| Stripe not installed by default | Optional feature; documented in SETUP.md |
| No MFA enforcement | Supabase supports TOTP; enable via dashboard when needed |
| Image URLs not proxied | Supabase Storage URLs are trusted; third-party avatar URLs from OAuth |

## Attack Surface

- `/api/webhooks/stripe` — Stripe signature required
- `/api/health` — public, read-only, no auth
- `/auth/callback` — session exchange, PKCE enforced by Supabase
- All other `/api/` routes — authenticated via Supabase session cookie
- Server actions — implicit CSRF protection, authenticated via cookie
