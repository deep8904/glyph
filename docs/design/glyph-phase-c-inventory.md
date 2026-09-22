# Phase C — current vs target inventory (Profile, Project, Devlog)

Written before implementation. Scope: **presentation and information architecture only.** No new tables, queries that expose new data, RLS, metrics or social mechanics. Facts marked (COUNTED/READ) come from the code as of this phase.
Note: the devlog route is `/p/[username]/[project-slug]/[devlog-slug]` (not `/dev/…`); `/dev/[username]` is the profile.
Note: there is **no Phase A `CommentThread` primitive** — Phase A built generic primitives only. `components/devlog/CommentThread.tsx` is the existing feature component and is restyled here on those primitives.

## Cross-cutting findings (all three surfaces)
| Finding | Evidence | Consequence |
|---|---|---|
| **Markdown is unstyled.** `MarkdownRenderer` uses `prose prose-sm …` classes but `@tailwindcss/typography` is not installed and not `@plugin`-loaded. Headings, lists, blockquotes and code in devlogs and project "About" render as plain text (observed on a real devlog: section titles look like body lines). | `package.json`, `globals.css` | Install the standard plugin, map its variables to tokens. Biggest single readability fix. |
| Legacy controls: pill buttons with glow (`shadow-lg shadow-indigo-600/20`), pill link chips, pill tags | READ | Use `Button`, `Badge`, plain text links. |
| Sub-12px mono uppercase labels as section titles (`text-[10px] uppercase tracking-widest`) and metadata (`text-[11px]`) | READ: profile 6, project 6, devlog 5, components 8 | `SectionHeader`, `MetadataBar`, `text-small/micro`. |
| Three near-identical initials/avatar implementations on these pages (`initials()` ×4) | READ | `Avatar`. |
| Card treatments: `rounded-2xl/3xl border`, amber tinted card (Featured), dashed empty boxes | READ | Remove; dividers + spacing. |
| Errors look like empty: secondary queries (`projects`, `devlog_posts`, `comments`) ignore `error` | READ | Show `ErrorState inline` when a list query fails. |
| No `loading.tsx` on any of the three routes | COUNTED | Add skeletons shaped like the content. |
| Comment/edit/delete failures are silent; delete uses `window.confirm()` | READ | Inline errors (`role=alert`); `Dialog` for delete confirm. |
| Owner vs visitor: same structure already on profile/project (extra action row for owner); keep one skeleton, action layer differs | READ | Preserve. |

## 1. PROFILE `/dev/[username]`
**Current (READ)**
- `ProfileHeader`: 80px rounded-2xl avatar, `text-3xl` name, mono `@username`, studio line, location + "Open to Collaborate" with pulsing dot (`animate-pulse`, 11px mono caps), follower/following links with icon, owner "Edit profile" pill or `FollowButton` (glow pill), inline Block/Mute pill buttons (visible to every signed-in visitor).
- "Current Project" 10px caps label + `CurrentProjectCard` (rounded-3xl bordered card, hover shadow, "VIEW PROJECT →" mono caps).
- "Last posted <link> <time>" line.
- Bio paragraph; role/engine/experience as three muted Badges.
- "Featured": amber tinted rounded card with `DevlogRow`s (+ owner star toggle, 44px round button) / owner hint.
- "Other Projects": bordered rounded list, tiny "Current" pill + stage Badge + "Updated" 11px.
- "Recent Devlogs": bordered rounded list; empty = plain gray sentence.
- `CollaborationCard`: bordered card, sentence, rows as bordered gray blocks with contract Badge.
- Social links as bordered pill buttons; footer "MEMBER SINCE" mono caps.
- Data: profile, up to 10 projects (RLS-filtered), follower/following counts, follow/block/mute rows, ≤3 open collab posts, studio affiliations, ≤3 featured + ≤5 recent published devlogs. Order in page: Identity, Current, Last-posted, About, Featured, Projects, Devlogs, Collaboration, Links.

