# Project State Model — Design Document (B4)

Status: **reviewed — see §17 Review Addendum below. Approved to proceed to migration.**

Original status before review: draft, pending internal review. No migration is written until this document is
reviewed and the actor matrix (below) is checked against every route listed in "Impact analysis."

This document separates four axes that the current schema conflates into one (`visibility`), per
the architecture directive. It is evidence-based: every claim below is backed by a specific file
and line, not an assumption.

---

## 1. CURRENT MODEL

### Schema (as of migration 039)

`public.projects` (002_projects.sql, extended by 003_devlogs.sql):

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `owner_id` | uuid | FK profiles, cascade delete |
| `title` | text | required |
| `slug` | text | **nullable**, unique per owner where not null (003) |
| `short_description`, `long_description` | text | |
| `tags` | text[] | default `{}` |
| `engine`, `genre` | text | free text |
| `stage` | text | `concept`\|`prototype`\|`alpha`\|`beta`\|`released` — no CHECK constraint, enforced only in app code (`lib/supabase/types.ts` `PROJECT_STAGES`) |
| `cover_url`, `cover_image_url` | text | two cover columns exist (002 and 003); app code reads `cover_url ?? cover_image_url` everywhere — pre-existing duplication, out of scope for this doc |
| `screenshots` | jsonb | default `[]`, array of URL strings |
| `external_links` | jsonb | default `{}` |
| `visibility` | text | **`public`\|`unlisted`\|`private`, default `'public'`**, CHECK-constrained (003) |
| `is_primary` | boolean | default `false` — "pinned as current work," orthogonal to state; unchanged by this doc |
| `fts` | tsvector | search index (006) |

**There is no `lifecycle` column, no `archived` state, and no `draft` state anywhere in the
schema.** A project exists on a single axis: `visibility`.

### The accidental fifth state: slug = NULL

`ProjectForm` (`components/dashboard/ProjectForm.tsx:94-97`) makes slug **required** for every
project created or edited through the normal UI. But **onboarding creates a project without going
through `ProjectForm`** — `app/onboarding/page.tsx:150-157` inserts directly:

```ts
await supabase.from('projects').insert({
  owner_id: user.id, title, short_description, stage, is_primary: true,
})
```

No `slug`, no `visibility` (so it defaults to `'public'`). The result: a project that is
`visibility = 'public'` in the database, but has no route (`/p/[username]/[slug]` requires a slug)
and is excluded from every discovery surface, because `discoverable_projects`
(030_discovery_views_and_search_functions.sql:112) requires `p.slug is not null`. Every list-row
component already defends against this (`ProjectRow`, `ProjectMark`, `CurrentWorkPanel` all do
`project.slug ? href : null`), so nothing crashes — but the project is a de facto, undocumented
draft that the schema calls "public." This is the exact conflation the directive names.

### RLS today

`public.projects` (023_fix_projects_visibility_rls.sql, the only policy after the 002 policy it
replaced):

```sql
create policy "projects_read" on public.projects for select using (
  visibility in ('public', 'unlisted') or auth.uid() = owner_id
);
-- unchanged from 002: "Users can manage their own projects" for all using (auth.uid() = owner_id)
```

Single-owner, single-axis. No lifecycle check (there is no lifecycle column to check).

### Discovery today

`discoverable_projects` view (030:84-113):
```sql
where p.visibility = 'public' and p.slug is not null and not hidden_from_viewer(p.owner_id)
```
Three conditions, two of which (`slug is not null`) are an accident of the onboarding code path
rather than a designed rule.

### A confirmed, real RLS inconsistency (found during this inspection)

Playtests and Collaboration **diverge** on whether a role/opportunity's discoverability is coupled
to its project's visibility:

- `discoverable_playtests` (032:443-450) — **correctly coupled**:
  ```sql
  from public.playtest_requests r
  join public.projects pj on pj.id = r.project_id and pj.visibility = 'public'
  ```
  An inner join with the visibility condition baked in: a playtest on a non-public project simply
  does not appear.

