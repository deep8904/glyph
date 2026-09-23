# Glyph rebuild plan

Research-driven product rebuild. Evidence base: `docs/research/glyph-recommended-product-architecture.md`, `glyph-feature-priority.md`, `glyph-product-gap-map.md`, `glyph-creation-flow-benchmark.md`, `glyph-ia-structure-benchmark.md`, plus the competitor/pattern/matrix detail docs and the design audits. Product model verified against the live schema (Supabase project `adiovtzggkpzrfqmevyx`), not just the docs.

## Current product model (verified against schema + code)

- **Developer** (`profiles`): identity, availability (`collaboration_status`), current work via `is_primary` project. Proof-led profile shipped (R3 CurrentWork).
- **Project** (`projects`): the durable hub — but its **state is under-modeled**. Columns: `visibility` (public/unlisted/private, NOT NULL), `stage` (concept…released, nullable), `is_primary`. There is **no lifecycle axis** (draft/published/archived) and **no explicit discovery-eligibility** column — "draft" is implicitly `visibility=private`, discovery eligibility is derived inside `discoverable_projects` (public + not blocked/muted). Media = `cover_url`/`cover_image_url`/`screenshots` (jsonb of URLs) — **URL-only, no upload**.
- **Devlog** (`devlog_posts`): Project-scoped; draft = `published_at IS NULL`; Markdown body; no media, no typed update, no schedule.
- **Collaboration / Playtest / Events / Jams / Studios / Publisher**: present with real state machines + RLS (per gap-map "present but weak"); each is thin on structured fields, lifecycle clarity, and handoff.
- **Discovery**: Explore rebuilt this cycle (full-width, ProjectMark tiles, object-specific composition). Search is correct retrieval-first.
- **Home/Dashboard**: action queue with Needs-attention separated from activity (R4). Distinct from Feed + Notifications already.

## Target product model (from research)

Glyph = **the professional home for a game while it is being built.** Identity is earned through visible Projects + Devlogs; Collaboration/Playtest are structured operations on Projects; Studios organize responsibility; Jams/Events are time-bound participation; Publishers relate privately to canonical Projects. Reject: engagement feed, pay-to-rank, reputation scores, gig bidding, ATS, full CRM, open DMs, default AI-written text.

**Global nav (research):** Home, Explore, Following, Opportunities; Create is an action; utilities Search/Notifications/Profile. Mobile: Home/Explore/Create/Alerts/You. (Current nav: Home/Explore only in rail + section tabs — needs Following + Opportunities promotion once inventory justifies.)

**State model — keep independent axes independent** (the load-bearing foundation decision):

| Axis | Values | Current column | Target |
|---|---|---|---|
| Editorial lifecycle | draft, published, archived | *none* (conflated into visibility) | new `lifecycle` |
| Audience visibility | private, unlisted, public | `visibility` ✓ | keep |
| Discovery eligibility | excluded, eligible | derived in view | keep derived; make reason explicit |
| Domain stage | concept…released | `stage` ✓ | keep |
| History | reopened, archived, etc. | timestamps | audit/timeline |

## Current gaps (prioritized — see backlog for full detail)

FOUNDATION: state-model separation (lifecycle vs visibility); first-class **media upload** (biggest gap — projects are games, media is URL-only today); timezone-safe dates; authoring recovery (autosave/resume/retry). CORE LOOP: quick-create Project (draft-first, not one long form); Devlog media + typed update; structured Collaboration + handoff; Playtest cohort/expiry/eligibility; scoped communication. RETRIEVAL: nav promotion (Following/Opportunities); staleness on opportunities.

## Dependencies

Media upload depends on a Supabase **storage bucket + RLS** (new infra). State-model lifecycle depends on a **migration + RLS rewrite across every actor + the discoverable views** — highest blast radius; gated. Quick-create Project can ship on the *current* schema (draft = visibility=private) and is **unblocked**. Devlog media depends on media upload. Scoped comms depends on a new `threads`/`messages` model + RLS.

## User flows (core loop, target)

Developer creates Project (quick: name + pitch + stage + visibility → private draft → management) → adds media/proof → publishes → writes Devlogs (Project pinned, fast) → is discovered in Explore → followed → opens a Playtest/Collaboration on the Project → testers/collaborators apply → developer reviews in the management queue (source of truth) → accepts → scoped handoff → feedback → continues building. Home aggregates "needs attention" across all of it; Notifications record awareness; Feed shows followed progress.

## Data-model impact

- **Unblocked, no migration:** quick-create flow, media *display* improvements, discovery/UI composition — use current columns.
- **Gated migrations (deliberate, design-first, RLS-reviewed, all-actors-tested):**
  1. `projects.lifecycle` enum + backfill (`visibility=private` → keep visibility; set lifecycle=draft where no published devlog?  — needs a defined backfill rule) + `archived_at`. RLS: owner sees own drafts; public sees `lifecycle=published AND visibility=public`. Update `discoverable_projects`.
  2. Media: `project_assets` table (or storage bucket) + storage RLS + ordering.
  3. Timezone columns (`*_tz` IANA) on events/jams/playtests.
  These are **surfaced before execution** (RLS intent + irreversible production-data change per the working agreement).

## UI impact

Project creation → quick-create + management. Project edit → progressive sections + media manager. Devlog → media + typed. Nav → add Following/Opportunities. Continue the discovery composition language (ProjectMark, object-specific layouts) across sub-pages, Collaborate, Playtests, ecosystem.

## Backend impact

New: storage bucket + policies (media); `lifecycle`/`archived_at` (projects); timezone columns; possibly `project_assets`. Each with a migration + RLS + audit. No change to auth, ownership, or the existing collaboration/playtest lifecycles beyond additive structure.

## Security impact

Every new state transition = authorized server op with audit. Never leak build URLs, eligibility/application answers, private notes, shortlists, or moderation evidence in public payloads. Storage RLS: only the project owner writes; public reads only for published+public projects. Lifecycle RLS is the highest-risk item → design + review + all-actor test before merge.

## Design references

Per-surface references documented in `glyph-rebuild-progress.md` at redesign time (Inspiration Rule: reference / pattern / why / adopt / don't-copy). Explore already done (itch.io live). Creation: GitHub minimal-start + itch.io draft + Behance ordered media (from the creation-flow benchmark).

## Test plan

Per slice: `tsc` + ESLint + `npm run build` + browser at 375/768/1024/1280/1440 + owner/visitor/empty/error/no-media/long-content states + independent multi-agent review (product/UX/visual/frontend/a11y/target-user) scored against the 12-category rubric (critical ≥8, avg ≥8.5). Migrations additionally: role-impersonation RLS tests for every actor before merge.

## Execution order (dependency-driven, not phases)

1. **Plan + backlog** (this) → 2. **Discovery composition rollout** (unblocked, in-flight: Explore done; extend to sub-pages/Collaborate/Playtests) → 3. **Quick-create Project** (unblocked, current schema) → 4. **Media upload** (gated: storage infra) → 5. **State-model migration** (gated: RLS) → 6. Devlog media/typed → 7. Collaboration structure + handoff → 8. Playtest cohort → 9. nav promotion → 10. ecosystem (events tz, jams, studios, publishers) → 11. safety/staleness/comms.

Gated items (4, 5, and comms) are designed here and surfaced for the RLS/irreversible-migration decision before execution; unblocked UI/flow work proceeds continuously without stopping.
