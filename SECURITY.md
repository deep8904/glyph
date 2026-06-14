# Glyph — Security Hardening Inventory

Last updated: 2026-06-14

## OWASP Top 10 Coverage

### A01 — Broken Access Control
- **RLS on every table.** `profiles`, `projects`, `devlog_posts`, `follows`, `reactions`, `comments`, `notifications` all have Row-Level Security enabled in Supabase. Public SELECT is permitted on most tables; INSERT/UPDATE/DELETE require the authenticated user to own the row (enforced by `auth.uid() = owner_id` / `auth.uid() = author_id`).
- **Route guarding via `proxy.ts`.** `/dashboard`, `/onboarding`, `/settings`, `/notifications`, and `/feed` redirect unauthenticated users to `/login`.
- **Owner checks on mutations.** Server-side DB calls include `.eq('owner_id', userId)` / `.eq('author_id', userId)` on all destructive operations so RLS and application-level checks are independent layers.
- **Open redirect prevention.** `app/auth/callback/route.ts` validates the `?next=` parameter with `isSafePath()` before following it. Any path that starts with `//`, contains `\`, or doesn't start with `/` is rejected and defaults to `/dashboard`.

### A02 — Cryptographic Failures
- **No passwords stored.** Supabase Auth manages all credentials. The app never sees, stores, or transmits passwords.
- **HTTPS enforced.** HSTS header (`max-age=63072000; includeSubDomains; preload`) forces HTTPS for 2 years including subdomains.
- **Secrets never committed.** `.env.local` is in `.gitignore`. The `.env.example` file documents required keys without values.
- **NEXT_PUBLIC_ prefix audit.** Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are exposed to the client. The service role key is never used in client-facing code.

### A03 — Injection
- **SQL injection.** All queries use the Supabase JS client's parameterised query builder — no raw SQL in application code. Full-text search uses `.textSearch()` with `websearch_to_tsquery` on the DB side.
- **XSS.** Devlog markdown content is rendered through `rehype-sanitize` with an explicit tag allowlist. Scripts, iframes, objects, embeds, event handlers (`on*`), and `javascript:` / `data:` URIs (except `data:image/`) are stripped. Comment content is rendered as plain text (`whitespace-pre-wrap`), not HTML.
- **Unicode injection (pastejacking).** `stripDangerousUnicode()` in `lib/utils.ts` removes zero-width characters and bidirectional control characters from all user-submitted text fields before storage.

### A04 — Insecure Design
- **Generic auth errors.** Login failures return a single message that doesn't distinguish between "email not found" and "wrong password".
- **No auto-login after signup.** Email signup flows send a 6-digit OTP; on verify success, the user is redirected to `/login` with a success banner — never silently signed in.
- **Content-Security-Policy.** Default-src is `'self'`; connect-src allows only `*.supabase.co`; frame-ancestors is `'none'` (blocks all embedding). See `next.config.ts`.

### A05 — Security Misconfiguration
- **Security headers** (set in `next.config.ts` for all routes):
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `Content-Security-Policy` — see `next.config.ts` for full value
- **`unsafe-inline` and `unsafe-eval` in CSP.** Required by Tailwind v4 (style injection) and Next.js dev mode respectively. These are standard limitations of the stack; production builds do not change this because Tailwind v4 injects styles at runtime.

### A06 — Vulnerable and Outdated Components
- **`npm audit` status.** Run `npm audit` before each deploy. Known exemption: `postcss < 8.5.10` is bundled inside `next` itself (not a direct dependency); `npm audit fix --force` would downgrade to Next.js 9.3.3 which is not viable. Track the Next.js release notes for a fix.
- **Dependabot.** `.github/dependabot.yml` is configured to open weekly PRs for npm dependency updates.
- **Pinned lockfile.** `package-lock.json` is committed and `npm ci` should be used in CI to ensure reproducible installs.

### A07 — Identification and Authentication Failures
- **Supabase Auth built-in rate limits.** Supabase applies its own rate limiting to all auth endpoints (signup, login, OTP, OAuth).
- **In-app rate limiting.** `lib/rate-limit.ts` provides additional per-IP rate limiting for custom API routes (e.g., username check: 30 req/min/IP). Uses an in-memory Map per Vercel function instance. For multi-instance production, replace with Upstash Redis.
- **Email OTP verification.** New email signups must verify with a 6-digit OTP before the account is usable.
- **Session security.** Supabase sessions use short-lived JWTs + refresh tokens. The app never stores tokens in `localStorage` directly — `@supabase/ssr` manages them in cookies with appropriate flags.

### A08 — Software and Data Integrity Failures
- **No `dangerouslySetInnerHTML`.** The codebase does not use this React prop anywhere.
- **Markdown sanitized before render.** `rehype-sanitize` strict schema is applied before any markdown reaches the DOM.
- **Subresource integrity.** No external scripts are loaded. Fonts are loaded from `fonts.googleapis.com` (in the CSP allowlist); no other third-party scripts.

### A09 — Security Logging and Monitoring Failures
- **Rate limit logging.** API routes that hit the rate limit return 429; these are visible in Vercel function logs.
- **Supabase Auth logs.** All auth events (signups, logins, failures) are logged automatically by Supabase and visible in the Dashboard → Logs → Auth.
- **Future:** A `security_events` table for application-level audit events (rate limit hits, suspicious patterns) is recommended before launch.

### A10 — Server-Side Request Forgery (SSRF)
- **No server-side URL fetching.** The app does not make outbound HTTP requests based on user-supplied URLs. All Supabase calls go to the project's own endpoint.
- **Open redirect closed.** `isSafePath()` in the auth callback prevents redirect to external URLs.

## ReDoS Prevention
- `app/api/profile/check-username/route.ts` checks `username.length > 30` before applying the regex, preventing long-input regex attacks.
- `lib/utils.ts` `slugify()` uses only character-class replacements — no backtracking-vulnerable patterns.

## Known Exceptions / Future Work
| Item | Status | Notes |
|------|--------|-------|
| `postcss < 8.5.10` moderate advisory | Accepted | Bundled inside Next.js; not exploitable in this context |
| In-memory rate limiter | Acceptable for launch | Replace with Upstash Redis for multi-instance production |
| `security_events` DB table | Future | Add before GA launch for audit trail |
| Pre-commit secret scanning | Recommended | Install `gitleaks` or similar locally; not enforced in CI yet |
| CSP `unsafe-inline` / `unsafe-eval` | Accepted | Required by Tailwind v4 + Next.js dev; standard for this stack |