**Target** — order per brief: Identity → Current work → Featured → Projects → Recent devlogs → Activity → About → Collaboration → Links; flat sections separated by hairlines, no cards.
- **ProfileHeader:** `Avatar xl` (circle), `text-display` name (H1), `@username` mono, studio affiliation line, one plain-text meta line (location · role · engine · experience), availability as text with a static dot (no pulse), counts as text links ("12 followers · 3 following"). Action layer: owner → `Button secondary` "Edit profile"; visitor → `FollowButton` (Button) + a `Menu` ("More": Block/Unblock, Mute/Unmute) instead of two always-visible buttons. Status text via `role=status`.
- **Current work:** `ProjectRow variant="feature"` (cover left, title, pitch, `MetadataBar` stage/engine/updated). Empty → `EmptyState first-use` (owner CTA, visitor none).
- **Featured:** `DevlogRow variant="list"` rows, owner star toggle kept (`IconButton`-style, `aria-pressed`). Section shown to visitors only when there is featured work; owner sees guidance.
- **Projects:** `ProjectRow variant="compact"` list (other projects).
- **Recent devlogs:** `DevlogRow variant="list"`; empty → `EmptyState`.
- **Activity:** `MetadataBar` of real timestamps only: last devlog (link + time), current project updated, member since. No counts/scores.
- **About:** bio (readable measure). **Collaboration:** availability sentence + open posts as rows. **Links:** text links with Lucide icons (https-only guard kept).
- Error: `ErrorState inline` if the projects/devlogs query fails. Loading: `loading.tsx` skeleton.

**Removed:** pulse animation, amber card, all pill buttons/chips, glow, hover shadows, uppercase mono section labels, three Badges for role/engine/experience.

## 2. PROJECT `/p/[username]/[project-slug]`
**Current (READ)**
- Full-width 21:9 cover; badges row (stage, "Current project", owner-only visibility notice); `text-4xl` title; pitch; byline with 28px avatar + studio links; mono caps "STARTED … · LAST DEVLOG … · N DEVLOGS"; owner pill buttons (Edit, Write devlog).
- Meta: engine/genre Badges and pill tags; external links as pill buttons; About (markdown, unstyled — see above); Screenshots grid `rounded-2xl`; Devlog timeline (`DevlogTimeline`: date column + title + excerpt, draft amber pill, edit icon); Open playtest section (icon, counts, CTA pill, platform/focus pills); "Looking for collaborators" list; publisher shortlist + contact link.
- Data: profile, project, ≤100 devlogs (owner incl. drafts), open playtest, publisher account+shortlists (viewer), studio links, ≤5 open collab posts. Private project → `notFound()` for non-owners (kept).

**Target** — canonical development record: narrative left, structured facts right (GitHub "About"/README split), no card containers.
- Cover as media (rounded-media, 21:9) when present.
- **Header:** stage `Badge` + owner-only visibility notice (text + Badge), `text-display` title (H1), pitch, byline (`Avatar sm` + owner, studio links), owner action layer (`Button secondary` Edit, `Button primary` Write devlog) — same skeleton for visitors, minus the actions.
- **Aside (≥1024px right column; stacked under header on mobile):** `MetadataBar stacked` (Stage, Engine, Genre, Started, Last devlog, Devlogs), tags as plain `#tag` text, Links (https-only), Team/Studio, **Playtest** block (status, x/y testers, platforms, CTA `Button`), **Collaborators** block (open posts as rows), publisher tools (shortlist + contact) for publisher viewers.
- **Main:** About (markdown, now styled), Screenshots, **Devlogs** (`DevlogRow variant="timeline"`; drafts marked "Draft · only you", edit link for owner). Empty → `EmptyState` with owner CTA. Devlog query error → `ErrorState inline`.
- Loading: skeleton. Private: unchanged (404 for non-owners, no existence leak).

**Removed:** pill buttons/tags, glow, mono-caps metadata line, `rounded-2xl` screenshot tiles → `rounded-media`, dashed empty box, per-section icons in headings.

## 3. DEVLOG `/p/[username]/[project-slug]/[devlog-slug]`
**Current (READ)**
- Draft banner (amber rounded box, mono); header: avatar + author · project link, `text-4xl` title, mono caps date with calendar icon, owner "Edit devlog"; body (unstyled markdown); previous/next as two rounded bordered cards (mono caps labels); "React" mono label + emoji pill buttons; comments (10px caps title, rounded-xl textarea, glow "Post Comment", replies one level, edit/delete/reply as 11px mono text buttons, `confirm()` for delete); footer links.
- Data: profile, project (id, title, slug, visibility), post, reactions, comments (+author), published siblings for prev/next, current user. Draft → 404 for non-owners (kept).

