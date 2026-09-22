# Phase G — Account, Settings and Notifications architecture

Written before any Phase G code. Scope: Settings, Notifications and the existing account controls, rebuilt on the Phase A primitives. Not a rewrite of authentication or the notification backend (Phase 10 already made both real: migration 036, `app/actions/account.ts`, `lib/notifications/present.ts`).

Rule for this phase: **describe the system Glyph actually has.** No control is shown unless the backend does something with it. A deliberate omission is better than a disabled or fake control.

## 1. Account vs Profile

| | Profile | Account |
|---|---|---|
| Question it answers | "What do other people see about me?" | "How do I sign in, and what does Glyph do for me?" |
| Audience | Public, signed in or not | Only the owner |
| Data | `profiles` row: display name, handle (`username`), bio, location, primary role, engine, experience, collaboration status (availability), four https links | `auth.users`: email, providers, password; `notification_preferences`; `user_blocks`, `user_mutes` |
| Route | `/settings/profile` (public page: `/dev/[username]`) | `/settings/account`, `/settings/security`, `/settings/privacy`, `/settings/notifications`, `/settings/danger` |
| Written by | Client update on `profiles` (RLS: owner) | Supabase Auth client calls; server actions in `app/actions/account.ts` and `moderation.ts` |
| Never shown publicly | – | email, providers, block/mute lists, notification list, preferences |

The handle is fixed at onboarding. There is no rename flow, so Settings shows it read-only with that explanation instead of an editable field.

## 2. Settings map (six pages, all backed by behaviour)

| Nav label | Route | What is on it | Real backing |
|---|---|---|---|
| Profile | `/settings/profile` | Identity, availability, links. Incomplete-profile hint | `profiles` update |
| Account | `/settings/account` | Sign-in email, how you sign in (providers), change email | `auth.updateUser({ email })` (confirmation link) |
| Security | `/settings/security` | Change password (email/password accounts only), sign out other devices | `signInWithPassword` re-auth + `updateUser({ password })`; `signOut({ scope: 'others' })` |
| Privacy | `/settings/privacy` | What you control (project visibility, blocks, mutes, notification categories) versus what Glyph fixes; block and mute lists with undo | `user_blocks`, `user_mutes`, per-project `visibility` |
| Notifications | `/settings/notifications` | Five categories, each listing the events it covers | `notification_preferences` + `notifications_gate` trigger |
| Delete account | `/settings/danger` | Consequences from your own data, ownership blockers, Dialog confirmation | `account_deletion_summary`, `delete_my_account` |

**"Preferences" is deliberately not a page.** Glyph has no language, theme, timezone, density or default-visibility setting, so there is nothing to put on it. (Dark mode is not shipped.) Add the page when the first real preference exists.

Not in Settings on purpose (object-scoped, stays where the object lives): studio settings (`/dashboard/studios/[slug]`), billing (`/dashboard/billing`), publisher account (`/dashboard/publisher`), project visibility (project editor).

### Authentication model (as implemented)
- Sign in: email + password, or GitHub / Google OAuth (`components/auth/AuthForm.tsx`).
- Sign up: email + password; the address is verified with a one-time code, then the user logs in (no auto-login).
- Sessions: Supabase cookies. "Sign out other devices" is a real API (`scope: 'others'`).
- **Not supported, therefore not shown:** 2FA / authenticator apps, recovery codes, a list of individual active sessions, passkeys, login history, connected-app tokens, data export. Password change is shown only when the account has an email/password identity; OAuth-only accounts are told to manage the password with their provider.
- Email is used only for sign-in and provider messages. Glyph sends no notification emails (`lib/email` has no callers), so there is no email-notification setting.

## 3. Roles and where they are managed

| Role | Scope | Managed at |
|---|---|---|
| Admin | Platform | Admin console (not a setting) |
| Studio owner / member | Studio | `/dashboard/studios/[slug]`; leaving/removal there |
| Publisher (verified) | Publisher account | `/dashboard/publisher` |
| Developer / tester / applicant | Per object | On the object (playtest, collaboration post) |

Settings never edits another person's role. The only destructive role interaction Settings touches is account deletion, which refuses to run while the caller is the only owner of a studio that still has other members.

## 4. Privacy: what is controllable today

