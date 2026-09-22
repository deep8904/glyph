# Glyph Product Model

**Date:** 2026-09-16
**Status:** Research/architecture document. No code, schema, or UI was changed to produce this.
**Scope:** Defines Glyph's actual product objects — what each represents, who owns it, its lifecycle, its relationships to other objects, and how it surfaces across the product — as the underlying model the navigation, profile, project-page, and settings blueprints in the companion documents are built on. Grounded directly in the current schema (`supabase/migrations/001`–`022`) and `lib/supabase/types.ts`, not invented.

---

## 1. Core Objects and Relationships

### DEVELOPER (`profiles`)
- **Represents:** a person's identity on Glyph — the root of every other object's ownership chain.
- **Owner:** the account holder (`id` = `auth.users.id`).
- **Audience:** public by default (profile pages are publicly readable); the account itself is private (settings, email).
- **Lifecycle:** created at signup (`is_onboarded=false`) → completed via `/onboarding` → editable indefinitely via `/settings/profile`. No deletion flow currently exists in the UI (per completeness audit).
- **Relationships:** owns Projects, Devlog Posts (via Projects), Playtest Requests, Playtest Sessions (as tester), Collaboration Posts, Collaboration Applications, Comments, Reactions, Events (as host), Game Jams (as host), Jam Entries (as team lead), Jam Votes, Studio Memberships, Publisher Accounts (0 or 1), Notifications (as recipient and as actor), Follows (both directions).
- **Primary actions:** edit profile, follow/unfollow another developer, block/mute another developer.
- **Secondary actions:** report content, view another developer's public work.
- **Visibility:** `bio`, `location`, `primary_role`, `primary_engine`, `experience_level`, `collaboration_status`, social links, and current project are all public. Email and account-level settings are private.
- **Discovery surface:** `/explore` (Developers section), `/search`, `/dev/[username]/followers` and `/following`.
- **Notification relationship:** recipient of `follow` notifications; actor for every notification type it triggers on others.
- **Settings relationship:** `/settings/profile` (identity fields), `/settings/account` (credentials), `/settings/notifications` (currently a stub), `/settings/danger` (account-level destructive actions).
- **Parent object:** none (root).
- **Child objects:** Projects, Studio Memberships (as member), Publisher Account (0 or 1).