- `discoverable_collab_posts` (032:429-441) — **not coupled**:
  ```sql
  from public.collaboration_posts c
  join public.profiles pr on pr.id = c.author_id
  left join public.projects pj on pj.id = c.project_id
  where c.status = 'open' and c.expires_at > now() and not hidden_from_viewer(c.author_id)
  ```
  No visibility condition. Because the view is `security_invoker = true`, the LEFT JOIN's own RLS
  (`projects_read`) does stop `pj.title`/`pj.slug` from leaking for a private project — they come
  back `null` — but **the collaboration post itself (role, description, contract type, remote,
  location) still appears on the public Collaborate board and in Search's Opportunities scope**,
  with a blank project name. A stranger can see "Looking for an Artist, Revenue Share, Remote OK"
  for a project its owner marked private. Not a full data leak (title/slug are protected by the
  join's own RLS), but a real, confirmed inconsistency and a minor existence-leak. **This gets
  fixed as part of the B4 RLS redesign** (align `discoverable_collab_posts` to the same
  inner-join-with-visibility pattern `discoverable_playtests` already uses correctly) — not a
  separate ambiguous decision; it is the same bug class as 023, with an established fix pattern.

### Other current dependents (impact-analysis inventory)

App-level `visibility` checks (everywhere the DB isn't trusted alone to enforce it):
- `app/p/[username]/[project-slug]/page.tsx` — `if (project.visibility === 'private' && !isOwner) notFound()`
- `app/p/[username]/[project-slug]/[devlog-slug]/page.tsx` — same pattern, for the devlog's parent project
- `components/dashboard/ProjectForm.tsx` — the visibility `<Select>`
- `components/studios/StudioManageClient.tsx` — shows a project's visibility when linking it to a studio

Everything else (Explore, Search, Feed, Profile "Current work"/"Projects," Studios' project list,
the owner Dashboard) reads through `discoverable_projects` or relies on RLS directly (no
app-level visibility filter) — see the per-surface tables in §6–§9 below.

---

## 2. TARGET MODEL

Four independent axes. A change to one never implicitly changes another.

| Axis | Values | Stored? | Owner-settable? |
|---|---|---|---|
| **Lifecycle** | `draft`, `published`, `archived` | New column, `projects.lifecycle text not null default 'published'` | Yes (draft↔published, published→archived) |
| **Visibility** | `public`, `unlisted`, `private` | Existing column, unchanged | Yes (unchanged) |
| **Discovery eligibility** | derived, not stored | **No new column** — computed in the `discoverable_projects` view | No — a fact, not a setting |
| **Development stage** | `concept`, `prototype`, `alpha`, `beta`, `released` | Existing `stage` column, unchanged | Yes (unchanged) |

### Why discovery stays derived, not a column

The directive is explicit that a mutable `discovery_status` should not be added unless genuinely
required. Nothing inspected here requires it: discovery eligibility is fully determined by facts
already on the row —

```
eligible_for_discovery :=
  lifecycle = 'published'
  and visibility = 'public'
  and slug is not null
  and not hidden_from_viewer(owner_id)
```

`slug is not null` stays a condition (not folded into lifecycle) because slug-presence is a
**readiness** fact (can this project even be linked to?), independent of the owner's own
draft/published intent — a published project could theoretically still lack a slug only through a
direct-insert path like onboarding's, which is exactly the case this model closes off (see §10:
the new project-creation flow assigns a slug before allowing `lifecycle = 'published'`).

---

## 3. STATE DEFINITIONS

**Lifecycle**
- `draft` — the owner is still assembling it. Not discoverable under any visibility. Visible only
  to the owner (and, per Owner Access below, accepted collaborators once that feature exists).
- `published` — the owner has committed to showing this project publicly (subject to its own
  `visibility` value — `published` does not mean `public`; a project can be `published` +
  `private`, meaning "I'm done drafting, but I'm still keeping it to myself").
- `archived` — the owner is done actively maintaining it. Still viewable per its `visibility`, but
  excluded from discovery and from "currently building" framing (Current Work, Dashboard).

**Visibility** (unchanged) — `public` (discoverable + directly viewable by anyone), `unlisted`
(directly viewable by anyone with the link, never listed), `private` (owner only).

**Development stage** (unchanged) — `concept`/`prototype`/`alpha`/`beta`/`released`. This is a
statement about the *game*, not the *project record*, and stays fully independent: a `released`
game can be `archived`; a `concept`-stage game can be `published` and `public` on day one.

---

## 4. VALID TRANSITIONS

**Lifecycle** (owner-only):
```
draft  ──publish──▶ published ──archive──▶ archived
  ▲                      │                     │
  └──────unpublish───────┘                     │
                          ▲─────restore─────────┘
```
- `draft → published`: requires `slug is not null` (enforced by a CHECK constraint, §10).
- `published → draft` ("unpublish"): allowed. Removes it from discovery immediately (lifecycle
  check fails). Existing devlogs, playtests, and collaboration posts on it are **not** deleted —
  see Archive/Delete rules below for what happens to them.
- `published → archived`: allowed any time.
- `archived → published` ("restore"): allowed any time.
- `archived → draft`: **not offered in the UI** (archiving implies "this was finished," going
  back to draft implies "this was never finished" — different intents). Not blocked at the DB
  level (no reason to forbid it structurally), just not a button the UI presents.

**Visibility**: unchanged, all six transitions already freely allowed by the existing RLS `all`
policy, independent of lifecycle.

**Development stage**: unchanged, freely settable, independent of the other two axes.

---

## 5. OWNER ACCESS

Unchanged and unaffected by this model: `"Users can manage their own projects" for all using
(auth.uid() = owner_id)`. The owner can always SELECT/UPDATE/DELETE their own project in any
combination of lifecycle × visibility × stage. This policy does not need to change.

---

## 6. PUBLIC ACCESS (direct view — `/p/[username]/[slug]`)

The **"can be viewed" rule stays visibility-only**, per the directive's explicit instruction to
keep "can be viewed" separate from "should appear in discovery." A project's direct page is not
gated by lifecycle — an owner who wants to share a draft-quality but `public`-visibility project
via a direct link (e.g. to get early feedback from a friend before "publishing" it into discovery)
can. Lifecycle does not become a second visibility gate.

New `projects_read` policy:
```sql
create policy "projects_read" on public.projects for select using (
  visibility in ('public', 'unlisted') or auth.uid() = owner_id
);
```
**Unchanged from today.** Lifecycle plays no role in row-level SELECT access — it plays a role
only in the *derived discovery* computation (§2), which lives in the view layer, not in RLS.

Devlogs, screenshots, and playtest/collaboration posts attached to the project follow the
project's visibility transitively where they don't already have their own visibility rule (see
§13 for the confirmed inconsistency being fixed here).

---

## 7. DISCOVERY RULES (Explore, the project browse grid)

`discoverable_projects` gains one condition:
```sql
where p.lifecycle = 'published'
  and p.visibility = 'public'
  and p.slug is not null
  and not public.hidden_from_viewer(p.owner_id)
```
(`slug is not null` becomes redundant once `draft → published` requires a slug, but is kept as a
defense-in-depth condition — cheap, and protects against any future direct-insert path repeating
onboarding's mistake.)

---

## 8. SEARCH RULES

`search_projects` (030) selects from `discoverable_projects` — inherits the lifecycle condition
automatically, no separate change needed. Same for the Studios/Opportunities scopes I added this
session (`searchStudios`, `searchOpportunities` in `lib/discovery/queries.ts`) once
`discoverable_collab_posts` is fixed to require `visibility = 'public'` (§13) — search never
bypasses the views.

---

## 9. PROFILE RULES (Current Work, Projects list)

`app/dev/[username]/page.tsx` queries `projects` directly (not through `discoverable_projects`)
and relies on RLS alone — this is intentional and correct today (a signed-in owner viewing their
own profile should see their own private/draft projects; RLS already handles that via `auth.uid()
= owner_id`). Two behavior changes needed:

- **Current Work** (`is_primary = true` project): should not surface an `archived` project as
  "currently building" — that phrase is a lifecycle claim. Add `lifecycle != 'archived'` to the
  current-project selection query (currently orders by `is_primary desc, updated_at desc` with no
  lifecycle filter).
- **Projects list** (the "Projects" section below Current Work): a **visitor** (non-owner) sees
  only `lifecycle = 'published'` projects there — **explicit decision, made during review (§17.3):
  this excludes both `draft` and `archived`**, not just draft. Archived is deliberately excluded
  from the visitor-facing list for the same reason it's excluded from Current Work and discovery:
  it is a "not actively representing what I'm building" state, and a visitor's Projects list is
  exactly the "what is this person building" surface. RLS alone doesn't distinguish any of this
  (RLS is visibility-only, by design, per §6), so it becomes an **app-level** filter,
  `.eq('lifecycle', 'published')`, added only when `!isOwner`. The **owner** viewing their own
  profile continues to see everything, including drafts and archived, so they can find and manage
  them — but the UI should label a draft or archived row so the owner doesn't mistake it for what
  a visitor sees (a small, owner-only badge: "Draft" / "Archived").

---

## 10. FEED RULES

`feed_items` view (029) already requires `p.visibility = 'public'`. Add `dp.published_at is not
null` is already there for the *devlog*; add `p.lifecycle = 'published'` for the *project* — a
devlog on a project its owner has since moved back to draft should stop appearing in followers'
feeds. (Rare case — unpublishing an already-fed project — but the rule should be consistent with
Explore/Search.)

---

## 11. ARCHIVE RULES

Archiving is **non-destructive**. An archived project:
- Keeps all its devlogs, screenshots, external links, tags — nothing is deleted.
- Is excluded from Explore/Search/Feed (via the discovery condition, §7).
- Is excluded from "Current Work" framing on the owner's profile and Dashboard (§9).
- **Existing open playtests and collaboration posts on an archived project are force-closed** at
  the moment of archiving (a server-side transition, not left to the owner to remember) — an
  archived project shouldn't keep recruiting testers or collaborators. This requires a small
  trigger or an explicit update in the archive action (`update playtest_requests set status =
  'closed' where project_id = :id and status = 'open'`, and equivalent for
  `collaboration_posts`). Existing accepted sessions/applications are untouched (their own status
  already reflects the relationship; only the *open recruiting* state closes).
- Remains directly viewable exactly as before (§6) — archiving is not a visibility change.

---

## 12. DELETE RULES

Unchanged by this document — project deletion already cascades via `owner_id references
profiles(id) on delete cascade` at the profile level, and `project_id references projects(id) on
delete cascade` on devlogs/playtests/collaboration posts/studio links (verified present on every
dependent table's FK in migrations 003/008/010/012). Deleting a project is already destructive and
already fully cascades. This document does not change delete behavior — lifecycle gives owners a
non-destructive alternative (`archived`) they didn't have before, which should reduce actual
deletes, but the delete path itself needs no schema change.

---

## 13. RLS CONSEQUENCES — the actor matrix

Every state combination below, and what each actor may do. "View" = SELECT the row directly
(§6 rule: visibility-only). "Discover" = appears in Explore/Search/Feed (§7 rule: lifecycle +
visibility + slug). Owner can always do everything; only non-owner columns are interesting.

| Lifecycle | Visibility | Anon | Auth non-owner | Owner |
|---|---|---|---|---|
| draft | public | ✕ view, ✕ discover | ✕ view, ✕ discover | ✓ view, ✓ edit |
| draft | unlisted | ✕ view, ✕ discover | ✕ view, ✕ discover | ✓ view, ✓ edit |
| draft | private | ✕ view, ✕ discover | ✕ view, ✕ discover | ✓ view, ✓ edit |
| published | public | ✓ view, ✓ discover | ✓ view, ✓ discover | ✓ view, ✓ edit |
| published | unlisted | ✓ view (link only), ✕ discover | ✓ view (link only), ✕ discover | ✓ view, ✓ edit |
| published | private | ✕ view, ✕ discover | ✕ view, ✕ discover | ✓ view, ✓ edit |
| archived | public | ✓ view, ✕ discover | ✓ view, ✕ discover | ✓ view, ✓ edit |
| archived | unlisted | ✓ view (link only), ✕ discover | ✓ view (link only), ✕ discover | ✓ view, ✓ edit |
| archived | private | ✕ view, ✕ discover | ✕ view, ✕ discover | ✓ view, ✓ edit |

Wait — the `draft` row above says "✕ view" for everyone but the owner, **regardless of
visibility**. This is a deliberate departure from §6's "visibility alone gates viewing": draft is
the one state where an app-level gate is added on top of RLS, because a draft is explicitly
"still being assembled" — the same reasoning that makes devlog drafts owner-only today
(`devlog_posts` already has exactly this pattern: `published_at is not null` OR
`author_id = auth.uid()`). **This means the `projects_read` RLS policy needs a lifecycle
condition after all**, refining §6:

```sql
create policy "projects_read" on public.projects for select using (
  (lifecycle != 'draft' and visibility in ('public', 'unlisted'))
  or auth.uid() = owner_id
);
```

This is the one correction to §6 found while building the actor matrix — draft status *does* gate
direct viewing (matching devlog draft behavior, which is the closest existing precedent in this
codebase), while published/archived continue to be gated by visibility alone, exactly as today.

**Other actors, tested explicitly per the directive:**
- **Studio member** (non-owner): no special read access to a fellow member's project today
  (`studio_projects` links a project to a studio for *display* on the studio page only — the
  studio page's project list already goes through `discoverable_projects`, so a draft or private
  member project correctly does not appear there, no change needed). A studio member does not
  gain project-edit rights through studio membership (`"Users can manage their own projects"` is
  keyed to `owner_id`, not studio membership) — unchanged, and out of scope for this document (a
  separate, real gap — studios have no shared project ownership — but not a lifecycle/visibility
  question).
- **Accepted collaborator**: same finding — no elevated project access exists today via a
  collaboration acceptance. Out of scope here (belongs to the "acceptance must go somewhere"
  work item later in the roadmap), but flagged: once that handoff exists, it should **not**
  grant draft-visibility by default — a collaborator seeing the project's current draft state is
  a deliberate future decision, not a side effect of this migration.
- **Playtester**: playtest build access is already independent of project visibility (verified —
  `get_playtest_build` RPC gates on session acceptance, migration 032, not on project state).
  Unaffected by this document.

**Leakage tests required before rollout** (per the security gate):
1. Draft project — anon SELECT via REST API directly on `projects` table → must return 0 rows.
2. Draft project — appears in `discoverable_projects` → must return 0 rows.
3. Private project — anon SELECT via REST API → must return 0 rows (existing test from 023,
   re-run to confirm no regression).
4. Unlisted project — appears in `discoverable_projects` → must return 0 rows (existing behavior,
   re-run to confirm no regression).
5. Archived + public project — appears in `discoverable_projects` → must return 0 rows; direct
   view by anon → must succeed.
6. Devlog on a draft project — anon SELECT → must return 0 rows (devlog RLS already independently
   checks `published_at`, but re-verify the project-visibility join added in 024 doesn't
   accidentally allow a draft-project's published devlog through).
7. **Collaboration post on a private project** — appears in `discoverable_collab_posts` or Search
   → must return 0 rows (this is the confirmed bug from §1, fixed here).
8. Playtest request on a draft project — appears in `discoverable_playtests` → must return 0 rows
   (add `pj.lifecycle = 'published'` alongside the existing `pj.visibility = 'public'` join
   condition).
9. Media (cover/screenshots) on a draft or private project — not fetchable by URL guessing once
   B3 (storage) exists; deferred to that work, flagged here so it isn't forgotten.
10. **Jam entry on a private or draft project** — anon SELECT on `jam_entries` (joined to its
    project) still returns the entry row → must return 0 rows for the *project-identifying* fields
    once fixed (found in review, §17.1 — same bug class as #7, a different table entirely, missed
    in the original inventory).

Any failure among 1–8 **stops rollout** per the directive.

---

## 14. MIGRATION PLAN

Additive, staged, reversible at every step — no single opaque migration.

1. **Schema**: `alter table public.projects add column lifecycle text not null default
   'published' check (lifecycle in ('draft','published','archived'));`
2. **Backfill** (see §15 for the reasoning): default `'published'` applies to all existing rows
   via the column default — no separate UPDATE needed for the general case. **One explicit
   exception**: `update public.projects set lifecycle = 'draft' where slug is null;` — the only
   deterministic, code-verified signal (not a visibility-based heuristic) that a row was never
   completed through the real creation flow.
3. **Constraint**: `alter table public.projects add constraint slug_required_when_published check
   (lifecycle = 'draft' or slug is not null);` — makes the discovery view's `slug is not null`
   condition structurally guaranteed for every non-draft row, not just conventionally true.
4. **RLS** (moved ahead of views — see §17.2): replace `projects_read` with the corrected policy
   from §13. This closes draft-project direct-viewability *before* anything downstream is touched,
   so there is no deploy window where a draft `visibility='public'` project is viewable by RLS
   while only the view layer has caught up.
5. **Views**: update `discoverable_projects` (add `lifecycle = 'published'`), `discoverable_playtests`
   (add `pj.lifecycle = 'published'` to the join condition), `discoverable_collab_posts` (change
   `left join` to `join ... and pj.visibility = 'public' and (pj.lifecycle = 'published' or
   pj.project_id is null)` — a collaboration post with no linked project at all stays visible,
   since it was never gated on project state to begin with; the fix only applies when a project
   *is* linked), `feed_items` (add `p.lifecycle = 'published'`), and `jam_entries_read` (see
   §17.1 — couple it to the linked project's visibility, the same bug class as
   `discoverable_collab_posts`, found in review).
6. **Server queries**: Profile's owner-vs-visitor Projects-list filter — now `lifecycle =
   'published'` exactly (excludes both draft and archived for a visitor; see §17.3), Current
   Work's `lifecycle != 'archived'` filter (§9).
7. **Creation/edit UI**: `ProjectForm` gains a lifecycle control (draft/published toggle, plus an
   "Archive this project" action on the edit page, separate from the form — archiving is a state
   transition with its own confirmation, not a form field to save accidentally). Onboarding's
   direct insert (`app/onboarding/page.tsx:150-157`) gets `lifecycle: 'draft'` explicitly — it
   should never again produce a project the schema calls "published" by accident.
8. **Test all actors** (§13's leakage list, extended in §17.1, plus the existing regression test
   suite if one exists — verify with `npm run build` + `tsc --noEmit` + a manual RLS check via
   the anon key, matching the method 023's own audit used).
9. **Verify no accidental visibility change**: run the leakage list against a snapshot of
   pre-migration data (every existing project, before and after, same visibility, same
   reachability at its direct URL) — the migration must not change what any existing project's
   *direct link* shows, only what's newly true about discovery.
10. **Verify rollback** (§16) actually restores the pre-migration `discoverable_projects` behavior
    before this migration is considered safe to ship.

---

## 15. BACKFILL — the exact rule and its justification

```
existing lifecycle = 'published'
existing visibility = unchanged
```

**except**: rows where `slug is null` backfill to `lifecycle = 'draft'`.

This is not a visibility-based heuristic (the directive's specific warning). It is a
**code-verified fact**: a null-slug project has never been reachable at a public URL, has never
appeared in `discoverable_projects`, and — per `ProjectForm`'s own required-field validation — was
never fully completed through the app's real creation form. Calling it "published" would be false
by the new model's own definition (published requires `slug is not null`, enforced structurally by
step 3's CHECK constraint). Every other existing project — regardless of its `visibility` value —
backfills to `published`, exactly as instructed: **public stays public, private stays private**,
and the old model's private rows are treated as established, published records whose owner chose
not to show them, not as unfinished drafts.

---

## 16. ROLLBACK PLAN

Every step in §14 is reversible independently:
- Views/RLS/server-query changes: redeploy the previous version of each (they are pure
  read-rule changes, not data changes — reverting them is a code revert, not a data operation).
- The `lifecycle` column and its constraint: `alter table public.projects drop column lifecycle;`
  is safe at any point **before** any code depends on it for a decision other than reading
  (nothing in this plan ever derives a *destructive* action from `lifecycle`, so there is no
  data loss risk in dropping it — the one non-reversible side effect is §11's playtest/
  collaboration-post auto-close on archive, which is why that specific action needs its own
  explicit confirmation step and audit log entry, not a blanket "archiving is fully reversible"
  claim).
- If rollback happens after real users have set `lifecycle = 'draft'` on projects created after
  the migration: those projects simply become permanently non-discoverable-but-still-owner-visible
  until the column is reintroduced — no data is lost, they are not deleted, only the lifecycle
  signal is (temporarily) unavailable. Document this specific consequence to the team before
  rolling back in production, not just before rolling forward.

---

## Open questions for review (not blocking the design, blocking only the migration)

1. Should `draft → archived` be reachable directly (skip publishing entirely)? Current plan: no
   UI path for it (matches "archived implies it was finished"), but not structurally forbidden.
   Low stakes either way — flag for reviewer preference, not a blocker.
2. §13's studio-member / accepted-collaborator access gaps are real but explicitly out of scope
   for this migration — confirm reviewer agrees they stay out of scope here rather than being
   pulled in.
3. The `cover_url` / `cover_image_url` duplicate-column situation (noted in §1) is pre-existing
   and unrelated to state — flagged for whoever picks up B3 media infrastructure, not for this
   migration to fix.

---

## 17. REVIEW ADDENDUM

An adversarial review (verifying every claim against the actual source, not the document's
paraphrasing) checked: the collab-posts bug's root cause and its "not a full leak" explanation,
all 9 lifecycle×visibility rows in the actor matrix against the exact proposed SQL, the backfill
rule's safety, migration-ordering for a mid-rollout security window, the CHECK constraint's
correctness given the backfill, missed surfaces, derived-discovery performance, and internal
consistency. Verdict: **no blockers**. Three should-fix items, all resolved in this revision;
one accepted tradeoff, documented rather than silently left implicit.

**17.1 — Missed surface: `jam_entries` has the same bug class as the collab-posts leak.**
`jam_entries_read` (011_game_jams.sql:84) is `for select using (true)` — fully public, no
visibility or lifecycle coupling to the linked project at all. A jam entry's `project_id`,
`team_lead_id`, `submission_url`, and `submission_notes` are readable regardless of the project's
state. Same mechanism as `discoverable_collab_posts` (§1): the *project's own* title/slug would
come back null through any RLS-respecting join, but the entry row itself, and its submission
details, do not depend on that. **Added to scope**: `jam_entries_read` gets the same fix as
`discoverable_collab_posts` — couple it to `exists (select 1 from projects p where p.id =
jam_entries.project_id and p.visibility = 'public' and p.lifecycle = 'published')`. This was not
part of B4's original inventory (Jams wasn't on the axis-conflation list because it doesn't have
its own state model to redesign) but the leak itself belongs to the same rollout, since it's the
identical root cause found while doing this work. Added to §13's leakage-test list as test 10,
and to §14's migration plan step 5 (views).

**17.2 — Migration-ordering window, closed.** Original plan updated views (step 4) before RLS
(step 5), leaving a deploy window where a `draft` + `visibility='public'` project would be
directly viewable (old RLS, no lifecycle check yet) even though it had already stopped appearing
in Explore (new view, lifecycle check already live). Not a leak beyond what RLS already allowed
pre-migration, but a real, avoidable regression window. **Fixed**: RLS now moves to step 4, views
to step 5 — the direct-view gate closes before anything downstream is touched, so there is no
window, however brief, where a draft project is more viewable than the target model intends.

**17.3 — Archived visibility to profile visitors, made explicit.** The original §9 said a visitor
sees only `published` projects "never draft," without stating whether `archived` also falls out of
that filter. The proposed code (`.eq('lifecycle', 'published')`) already excluded archived too —
correctly, by construction — but the document's *prose* didn't say so, leaving it an implicit side
effect rather than a stated decision. **Fixed**: §9 now states explicitly that a visitor's
Projects list excludes both draft and archived, and why (archived is a "not actively representing
current work" state, consistent with its exclusion from Current Work and discovery).

**17.4 — Backfill accepted tradeoff, now stated.** The backfill (§15) never makes an existing
project less visible than before (visibility is untouched) — that direction was already verified
safe. The review surfaced the converse, previously implicit: a `visibility='public'`,
`slug`-having project that was, in practice, an abandoned or half-finished draft the owner never
meant to actively promote (old model had no way to express that intent at all) will backfill to
`lifecycle='published'` and become first-class discoverable-eligible, where before it was only
*technically* reachable by direct link and never listed anywhere. This is not new *reachability*
(the link already worked) but it is new *listing exposure*, and it is not something this migration
can distinguish from a genuinely-intended-to-be-public project — the old schema simply never
captured that distinction. **Accepted, not fixed**: per the directive's own instruction ("preserve
existing meaning... public stays public... do not use unreliable heuristics"), there is no safe
signal to do otherwise, and the alternative (silently draft-ing old public projects) would be a
worse, undiscussed behavior change for owners who *did* intend their project to be public. Any
owner who does not want a stale project newly appearing in Explore can archive or unpublish it
after the fact — a one-click, fully reversible action this migration adds for exactly that case.