| Thing | Controllable? | Where |
|---|---|---|
| Profile visibility | No. Always public | – (stated on Privacy) |
| Project visibility | Yes, per project: public / unlisted / private | Project editor |
| Devlog visibility | Follows its project; drafts only the author | – |
| Comments, reactions, follows | No. Public | – |
| Collaboration posts | Public while open; applications visible to post owner and applicant | – |
| Playtest and build access | Developer accepts testers; `build_url` only via `get_playtest_build` | Playtest management |
| Studio membership | Public on team page | Studio management |
| Publisher messages | Sender and recipient only | – |
| Block | Yes | Profile menu; list and undo in Privacy |
| Mute | Yes | Profile menu; list and undo in Privacy |
| Notification categories | Yes | Notifications |

Privacy page groups the rows into **You control** (with a link to the place to change each) and **Set by Glyph** (statement only, no control). Nothing new is invented.

## 5. Notifications

### Model: actor → action → object → time
One dense row per event: `[actor] [action] [object]  [relative time]`. Rows of type follow / comment / reaction that share an object merge ("A, B and 2 others commented on your devlog X").

### Types that exist (18) and their families
| Family (preference) | Types | Object | Canonical destination |
|---|---|---|---|
| Activity on your work | follow | actor | `/dev/[actor]` |
| | comment, reply, reaction | devlog post | `/p/[owner]/[project]/[devlog]` (+`#comments` for comment/reply) |
| | mention | – | none (no writer exists; reserved) |
| Collaboration | collab_application | collaboration post | `/collaborate/[id]` (owner sees applications there) |
| | collab_accepted / rejected / closed | collaboration post | `/collaborate/[id]` |
| Playtesting | playtest_signup, playtest_feedback | playtest request | `/dashboard/playtests` (developer decides / reads feedback there) |
| | playtest_accepted, playtest_skipped | playtest request | `/playtests/[id]` |
| Studios | studio_invitation | studio invitation | `/dashboard/studios` |
| | studio_invite_accepted, studio_role_changed | studio | `/dashboard/studios/[slug]` |
| | studio_removed | studio | `/studios/[slug]` (public page; management no longer allowed) |
| Publisher messages | publisher_contact | contact | `/dashboard/publisher-contacts` |

There are no Event/Jam/System notification types, so no such preference groups exist. Adding a type means adding it to the constraint, `notification_category()`, the presenter and this table.

There are no notification-specific pages. Every destination is the canonical object or its existing management surface.

### Lifecycle
1. Created by a database trigger (`notify_event`) or, for the four social types, by a client insert allowed by RLS (`actor_id = auth.uid()`).
2. `notifications_gate` drops it silently if the recipient turned the category off, or there is a block in either direction, or the recipient muted the actor.
3. Unread (`read_at is null`). Following the row marks it (or the merged group) read; failure to mark never blocks navigation. "Mark all as read" updates all unread rows.
4. Only `read_at` is writable by the recipient. Rows are never deleted by the UI; they go away when the recipient account is deleted (a deleted actor becomes null → "A deleted account").
5. List reads the latest 100. Rows from actors blocked/muted **after** delivery are hidden in the page.

### States
| State | Presentation |
|---|---|
| Loading | Route `loading.tsx` skeleton rows (`LoadingRegion`) |
| Populated, some unread | Unread dot + heavier text + screen-reader "Unread." prefix; header says "N unread"; Mark all as read |
| Populated, all read | "Nothing unread."; no mark-all button |
| Empty | `EmptyState first-use`: what will appear here |
| Unread filter, none | `EmptyState no-results` with link to all |
| Load failure | `ErrorState` (`role=alert`) with reload link; never shown as empty |
| Target deleted **or** no longer visible to the viewer | Row stays (the event happened), says the object "is no longer available", no link. The database does not let us tell "deleted" from "hidden by RLS", so one honest wording covers both |
| Actor account deleted | "A deleted account" |
| Actor blocked/muted | Row not shown |

### Preferences
Five checkboxes, one per family above, each listing the events it covers. They apply to *new* notifications only (stated). Nothing about email is offered; the page says so in one sentence.

## 6. Destructive actions

| Action | Where | Pattern |
|---|---|---|
| Delete account | `/settings/danger` | Page states consequences from the user's own counts (server RPC) and blockers → `Dialog` with typed phrase (+ password when the account has one) → account deleted, signed out, "resulting state" shown in the dialog with a link home. Never one click |
| Unblock / unmute | Privacy | Reversible, one action, status announcement |
| Leave studio / remove member / role change | Studio management (Phase F) | Already `Dialog`-confirmed; untouched |
| Remove from shortlist | Publisher dashboard (Phase F) | Already `Dialog`-confirmed |

