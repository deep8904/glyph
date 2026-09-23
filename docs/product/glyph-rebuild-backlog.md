# Glyph rebuild backlog

Dependency-driven, not phased. Always work the highest-value **unblocked** item. Priority = product-model correctness → core loop → frequency → UX-failure severity → dependency value → visual impact. Status: `todo` / `in-progress` / `done` / `gated` (needs a surfaced backend/RLS decision).

---

### B1 — Discovery composition rollout
- **User problem:** discovery surfaces read as identical stacked rows in a dead-canvas column; can't tell a project from a person from an opportunity.
- **Evidence:** gap-map "Feed/Explore data contract"; ia-structure-benchmark; brief "current Explore rejected."
- **Current:** Explore hub rebuilt (ProjectMark tiles, object-specific composition, full-width). Sub-pages (`/explore/projects|developers|devlogs`), Collaborate, Playtests still use old `max-w-3xl` rows.
- **Target:** the tile-grid + object-specific language applied to `/explore/*` sub-pages; Collaborate/Playtests get opportunity-specific composition (not generic rows).
- **Deps:** none (ProjectMark/ProjectTile exist). **Design:** high. **FE:** medium. **BE:** none. **RLS:** none.
- **Priority:** high (visual impact + unblocked + continues in-flight work). **Status:** in-progress. **Test:** per-slice browser + review.

### B2 — Quick-create Project (draft-first)
- **User problem:** one long form with title/slug/visibility all up front; can't get a project created fast and improve it later.
- **Evidence:** creation-flow-benchmark §1 (GitHub minimal start + itch.io draft); gap-map "Project creation present-but-weak."
- **Current:** `ProjectForm.tsx` — single long form, private default, URL media.
- **Target:** quick-create (owner, name, one-line pitch, stage, visibility) → creates a private draft → routes to the management/edit view where description/media/links/tags are added progressively. Management edit reorganized into proof sections.
- **Deps:** none (works on current schema; draft = visibility=private for now, aligned with future `lifecycle` without requiring it). **Design:** high. **FE:** high. **BE:** none. **RLS:** none.
- **Priority:** high (core-loop entry, unblocked). **Status:** todo.

### B3 — First-class media upload (GATED)
- **User problem:** projects are games but media is URL-paste only; the single biggest "feels unfinished" gap.
- **Evidence:** feature-priority FOUNDATION #4; gap-map MUST #1.
- **Current:** `cover_url`/`screenshots` are text/jsonb of external URLs.
- **Target:** Supabase Storage bucket + RLS (owner writes, public reads for published+public), upload with progress/retry/failure, ordering, removal, alt text, draft persistence.
- **Deps:** storage bucket + policies (**new infra**). **Design:** high. **FE:** high. **BE:** storage bucket + RLS. **RLS:** new (surfaced).
- **Priority:** high but **gated** on the storage/RLS decision. **Status:** gated.

### B4 — Project state-model separation (GATED)
- **User problem:** "private" means both "draft" and "finished but hidden"; no archive; discovery eligibility is implicit.
- **Evidence:** recommended-architecture "keep axes independent"; feature-priority FOUNDATION #2–3; verified in schema (no lifecycle column).
- **Current:** `visibility` conflates lifecycle; `stage` ok; eligibility derived in `discoverable_projects`.
- **Target:** add `projects.lifecycle` (draft/published/archived) + `archived_at`; RLS: owner sees own drafts, public sees published+public; update discoverable views; backfill rule defined.
- **Deps:** migration + RLS rewrite across every actor + view updates (**highest blast radius**). **Design:** medium. **FE:** medium. **BE:** migration. **RLS:** rewrite (surfaced).
- **Priority:** foundation, but **gated** — irreversible production-data migration + RLS intent, surfaced before execution. **Status:** gated.

### B5 — Devlog media + typed update
- **User problem:** devlogs are text-only; can't show a build screenshot/gif; no update type.
- **Evidence:** creation-flow-benchmark §2; gap-map.
- **Deps:** B3 (media upload). **Priority:** high (blocked by B3). **Status:** blocked.

### B6 — Nav promotion: Following + Opportunities
- **Evidence:** recommended-architecture global nav (Home/Explore/Following/Opportunities).
- **Current:** rail = Home/Explore only; Following lives at /feed, Opportunities split across Collaborate/Playtests.
- **Target:** promote Following (feed) and an Opportunities hub to primary nav once inventory justifies; keep Create an action.
- **Deps:** an Opportunities hub route (Collaborate+Playtests unified index). **Priority:** medium. **Status:** todo.

### B7 — Collaboration structure + handoff
- **Evidence:** creation-flow-benchmark §3; feature-priority CORE #3.
- **Target:** structured skills/duration/questions, shortlist/pause, reviewer grant, explicit post-acceptance handoff (not open DM). **Deps:** scoped-comms model for handoff. **Priority:** high. **Status:** todo (partially blocked by comms).

### B8 — Playtest cohort/eligibility/expiry
- **Evidence:** creation-flow-benchmark §4; feature-priority CORE #4. **Priority:** high. **Status:** todo.

### B9 — Timezone-safe dates (events/jams/playtests)
- **Evidence:** feature-priority FOUNDATION #5; gap-map MUST. **Target:** store UTC + IANA zone. **Deps:** migration (additive). **Priority:** high. **Status:** todo (light migration).

### B10 — Scoped communication + handoff (GATED)
- **Evidence:** recommended-architecture; "no open DMs." **Target:** Project-context threads for collaboration/playtest/publisher, with safety boundaries. **Deps:** new `threads`/`messages` + RLS. **Priority:** medium. **Status:** gated.

### B11 — Safety + staleness
- **Evidence:** gap-map underweighted cross-cutting. **Target:** report/block/mute (block/mute exist), suspicious-link handling, opportunity expiry/auto-close/last-active. **Priority:** medium. **Status:** todo.

### B12 — Authoring recovery (autosave/resume/retry)
- **Evidence:** feature-priority; creation-flow contract. **Target:** autosave drafts + resume + upload retry on Project/Devlog. **Deps:** B2/B3. **Priority:** medium. **Status:** todo.

---

## Working now

**B1** (unblocked, in-flight, high visual impact) then **B2** (unblocked core-loop entry). B3/B4/B10 are **gated** — designed in the plan, surfaced for the storage/RLS/migration decision before execution, so unblocked UI/flow work is not held up.
