# Glyph Runbook

Operational procedures for Glyph production deployments.

## Deployments

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

Vercel auto-deploys on push to `main`. Preview deployments are created for every branch/PR.

### Rollback

From the Vercel dashboard → Deployments → select the previous deploy → Promote to Production.
Or via CLI: `vercel rollback <deployment-url>`.

## Environment Variables

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Service role key (for admin scripts only) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Production URL (e.g. `https://glyph.gg`) |
| `RESEND_API_KEY` | Optional | Resend API key for transactional email |
| `EMAIL_FROM` | Optional | Sender address (e.g. `Glyph <noreply@glyph.gg>`) |
| `STRIPE_SECRET_KEY` | Optional | Stripe secret key for payments |
| `STRIPE_WEBHOOK_SECRET` | Optional | Stripe webhook signing secret |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Optional | Plausible domain for analytics |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Optional | Umami website ID for analytics |
| `NEXT_PUBLIC_UMAMI_URL` | Optional | Umami script URL |

## Database Migrations

Migrations are in `supabase/migrations/`. Apply via Supabase dashboard or CLI:

```bash
# Apply all pending migrations (using Supabase CLI)
supabase db push

# Or apply a specific migration via MCP
# mcp__claude_ai_Supabase__apply_migration(project_id, name, query)
```

Current migrations: 001 through 016. Always apply in order.

## Health Check

`GET /api/health` returns:

```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-06-14T...",
  "uptimeMs": 12,
  "checks": {
    "database": { "status": "ok", "latencyMs": 8 },
    "env": { "status": "ok" }
  }
}
```

Returns `503` if any check fails. Vercel cron pings this every 5 minutes.

## Adding an Admin User

Run via Supabase SQL editor or MCP:

```sql
insert into public.admin_users (user_id, role)
select id, 'admin'
from public.profiles
where username = 'your-username';
```

## Incident Response

1. Check `/api/health` — if `503`, identify the failing check
2. Check Supabase dashboard for database issues
3. Check Vercel function logs for application errors
4. Rollback if a deploy caused the incident (see above)
5. Post in #incidents with: what happened, when, impact, resolution

## Stripe Webhook

Stripe webhook endpoint: `POST /api/webhooks/stripe`

Register in Stripe Dashboard → Webhooks → Add Endpoint:
- URL: `https://glyph.gg/api/webhooks/stripe`
- Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `payment_intent.succeeded`

Local development with Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Rate Limiting

In-memory rate limiter (`lib/rate-limit.ts`). Resets on server restart. For production, upgrade to Upstash Redis:

```bash
npm install @upstash/ratelimit @upstash/redis
```

Then update `lib/rate-limit.ts` to use the Redis backend.
