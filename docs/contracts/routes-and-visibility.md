# Routes & visibility contract

Durable routing + visibility facts (extracted from prior audits; verify against live code/schema before relying). No visual prescription here.

## Public content (viewable signed-out; uses optional identity)
Public/visitor-accessible — no auth redirect; each still enforces per-object visibility on load. Note: the **migrated Explore routes now render inside the new Glyph top-bar shell** (`app/explore/layout.tsx`), not "outside the app shell" as the legacy audits described; the standalone `/dev`, `/p/...` pages remain outside it (not yet migrated).
- `/dev/[username]` — developer profile.
- `/p/[username]/[project-slug]` — project.
- `/p/[username]/[project-slug]/[devlog-slug]` — devlog.
- `/search` — **public**, optional identity (`createClient`, no redirect); results still RLS/visibility-scoped.
- Discovery: `/explore`, `/explore/[section]` (`projects|developers|devlogs`), `/collaborate`, `/collaborate/[id]`, `/playtests/browse`, `/playtests/[id]`, `/studios`, `/studios/[slug]`, `/jams`, `/jams/[slug]`, `/events`, `/events/city/[city]`, `/events/[id]`, `/publishers`, `/publishers/[id]`, `/pricing`.

## Auth-gated
- `/feed`, `/notifications`, `/settings/*`, `/onboarding` (redirect to `/onboarding` or `/login` when no profile/session).
- `/dashboard/*` (overview, projects, projects/[id]/edit, projects/[id]/devlogs/new + /[id]/edit, playtests + /new, studios + /new, publisher, publisher-contacts, billing, events/new, jams/new). `app/dashboard/layout.tsx` performs the auth redirect.
- `/admin/*` — gated by the `isAdmin` flag.
- `/collaborate/new`, `/playtests/[id]/test/[session-id]`.
- Auth flow: `/login`, `/signup`, `/reset-password`, `/auth/callback`.

## Visibility & discovery rules (enforce in RLS + page loads)
- **Project visibility:** `public` (discoverable) · `unlisted` (reachable by link, excluded from discovery) · `private` (owner only).
- **Project lifecycle:** `draft` · `published` · `archived`. A project is `notFound` for non-owners when `lifecycle === 'draft'` OR `visibility === 'private'`. `archived` is excluded from Current Work and from discovery.
- **Devlogs:** visitors see only `published_at` non-null AND `<= now`; the owner also sees drafts/scheduled. Future `published_at` = scheduled, not public.
- **Discovery/search** surface only public + published + non-future rows via the `discoverable_*` views and `search_*` RLS; viewer block/mute is applied in the `feed_items` view.

## Routing correctness (Next.js App Router)
- A `loading.tsx` must **not** sit above a dynamic route that calls `notFound()` — it streams a 200 before the boundary resolves, so unknown slugs stop returning 404. Keep list `loading.tsx` in a route group (`(hub)`, `(overview)`, `(board)`) sibling to the `[slug]`/`[id]` detail route. Confirmed for `/explore`, `/jams`, `/collaborate`, `/dashboard`.
- `/explore/[section]` returns real 404 for unknown sections (`isSection` → `notFound()`).
- Public developer/project/devlog pages intentionally render outside the app chrome.
