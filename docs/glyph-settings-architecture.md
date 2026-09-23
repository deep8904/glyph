# Glyph Settings Architecture

**Date:** 2026-09-16
**Status:** Research/architecture document. No code, schema, or UI was changed to produce this — including the genuine bug found in §4 below, which is documented, not fixed.
**Method:** Started from LinkedIn's mature settings model (pattern library §11), then validated every proposed category against actual Glyph functionality rather than copying categories that don't apply (LinkedIn's "Advertising data" category, for instance, has no Glyph equivalent and is explicitly excluded below, not force-fit).

---

## 1. Current Glyph Settings — As Actually Implemented

Confirmed by direct source read this pass (`app/settings/*`, `components/settings/*`):

| Page | Route | Current implementation |
|---|---|---|
| Profile | `/settings/profile` | Bio, location, role/engine/experience, social links, avatar — full CRUD, per Phase 1/2 recon |
| Account | `/settings/account` | Email + password + connected-provider display (`AccountForm.tsx`), reads `user.identities` for provider list |
| Notifications | `/settings/notifications` | **Stub — "Email preferences coming soon"** (confirmed, unchanged since the original AI-slop finding) |
| Danger Zone | `/settings/danger` | "Delete Account" — see §4, a genuine finding, not a research abstraction |

Navigation: `SettingsNav.tsx`, a left/top rail (responsive: horizontal-scroll on mobile, vertical on desktop) — already a confirmed-good pattern per every prior audit, unchanged by this document.

## 2. LinkedIn's Model, Validated Against Glyph

Per pattern library §11, LinkedIn's six top-level categories: Account preferences, Sign in &amp; security, Visibility, Data privacy, Advertising data, Notifications. Validated one-by-one against real Glyph functionality, not copied wholesale:

| LinkedIn category | Applies to Glyph? | Reasoning |
|---|---|---|
| Account preferences | **Yes, partially** — Glyph's current "Account" page is closer to this than to "Sign in & security" alone | Glyph's `/settings/account` currently mixes identity (email) with security (password) — LinkedIn separates these; see §3 |
| Sign in & security | **Yes** — currently folded into `/settings/account`, should be its own category per LinkedIn's split | Password, connected providers, and (if ever built) two-factor auth belong together, separate from profile-content settings |
| Visibility | **Yes — currently missing entirely** | Glyph has real visibility-relevant functionality (project `visibility` field per-project, Block/Mute from Phase 1's predecessor work, devlog draft-gating) with no settings-page home at all |
| Data privacy | **Partially** — Glyph has no analytics-opt-out or third-party-app-permission surface (no OAuth app ecosystem exists), but blocked-users management belongs in a privacy-adjacent category | Don't force-fit LinkedIn's full scope; Glyph's version is much smaller |
| Advertising data | **No** — Glyph has no advertising system | Explicitly excluded, not adapted |
| Notifications | **Yes** — already exists as a category, currently a stub | See §5 |

## 3. Proposed Glyph Settings Categories

Not automatically adopted from LinkedIn — each validated against real, current Glyph functionality per the instruction to check before proposing:

1. **Profile** (existing, unchanged) — bio, location, role/engine/experience, socials, avatar. Content about the developer, not account mechanics.
2. **Account** (narrowed from current scope) — email, password, connected providers only. Remove any identity-adjacent content that more properly belongs in Profile or the new Privacy category.
3. **Privacy** (new, proposed) — houses: blocked/muted users list and management (currently reachable only from a target user's own profile page via `BlockMuteButtons`, per the prior UX audit's discoverability finding — this settings page would be a second, appropriate discovery path, not a replacement); default project visibility preference (if useful — not confirmed as a real need, flagged as speculative); who-can-contact-me controls (relevant once/if a direct-contact profile field is ever added, per the product model's profile blueprint). This directly closes the gap named in the pattern library (§11) and the information architecture gap table (P1).
4. **Notifications** (existing category, content still a stub — not built this phase). See §5 for the target model once it is built.
5. **Studio** (contextual, not a `/settings/*` page) — studio-specific settings already correctly live at `/dashboard/studios/[slug]` (Phase 1), not under the personal `/settings/*` tree. No change recommended — this is already structured correctly (studio settings are object-scoped, not account-scoped, matching Discord's Server-Settings-vs-User-Settings split from the pattern library §9).
6. **Billing** (existing route, `/dashboard/billing`, correctly NOT nested under `/settings/*`) — already reachable via the Phase 2 secondary nav. No change recommended.
7. **Danger Zone** (existing, needs real work — see §4).

**Explicitly not proposed:** an "Advertising data" equivalent (no ad system exists); a "Data privacy/third-party apps" category (no OAuth-app ecosystem for other developers to connect to Glyph exists); a separate "Accessibility" or "Language" category (no i18n/accessibility-preference infrastructure exists to configure — would be a settings page with nothing real behind it).

## 4. Danger Zone — A Real Finding, Not Just a Gap

Direct source read this pass (`components/settings/DeleteAccountForm.tsx`) surfaces two concrete issues, found incidentally while researching LinkedIn's account-closure pattern (pattern library §11) and checking Glyph's equivalent:

**Finding 1 — the delete flow's own copy overstates what the code does.** The UI states: "This will remove your public profile, all your projects, devlogs, comments, and reactions. This cannot be undone." The actual implementation only nulls out a subset of `profiles` columns (`display_name`, `bio`, `location`, `avatar_url`, social links, `is_onboarded`) and signs the user out — it does **not** delete projects, devlogs, comments, or reactions at all; the `auth.users` row is explicitly retained (per the code's own comment, "for 30 days per Supabase's data retention"). This is a "UI that lies" finding in the same category the prior UI/UX audit flagged elsewhere (billing page's now-fixed example) — the stated consequence and the actual behavior diverge.

**Finding 2 — no owned-resource resolution before deletion, unlike LinkedIn's gated flow.** LinkedIn's account-closure flow (pattern library §11) requires resolving owned premium resources (transferring or cancelling them) before the base account can close. Glyph's delete flow has no equivalent check at all — critically, it does not verify whether the user is the **sole owner of a studio** (the exact case Phase 1's `leaveStudio`/`removeStudioMember` actions explicitly protect against elsewhere in the app — "a studio must have at least one owner"). A user could delete their account through this flow while being a studio's only owner, leaving that studio permanently ownerless with no code path to recover it — the same class of problem Phase 1 deliberately guarded against in the studio actions, left unguarded here.

**Both findings are documented only, per this phase's explicit no-implementation rule.** They are flagged as **P0** in the sense that they're a real correctness/data-integrity gap already in production code, not a hypothetical research finding — but fixing them is implementation work for a future phase (most naturally the Settings/Account phase in the updated sequence below), not this research pass.

**Recommended target flow, derived from LinkedIn's pattern (not to be implemented this phase):** (1) reason selection (optional, lower priority for Glyph than for LinkedIn's retention-analytics use case); (2) password re-authentication (currently absent — the type-your-username confirmation is a reasonable low-friction anti-misclick guard but is not equivalent to re-auth, since anyone with an active session can complete it without proving they still know the password); (3) explicit, accurate stated consequences (fix the copy to match actual behavior, or — better — implement real deletion to match the existing copy, a product decision, see open decisions below); (4) owned-resource resolution gate, reusing the exact `countOwners`-style check already built in `app/actions/studios.ts` from Phase 1.

## 5. Notification Preferences — Target Model (Not Built This Phase)

Per pattern library §10/§11 (LinkedIn's category-then-grid drill-down, sized down from 7 categories to something proportionate to Glyph's much smaller notification-type list):

- **Categories (proposed, 3, not 7):** "Social" (follow, comment, reply, reaction), "Studio & Collaboration" (collaboration application accept/reject, studio invite/role-change — once these are wired per the implementation plan's open notification-enum-extension decision), "Platform" (publisher contact, jam/event updates if ever added).
- **Channels:** In-app only until `lib/email/*` is actually wired up (per the implementation plan's tracked open item) — do not build a channel toggle for a channel that doesn't send anything yet; that would be the exact "UI that lies" pattern §4 above just flagged.
- **Not proposed:** push notifications (no mobile app exists), a full type×channel matrix (disproportionate until email is wired and the notification-type list actually grows past a handful).

## 6. Open Product Decisions From This Document

- **Fix the Delete Account copy-vs-behavior mismatch, or implement real deletion to match the copy** — a genuine product decision (which is correct depends on what users actually expect and what's legally/practically required), not resolved here. Whichever direction, the owned-resource (studio ownership) gate should be added regardless — that part isn't a copy question, it's a real gap.
- **Whether a "default project visibility" preference in the new Privacy category is worth building** — speculative, not validated against real user demand this pass.
- **Whether password re-authentication should gate account deletion**, given Glyph's simpler risk profile than LinkedIn's (no premium subscriptions to protect, but real owned data — projects, studios — to protect) — a judgment call for whoever implements the Danger Zone rework.