### PROJECT (`projects`)
- **Represents:** a single game/work-in-progress — Glyph's second-most-central object.
- **Owner:** the creating `Developer` (`owner_id`).
- **Audience:** `visibility` enum (`public` / `unlisted` / `private`) controls this per-project.
- **Lifecycle:** created via `/dashboard/projects/new` → `stage` progresses (concept→prototype→alpha→beta→released, developer-declared, not automated) → editable/deletable by owner indefinitely. One project per developer may be `is_primary` (featured on their profile).
- **Relationships:** has many Devlog Posts, has 0-or-more Playtest Requests, has 0-or-more Collaboration Posts (optional link), may belong to a Studio (via the `studio_projects` join table — a many-to-many in schema, though the UI treats it as effectively one-studio-at-a-time per project), may have Jam Entries (via `jam_entries.project_id`).
- **Primary actions:** create, edit, delete, publish a devlog against it, open a playtest request, post a collaboration opportunity linked to it, submit it to a jam.
- **Secondary actions:** attach to/detach from a studio (studio owner/admin only, and only the project's own owner's projects can be attached — per `addStudioProject`'s check).
- **Visibility:** per-project `visibility` field; private projects are only visible to the owner.
- **Discovery surface:** `/explore` (Recent Projects), `/search`, the owner's `/dev/[username]` profile (current-project card), a studio's public page (`/studios/[slug]`) if attached.
- **Notification relationship:** not itself a notification target, but the parent of Devlog Posts and Playtest Requests, which are.
- **Settings relationship:** none directly — managed via `/dashboard/projects/[id]/edit`, not `/settings/*`.
- **Parent object:** Developer (and optionally Studio, as a secondary/non-exclusive association).
- **Child objects:** Devlog Posts, Playtest Requests, (indirectly) Collaboration Posts and Jam Entries that reference it.

### DEVLOG POST (`devlog_posts`)
- **Represents:** a single, timestamped unit of progress — per the product design blueprint, the atomic core-loop object.
- **Owner:** implicitly the Project's owner (`author_id`, always equal to the project owner in current practice — no co-authored devlogs).
- **Audience:** inherits the parent Project's visibility; individually can also be a draft (`published_at` null or future).
- **Lifecycle:** created → optionally drafted → published → (no edit UI currently exists, per completeness audit) → permanent (no delete UI located either).
- **Relationships:** belongs to one Project; has many Comments (threaded one level deep) and Reactions.
- **Primary actions:** create, publish, react, comment, reply.
- **Secondary actions:** none currently (no edit/delete, a real gap noted in prior audits, not addressed by this document).
- **Visibility:** inherits Project visibility; drafts are owner-only regardless.
- **Discovery surface:** `/explore` (Recent Devlogs), `/search`, the parent Project page, `/feed` (for users following the author).
- **Notification relationship:** triggers `comment`/`reply`/`reaction` notifications to the devlog's author.
- **Settings relationship:** none.
- **Parent object:** Project.
- **Child objects:** Comments, Reactions.

### COMMENT (`comments`) / REACTION (`reactions`)
- **Represents:** feedback on a specific Devlog Post.
- **Owner:** the commenting/reacting Developer.
- **Lifecycle:** created, immutable (no edit/delete UI located).
- **Relationships:** belong to one Devlog Post; Comments can reply to another Comment (`parent_comment_id`, one level).
- **Notification relationship:** triggers `comment`/`reply` (Comment) or `reaction` (Reaction) notifications to the devlog's author, guarded against self-notification.
- **Parent object:** Devlog Post. **Child objects:** none (Comments' one-level reply is a sibling relationship, not a further nested child).

### FOLLOW (`follows`)
- **Represents:** one Developer tracking another's activity.
- **Lifecycle:** created/deleted via `FollowButton`.
- **Relationships:** directional, Developer→Developer.
- **Notification relationship:** triggers a `follow` notification to the followed developer.
- **Feed relationship:** the `feed_items` view is built directly on top of this table — a user's Feed is exactly "devlogs published by developers I follow."

### PLAYTEST REQUEST (`playtest_requests`) / PLAYTEST SESSION (`playtest_sessions`) / PLAYTEST FEEDBACK (`playtest_feedback`)
- **Represents:** a structured request for testers (Request), one tester's participation (Session), and their structured response (Feedback).
- **Owner:** Request is owned by the Project's author; Session is owned by the tester; Feedback is owned by the tester (one per session).
- **Lifecycle:** Request: `open`→`full`(auto, per Phase 1)/`closed`(manual). Session: `requested`→`accepted`/`skipped`(by author)→`completed`(tester submits feedback) or `skipped`(tester withdraws, per Phase 1). Feedback: created once per accepted session.
- **Relationships:** Request belongs to Project; has many Sessions; Session belongs to one Request and one tester; has 0-or-1 Feedback.
- **Primary actions (requester):** create request, accept/skip a session (Phase 1), view feedback (Phase 1).
- **Primary actions (tester):** browse, request a session, withdraw (Phase 1), submit feedback.
- **Visibility:** Request public when `open`; Feedback visible to the tester and the request author (and other testers only if `is_private=false`).
- **Discovery surface:** `/playtests/browse`, the embedded card on the Project page, `/dashboard/playtests` (requester + tester views combined).
- **Notification relationship:** currently none wired (flagged in the implementation plan as a deliberate open product decision, not done in Phase 1).
- **Parent object:** Project (Request) → Request (Session) → Session (Feedback).

### COLLABORATION POST (`collaboration_posts`) / COLLABORATION APPLICATION (`collaboration_applications`)
- **Represents:** a structured "seeking collaborator" or "available to collaborate" listing, and one person's application to it.
- **Owner:** Post by the posting Developer (optionally linked to a Project); Application by the applicant.
- **Lifecycle:** Post: `open`→`filled`/`closed` (manual, `closeCollabPost`, Phase 1) →expires automatically (`expires_at`, 60 days). Application: `pending`→`accepted`/`rejected` (Phase 1 UI).
- **Relationships:** Post optionally belongs to a Project; has many Applications.
- **Primary actions (poster):** post, close, accept/reject applicants (Phase 1).
- **Primary actions (applicant):** browse, apply.
- **Notification relationship:** applying triggers a notification to the post's author (working since Phase 1's predecessor).
- **Parent object:** Developer (author) and optionally Project.

### STUDIO (`studios`) / STUDIO MEMBER (`studio_members`) / STUDIO PROJECT (`studio_projects`)
- **Represents:** an organizational identity wrapping one or more Developers and their Projects — the closest Glyph object to a LinkedIn Company Page or a GitHub Organization.
- **Owner:** the `owner`-role Studio Member(s); a studio always has at least one (enforced at the application layer since Phase 1, not by RLS).
- **Lifecycle:** created (creator auto-becomes owner) → members invited/removed/role-changed (Phase 1) → projects attached/detached.
- **Relationships:** has many Members (each with `role` = owner/admin/member); has many attached Projects (via the join table, many-to-many in schema).
- **Primary actions (owner/admin):** edit studio info, invite/remove members, change roles, attach/detach projects (all Phase 1).
- **Primary actions (member):** leave (Phase 1).
- **Visibility:** public studio page (`/studios/[slug]`) when `status='active'`.
- **Discovery surface:** `/dashboard/studios` (own memberships), public `/studios/[slug]`; not yet on `/explore` or `/search`.
- **Notification relationship:** none currently wired for membership changes (noted as an open decision in the implementation plan).
- **Parent object:** none (Developers are members, not children, since a Developer can belong to at most one owned studio currently but the schema supports multi-membership).
- **Child objects:** Members, attached Projects (non-exclusively).

### GAME JAM (`game_jams`) / JAM ENTRY (`jam_entries`) / JAM VOTE (`jam_votes`)
- **Represents:** a time-boxed community competition (Jam), one Project's submission to it (Entry), and one Developer's rating of an Entry (Vote).
- **Owner:** Jam by its `host_id`; Entry by its `team_lead_id` (the only ownership concept an entry has — no broader team model, confirmed in Phase 1's RLS work); Vote by its `voter_id`.
- **Lifecycle:** Jam: `upcoming`→`running`→`voting`→`completed`, gated by `admin_approved` before public visibility. Entry: submitted during the `running` window. Vote: cast during `voting`, one per entry/voter/category (unique constraint), self-voting blocked at the RLS layer since Phase 1.
- **Relationships:** Jam has many Entries; Entry belongs to one Project and has many Votes.
- **Discovery surface:** `/jams` (public listing), `/jams/[slug]` (detail/entries), `/jams/[slug]/results` (leaderboard).
- **Notification relationship:** none currently wired.
- **Parent object:** Developer (host) for Jam; Project + Jam for Entry.

### EVENT (`events`) / EVENT RSVP (`event_rsvps`)
- **Represents:** a local, real-world or virtual meetup/showcase/talk/workshop.
- **Owner:** the host Developer.
- **Lifecycle:** `draft`→`published`→`completed`/`cancelled`.
- **Relationships:** has many RSVPs (public-readable, per-user status).
- **Discovery surface:** `/events`, `/events/city/[city]`.
- **Notification relationship:** none currently wired.
- **Parent object:** Developer (host). Distinct from the core devlog→discovery→feedback loop — community logistics, not core-object activity (per the Phase 2 navigation reasoning).

### PUBLISHER ACCOUNT (`publisher_accounts`) / PUBLISHER SHORTLIST (`publisher_shortlists`) / PUBLISHER CONTACT (`publisher_contacts`)
- **Represents:** a business-role account layered on top of a Developer identity, plus its saved-project lists and outbound messages.
- **Owner:** the registering Developer (one Publisher Account per Developer, `user_id` unique).
- **Lifecycle:** register → verified (admin-controlled `verified` flag) → operate (create shortlists, contact developers, Phase 1).
- **Relationships:** has many Shortlists (each a named list of Project ids in a `jsonb` array); has many Contacts (messages to specific Developers).
- **Discovery surface:** `/publishers` (public directory of verified publishers); `/dashboard/publisher` (own dashboard).
- **Notification relationship:** `contactDeveloper` triggers a notification to the contacted Developer (working since Phase 1).
- **Parent object:** Developer.

### NOTIFICATION (`notifications`)
- **Represents:** a single event needing a recipient's attention.
- **Owner/audience:** strictly the `recipient_id`; only they can read it.
- **Structure (as currently implemented):** `type` (enum: follow/comment/reply/reaction/mention) + `actor_id` + `entity_type`/`entity_id` (free-text/uuid, not resolved into a real link by the UI) + `read_at`.
- **Lifecycle:** created by the triggering action → read (mark-as-read exists via `components/notifications/MarkAllReadButton.tsx`) → never deleted.
- **Relationships:** every notification has exactly one recipient and one (optional) actor; `entity_type`/`entity_id` loosely reference another object but aren't a real foreign key or resolved link.
- **Gap, noted for the companion notification-model document:** this is a flatter `type + entity_id` structure than a mature platform's `actor → action → object` model (see the pattern library) — the same `type: 'mention'` is currently reused for both collaboration applications and publisher contacts, which is exactly the kind of ambiguity a more explicit actor/verb/object structure would resolve.

## 2. The Devlog-Centered Loop, Restated in Object Terms

Per the product design blueprint's thesis (unchanged by this research pass — the object model above confirms it, not contradicts it): the loop is

**Developer → Project → Devlog Post → (Comment/Reaction | Follow | Playtest Request → Session → Feedback | Collaboration Post → Application)**

with Studio, Game Jam, Event, and Publisher all as objects that wrap or intersect this loop rather than replace it — a Studio groups Developers' Projects, a Game Jam is a time-boxed variant of Project→Entry→Vote, an Event is adjacent community infrastructure, and a Publisher is a business-role viewer of the same Project objects everyone else sees, with an added Contact/Shortlist relationship.

---

## 3. Profile Blueprint

Derived from `docs/glyph-platform-pattern-library.md` §2 (Profiles) and §12 (Account) — LinkedIn's layered-visibility and own-vs-other-render patterns primary, GitHub's Pinned-items pattern secondary. This is a blueprint for future work, not an implementation — nothing here has been built.

| Section | Why it exists | Priority | Who sees it | Empty state | Editing | Mobile |
|---|---|---|---|---|---|---|
| **Identity** (avatar, name, username, location) | Answers "who is this" in under 5 seconds — LinkedIn's identity block is the one section always shown regardless of viewer | P0 (already exists) | Everyone | N/A (required at onboarding) | Inline on own profile (`/settings/profile`) | Stays above the fold |
| **Availability/collaboration status** | Answers "can I reach out to this person" — maps to LinkedIn's "Open to Work" preference→recommendation fan-out (pattern library §7) | P0 (already exists) | Everyone | Defaults to "closed" | `/settings/profile` | Stays above the fold |
| **Activity/momentum signal** (last posted, when) | The single highest-priority *new* addition — closes the gap named in every prior audit and confirmed again by GitHub's Pinned-items existing specifically as a counterweight to raw activity counts (pattern library §2) | P0 (recommended, not built) | Everyone | "No devlogs posted yet" (specific, not generic) | Derived, not directly editable | Stays above the fold |
| **About/bio** | Free-text narrative — LinkedIn's About section equivalent | P0 (already exists) | Everyone | Empty-state prompt on own profile only | `/settings/profile` | Below identity |
| **Featured** (1-3 pinned devlogs/projects) | Curated "best evidence," structurally distinct from chronological history — independently validated by both LinkedIn (Featured) and GitHub (Pinned) in this research pass | P1 (recommended, not built) | Everyone | Hidden entirely if empty (not shown as an empty section) — matches GitHub's "don't show Pinned if nothing's pinned" convention | Owner picks from own devlogs/projects | Below About |
| **Current project** | Answers "what are they building right now" — core to Glyph's own "still building" thesis | P0 (already exists) | Everyone | Dashed-border empty state (already the best-executed empty state in the product, per the prior UX audit — keep it) | Set via `is_primary` on a project | Below Featured |
| **Identity badges** (role/engine/experience) | Structured, scannable credibility signals — beats LinkedIn's free-text headline for Glyph's narrower domain | P0 (already exists) | Everyone | Hidden if none set | `/settings/profile` | Inline with identity |
| **Social/external links** | Already well-executed (labeled, not icon-only, per prior audit) | P0 (already exists) | Everyone | Hidden if none set | `/settings/profile` | Below badges |
| **Projects list** (beyond current/primary) | Not currently a distinct section — only the primary project is shown | P2 (recommended, not built) | Everyone | N/A — only relevant if a developer has 2+ projects | Automatic from ownership | Collapsible on mobile |
| **Follower/following counts** | De-emphasized relative to activity signal — a follower count alone doesn't answer "is this person building" (per the design blueprint's own reasoning) | P0 (already exists) | Everyone | Shows 0 | N/A | Kept small |
| **Contact info** | NOT currently a section — flagged by LinkedIn's layered-visibility pattern (pattern library §2) as something that, if added, must be gated (not public-by-default) | Not built — deliberately deferred until a real need is identified | N/A | N/A | N/A | N/A |

**Explicitly not recommended:** a LinkedIn-style Experience/Education timeline (no evidence Glyph developers want to log employment history — the "Current project" + devlog history already serves the equivalent function of "what have you been doing"); Discord-style per-context profiles (over-engineering at Glyph's scale, per pattern library §2).

## 4. Project Page Blueprint

Derived primarily from `docs/glyph-platform-pattern-library.md` §3 (Projects) — Steam's three-distinct-views pattern is the load-bearing finding here, with Behance/Dribbble/Letterboxd's project-vs-devlog confirmation as secondary support. **This is explicitly a lens for a future project-page phase, not a redesign to implement now** — consistent with every phase in this engagement keeping research and implementation separate.

**The core recommendation:** treat the public project page, the owner/team management surface, and (if ever built) a community/discussion layer as three intentional views of one canonical Project object — mirroring Steam's Store/Hub/Library split — rather than one page with conditionally-rendered owner-only elements bolted on.

| View | Audience | Primary job | Current Glyph state |
|---|---|---|---|
| **Public showcase** (`/p/[username]/[project-slug]`) | Visitor evaluating the project | Understand what it is, see credibility signals, follow/playtest | Already the strongest page in the product (per every prior audit) — structured badges + embedded playtest CTA + devlog list. Keep this view's content model; the recommendation is about relationship to the other two views, not a rebuild of this one. |
| **Owner/team management** (`/dashboard/projects/[id]/edit`, `/devlogs/new`) | The owner (and, post-Phase-1, studio teammates with access) | Edit, publish, manage | Exists, functionally adequate (confirmed in Phase 2 recon — no genuine fragmentation needing tab consolidation), but visually disconnected from the public page (different route family, no shared chrome/back-link continuity). |
| **Community/discussion** (not built) | Followers, commenters, collaborators | Discuss the project as a whole, not just one devlog | Does not exist — comments currently live only on individual devlog posts (confirmed in Phase 1 recon), not the project as a whole. This is the one genuinely new surface Steam's pattern suggests, and the one most clearly NOT to build without further evidence of need (Glyph's comment volume per project is currently far below what would justify a dedicated discussion surface). |

**What this blueprint explicitly does NOT recommend:** building the community/discussion view now (no evidence of need yet — flag for reconsideration only if devlog-comment volume grows substantially); restructuring the public showcase view's actual content (already validated as strong); merging management into the public page (Steam explicitly keeps Library separate from the Store page for good reason — an owner's editing tools have no business competing for visual space with a visitor's evaluation).

**One concrete, low-cost near-term improvement this blueprint does support:** giving the owner/management view (`/dashboard/projects/[id]/edit`) a visible link back to the public showcase view and vice versa (currently: the public page has an "Edit project" link only when `isOwner`, per Phase 1 findings; the edit page has no reciprocal "View public page" link) — a small continuity fix consistent with the three-views model without being a redesign. **GLYPH RECOMMENDATION**, small enough to fold into whichever future phase touches project pages next.