**Target** — an editorial work record, single column ≈ 68–72ch.
- Project context first (eyebrow: project title link + stage is not fetched here, so title only), `text-display` title, byline (`Avatar sm`, author link, `<time>` long date), owner "Edit devlog" `Button` (secondary, sm); draft banner as a warning-toned notice with the edit link.
- Body: `MarkdownRenderer` on the typography plugin (headings, lists, quotes, code, images, tables styled from tokens), max width ≈ 42rem, 16px/1.75.
- **Prev/next:** two link blocks (label "Earlier"/"Later" + title), divider above, no cards.
- **Reactions:** quiet row of the same four reactions (emoji kept — they are the existing data; icon mapping deferred to Phase D with the feed which shares them), 40px `rounded-control` buttons with counts, `aria-pressed`, "Sign in to react" text.
- **Feedback (CommentThread):** heading with real count; composer (`Field` + `Textarea` + `Button`); threads: avatar, name, time, body; replies indented one level (existing data limit) with a left rule; **collapse/expand** per thread (`aria-expanded`), Reply/Edit/Delete as small ghost buttons (44px on touch), delete confirm via `Dialog`, inline `role=alert` errors, `EmptyState` (`first-use`, sign-in prompt for visitors). No votes/karma.
- Related context at the end: "From <project>" link + author profile link.
- Loading skeleton; comments query error → `ErrorState inline`.

**Removed:** mono-caps everything, calendar icon chip, glow button, rounded cards for prev/next, `confirm()`.

## Shared components (built or rewritten this phase, no page-specific copies)
`ProfileHeader` (rewritten), `ProjectRow` (new: `compact`, `feature`; replaces `CurrentProjectCard`, `ProjectsList`), `DevlogRow` (new in `components/devlog/`: `list`, `timeline`; replaces `profile/DevlogRow`, `project/DevlogTimeline`), `CommentThread` (rewritten), `BlockMuteButtons` (menu-based), `FollowButton` (uses `Button`; still used by discovery/feed), `MarkdownRenderer` (typography plugin). Deleted when unreferenced: `CurrentProjectCard`, `ProjectsList`, `profile/DevlogRow`, `project/DevlogTimeline`, `devlog/DevlogCard` (already unreferenced).
Explicitly **not** touched: Feed, Explore, Search, Collaboration, Playtesting, Studios/Jams/Events, Settings, Notifications, landing, database, RLS, actions.

---

# Implementation record (what actually shipped)

**Profile** — order shipped: Identity → Current work → Featured → Projects → Recent devlogs → Activity → About → Collaboration → Links. Components: `ProfileHeader` (rewritten), `ProjectRow` (`feature`/`compact`), `DevlogRow` (`list`), `FeaturedToggleButton` (aria-pressed), `Section`, `MetadataBar`, `EmptyState`, `ErrorState`, `Button`. Owner vs visitor: same skeleton; owner gets Edit profile + Featured toggles + first-use CTAs; signed-in visitors get Follow + a "More" menu (Mute/Block); signed-out visitors get neither. Activity = last devlog, current project updated, member since (real timestamps only).
**Project** — two columns from 1024px (narrative + record left; structured facts right: `MetadataBar` responsive, studio, tags, links); one column below, facts inline under the header. Sections: About (styled markdown), Screenshots, Devlogs (timeline rows), Open playtest, Looking for collaborators, Publisher tools (publisher viewers). No card containers.
**Devlog** — single column `max-w-2xl` (≈70ch at 16px/28px). Project context, title, author + `<time>`, styled body, Earlier/Later, Reactions, Feedback (`CommentThread`), related-context footer. Draft banner (owner only) is a warning-toned note.
**Comments** — collapse/expand per thread (`aria-expanded`/`aria-controls`), labelled composer/reply/edit fields via `Field`, delete via `Dialog`, all write failures shown inline (previously silent), no votes/karma, one reply level (existing data model).

## Deviations from the plan above
- **No `loading.tsx` for the three routes.** It was built and removed: a segment `loading.tsx` makes Next stream a 200 before `notFound()` runs, so unknown profiles/projects/devlogs returned HTTP 200 instead of 404 (verified with `next start`). Correct status codes on public, indexable object pages were kept over skeletons. Skeleton shapes are described in `glyph-state-matrix.md`; the route-level fix (resolve existence in a layout, then stream) is deferred.
- Reactions keep their emoji (shared with the feed); icon mapping deferred to Phase D.
- Followers/following pages were not restyled (they only gained the shell/breadcrumb in Phase B).

## Found and fixed along the way
- Markdown was unstyled everywhere (`prose` classes with no typography plugin) — installed `@tailwindcss/typography`, mapped to tokens (`.prose-glyph`).
- Comment edit/delete/reply failures were silent; delete used `window.confirm()`.

## Dev-only fixtures
`/design/objects` (404 in production) renders `ProfileHeader` (owner / signed-in visitor), `ProjectRow`, `DevlogRow`, markdown, reactions and `CommentThread` (signed in with replies, signed out empty, load failed) from clearly labelled fake data, so owner-side UI and comment interactions could be inspected without authentication. Writes from that page fail by design.
