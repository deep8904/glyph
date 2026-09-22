# Phase D — four-surface content hierarchy and current-vs-target

Written before implementation. Scope: Dashboard, Feed, Explore, Search. Read-only consumption of existing data, views, RPCs and RLS; no migrations, no ranking, no metrics.

## 1. The four surfaces must not converge
| Surface | Primary question | Primary object | Secondary object | Ordering | Signature structure |
|---|---|---|---|---|---|
| **Dashboard** | What needs my attention? | Developer (me) + my current project | Project / Devlog | State and action (next action, pending items) | Sections answering six questions; one primary action; no lists of other people's content except a short network preview |
| **Feed** | What did the people I follow publish? | Devlog | Project / Developer | Chronological (publish time, keyset paging) | One long ordered list of `DevlogRow feed`; nothing else enters |
| **Explore** | What might I want to discover? | Project | Developer / Devlog | Discovery: grouped by what you can *do* (join a playtest, follow a project, meet a collaborator, read a devlog), each group by most recent activity | Sections with "see all" pages and URL filters; no query box in the body |
| **Search** | What am I looking for? | Typed result | Metadata | Relevance (exact name → prefix → contains, then recency) | Query first; typed tabs with counts; no browse content until a query exists |

Distinguishing rules I will keep as checks: Feed never shows other kinds of objects; Explore never shows my own state or a query result; Search never shows a section without a query; Dashboard shows other people's work only as a short, labelled network preview.

