# Authentication, permissions & privacy contract

Extracted durable facts. Verify against live RLS/schema before relying.

## Auth
- Supabase Auth (email OTP) + per-table RLS. Auth redirect for `/dashboard/*` lives in `app/dashboard/layout.tsx`; every protected destination also enforces its own access on load (nav is presentation only).
- `getOptionalIdentity()` is shared by every authenticated page and deliberately selects a **minimal** column set (`display_name, username`, nav flags) to keep that shared per-request cost small. Pages needing more (e.g. Dashboard's profile-completeness) do a separate single-row read rather than widening the shared query — preserves per-table RLS isolation and payload size.

## Permission gates (flags on identity)
- Publisher tools: `publisher_accounts` / `hasPublisherAccount`. Publisher inbox: `hasPublisherContacts`. Studios area: `hasStudio`. Admin: `isAdmin`. Role-gated links must follow these flags.

## Privacy / safety rules
- `feed_items` view encodes visibility + follow + **block + mute**; its grant is **authenticated-only (not anon)**.
- Any "suggested developers" / people surfacing MUST apply the same rule as the feed: exclude blocked/muted users and require public work. (Prior dashboard bug: it used `profiles ORDER BY created_at` with no block/mute exclusion and no public-work requirement — must not recur.)
- `.in()` id lists are capped (≤20) before querying; discovery/feed reads are `.limit()`-ed.
- No `javascript:` or other unsafe URLs are rendered from user data (vote/link controls sanitize).

## Not shipped (as of the audits)
- No preferences page and no language/theme/timezone/default-visibility settings existed in the legacy app. **Update:** the new Glyph system ships a light/dark (Bone/Graphite) theme — see verification-debt.md.
