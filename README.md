# Glyph°

The platform for indie game developers who are still building. Profile, devlogs, playtesting, events, collaboration, and publisher discovery — all in one place.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind v4 (configured via `@theme` in `globals.css`) |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email magic link + OAuth) |
| Storage | Supabase Storage |
| Payments | Stripe |
| Email | Resend |
| Analytics | Plausible / Umami (cookie-free) |
| Deployment | Vercel |

## Getting Started

See [SETUP.md](./SETUP.md) for the complete setup guide including database migrations, OAuth configuration, and environment variables.

```bash
npm install
cp .env.example .env.local
# fill in .env.local
npm run dev
```

## Project Structure

```
app/
  actions/          # Server actions (all mutations)
  api/              # API routes (webhooks, health, etc.)
  admin/            # Admin dashboard (protected by admin_users table)
  dashboard/        # Authenticated user dashboard
  ...               # Public routes (profiles, projects, events, etc.)

components/
  ui/               # Base design system components
  layout/           # PageShell, PanelHeader, PanelBody, EmptyState
  admin/            # Admin-specific client components
  studios/          # Studio management
  publisher/        # Publisher tools
  moderation/       # Block/mute/report UI

lib/
  supabase/         # Client, server, types
  email/            # Email infrastructure (Resend)
  analytics.ts      # Plausible/Umami helper
  rate-limit.ts     # In-memory rate limiter
  utils.ts          # slugify, stripDangerousUnicode, cn

supabase/
  migrations/       # 001-016 SQL migration files

messages/           # i18n strings (en, es)
```

## V-Checklist Status

| Version | Feature | Status |
|---|---|---|
| V1 | Auth + Security baseline | ✅ |
| V2 | Developer profiles + Projects + Devlogs | ✅ |
| V3 | Community (follows, notifications, reactions) | ✅ |
| V4 | Playtesting + Events + Collaboration + Game Jams | ✅ |
| V5 | Studios + Featured Listings + Publisher Tools + Admin | ✅ |
| V6 | Email + Analytics + Moderation + Accessibility + i18n | ✅ |
| V7 | Production Hardening + Security + Performance + Deployment | ✅ |

## Security

See [SECURITY.md](./SECURITY.md) for the full OWASP A01–A10 mitigation inventory.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design and data flow.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT — see [LICENSE](./LICENSE).