## 2. Current implementation vs target
### Dashboard `/dashboard`
**Current (READ):** client component `DashboardClient`; tiny grey `h1` "<Name>'s workspace"; profile-completeness banner (indigo card + pill chips); "Your Current Project" white rounded card with big Stage badge and pill button; "Needs Your Attention" bordered card list + notification row; "Recent Activity On Your Work" (comments on my devlogs); "From Your Network" (5 feed items, or suggested developers as pill chips); "Your Other Projects" bordered list; "More" pill links. 11px mono caps headings, dashed empty boxes, `Sparkles` empty state. Logic: next-action state machine (create project → first devlog → applications → playtest signups → share playtest → stale → continue), all preserved.
**Problems:** identity is the smallest text on the page; attention and activity read as identical lists; empty states are one dashed template; suggested developers query is `profiles ORDER BY created_at` with **no block/mute exclusion and no public-work requirement** (differs from the feed's rule); query errors are silent.
**Target:** (1) identity (avatar, name, facts, public-profile link, missing-profile prompt as text); (2) current work: `ProjectRow feature` + latest devlog + the next action as the one primary button + other projects as `compact` rows; (3) needs attention: pending applications / playtest signups / unread notifications as rows, `EmptyState cleared` when none; (4) what happened on my work: comments on my devlogs; (5) network: `DevlogRow list` with author, or `DeveloperRow compact` suggestions when following nobody, using the **same rule and function as the feed** (`fetchSuggestedDevelopers`, which excludes blocked/muted); (6) opportunities: plain destinations (Collaborate, Playtests, Jams, Events; Studios/Publisher when applicable). ≥1024px: main column (1–4) plus a side column (5–6). No numbers except real counts of pending items; no scores.

### Feed `/feed`
**Current (READ):** already chronological with keyset `?cursor=`, `feed_items` view (visibility/follow/block/mute in the view), read-only engagement counts. Presentation still legacy: `FeedItem` (own avatar/initials), pill "Older devlogs" button, red alert box, mono "Following N", `SuggestedDevelopers` with its own initials.
**Target:** same data and paging; `DevlogRow variant="feed"` (Avatar, actor → action → object → time, title, excerpt, reactions/comments line), `Button` paging, `EmptyState` with distinct kinds (following nobody = first-use; following but nothing published = cleared; past the end = no-results), `ErrorState` with retry, `DeveloperRow compact` suggestions with the stated (non-personalised) rule.

### Explore `/explore`, `/explore/[section]`
**Current (READ):** three near-identical sections (Projects, Developers, Recent devlogs), each "most recent activity first"; `ProjectResult`/`DeveloperResult`/`DevlogResult` rows; stage filter on `/explore/projects`; pill Pager; hand-written empty/error text.
**Problems:** the three sections differ only by object type — same ordering, same weight; nothing tells a visitor what they can *do*. Sections ≠ discovery hierarchy.
**Target:** sections defined by real states already in the views: **Playtests you can join** (`has_open_playtest`), **Projects** (all, recent activity; stage filter on the full list), **Developers open to collaborate** (`is_open_to_collab`), **Recent devlogs**. Each with a one-line ordering note and "See all"; full lists at `/explore/[section]` get URL filters (`stage`, `playtest=open`, `collab=open`) as link chips and real `page` param. Rows: `ProjectRow listing`, `DeveloperRow listing`, `DevlogRow listing`. No popularity/trending/personalisation. Filters are read-only conditions on existing view columns (no schema change).

### Search `/search`
**Current (READ):** query + typed tabs (All/Developers/Projects/Devlogs) with counts, `stage` filter, paging, URL state (`q,type,stage,page`), RPCs `search_*` (tiered relevance, viewer-relative), all-tab preview of 5 per type; correct truncated/beyond-last-page handling. Presentation legacy: pill input and button, `StageFilter` pills, text-only no-results, red alert box.
**Target:** unchanged query/URL/RPC behaviour; `Input` + `Button` form; tabs as a `nav` with `aria-current` and counts; results as typed sections using the same three rows as Explore (`listing` variants — one component per object, three contexts); `EmptyState no-results` (echoes the query, offers loosening) vs `EmptyState` guidance when there is no query; `ErrorState` with retry.

## 3. Shared row language (no card grids)
- `ProjectRow`: add `listing` (thumbnail, title, pitch, meta line: maker · stage · engine · genre · open playtest · last activity). Existing `feature`, `compact` stay.
- `DevlogRow`: add `feed` (actor line + title + excerpt + engagement) and `listing` (title, project · author · time, excerpt). Existing `list`, `timeline` stay.
- **New** `DeveloperRow` (`components/developer/DeveloperRow.tsx`): `listing` (identity, current project, role, open-to-collab, bio, Follow) and `compact` (name, role, Follow). Replaces `DeveloperResult`, `SuggestedDevelopers`, and the dashboard suggested chips.
- Replaced and deleted after migration: `discovery/ProjectResult`, `DeveloperResult`, `DevlogResult`, `feed/FeedItem`, `feed/SuggestedDevelopers`, `dashboard/{CurrentWork,AttentionList,ActivityList,NetworkPreview,ProjectsOverview,SecondaryLinks,DashboardClient}` (rebuilt as server components on the same rows). `Pager` and `StageFilter` are restyled on tokens (`FilterLinks`).
- Typography: excerpts/pitch use the Phase A scale (`text-body`/`text-small`); markdown excerpts are plain text via `markdownExcerpt` (no separate markdown styling); full markdown stays in `MarkdownRenderer`.

## 4. Backend observations (documented, not migrated)
1. Dashboard suggested developers ignored block/mute — fixed by calling the existing feed function (consumption only).
2. `fetchEngagement` reads all comment/reaction rows for a page (two queries, no aggregate); fine at current scale, would need an aggregate view later. Not changed.
3. `/dashboard` runs ~14 queries per load; left as is.

---

# Implementation record (what shipped)

**Rows:** `ProjectRow` (`feature`, `compact`, `listing`), `DevlogRow` (`list`, `timeline`, `feed`, `listing`), new `DeveloperRow` (`listing`, `compact`), `FilterLinks` (URL-driven chips), `Pager` (buttons), `Section`/`SectionHeader` (+ `description`), `EventRow` (dashboard). Deleted: `discovery/{ProjectResult,DeveloperResult,DevlogResult,StageFilter}`, `feed/{FeedItem,SuggestedDevelopers}`, `dashboard/{DashboardClient,CurrentWork,AttentionList,ActivityList,NetworkPreview,ProjectsOverview,SecondaryLinks}`. `/studios/[slug]` swapped to `ProjectRow listing` (one-line change; page otherwise untouched).
**Dashboard:** `DashboardView` (props are plain data; the page maps queries → view, which is also what the dev fixture renders). Same next-action state machine and queries; new: errors on projects/attention/feedback queries are shown (they were silent); suggested developers now use the Feed's function (bug fix).
**Feed:** same queries, keyset paging and view; presentation only. Empty states: first-use (following nobody) / cleared (following, nothing published) / no-results (past the end); `ErrorState` with reload link.
**Explore:** four sections by what you can do — Playtests you can join (`has_open_playtest`), Projects, Developers open to collaborate (`is_open_to_collab`), Recent devlogs. Section pages take `stage`, `playtest=open`, `collab=open`, `page` in the URL; filters are read-only conditions on view columns (no migration).
**Search:** query, typed tabs with counts, stage filter, paging and URL state unchanged; results use the same three rows; distinct no-query, no-results, beyond-last-page and error states.
**Loading:** `loading.tsx` rebuilt with `Skeleton`/`LoadingRegion` for Feed, Explore hub, Search, Dashboard (generic, shared by all `/dashboard/*`). Explore loading is scoped to the hub via a `(hub)` route group so `/explore/[section]` keeps a real 404 for unknown sections (a segment `loading.tsx` streams a 200 before `notFound()`; same trade-off as Phase C).

## Verified
Signed out (dev + `next start`): Explore, section pages with combined filters, empty/no-results/beyond-last-page states, Search (no query, all, typed, stage, zero results, single type), `/explore/bogus` 404, protected routes 307 → `/login`. Signed-in surfaces (Feed, Dashboard) only through `/design/dashboard` fixtures (populated, brand-new, failed loads, feed rows) and code; not with a real session.
## Not verified / limitations
Real Feed/Dashboard data, Follow writes from suggestions, block/mute effects in rows (enforced by the unchanged views/functions; not exercised signed in), 1024/1440 visual pass on Explore/Search, tablet, screen readers. Synthetic Enter in the automation tool did not submit the search form; the submit button and resulting URL state were verified.
## Backend observations (unchanged)
`fetchEngagement` reads all comment/reaction rows per page; dashboard runs ~14 queries; `/dashboard/*` `loading.tsx` shares one skeleton. The Phase C loading/404 route-architecture cleanup remains on the backlog.
