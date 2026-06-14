# Glyph — V3 Feature Inventory

All six V3 community features have been implemented.

## Feature 1 — Project Pages & Devlogs
- Public project page at `/p/[username]/[project-slug]`
- Devlog post page at `/p/[username]/[project-slug]/[devlog-slug]`
- `devlog_posts` table with RLS (public read of published; author full access)
- Markdown rendering via `react-markdown` + `remark-gfm` + `rehype-sanitize` (strict schema)
- Dashboard flows: `/dashboard/projects`, `/dashboard/projects/new`, `/dashboard/projects/[id]/edit`, `/dashboard/projects/[id]/devlogs/new`
- Components: `ProjectForm`, `DevlogForm`, `DevlogCard`, `MarkdownRenderer`

## Feature 2 — Following System & Community Feed
- `follows` table (follower_id, followed_id primary key; no self-follow constraint)
- `feed_items` view: devlog posts from accounts the viewer follows
- `/feed` page: authenticated-only; shows devlogs from followed developers
- `/dev/[username]/followers` and `/dev/[username]/following` pages
- `FollowButton` component with optimistic state and notification insert
- Follower/following counts displayed on profile pages

## Feature 3 — Reactions & Comments
- `reactions` table: unique per (user, post, type); types: like, helpful, inspiring, question
- `comments` table: content 1–5000 chars; one level of nesting via `parent_comment_id`
- `ReactionsBar` component: emoji reactions with optimistic updates
- `CommentThread` component: threaded comments with edit, delete, and reply
- Both appear on the devlog post page below the markdown content

## Feature 4 — Search & Discovery
- `/explore` — discovery landing with featured projects and active developers
- `/search` — full-text search with type filter (all / developers / projects / devlogs)
- Postgres FTS via trigger-maintained `tsvector` columns on `profiles`, `projects`, `devlog_posts`
- `websearch_to_tsquery` used for safe, user-supplied search queries
- GIN indexes on all `fts` columns for fast queries

## Feature 5 — Notifications
- `notifications` table: recipient_id, actor_id, type (follow/comment/reply/reaction/mention), entity_type, entity_id, read_at
- RLS: recipient reads own; actor inserts; recipient updates read_at
- `/notifications` page: grouped by read/unread; mark all read action
- Bell icon in dashboard navigation with unread count badge
- `MarkAllReadButton` client component for batch read marking

## Feature 6 — Account Settings
- `/settings` shared layout with tab navigation
- `/settings/profile` — edit display name, bio, location, role, engine, experience, collab status, social links
- `/settings/account` — change email (requires re-auth) and change password
- `/settings/notifications` — placeholder for future notification preferences
- `/settings/danger` — delete account with confirmation (type your username to confirm)
- All settings routes protected by `proxy.ts` middleware
