# Glyph Phase 10 — Recon (before implementation)

Compared against `docs/glyph-settings-architecture.md` (2026-09-16) and the Phase 1–9 notes. Where the documents and the code disagree, the code was treated as authoritative.

## Settings routes and forms (as found)

| Route | What it was | Reality check |
|---|---|---|
| `/settings` | redirect | ok |
| `/settings/profile` | `EditProfileForm` (client, writes `profiles` directly) | labels not associated with inputs; social links **not validated** and rendered as `<a href>` on the public profile (stored-XSS vector via `javascript:`) |
| `/settings/account` | email change, password change, provider list | worked; labels unassociated; no way to end other sessions |
| `/settings/notifications` | **stub**: four rows each saying "Email preferences coming soon" | no storage, no email sender anywhere; a decorative page |
| `/settings/danger` | `DeleteAccountForm` | copy claimed projects/devlogs/comments/reactions are removed; code only nulled some `profiles` columns and signed out. Login and all content stayed, so the "deleted" user could sign in again. Phase 9 added a studio-only pre-check in app code |
| privacy / blocked / muted | **none** | block/mute existed only as buttons on other people's profiles; no list, no undo |

## Account deletion — what the schema actually allows
Every table referencing `profiles(id)` is `ON DELETE CASCADE` except `notifications.actor_id`, `moderation_queue.reported_by`, `security_events.user_id` (`SET NULL`); `profiles.id` cascades from `auth.users`. There is no anonymise path: deleting the auth user deletes the person's projects, devlogs, comments, reactions, collaboration posts/applications, playtest requests/sessions/feedback (via cascade), studio memberships/invitations, publisher account/contacts/shortlists, follows, blocks, mutes, notifications. `SUPABASE_SERVICE_ROLE_KEY` is **not configured**, so app code cannot call the admin API. A `SECURITY DEFINER` function owned by `postgres` can delete from `auth.users` (verified in a rolled-back transaction: profile, projects and devlogs cascade away).

## Notification infrastructure
`notifications` (recipient, actor, type, entity_type, entity_id, read_at). 18 types after Phases 8–9 (5 social, 4 collaboration, 4 playtest, 4 studio, 1 publisher). Workflow types are trigger-created; social types are client-inserted (comment/reply/reaction/follow). The list page had no per-row read state, no deep link for social types, no grouping, no deleted-object handling, and showed rows from blocked/muted actors. `MarkAllRead` existed. A recipient could update any column of their own rows.

## Email infrastructure
`lib/email/*` (Resend wrapper + 4 templates) has **zero callers**; `RESEND_API_KEY` is not set; only a dev `console.log` stub. No notification email is ever sent. `.env.local` contains only the two public Supabase values.

## Discrepancies, dead and misleading items
- Delete copy vs behaviour (above) — REAL BUG.
- Notification preferences page: decorative — REAL BUG.
- Profile links unvalidated — REAL BUG (security).
- Landing footer: 7 `href="#"` links (About, Press, Privacy Policy, Terms of Service, three social icons) to nothing — REAL BUG. There are **no** Terms or Privacy Policy pages in the product — MISSING (legal, not built here).
- `MarkAllReadButton` and the AppShell unread badge ignore blocked/muted actors — minor.
- `lib/email/*` unused — DEAD CODE (kept; documented, not wired).
- `publisher_contact` notification previously typed `mention` — fixed in Phase 9.

## Block / mute today
Actions `blockUser/unblockUser/muteUser/unmuteUser` (`app/actions/moderation.ts`), UI only on `/dev/[username]`. Enforced in: Feed (`feed_items`), Explore/Search (`discoverable_*`), boards, studio team, invites, contacts, sign-ups/applications. Not enforced before this phase: client-inserted notifications.