The only irreversible action in Settings is account deletion. It keeps its existing server checks (phrase, password re-auth, studio-owner blocker); this phase changes presentation only.

## 7. Page structure ("boring")
- Left list nav on ≥ 640 px, horizontal scroll list below; active item has `aria-current="page"`.
- One `h1` per page; sections are hairline-separated; forms use `Field` + `Input/Select/Textarea` + `Button`.
- No hero, cards, illustrations, statistics or tiles. Descriptions: one line per page and one per section at most.
- Status messages: inline `role="status"` (success) and `role="alert"` (error).

## 8. Verification plan
- Dev-only fixture `/design/account` (404 in production, fake labelled data): notifications (populated/unread, all read, empty, failed, unavailable target, long text), settings (normal account, incomplete profile, privacy lists, notification preferences, destructive confirmation in each state).
- `/design/account` at 375 / 768 / 1024; keyboard through the dialog; accessibility tree inspection.
- Signed-out route smoke on production build (`/settings/*`, `/notifications` redirect to login).
- Not verifiable here: any real signed-in save (email-OTP), email change confirmation, password change, sign-out-others, deletion, real notification delivery.

## 9. Out of scope / parked (explicitly)
Event RSVP count trigger; public demo-slot visibility (RLS/product decision); loading/404 architecture; collaboration compensation; `fetchEngagement` / dashboard query performance. Notification email, 2FA, session list, data export: not built, not simulated.

---

# Implementation record (what shipped)

**Settings** — six pages under `/settings`: Profile, Account, Security (new route, same behaviours that used to share Account), Privacy, Notifications, Delete account. All on Phase A primitives (`Field`, `Input/Select/Textarea`, `Button`, `Dialog`, `ErrorState`, `EmptyState`) plus three small settings-only helpers: `SettingsHeading`/`SettingsSection` (heading and hairline section, no card), `FormStatus` (live-region result) and `SettingsNav`. No hero, cards, tiles or statistics.
- **Profile**: identity, work, availability, links; handle shown read-only; a one-sentence note names the empty fields (no score). Link errors are per-field. Save errors no longer echo database messages.
- **Account**: sign-in methods, email (read-only) and the change-email form.
- **Security**: password form (only for accounts with an email/password identity) and *Sign out other devices*, now confirmed in a `Dialog`. The page states what Glyph does not offer (2FA, session list).
- **Privacy**: rules split into **What you control** (each with a link to where) and **Set by Glyph** (statement, no switch). Block/mute lists with undo, and an `ErrorState` when a list fails to load (previously rendered as an empty list).
- **Notifications**: five families, each with the exact events it covers; the email statement is one sentence.
- **Delete account**: the page states consequences from the account's own counts; the button opens a `Dialog` (phrase + password when applicable); on success the Dialog shows the result ("Account deleted") instead of navigating into a page that would bounce to sign-in. Previously `/?account=deleted` was set but nothing read it.

**Notifications page** — `NotificationsView` (pure view over presented rows): All / Unread filter (`?filter=unread`), unread count, Mark all as read, unread dot + weight + sr-only "Unread." Objects that are gone or hidden are now detected for **all six object kinds** (previously only devlogs and collaboration posts), keep the row, drop the link and say why. `loading.tsx` skeleton for the list and for `/settings/*`.

**Fixtures** — `/design/account` (404 in production): notifications populated with every type, merged rows, a very long name and title, deleted actor, unavailable targets; unread filter; all read; empty; failed; settings nav; profile normal/incomplete; email/password/devices; privacy with block and mute lists; preferences; delete flow (populated password account, empty provider account, studio-owner blocked).

**Backend impact:** none. No migrations, RLS, or server-action changes. `lib/notifications/present.ts` is presentation only.

**Verified:** `tsc`, `eslint`, build (see report). Fixture at 375 (no overflow, no unlabelled controls, standalone controls ≥ 44 px), 1024. Delete dialog: focus enters at Close, Tab order, submit disabled until phrase (+ password), Escape closes and returns focus to the trigger. 

**Not verified (email-OTP):** any real save, email confirmation link, password change, sign-out-others, deletion, real notification delivery and read marking, block/mute-hidden rows. Screen readers not run; the accessibility tree was inspected.

**Deliberate omissions:** a "Preferences" page (no preferences exist), email notification settings, 2FA, session list, data export, Event/Jam/System notification families (no such types).
