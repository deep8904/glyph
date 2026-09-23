# Glyph Phase 10 — Settings, Privacy, Account, Notifications

Status words: COMPLETE / PARTIAL / BROKEN / BACKEND-ONLY / UI-ONLY / MISSING / NOT TESTABLE. "Signed-in UI" was not exercised in a browser (email-OTP blocker); it is marked NOT TESTABLE where relevant.

## Information architecture (five categories)
| Category | Route | Owns | Not here |
|---|---|---|---|
| Profile | `/settings/profile` | name, bio, location, role, engine, experience, collaboration status, https-only links | sign-in, visibility of projects |
| Account | `/settings/account` | sign-in methods, email change, password change, sign out other devices, pointer to delete | profile content |
| Privacy | `/settings/privacy` | truthful "who can see what" table, blocked list, muted list (undo) | fake switches |
| Notifications | `/settings/notifications` | 5 in-product categories; email explained | email toggles (no email exists) |
| Delete account | `/settings/danger` | staged permanent deletion | — |
Studio, publisher and billing settings stay under `/dashboard/*` (object-scoped).

## Privacy model (no toggles)
Profile public; project visibility per project (public/unlisted/private, default private); devlogs follow the project; comments, reactions, follows, team membership public; applications, sign-ups, publisher messages, notifications visible only to their parties. A per-user "hide me from Explore" or "default visibility" switch was **not** built: it would either contradict public projects or need a new column with no consumer. Documented, not faked. Blocked/muted semantics are written out on the page and match what the database does (Feed, Explore, Search, boards, team lists, invites, sign-ups, contacts, notifications).

## Account deletion model
Permanent, immediate, no grace period (matches the copy and the schema). Stage 1 shows counts from the database of what will be removed and what it takes with it (others' comments on your devlogs, testers' sign-ups on your playtests; notifications you caused lose your name). Stage 2 requires the phrase `delete @username` and, for password accounts, the password (verified server-side). `delete_my_account()` (definer, acts only on `auth.uid()`) deletes the auth user; everything cascades. Escape backs out of stage 2; no `confirm()`.
**Ownership blocker:** sole owner of a studio that still has other members → deletion refused in the UI *and* in the database; page lists the studios with a link to make another owner or remove members. Sole-member studios are closed (status `deleted`); studios with other owners keep running.

## Test matrix (SQL = rolled-back transactions on the live schema)
| # | Scenario | Result | Verified by |
|---|---|---|---|
| 1 | normal user | deletes; profile + auth user gone | SQL (D5/D7/D7b) |
| 2–3 | projects, devlogs | removed | SQL (D11/D12) |
| 4 | collaboration posts | cascade (schema) | SQL cascade test + FK audit |
| 5 | playtest sessions (as tester) | cascade | FK audit |
| 6 | studio member | leaves; studio intact | SQL (D16/D17) |
| 7 | sole owner, no other members | studio closed | SQL (D18) |
| 8 | sole owner, other members | **blocked**, named studio | SQL (D1/D3/D4) |
| 8b | after promoting another owner | allowed | SQL (D8/D9) |
| 9 | admin | leaves; no blocker | guard/RPC logic |
| 10–12 | publisher, contacts, shortlists | removed with account | FK audit (cascade) |
| 13 | blocked relationship | blocks removed; other party unaffected | FK audit |
| 14 | muted relationship | same | FK audit |
| 15 | anonymous | `permission denied` for both RPCs | SQL (N20/N21) |
| — | other user's playtest sessions on my playtests | deleted with the playtest | SQL (D13/D14) |
| — | user X deleting does not touch user O | true | SQL (D6) |

## Notification model
`lib/notifications/present.ts` (unit-run): ACTOR → ACTION → OBJECT → TIME; merge rule for follow/comment/reaction on the same object ("Ana, Ben and 2 others commented on your devlog “…”"); every row links to its destination or, when the devlog/post is gone, says "…a devlog that no longer exists" with no link; blocked/muted actors are filtered from the list; clicking a row marks it (and merged rows) read; "Mark all as read"; `time` + `sr-only` unread text.
**Preferences:** `notification_preferences` (5 booleans: activity, collaboration, playtesting, studios, publisher). Enforced in a `BEFORE INSERT` trigger on `notifications`, so client-inserted and trigger-inserted notifications alike are dropped when a category is off, or when either side has blocked, or the recipient muted the actor. Email: none (documented on the page).

## Security changes
- `notifications`: recipient may update `read_at` only (column privilege).
- `notification_preferences`: own row only (RLS + column grants).
- `delete_my_account()` / `account_deletion_summary()`: authenticated only; no target argument.
- `profiles.*_url`: https-only CHECK (existing rows verified) + render-time guard.
- Removed the client-side profile scrub; removed the app-level studio pre-check (superseded by the database rule).

## Known limits
- `delete_my_account()` is callable directly by a valid session; the phrase/password re-auth is enforced by the server action, not the RPC. An attacker with a valid session token already controls the account.
- No Terms of Service / Privacy Policy pages exist (landing links to them were removed). MISSING — legal review needed before launch.
- No email notifications, no data export, no deactivation, no default-visibility preference (all documented, none faked).
