# Glyph entire-application UI / UX / product-experience audit

**Audit date:** 2026-09-22  
**Running product:** `http://localhost:58387`  
**Repository reviewed:** `/Users/deeppatel/glyph`  
**Scope:** audit only. No implementation, schema, content, or configuration files were changed.  
**Status:** the redesign is **not complete**. This document is the decision baseline for a future redesign pass.

## Evidence legend

- **OBSERVED IN BROWSER** — rendered or interacted with in the running application during this audit.
- **OBSERVED BOUNDARY** — the requested route was opened, but authentication, role, or absent production data prevented its intended page from rendering.
- **CODE VERIFIED ONLY** — current route/component source and repository fixtures were inspected; the real route UI was not rendered in its intended live state.
- **FIXTURE OBSERVED** — a development-only route rendered the real component/state with labelled fake data; writes intentionally fail.
- **RESEARCHED** — supported by a linked first-party product/design-system source.
- **INFERRED** — design judgment derived from observed evidence; not presented as a measured user outcome.
- **RECOMMENDED** — proposed direction, not current behavior.
- **NOT TESTED** — not claimed; the reason is stated.

---

## 1. Executive diagnosis

Glyph is functionally broad and structurally more mature than its visual expression. The current product has a dependable shell, readable forms, strong state coverage in fixtures, clear public URLs, and a genuinely useful object model. The main problem is not inconsistency. It is **insufficient differentiation and art direction**.

The internal product repeatedly renders different jobs—discovering a game, evaluating a collaborator, joining a playtest, reading progress, triaging work, and managing an account—through the same narrow white column, 24–32 px Inter headings, muted explanatory copy, hairline dividers, and text-heavy rows. The result is technically disciplined but perceptually flat. Users must read labels to know which product area they are in because composition, media, density, and interaction seldom communicate the job.

The strongest observed surface is the canonical project page because Emberfall Keep's cover creates a real visual subject. The weakest cross-product pattern is that the project's identity disappears as soon as the user moves into a Devlog, Collaboration listing, Playtest, Feed item, or notification. Glyph's central relationship—**Developer → Project → Devlog**—exists in URLs and links but is not consistently carried by the visual system. Likewise, **BUILD → DOCUMENT → DISCOVER → CONNECT → BUILD AGAIN** is supported by routes, but the loop is not perceptible as a connected experience.

The product currently has two visual worlds:

1. The landing page is expressive, large, rounded, animated, purple, and marketing-led.
2. The application is restrained, gray, narrow, row-led, and operational.

That contrast could be productive, but today it feels like two separately generated products. The landing page also contains several of the clearest AI-slop signals: a giant rounded browser frame, a generic SaaS hero mockup, invented engagement counts, uncited market statistics, bento-like feature blocks, glows, and universal reveal motion. The application reacted against that style by removing almost all visual emphasis; it overcorrected into uniformity.

The most urgent product-truth issue is public `/pricing`: it offers Free, Pro ($19/month), and Team ($49/month) plans and says upgrades unlock visibility and publisher tools, while `PRODUCT.md` says the core product is permanently free in V1 with **no payments, paywalls, upsell pressure, or paywall visual language**. The landing page separately says developers are “always free.” This is a P0 trust and positioning contradiction, not a cosmetic preference.

The audit outcome is therefore:

- **KEEP** the shell foundations, canonical URLs, flat baseline, accessible focus treatment, status vocabulary, and detailed state fixtures.
- **REFINE** typography, width, hierarchy, responsive discovery, copy, loading transitions, and forms.
- **REWORK** the composition of public creator/object surfaces and the visual differentiation of product areas.
- **REMOVE or suspend** unsupported pricing/market claims and decorative marketing effects that lack semantic value.
- **INTRODUCE** persistent provenance, purpose-specific page grammars, strong project media anchors, lifecycle views, typed search, and explicit next-action hierarchy.

### Audit totals

| Measure | Total | Meaning |
|---|---:|---|
| Route page files found | **74** | Every current `app/**/page.tsx`; 67 production routes + 7 development-only design routes |
| Route entrypoints opened in browser | **74 / 74** | Intended content, redirect boundary, or real 404 was observed for every route pattern |
| Intended page UIs rendered | **28** | 21 production surfaces + all 7 development fixtures |
| Auth/role boundary-only routes | **42** | Opened while signed out; all correctly reached `/login` (two jam routes preserve `next`) |
| No-data detail routes | **4** | Jam detail, jam results, event detail, and publisher detail returned the real 404 because no current record existed |
| Route UIs requiring code-only review | **46** | The 42 protected page bodies + 4 no-data detail bodies |
| Documented horizontal-overflow failures on major surfaces | **0** | At 375, 768, 1024, and 1440; composition problems still exist |

---

## 2. Methodology

1. Inspected the **current** `app/**/page.tsx` tree and counted 74 page files.
2. Read current product/design authority, especially `PRODUCT.md`, information architecture, shell architecture, responsive system, state matrix, visual direction, and workflow/fixture documentation.
3. Derived safe real identifiers from rendered links and existing fixture data rather than guessing valid objects: `demo-nova`, `deep`, `emberfall-keep`, `phase1-test-project`, `phase1-test-studio`, current Collaboration UUIDs, and current Playtest UUIDs.
4. Opened every route pattern in the running browser. For protected routes, recorded the actual login boundary. For data-less detail routes, recorded the actual 404 and reviewed current source.
5. Rendered every development fixture: `/design`, `/design/shell`, `/design/objects`, `/design/workflows`, `/design/graph`, `/design/dashboard`, `/design/account`.
6. Exercised create/account menus, search and board filters, authentication validation, Collaboration and Playtest fixture submissions, jam rating selection, keyboard skip-link focus, and the account deletion dialog without committing a destructive action.
7. Tested 15 major surfaces at **375, 768, 1024, and 1440**: landing, Explore, Search, profile, project, Devlog, Collaboration, Playtests, Studio, Pricing, Dashboard fixture, Workflow fixture, Graph fixture, Account fixture, and Login.
8. Took visual browser snapshots of Landing, Explore loading and loaded states, Search loading, Project mobile, Account mobile, Login, and visible keyboard focus.
9. Reviewed motion/reduced-motion implementation, semantic tokens, typography, shared components, loading/error files, and protected route source.
10. Conducted targeted reference research using first-party docs, organized by Glyph product problem rather than competitor brand.

### Scope limitations

- No authenticated user session was available. I did not create an account, consume email verification, or mutate production-like application data.
- Development fixtures provide strong component/state evidence but do not prove live database wiring, permissions, latency, or multi-user continuity.
- No current approved Jam, Event, or Publisher detail record existed. Those four production detail bodies are code-verified and fixture-observed only.
- Hover styling was code-reviewed and visually inferred; the browser interface did not expose reliable pointer-hover screenshots. Focus, pressed, menus, dialog, validation, and responsive states were directly exercised.
- No real assistive-technology session, real device, landscape-phone session, localization expansion, or 200% zoom pass was performed.

---

## 3. Complete route inventory

Every row below corresponds to one current `page.tsx`. “Browser evidence” is intentionally strict: a redirect is not counted as rendering the destination page body.

| # | Route | Purpose | Access / persona | Shape and required data | Browser evidence |
|---:|---|---|---|---|---|
| 1 | `/` | Marketing entry | Public visitor | Static marketing + optional identity | **OBSERVED IN BROWSER** |
| 2 | `/login` | Sign in | Public/returning user | Static client form + auth provider | **OBSERVED + FLOW TESTED** |
| 3 | `/signup` | Account creation | Public/new developer | Static client form + auth provider | **OBSERVED + VALIDATION TESTED** |
| 4 | `/onboarding` | Four-step profile/project setup | Authenticated new developer | Auth session; profile/project writes | **OBSERVED BOUNDARY; CODE VERIFIED ONLY** |
| 5 | `/admin` | Admin overview | Authenticated admin | Admin profile + moderation counts | **OBSERVED BOUNDARY; CODE VERIFIED ONLY** |
| 6 | `/admin/audit` | Audit log | Authenticated admin | Audit entries | **OBSERVED BOUNDARY; CODE VERIFIED ONLY** |
| 7 | `/admin/featured` | Featured-listing admin | Authenticated admin | Featured listings | **OBSERVED BOUNDARY; CODE VERIFIED ONLY** |
| 8 | `/admin/flags` | Feature flags | Authenticated admin | Flags | **OBSERVED BOUNDARY; CODE VERIFIED ONLY** |
| 9 | `/admin/jams` | Jam approval | Authenticated admin | Pending jams | **OBSERVED BOUNDARY; CODE VERIFIED ONLY** |
| 10 | `/admin/moderation` | Moderation queue | Authenticated admin | Reports/moderation items | **OBSERVED BOUNDARY; CODE VERIFIED ONLY** |
| 11 | `/admin/publishers` | Publisher verification | Authenticated admin | Pending publisher accounts | **OBSERVED BOUNDARY; CODE VERIFIED ONLY** |
| 12 | `/admin/studios` | Studio verification | Authenticated admin | Pending studios | **OBSERVED BOUNDARY; CODE VERIFIED ONLY** |
| 13 | `/admin/users` | User administration | Authenticated admin | Profiles | **OBSERVED BOUNDARY; CODE VERIFIED ONLY** |
| 14 | `/collaborate` | Collaboration board | Public developer/collaborator | Open posts; filters | **OBSERVED + FILTERS** |
| 15 | `/collaborate/[id]` | Opportunity detail/application | Public/applicant/owner | Real post UUID, parent project, application state | **OBSERVED** with `11111111-7777-7777-7777-777777777702` |
| 16 | `/collaborate/new` | Post an opportunity | Authenticated developer | User projects + create action | **OBSERVED BOUNDARY; CODE + FIXTURE VERIFIED** |
| 17 | `/dashboard` | Resumptive work/attention | Authenticated onboarded developer | Profile, projects, attention, feed | **OBSERVED BOUNDARY; FIXTURE OBSERVED** |
| 18 | `/dashboard/billing` | Billing/plan state | Authenticated developer | Query plan, future subscription state | **OBSERVED BOUNDARY; CODE VERIFIED ONLY** |
| 19 | `/dashboard/events/new` | Create event | Authenticated host | Event form/write | **OBSERVED BOUNDARY; CODE + FIXTURE VERIFIED** |
| 20 | `/dashboard/jams/new` | Create jam | Authenticated host | Jam form/write | **OBSERVED BOUNDARY; CODE + FIXTURE VERIFIED** |
| 21 | `/dashboard/playtests/new` | Request testers | Authenticated project owner | Owned project(s) + form | **OBSERVED BOUNDARY; CODE + FIXTURE VERIFIED** |
| 22 | `/dashboard/playtests` | Manage/joined playtests | Authenticated owner/tester | Requests, sessions, feedback states | **OBSERVED BOUNDARY; FIXTURE OBSERVED** |
| 23 | `/dashboard/projects/new` | Create project | Authenticated developer | Project form/write | **OBSERVED BOUNDARY; CODE VERIFIED ONLY** |
| 24 | `/dashboard/projects` | Manage projects | Authenticated owner | Owned projects | **OBSERVED BOUNDARY; FIXTURE PARTIAL** |
| 25 | `/dashboard/publisher-contacts` | Developer publisher inbox | Authenticated developer | Contact threads | **OBSERVED BOUNDARY; FIXTURE OBSERVED** |
| 26 | `/dashboard/publisher` | Publisher dashboard | Authenticated publisher | Publisher account, shortlist/activity | **OBSERVED BOUNDARY; FIXTURE PARTIAL** |
| 27 | `/dashboard/publisher/register` | Publisher registration | Authenticated user | Registration form | **OBSERVED BOUNDARY; CODE VERIFIED ONLY** |
| 28 | `/dashboard/studios/new` | Create studio | Authenticated developer | Studio form/write | **OBSERVED BOUNDARY; CODE + FIXTURE PARTIAL** |
| 29 | `/dashboard/studios` | Studio memberships/invitations | Authenticated developer | Memberships/invites | **OBSERVED BOUNDARY; FIXTURE OBSERVED** |
| 30 | `/dashboard/events/[id]/manage` | Host event management | Authenticated host | Real event UUID + owner role | **OBSERVED BOUNDARY; CODE + FIXTURE VERIFIED** |
| 31 | `/dashboard/projects/[id]/edit` | Edit project | Authenticated owner | Real project UUID + owner role | **OBSERVED BOUNDARY; CODE VERIFIED ONLY** |
| 32 | `/dashboard/projects/[id]/devlogs/new` | Write Devlog | Authenticated owner | Real project UUID + form | **OBSERVED BOUNDARY; CODE VERIFIED ONLY** |
| 33 | `/dashboard/projects/[id]/devlogs/[devlogId]/edit` | Edit Devlog | Authenticated owner | Project + Devlog UUIDs | **OBSERVED BOUNDARY; CODE VERIFIED ONLY** |
| 34 | `/dashboard/publisher/contact/[id]` | Publisher contacts developer | Authenticated verified publisher | Developer UUID, optional project | **OBSERVED BOUNDARY; CODE VERIFIED ONLY** |
| 35 | `/dashboard/studios/[slug]` | Manage studio | Authenticated member/admin | Real studio slug + role | **OBSERVED BOUNDARY; CODE + FIXTURE VERIFIED** |
| 36 | `/design` | Primitive/state reference | Development only | No product data | **FIXTURE OBSERVED** |
| 37 | `/design/account` | Notifications/settings fixtures | Development only | Labelled fake states | **FIXTURE OBSERVED + INTERACTIONS** |
| 38 | `/design/dashboard` | Dashboard/feed fixtures | Development only | Populated/new/failed fake states | **FIXTURE OBSERVED** |
| 39 | `/design/graph` | Studio/jam/event/publisher fixtures | Development only | Labelled fake graph states | **FIXTURE OBSERVED + JAM CONTROL** |
| 40 | `/design/objects` | Profile/project/Devlog/comment fixtures | Development only | Owner/visitor fake states | **FIXTURE OBSERVED** |
| 41 | `/design/shell` | Signed-in shell fixture | Development only | Fake identity | **FIXTURE OBSERVED + MENUS** |
| 42 | `/design/workflows` | Collaboration/playtest fixtures | Development only | All lifecycle states | **FIXTURE OBSERVED + INTERACTIONS** |
| 43 | `/dev/[username]` | Public Developer profile | Public visitor/owner | Real username/profile | **OBSERVED** with `demo-nova`, `deep`; owner via fixture |
| 44 | `/dev/[username]/followers` | Followers list | Public | Real username/follows | **OBSERVED** with `demo-nova` |
| 45 | `/dev/[username]/following` | Following list | Public | Real username/follows | **OBSERVED** with `demo-nova` |
| 46 | `/events` | Event discovery | Public participant | Published upcoming events | **OBSERVED** empty state |
| 47 | `/events/city/[city]` | City event filter | Public local participant | City string + events | **OBSERVED** with `Phoenix` empty state |
| 48 | `/events/[id]` | Event detail/RSVP/demo | Public/participant/host | Published event UUID | **OBSERVED 404; CODE + FIXTURE VERIFIED** |
| 49 | `/explore` | Curated discovery hub | Public | Public projects/devs/devlogs/playtests | **OBSERVED** |
| 50 | `/explore/[section]` | Typed Explore list | Public | `projects`, `developers`, `devlogs`; filters | **OBSERVED** all three sections |
| 51 | `/feed` | Followed activity | Authenticated onboarded user | Following graph + Devlogs | **OBSERVED BOUNDARY; FIXTURE OBSERVED** |
| 52 | `/jams` | Jam discovery | Public participant | Approved jams | **OBSERVED** empty state |
| 53 | `/jams/[slug]` | Jam lifecycle/detail | Public/host | Approved jam slug, entries | **OBSERVED 404; CODE + FIXTURE VERIFIED** |
| 54 | `/jams/[slug]/results` | Jam standings/results | Public | Voting/completed jam slug + votes | **OBSERVED 404; CODE + FIXTURE VERIFIED** |
| 55 | `/jams/[slug]/submit` | Submit project to jam | Authenticated participant | Approved running jam + owned projects | **OBSERVED BOUNDARY; CODE VERIFIED ONLY** |
| 56 | `/jams/[slug]/vote` | Judge/rate entries | Authenticated participant | Voting jam + entries | **OBSERVED BOUNDARY; FIXTURE CONTROL OBSERVED** |
| 57 | `/notifications` | Notification triage | Authenticated user | Notification list/preferences | **OBSERVED BOUNDARY; FIXTURE OBSERVED** |
| 58 | `/p/[username]/[project-slug]` | Canonical Project | Public visitor/owner/publisher | Real owner + public project | **OBSERVED** with two projects; owner via fixture |
| 59 | `/p/[username]/[project-slug]/[devlog-slug]` | Canonical Devlog | Public visitor/owner | Published Devlog + project + comments | **OBSERVED** with two Devlogs; owner via fixture |
| 60 | `/playtests/browse` | Playtest discovery | Public tester | Open requests with capacity | **OBSERVED** |
| 61 | `/playtests/[id]` | Playtest detail/request | Public/tester/owner | Real request UUID + session | **OBSERVED** with `ee000001-cafe-cafe-cafe-000000000001` |
| 62 | `/playtests/[id]/test/[session-id]` | Build access/feedback | Authenticated accepted tester | Request + owned session IDs | **OBSERVED BOUNDARY; CODE + FIXTURE VERIFIED** |
| 63 | `/pricing` | Plans/upgrade marketing | Public | Static plan data | **OBSERVED**; conflicts with product authority |
| 64 | `/publishers` | Verified publisher directory | Public developer | Verified publishers | **OBSERVED** empty state |
| 65 | `/publishers/[id]` | Publisher profile | Public | Publisher UUID + verification/ownership | **OBSERVED 404; CODE + FIXTURE VERIFIED** |
| 66 | `/search` | Typed global search | Public | Query, result type | **OBSERVED** no-query, results, no-results, type links |
| 67 | `/settings` | Settings index | Authenticated | Redirect only | **OBSERVED BOUNDARY; CODE VERIFIED redirect to profile after auth** |
| 68 | `/settings/profile` | Public-profile settings | Authenticated onboarded user | Profile | **OBSERVED BOUNDARY; FIXTURE OBSERVED** |
| 69 | `/settings/account` | Identity/sign-in settings | Authenticated user | Auth identities | **OBSERVED BOUNDARY; FIXTURE OBSERVED** |
| 70 | `/settings/notifications` | Notification preferences | Authenticated user | Preferences | **OBSERVED BOUNDARY; FIXTURE OBSERVED** |
| 71 | `/settings/privacy` | Visibility/block/mute | Authenticated user | Relationships + privacy copy | **OBSERVED BOUNDARY; FIXTURE OBSERVED** |
| 72 | `/settings/security` | Password/device actions | Authenticated user | Auth identities/sessions | **OBSERVED BOUNDARY; FIXTURE OBSERVED** |
| 73 | `/settings/danger` | Account deletion | Authenticated user | Impact counts/studio ownership | **OBSERVED BOUNDARY; FIXTURE + DIALOG OBSERVED** |
| 74 | `/studios/[slug]` | Public Studio | Public/member | Real studio slug, projects, members | **OBSERVED** with `phase1-test-studio` |

### State files outside the route count

**CODE VERIFIED:** `app/error.tsx`, `app/dashboard/error.tsx`, `app/not-found.tsx`, plus loading files for Feed, Notifications, Search, and Settings. The 404 was browser-observed on an unknown path and the four no-data dynamic routes.

---

## 4. Browser-testing coverage matrix

| Surface | Breakpoints | Persona/state | Browser tested? | Flow tested? | Principal evidence and issue | Priority |
|---|---|---|---|---|---|---|
| Landing | 375/768/1024/1440 | New visitor | Yes | CTA/link orientation | Expressive but generic SaaS composition; fake counts and uncited statistics | P1 |
| Auth | 375/768/1024/1440 | New/returning | Yes | Invalid/empty submission | No visible input labels; no recovery; weak field-level feedback | P1 |
| Onboarding | Boundary only | New signed-in developer | No body | No | Four steps code-verified; real continuation/write untested | Untested |
| Shell | 375/768/1024/1440 | Signed out + signed-in fixture | Yes | Create/account menus, keyboard | Stable tiers; mobile context tabs scroll without cue | P2 |
| Dashboard | 375/768/1024/1440 fixture | Populated/new/failed | Fixture | Navigation links only | Improved attention model, but modules share identical rhythm and no dominant next move | P1 |
| Feed | Fixture | Populated/empty/end/failure | Fixture | Destination links | Feed items do not preserve sufficiently strong Project identity/provenance | P1 |
| Explore | 375/768/1024/1440 | Public hub + three sections | Yes | Stage/type links | Database-like rows; no editorial visual anchor; wide desktop underused | P1 |
| Search | 375/768/1024/1440 | No query/results/no results | Yes | Query and type facets | Only three object types; no typeahead; results reuse generic rows | P1 |
| Profile | 375/768/1024/1440 + fixture | Visitor/owner | Yes/fixture | Follow fixture state; follower lists | Current work does not dominate identity; “Featured” capability is not visible in live visitor page | P1 |
| Project | 375/768/1024/1440 + fixture | Visitor/owner | Yes/fixture | Links to Devlog/playtest/collab | Best product page; still treats media as one field and owner flow is untested | P1 |
| Devlog | 375/768/1024/1440 + fixture | Visitor/owner | Yes/fixture | Previous/next; reaction controls observed | Readable, but visually detached from parent Project | P1 |
| Collaboration | 375/768/1024/1440 + fixture | Visitor/applicant/owner | Yes/fixture | Filters; attempted apply; all states rendered | Strong lifecycle coverage; board/detail lack project visual trust anchor and management hub | P1 |
| Playtesting | 375/768/1024/1440 + fixture | Visitor/tester/owner | Yes/fixture | Request feedback; lifecycle states | Clear basics; state is not yet composed as a temporal lifecycle | P1 |
| Studios | 375/768/1024/1440 + fixture | Visitor/member/owner | Yes/fixture | Team/profile links | No index; weak team identity; public example has no projects | P1 |
| Jams | Fixture + index | Public/participant/host | Index only live | Rating pressed state | Actual jam detail absent; fixture proves phases but not live continuity | Untested/P1 |
| Events | Index/city + fixture | Public/participant/host | Partial | Filter links | Actual detail/RSVP unavailable; index is a thin empty list rather than temporal discovery | Untested/P1 |
| Publishers | Index + fixture | Developer/publisher | Partial | Links only | Actual detail unavailable; no evidence-rich fit discovery | Untested/P1 |
| Notifications | 375/768/1024/1440 fixture | Unread/read/empty/error/gone | Fixture | Filters/dialog entry links | Excellent state coverage; flat dot rows do not support triage | P1 |
| Settings | 375/768/1024/1440 fixture | Normal/incomplete/blocked/delete | Fixture | Nav + delete dialog open/close | Detailed copy; mobile category rail hides destinations; very long one-page fixture | P2 |
| Admin | Boundary + code | Admin | Boundary only | No | Legacy visual vocabulary diverges from product system | P2 |
| 404/error/loading | Desktop + selected mobile | Public/protected | Yes/fixture/code | Retry links not live-failed | 404 clear; skeletons competent; route coverage inconsistent by architecture | P2 |

---

## 5. Persona / flow audit

### New Developer

`/` → `/signup` → verification → `/onboarding` → `/dashboard` → create Project → create Devlog

- **OBSERVED:** Landing and Signup are clear entry points.
- **CODE VERIFIED:** Email verification and four-step onboarding cover handle, identity, first Project, and links; steps 3–4 can be skipped.
- **INFERRED:** The transition is visually abrupt: highly expressive landing → generic centered auth card → operational onboarding card.
- **NOT TESTED:** Real signup, email code, onboarding persistence, first Project write, first Devlog, and reflection into Feed/Profile.
- **RECOMMENDED:** Preserve task context in auth, ask the user's initial intent before biography, then make “start a Project” or “document existing work” the dominant first successful loop.

### Returning Developer

`/login` → `/dashboard` → attention/current work → continue Project/Devlog

- **FIXTURE OBSERVED:** Current work, attention, feedback, other Projects, followed updates, and opportunities all exist.
- **INFERRED:** The dashboard can answer “what changed?” but not decisively “what should I do next?” because Current work, attention rows, feed, and opportunities remain visually similar.
- **RECOMMENDED:** One resumptive action should dominate; incoming decisions follow; network content belongs in Feed.

### Visitor

Explore → Developer → Project → Devlog → continue discovery/follow

- **OBSERVED:** The route chain works with real objects and breadcrumbs.
- **OBSERVED:** Developer and Project context is progressively clearer until the Devlog, where Project identity collapses to text links.
- **INFERRED:** Discovery feels like querying records, not encountering games/builders.
- **NOT TESTED:** Live follow because no authenticated session.

### Collaborator

Collaboration → listing → Project/Developer context → apply → application states

- **OBSERVED:** Board, filters, detail, parent links, compensation, remote status, time, and sign-in CTA.
- **FIXTURE OBSERVED:** pending, accepted, rejected, withdrawn, closed-post pending, owner review, and applicant form.
- **Observed interaction:** fixture submission produced visible sign-in/error feedback rather than silently failing.
- **Gap:** No clear “Your applications / Your posts” operating surface in live navigation; state is scattered between detail, notifications, and dashboard attention.

### Playtester

Browse → request → accepted → build → feedback

- **OBSERVED:** Browse and detail communicate platform, capacity, and what to test.
- **FIXTURE OBSERVED:** requested, accepted, browser-link/Steam-key access, completed, skipped, withdrawn, full/closed, developer review, and feedback forms.
- **Gap:** The public detail does not lead with schedule, eligibility, confidentiality, or lifecycle; Project cover/identity is weak.
- **NOT TESTED:** Real accepted-session access and feedback write.

### Project Owner

Dashboard/notification → applicant/tester → accept/reject → status

- **FIXTURE OBSERVED:** review queues and workflow states are comprehensive.
- **Gap:** attention rows and management surfaces use the same visual register as passive information, reducing urgency.
- **NOT TESTED:** Multi-user notification convergence and real role actions.

### Event User

Events → detail → RSVP/demo information

- **OBSERVED:** Index and city empty states only.
- **FIXTURE OBSERVED:** Event rows, RSVP, demo request, host management, accepted demo presentation.
- **NOT TESTED:** Current live Event record, RSVP write, calendar action, capacity behavior, or ended transition.

### Studio User

Studio → team/Projects → Developer/Project

- **OBSERVED:** Public studio and team member link.
- **FIXTURE/CODE VERIFIED:** management, invitations, roles, and linked Projects.
- **Gap:** no public Studio index; public example has no Project proof; team identity is little more than an initial and list.

### Publisher

Publisher directory → publisher/project → shortlist/contact/inbox

- **OBSERVED:** Empty public directory.
- **FIXTURE/CODE VERIFIED:** verified state, dashboard, shortlist/contact, developer inbox, account restriction.
- **NOT TESTED:** A real verified Publisher detail, contact write, shortlist persistence, or inbox reply.

---

## 6. Route-by-route UI audit

### Landing and entry

- **OBSERVED:** `/` has the product's clearest visual authorship: strong two-tone headline, asymmetry, framed mock product, and deliberate CTA contrast.
- **Weakness:** the huge rounded white frame on a dark field, indigo glow, feature bento blocks, generic SVG game scene, and staged scroll reveals read as a contemporary template rather than a local indie-development community.
- **OBSERVED:** `/login` and `/signup` are compact and visually calm, but the single bordered card floats in a large undifferentiated canvas.

### Product shell

- **OBSERVED:** Desktop rail, tablet compact rail, mobile top/bottom navigation, contextual bars, breadcrumbs, search entry, Create menu, and account menu are all coherent.
- **Observed menu contents:** Create exposes Project, Devlog, Collaboration, Playtest, Event, Jam, Studio; account exposes Profile, Dashboard, Projects, Studios, Publisher tools/messages, Admin, Settings, Sign out.
- **Weakness:** mobile product-area tabs extend beyond the viewport without a gradient, partial next item, or other affordance signaling horizontal scroll.

### Dashboard and Feed

- **FIXTURE OBSERVED:** populated, first-use, and failed dashboard states; populated and end/empty Feed states.
- **UI judgment:** both are assembled from well-made rows and sections, but the Dashboard needs orchestration, not another list. “Currently building” should be materially larger than network updates.
- **Feed judgment:** actor/action/object/provenance are not strongly separated. The Devlog item and opportunity item remain variants of the same text row.

### Explore and Search

- **OBSERVED:** Explore home has four well-labelled sections; section pages add useful stage/open-playtest/collaboration filters.
- **UI judgment:** the dense central column has no editorial top story, meaningful cover system, or spatial hierarchy. At 1440, content occupies a narrow strip while hundreds of pixels remain inert.
- **OBSERVED:** Search has no-query help, query results, three type facets with counts, and a good no-results explanation.
- **UI judgment:** Developer, Project, and Devlog results are visually too similar; no result preview communicates each object's distinct value.

### Developer / followers / following

- **OBSERVED:** identity, location, role, engine, availability, current work, recent Devlogs, activity, about, collaboration, links, follower/following counts.
- **UI judgment:** current work appears as the first section but not as the Developer's defining visual proof. Initials, name, and metadata create a directory-entry feel.
- **OBSERVED:** follower/following pages are simple and clear; the zero state is direct.
- **FIXTURE OBSERVED:** owner edit entry, follow state, featured controls, block/mute-related settings states.

### Project and Devlog

- **OBSERVED:** Project header, cover, proposition, owner, stage, engine, genre, dates, tags, links, About, screenshots, Devlogs, open Playtest, and Collaboration.
- **UI judgment:** Project is closest to intentionally art-directed because the cover acts as a face. The rest of the page quickly returns to metadata and hairline sections.
- **OBSERVED:** Devlog reading width is comfortable; heading hierarchy, date, markdown, previous/next, reactions, comments, replies are legible.
- **UI judgment:** Devlog looks like a generic article. The cover, visual tone, stage, and chronology of its parent Project do not travel with it.

### Collaboration and Playtesting

- **OBSERVED:** listings contain the right basic facts and destination links.
- **FIXTURE OBSERVED:** lifecycle state breadth is excellent.
- **UI judgment:** Collaboration should feel professionally evaluative; Playtesting should feel participatory and temporal. Both currently use the same discovery list grammar and near-identical detail skeleton.

### Studios, Jams, Events, Publishers

- **Studio OBSERVED:** a public detail with size, Projects, and Team. It lacks a strong identity, representative work, current activity, or public directory.
- **Jam OBSERVED:** only the empty index. **FIXTURE OBSERVED:** upcoming/running/voting/completed phases, rules, prizes, entries, score controls, results.
- **Event OBSERVED:** only index/city empty states. **FIXTURE OBSERVED:** event rows, RSVP, demo slots, host management.
- **Publisher OBSERVED:** empty verified directory. **FIXTURE/CODE VERIFIED:** profile, verification, dashboard, shortlist/contact.
- **UI judgment:** fixtures prove components exist, but no live content demonstrates mature composition. These areas currently inherit the same shell and rows rather than feeling competitive, temporal/local, or business-oriented.

### Notifications and Settings

- **FIXTURE OBSERVED:** unread/read/all-read/empty/failure/unavailable-target/deleted-actor and multiple settings/account/deletion states.
- **UI judgment:** state semantics and copy are unusually thorough. Visual triage is weak: colored dots and text make an application, studio invite, reaction, and follow compete at nearly equal weight.
- **OBSERVED at 375:** notification copy wraps cleanly; bottom navigation is stable. The Settings category rail hides later items off-screen without a strong cue.

### Admin

- **CODE VERIFIED ONLY:** functional overview and queue/list pages.
- **UI judgment:** admin pages still use older Tailwind-gray/indigo, `rounded-2xl`, and panel components, so their visual grammar diverges from the semantic-token system used elsewhere.

---

## 7. Route-by-route UX audit

| Route family | What works | What breaks continuity / discoverability | Recommendation |
|---|---|---|---|
| Entry/auth | Clear sign-in/up choices; focused shell | No password recovery; no visible labels; OAuth consequences unexplained | Add labelled fields, recovery, return-to-task copy, first-class verification/expiry states |
| Dashboard | Current work + attention are present | Feed/opportunities dilute resumptive task; equal-weight modules | Make one next action dominant; collapse absent modules |
| Feed | Followed work is conceptually separate from inbox | Weak provenance and insufficient object differentiation | Actor → action → Project → Devlog composition |
| Explore | Clear categories and recency policy | No editorial guidance, studios, jams/events context, or strong visual scanning | Curated entry points + distinct typed browse lists |
| Search | Helpful no-query/no-result copy and counts | Searches only three types; no typeahead/pagination visible | Add typed suggestions and all relevant objects; show paging/limits |
| Profile | All essential biography/work sections exist | Social counts precede proof; current work not dominant | Curate 1–3 proof objects; move exhaustive activity later |
| Project | Strong canonical URL and connected actions | Owner management untested; Project identity not reused downstream | Treat as source of visual identity for related objects |
| Devlog | Excellent previous/next and readable content | Project context becomes breadcrumb metadata | Persistent Project marker/cover crop/stage + chronology |
| Collaboration | Clear role detail and application states | No consolidated My posts/applications; board rows omit visual proof | Split public discovery from applicant/owner operations |
| Playtesting | Capacity and focus clear | Requirements/lifecycle not prioritized | Recruiting → Accepted → Live → Feedback → Closed model |
| Studio | Team and Projects are conceptually correct | No discovery route; identity/evidence thin | Public Studio index + featured Projects + roles/activity |
| Jam | Phase model exists in fixture | No live content or discoverable host management evidence | Phase-specific hero/actions; contextualize entries as Projects |
| Event | City filter and fixture lifecycle exist | No live detail; index has no temporal buckets/calendar affordance | Live/Today/This week/Later; calendar and state transitions |
| Publisher | Verification model exists | No live proof; directory cannot show fit; tools isolated | Fit-first profiles and explicit relationship/contact policy |
| Notifications | Deep-link copy and unavailable states are strong | No priority grouping/batching; action vs social equal | Needs action / Mentions / Projects / Opportunities views |
| Settings | Scope copy and destructive impact are excellent | Mobile nav is a hidden horizontal rail; long content burden | Mobile index → detail; show save/error status consistently |
| Admin | Access control and queues exist | Legacy UI and generic empty panels | Adopt operational register after public/core redesign |

---

## 8. Information architecture findings

### What works

- **OBSERVED/CODE VERIFIED:** Primary product areas are reachable from a stable shell; object details stay contextual rather than becoming permanent navigation.
- Dashboard, Feed, Explore, Collaboration, and Playtesting have distinct routes and conceptual purposes.
- Public URLs encode Developer → Project → Devlog cleanly.
- Notifications and Settings are account utilities, not mixed into discovery.

### Gaps

1. **P1 — Search IA is narrower than product IA.** It retrieves Developers, Projects, and Devlogs only, excluding Studios, Jams, Events, Publishers, Collaboration roles, and Playtests.
2. **P1 — Studios are orphaned.** There is no public index; discovery depends on a direct link or known slug.
3. **P1 — Collaboration/Playtesting lack a clearly named personal operations home.** Applicant/tester and owner states exist but are distributed across Dashboard, Notifications, detail pages, and `/dashboard/playtests`.
4. **P2 — Explore context navigation treats six destinations as peers.** On mobile, only the first items are visible; Jams, Events, and Publishers become spatially secondary without signalling.
5. **P2 — Pricing is structurally present despite contradicting V1 product authority.** It should not be an informational side route until the business model is reconciled.

---

## 9. Navigation findings

- **KEEP:** global rail/bottom bar model, stable Search utility, object breadcrumbs, Create and account menus.
- **OBSERVED:** mobile has four signed-out destinations and five signed-in fixture destinations; targets are large and labels clear.
- **IMPROVE:** horizontally scrolling context bars need a visible overflow affordance and active-item auto-centering.
- **IMPROVE:** context bars and page titles sometimes repeat the same noun (“Explore”, “Search”), adding chrome without orientation value.
- **INTRODUCE:** personal workflow entries—Applications, Your posts, Testing—as named destinations inside Dashboard or the account menu, not additional global tabs.
- **REFINE:** back navigation on filtered lists should preserve query/filter context; direct links currently rely on browser Back rather than explicit return-state continuity.

---

## 10. Layout / composition findings

- The shell is technically responsive, but most application content uses one centered 700–800 px column even when a wider canvas could support media, comparison, or operational secondary information.
- Public object pages and operational forms need different composition rules. Today they differ mainly by content, not page architecture.
- Explore/Collaboration/Playtesting should be denser and more comparable; Project/Devlog/Profile should be more editorial and media-led.
- The landing page has the inverse problem: many competing visual devices—outer frame, hero mockup, glow, bento cards, timeline, statistic block—without enough product-specific evidence.
- Empty horizontal space is often symmetric but purposeless. Centering fixed imbalance, not composition.
- Project mobile composition is the best responsive example: image → state → title → proposition → owner → facts. This sequence should become the provenance template for related surfaces.

---

## 11. Typography findings

- **KEEP:** Inter for operational UI and JetBrains Mono for handles/tags/technical tokens; both are legible.
- **Weakness:** almost all application hierarchy is produced from the same sans family, 12/13/15/16/20/24/32 px steps, and 500/600 weight. Sections feel formatted rather than edited.
- Devlog prose is readable, but the headline/deck/byline/project context do not establish a distinct editorial register.
- Muted 12–13 px metadata is overused. Important state, owner, date, and provenance often become equally quiet.
- The landing headline is oversized but justified by marketing; repeating large scale on ordinary object pages would not solve hierarchy.
- **RECOMMENDED:** first use scale, width, line-height, casing, and placement more decisively. Only evaluate a distinctive display face after composition works; a font swap is not the first fix.

---

## 12. Color findings

- **KEEP:** restrained accent purple for links/actions/focus and semantic success/warning/danger/info tokens.
- **OBSERVED:** status tokens exist, but many meaningful facts still render as gray text. Stage, availability, jam phase, application status, playtest status, and object type do not form a consistent semantic system.
- The landing uses gradients/glows and saturated purple much more aggressively than the app, intensifying the split identity.
- **RECOMMENDED:** use quiet semantic state color, not decorative color. Let project media provide expressive color; let the platform use color for action, state, and safety.
- **REMOVE/REDUCE:** purple glows and lift effects that do not convey state or causality.

---

## 13. Component findings

### Strong primitives

- Buttons, fields, menus, dialog, tabs, badges, skeletons, EmptyState, ErrorState, avatars, and focus treatment are coherent.
- The delete-account dialog has explicit impact, a typed confirmation phrase, password requirement, safe cancel, and a disabled blocked state.
- Jam rating buttons expose `aria-label` and `aria-pressed`; pressed state changed correctly in the fixture.

### Over-generalized domain components

- `Section`, `ProjectRow`, `DevlogRow`, `EventRow`, `JamRow`, collaboration rows, playtest rows, and notification rows converge on the same divider/list anatomy.
- `ObjectHeader` gives Jam/Event/Publisher a shared baseline but not enough domain-specific composition.
- Empty/Error primitives are good; using them repeatedly without area-specific content or visual evidence still feels templated.

### Recommendation

Do not add dozens of one-off components. Add a small set of **purposeful compositions**: Project identity marker, provenance header, lifecycle header/timeline, resumptive task module, typed result preview, temporal event row, professional opportunity row, and triage notification row.

---

## 14. Visual hierarchy findings

1. Most pages have one `h1`, but semantic correctness does not create perceptual priority.
2. Profile's current Project should outrank follower counts and generic activity.
3. Dashboard's next action should outrank discovery/network modules.
4. Collaboration role + parent Project proof should outrank post metadata.
5. Playtest state + requirement + next action should outrank platform metadata.
6. Event date/time/location and Jam phase/deadline should be the visual subject.
7. Notification consequence/required action should outrank actor metadata.
8. Publisher fit and verification should outrank generic company description.

The repeated failure mode is **hierarchy by source order** rather than hierarchy by composition.

---

## 15. Density / spacing findings

- Operational rows are sometimes too generous vertically, while important metadata is too small. This creates long pages without improved comprehension.
- Public browse pages are too sparse for comparison at desktop and too tall on mobile once summaries wrap.
- The landing uses large spacing consistently, producing a polished first viewport but excessive scroll across repeated sections.
- Settings and account forms use sensible internal spacing, but the full fixture demonstrates how quickly section-after-section becomes exhausting; real routes wisely split them.
- **RECOMMENDED:** define density by job:
  - compact/scan for Search, Notifications, review queues;
  - medium/compare for Explore, Collaboration, Playtests;
  - spacious/read for Profile, Project, Devlog;
  - temporal/urgent for Jams and Events.

---

## 16. Forms / input findings

- **P1 ACCESSIBILITY:** Login/Signup inputs use placeholders without visible labels and without programmatic labels from `Field`. Placeholders disappear during entry and are not a robust accessible name.
- **OBSERVED:** empty Login submission returns the generic “Invalid email or password.” This protects account enumeration but does not identify the empty field.
- **OBSERVED:** invalid Signup email was blocked by native validation without a persistent inline error in the DOM; the component has form-level errors but no field association.
- **CODE VERIFIED:** most product forms use the better shared `Field` pattern with label, hint, `aria-invalid`, and described errors.
- **CODE VERIFIED:** onboarding has four steps, explicit progress, optional content, and skip actions on later steps.
- **Gap:** no password-recovery route or affordance is present.
- **RECOMMENDED:** visible labels, field-level validation, preserved values, explicit success/error feedback, unsaved-change protection where consequential, and a recovery path.

---

## 17. Motion / animation findings

### Observed and code-verified

- Landing uses Lenis smooth scrolling, GSAP ScrollTrigger reveal batches, CSS hero entrance animations, hover lifts, icon scaling, shadow changes, and gradient/glow effects.
- The application mainly uses 150 ms color transitions, loading spinners, skeleton pulse, toggle translation, menu/dialog behavior, and selected/pressed states.
- `prefers-reduced-motion` disables reveal motion, smooth behavior effects, skeleton pulse/spinners, and collapses transition durations.
- Create and account menus opened and closed correctly; the deletion dialog opened with a safe cancel; jam rating announced and showed pressed state.

### Classification

| Motion behavior | Decision | Reason |
|---|---|---|
| Focus/pressed/menu/dialog state | **KEEP** | Communicates interaction and causality |
| Skeleton/loading feedback | **KEEP / REFINE** | Useful, but loading ownership should move to layouts to avoid duplicated shell work |
| Toggle and score selection | **KEEP** | Clear state change |
| Landing hero entrance | **REDUCE** | One restrained entrance is enough; five stagger classes add little meaning |
| Universal below-fold reveal | **REMOVE or sharply reduce** | Content arrival is ornamental, not causal |
| Card hover lift/icon scaling/glow | **REDUCE** | Multiple simultaneous effects feel template-like |
| Lifecycle transition feedback | **INTRODUCE** | Applications, playtests, Jams, and Events need continuity when state changes |
| Save/success continuity | **IMPROVE** | Forms need explicit, persistent success and failure states |
| Navigation/page transitions | **DO NOT INTRODUCE globally** | Would decorate rather than clarify; preserve speed |

Motion should emphasize **state, causality, continuity, and feedback**. It should not be the substitute for visual hierarchy.

---

## 18. Responsive findings

### Test matrix result

The 15 major surfaces were opened at 375, 768, 1024, and 1440. None produced document-level horizontal overflow.

| Width | Shell behavior observed | Quality judgment |
|---:|---|---|
| 375 | Top utility bar + fixed bottom navigation; single-column content | Technically stable. Context and Settings tab rails hide later items; long rows create high scroll cost. |
| 768 | Compact rail and top search; no bottom bar | Stable but composition remains essentially enlarged mobile; limited use of intermediate width. |
| 1024 | Full rail begins; centered content | Large jump in navigation footprint; core content often stays narrow. |
| 1440 | Full rail; broad canvas | Significant dead space on browse/operations pages; too little editorial/secondary use of width. |

### Specific findings

- **OBSERVED:** Project mobile preserves an excellent sequence and scales its cover correctly.
- **OBSERVED:** Devlog reactions have two 39×44 px controls at 375, just below the stated 44 px width rule; in-content name/avatar links also remain below 44 px in places.
- **OBSERVED:** public product-area tabs and Settings tabs position items beyond the viewport while the document itself reports no overflow. This is intentional internal scrolling, but there is no cue.
- **OBSERVED:** bottom navigation does not create page overflow, but it visually competes with content close to the viewport edge and increases the importance of consistent safe-area padding.
- **INFERRED:** 768 and 1024 are breakpoint changes, not fully recomposed layouts. Filters, metadata, and secondary content do not meaningfully reorganize.
- **NOT TESTED:** landscape phones, on-screen keyboard, safe-area hardware, 200% zoom, Spanish expansion, real touch, and real device text rendering.

### Recommendations

1. Use mobile index → detail for Settings and management surfaces.
2. Provide visible scroll cues and auto-center active items in horizontal rails.
3. Use 1024–1440 for split views or secondary context only where the job benefits; do not merely widen empty gutters.
4. Keep Project/Devlog reading widths constrained while allowing media to extend.
5. Turn complex filters into an explicit sheet at phone widths with active-filter summary.

---

## 19. Accessibility observations

### What works

- **OBSERVED:** a keyboard Tab from page load focuses the “Skip to main content” link; the link becomes visibly prominent.
- Semantic landmarks, heading levels, navigation labels, list roles, status/error regions, dialog semantics, and `aria-pressed` on scoring are broadly strong in fixtures.
- Focus ring is globally defined and visibly high contrast.
- Reduced-motion handling is explicit.
- Destructive confirmation has a safe escape/cancel path and clear impact copy.

### Findings

1. **P1:** Login/Signup fields lack visible labels and rely on placeholders.
2. **P2:** Some inline links and reaction controls remain narrower than 44 px at 375; height is generally 44 px due blanket mobile CSS.
3. **P2:** Multiple fixture examples intentionally place repeated `h1`s on one page; this is acceptable for a fixture but must not be used as production-page evidence.
4. **P2:** Horizontal rails need a non-visual and visual indication of scrollability and current position.
5. **P2:** Color-dot Notifications do not rely on color alone because text is present, but dot color adds little semantic meaning for screen-magnification and cognitive triage.
6. **P3:** The root app background is dark while most shells paint a light canvas; watch for flash-of-background contrast during load/navigation.

### Not tested

VoiceOver/NVDA, switch control, speech input, high-contrast mode, 200%/400% zoom, localization expansion, and real reduced-motion rendering were not tested with assistive technology.

---

## 20. Content / copy findings

### Strong copy

- Settings privacy and deletion language is direct, scoped, and unusually transparent.
- Search no-results copy explains matching behavior and offers a recovery path.
- Collaboration and Playtest detail copy identifies real requirements rather than generic encouragement.
- Empty states usually describe what appears here and what the user can do.

### Weak or risky copy

1. **P0:** `/pricing` contradicts `PRODUCT.md` and the landing “always free” commitment.
2. **P1:** Landing displays “48% of all Steam full-game revenue” and “$10.8B projected indie market size by 2031” without visible sources or methodological context.
3. **P1:** The landing mockup uses invented “12 comments”, “34 views”, and “7 signed up” as if they were product evidence.
4. **P2:** “Free forever. No credit card.” on Signup is categorical while Pricing advertises paid upgrades.
5. **P2:** Public empty hubs repeatedly say “No X yet” and “be the first” without providing a credible preview of what the object does or why it matters.
6. **P2:** Several surfaces explain sorting (“latest activity, not popularity”) but the product provides limited controls to act on that knowledge.

### Recommendation

Use product truth and real community specificity. If figures are strategic, cite them. If examples are fictional, label them as examples. Avoid empty social proof.

---

## 21. Empty / loading / error / state findings

### Strengths

- The shared state matrix distinguishes first-use, cleared, no-results, restricted, error, field error, async result, and destructive/permission states.
- `/design/account` and `/design/workflows` demonstrate unusually comprehensive state design.
- Unavailable/deleted notification targets remain readable rather than becoming broken links.
- Public 404 is clear and offers a safe return.
- Search and Explore skeletons approximate list structure rather than showing a spinner-only blank page.

### Gaps

- Only a small set of route segments have `loading.tsx`; this is partly a deliberate tradeoff to preserve correct dynamic 404s.
- Immediate navigation to Explore/Search produces a full-page skeleton inside the shell. The shell remains stable visually, but current architecture remounts it per page and duplicates work.
- Public Jams, Events, and Publishers have empty states but no seeded/live object, so the primary product promise cannot be evaluated in the actual route.
- Some older Admin pages use legacy generic empty panels and do not share the nuanced state taxonomy.
- Success states after real writes were not tested; failure feedback in fixtures was visible.

### Recommendation

Keep the taxonomy. Improve route/layout ownership of loading, preserve object identity inside skeletons, and validate real write success/failure in a dedicated authenticated QA pass.

---

## 22. AI-slop inventory with exact examples

| Exact instance | Evidence | Why it feels generic | Replace with |
|---|---|---|---|
| Landing giant rounded white browser frame on dark field | `/` at 1440 | Familiar portfolio/SaaS showcase device; says nothing about indie development | Simpler editorial canvas grounded in real work/community |
| Landing mock Devlog with generic SVG platformer | `/` | Illustrative placeholder resembles generated demo content | Labelled real Project/Devlog media or honest product screenshot |
| “12 comments / 34 views / 7 signed up” | `/`, source lines | Invented social proof masquerades as evidence | Remove, or label example metrics and use real fixture data |
| Uncited “48%” and “$10.8B” statistics | `/` | Big-number credibility pattern without source context | Cite defensible research or remove the section |
| Bento-like feature blocks with hover lift and icon scaling | `/` | Every capability is equal, rounded, and animated | One product-loop narrative using real Developer/Project/Devlog objects |
| Free/Pro/Team three-column Pricing with “Most popular” | `/pricing` | Stock SaaS monetization template and product contradiction | Remove route until strategy exists, or publish truthful V1 free policy |
| Explore sections: heading + gray sentence + hairline + rows | `/explore` | Repeats one anatomy across four different discovery intents | Hero/featured work + typed shelves + denser result mode |
| Collaboration and Playtesting sharing Explore's row grammar | `/collaborate`, `/playtests/browse` | Professional fit and temporal participation become database entries | Opportunity comparison rows vs lifecycle/status rows |
| Single-letter media substitutes | Explore/Profile/Studio examples | Placeholder initial tiles do not convey games, people, or teams | Real cover/avatar/logo with a principled fallback |
| Profile identity at list-item scale | `/dev/deep`, `/dev/demo-nova` | Looks like a record inspector, not a person's home base | Curated current work as the visual anchor |
| Project identity disappears in Devlog | live Emberfall Devlogs | Article could belong to any blog | Persistent Project marker/media/stage/chronology |
| Notification dot + text repeated for every event | `/design/account` | All consequences appear equal; dot is decorative | Typed rows with actor/object thumbnail and action priority |
| Same `Section`/`SectionHeader` weight across page | profile/project/fixtures | Hierarchy comes from order, not visual emphasis | Lead, standard, and utility section roles |
| Endless muted metadata | most public rows | Important state, provenance, and trivia share one gray register | Prioritize one state and one provenance line; demote/remove rest |
| Symmetric empty desktop columns | Explore/boards at 1440 | Space is unused rather than intentionally calm | Wider compare layout, media lane, or contextual side zone |
| Generic icon + title + description empty states | Jams/Events/Publishers/Admin | Repeated primitive becomes interchangeable | Area-specific explanation, preview, and next credible action |
| Universal reveal motion | Landing below fold | Motion creates “premium” feel without state or causality | Keep only transitions that explain interaction/state |

This does **not** mean all cards, pills, or dividers are wrong. Status badges, active filters, compact pricing facts (if truthful), and discrete Project previews are legitimate. The problem is using the same treatment without a content-specific job.

---

## 23. Elements / components that should be removed

1. **REMOVE or unpublish `/pricing` in V1** until product/business authority agrees with its claims.
2. **REMOVE invented engagement counts** from the landing mockup.
3. **REMOVE uncited market statistics** or add visible, credible sources and context.
4. **REMOVE most universal landing reveal animations**; retain only purposeful entrance/feedback.
5. **REMOVE decorative purple glow/lift combinations** that do not communicate action or state.
6. **REMOVE duplicated low-value metadata** when it repeats the same fact in breadcrumb, header, and row.
7. **REMOVE decorative initial tiles where real media exists**; keep initials as an honest fallback only.
8. **REMOVE equal-weight network/opportunity modules from Dashboard's primary visual plane**; move them to Feed/Explore or subordinate them.
9. **REMOVE legacy Admin visual primitives over time**, after core public/operational patterns stabilize.

---

## 24. Elements / components that are missing

- Persistent **Project identity marker** reusable in Devlog, Feed, Collaboration, Playtest, Jam entry, Notification, and Search.
- **Provenance header** expressing Developer → Project → child object without pill clutter.
- **Resumptive task module** for Dashboard with last action, current state, next action, and urgency.
- **Typed Search preview** and typeahead for all relevant objects.
- **Public Studios directory**.
- **My applications / My posts** operating views.
- **Lifecycle header/timeline** for Playtests, Jams, Events, Collaboration applications, and Publisher contacts.
- **Temporal browse grouping** for Events and phase grouping for Jams.
- **Fit summary** for Collaboration and Publishers.
- **Curated Featured work** on Developer/Studio profiles.
- **Password recovery** and labelled auth fields.
- **Mobile filter sheet** and horizontal-scroll affordance.
- **Notification priority/reason filters** and typed row visuals.
- **Calendar action** and explicit RSVP semantics for Events.
- **Live data fixtures/seed objects** for one Jam, Event, and Publisher so their real route compositions can be evaluated.

---

## 25. Research / reference analysis with sources

Research below is organized by Glyph problem. These are transferable principles, not visual-cloning instructions.

| Glyph area | Primary-source reference | Transferable lesson | Do not copy |
|---|---|---|---|
| Dashboard | [Linear My Issues](https://linear.app/docs/my-issues), [Notion Search/recents](https://www.notion.com/help/search) | Prioritize blocked/urgent/recent resumptive work and hide irrelevant modules | Issue-tracker density or a generic activity history |
| Feed | [Linear Pulse](https://linear.app/docs/pulse), [Behance For You](https://help.behance.net/hc/en-us/articles/204484454-Guide-For-You-Feed), [itch.io followers](https://itch.io/docs/accounts/followers) | Make actor, action, object, provenance, and recency explicit | LinkedIn-style engagement chrome and resharing |
| Explore | [Behance Discover](https://help.behance.net/hc/en-us/articles/204484044-Guide-Discover-Creative-Work-on-Behance), [itch.io indexing](https://itch.io/docs/creators/getting-indexed), [Reddit Discover](https://redditinc.com/news/introducing-our-discover-tab-a-new-way-to-use-reddit-and-find-more-communities) | Separate editorial discovery from exact retrieval; use eligibility and meaningful taxonomy | Opaque popularity, polish-only ranking, endless uniform gallery |
| Search | [Figma universal search](https://www.figma.com/blog/new-ways-to-search-and-provide-context-in-figma/), [Linear Search](https://linear.app/docs/search), [LinkedIn people search](https://www.linkedin.com/help/linkedin/answer/a525054) | Type-aware suggestions and previews; filters depend on object intent | Expert query syntax or interchangeable rows |
| Developer | [GitHub profiles](https://docs.github.com/en/account-and-profile/concepts/contributions-on-your-profile), [Behance profiles](https://help.behance.net/hc/en-us/articles/360034538213-Guide-Fill-Out-Your-Profile), [LinkedIn Featured](https://www.linkedin.com/help/linkedin/answer/a550399/manage-featured-samples-of-your-work-on-your-linkedin-profile) | Identity plus consciously selected proof, then chronology | Resume bureaucracy or a meaningless contribution graph |
| Project | [Behance Projects](https://help.behance.net/hc/en-us/articles/204483684-Guide-Create-Publish-A-Project), [itch.io project design](https://itch.io/docs/creators/design), [Steam asset rules](https://partner.steamgames.com/doc/store/assets/rules) | Canonical work needs representative media, concise proposition, ordered story, truthful metadata | Steam storefront merchandising or unrestricted creator CSS |
| Devlog | [itch.io Devlog types](https://itch.io/updates/devlogs-post-types-enhanced-browsing-and-more), [Are.na blocks](https://help.are.na/docs/getting-started/blocks) | Editorial reading plus persistent parent context and meaningful post types | Generic blogging network or giant hero for every update |
| Collaboration | [LinkedIn job search](https://www.linkedin.com/help/linkedin/answer/a511260/linkedin-help-center?lang=en), [Behance freelance flow](https://help.behance.net/hc/en-us/articles/11789181719963-FAQ-How-do-Freelance-Job-inquiries-work) | Foreground fit, compensation, scope, evidence, and durable application state | Premium pressure, competition counters, corporate job-board density |
| Playtesting | [Steam Playtest](https://partner.steamgames.com/doc/features/playtest?l=english) | Treat playtest as a stateful child of the canonical game | Depot/app-ID console complexity or store chrome |
| Studios | [GitHub organization profiles](https://docs.github.com/en/account-and-profile/concepts/organization-profile), [Figma teams](https://help.figma.com/hc/en-us/articles/360039480614-Guide-to-teams) | Selected work + members/roles prove team identity | Enterprise workspace nesting and seat concepts |
| Jams | [itch.io game jams](https://itch.io/docs/creators/game-jams) | Composition and primary action change by phase | Default ranking/popularity contest or organizer configuration sprawl |
| Events | [Discord Scheduled Events](https://support.discord.com/hc/en-us/articles/4409494125719-Scheduled-Events) | Date, modality, location, interest/RSVP, permissions, and reminders are stateful | Discord server/channel complexity |
| Publishers | [Steam creator homepages](https://partner.steamgames.com/doc/store/creator_homepage?l=english), [LinkedIn Page types](https://www.linkedin.com/help/linkedin/answer/a727893) | Show catalog, verified identity, focus, relationship, and submission policy | Discounts, lead-gen clutter, follower-count authority |
| Notifications | [GitHub inbox filters](https://docs.github.com/en/subscriptions-and-notifications/reference/inbox-filters), [Linear Inbox](https://linear.app/docs/inbox) | Triage by reason, consequence, and source object | Query syntax or keyboard-command density by default |
| Settings | [Primer navigation patterns](https://primer.style/product/ui-patterns/navigation/), [Notion workspace settings](https://www.notion.com/help/workspace-settings) | Scope-aware parent/detail; mobile index → detail | Enterprise policy complexity for individuals |
| Auth/onboarding | [Discord onboarding](https://support.discord.com/hc/en-us/articles/11074987197975-Community-Onboarding-FAQ), [Primer layout foundations](https://primer.style/product/getting-started/foundations/layout/) | Ask minimal intent, focus interstitials, defer optional completion | Mandatory biography ceremony or personality quiz |
| Responsive | [Primer responsive navigation](https://primer.style/product/ui-patterns/navigation/), [Discord mobile refinement](https://discord.com/blog/refining-discords-mobile-experience-with-your-feedback) | Recompose while preserving mental model and functionality | Shrunk desktop density or features that silently disappear |

### Research synthesis

The strongest transferable pattern is not a particular aesthetic. It is **purpose-specific composition inside a stable system**. Glyph should use two coordinated registers:

- **Expressive public register:** Developer, Project, Devlog, Studio, Jam results—media, editorial typography, selected proof, provenance.
- **Quiet operational register:** Dashboard, Search, Notifications, Settings, reviews—dense scan, explicit state, next actions, restrained chrome.

---

## 26. Glyph-specific visual direction

### Direction statement

**Glyph should feel like an editorial record of games being made, connected to a calm professional operating system for the people making them.**

### Signature relationship

`Developer → Project → Devlog / Opportunity / Playtest / Jam entry`

This relationship should be visible through composition:

- Developer pages lead with current Project proof.
- Project establishes a reusable media crop, name, stage, creator/team, and accent derived from authentic media—not a generated gradient.
- Devlog inherits that Project marker while gaining an editorial reading rhythm.
- Collaboration and Playtest inherit Project proof but foreground their own role/lifecycle.
- Feed/Search/Notifications show provenance without repeating a cloud of pills.

### Product loop

| Loop stage | Product expression | Visual cue |
|---|---|---|
| BUILD | Dashboard / Project | current state + one next action |
| DOCUMENT | Devlog creation/reading | chronology, media, authored progress |
| DISCOVER | Explore / Search / Feed | typed previews and authentic Project identity |
| CONNECT | Collaboration / Playtest / Events / Studios / Publishers | fit, lifecycle, people, consequence |
| BUILD AGAIN | Dashboard / Project after feedback | surfaced decisions, feedback, and resumed work |

### Visual principles

1. One unmistakable subject per page.
2. Real work provides visual color; platform color communicates action/state.
3. Public pages may be expressive; operating pages stay quiet and dense.
4. Provenance is a layout pattern, not a pill cluster.
5. Space must create focus or support comparison—not simply remain empty.
6. Motion explains change; it does not manufacture prestige.
7. Local/community identity comes from real people, Projects, Events, and places—not decorative Arizona motifs.

---

## 27. Page-specific visual direction

### Dashboard

Lead with “Resume” for the current Project/Devlog. Follow with Needs attention, then scheduled commitments. Show network/opportunities as compact secondary links or move them to Feed/Explore. Use progress/state and next action, not vanity statistics.

### Feed

Use several event anatomies: authored Devlog, Project milestone, Playtest opening, Collaboration opening, Studio/Jam/Event update. Each keeps Developer + Project provenance and explains why it appears. Do not add generic status posts.

### Explore

Open with one or two real, editorially selected Projects/Devlogs, then purposeful shelves: Active builds, Needs testers, Open collaboration, Local/Phoenix, Recent progress. Transition to a denser filterable browse mode.

### Search

Add typeahead grouped by object. Full results use object-specific previews and counts. Support Developers, Projects, Devlogs, Studios, Collaboration, Playtests, Jams, Events, and verified Publishers. Keep filters visible and legible.

### Profile

Make current work or selected Projects the visual center. Keep identity/availability concise. Add curated Featured proof; place activity and follower counts later. Owner tools should be quiet and contextual.

### Project

Keep the strong cover-first mobile sequence. On desktop, let authentic media and proposition dominate; use a secondary facts/primary-action lane. Establish the Project marker that all child objects inherit. Compose differently by stage and activity.

### Devlog

Use an editorial article register with deck, readable line length, intentional media rhythm, and visible Project context. Make chronology and next/previous entries feel like progress through a Project, not generic related posts.

### Collaboration

Use professional comparison: role, parent Project proof, scope, commitment, compensation, remote/time zone, required evidence, deadline, team. Separate public discovery from My applications/My posts and owner review.

### Playtesting

Lead with lifecycle status, schedule/access, requirements, capacity, confidentiality, and next action. Retain Project cover and creator. Owner view emphasizes selection, build state, participation, and feedback coverage.

### Studios

Introduce public discovery. Public detail leads with selected Projects, studio focus, and members/roles. Management separates invitations, permissions, Project access, and identity settings.

### Jams

Change composition by phase: premise/schedule before start; countdown/submission live; criteria/obligation during judging; selected work/results after. Entry remains a Project with jam-specific context.

### Events

Use temporal groupings and a calendar-like date anchor. Detail leads with date/time zone, modality/location, host, capacity, and RSVP state. Preserve ended events as recaps with Project/demo evidence.

### Publishers

Use fit and trust: verified identity, genres/stages/platforms/territories, portfolio, relationship labels, submission policy, and one professional next action. Do not mimic a storefront.

### Notifications

Group by Needs action, Mentions/replies, Projects/Playtests, Opportunities/Studios, and Social. Use actor/avatar or Project thumbnail, consequence, deadline, and exact deep link. Batch low-value events.

### Settings

Keep quiet form-forward styling. Desktop parent/detail is appropriate; mobile becomes an index then a focused page. Always state identity/scope. Preserve the excellent privacy/deletion explanations.

### Auth / onboarding

Use visible labels, recovery, clearer errors, and return-to-task continuity. Onboarding begins with intent, then required handle, then optional Project/profile information. Keep optional fields deferrable and resumable.

---

## 28. KEEP / REFINE / REWORK / REMOVE / INTRODUCE matrix

| Classification | Element / decision | Why |
|---|---|---|
| KEEP | Stable responsive shell tiers | Clear, technically robust foundation |
| KEEP | Flat/hairline baseline for operational UI | Appropriate restraint when information is the task |
| KEEP | Accent purple for action/focus | Strong discipline; avoids decoration sprawl |
| KEEP | Semantic status colors and state taxonomy | Solid basis for lifecycle communication |
| KEEP | Canonical Developer/Project/Devlog URLs | Encodes core object relationship |
| KEEP | Project mobile content sequence | Best observed hierarchy |
| KEEP | Settings privacy/delete content | Clear scope, safety, consequences |
| KEEP | Detailed fixtures | Excellent design/QA infrastructure |
| REFINE | Typography scale and metadata | More decisive hierarchy, less muted sameness |
| REFINE | Project desktop composition | Let media/proposition outrank facts |
| REFINE | Devlog provenance | Parent identity must persist visually |
| REFINE | Responsive tab/filter affordances | Internal overflow needs a cue and active centering |
| REFINE | Loading ownership/skeleton identity | Stable shell and object-specific skeletons |
| REFINE | Notification rows | Add typed priority and visual source identity |
| REFINE | Forms and success/error feedback | Field labels and associated validation |
| REWORK | Profile | Current work becomes identity proof |
| REWORK | Explore | Editorial discovery plus typed browse |
| REWORK | Search result anatomies | Object-specific previews and full type coverage |
| REWORK | Collaboration and Playtesting composition | Fit vs lifecycle are different jobs |
| REWORK | Studio/Jam/Event/Publisher public presence | Purpose-specific identity and state |
| REWORK | Dashboard hierarchy | One resumptive action, then attention |
| REWORK | Feed item taxonomy | Actor/action/object/provenance by event type |
| REMOVE | Contradictory paid Pricing in V1 | Violates stated product commitments |
| REMOVE | Fake engagement counts | Misleading social proof |
| REMOVE | Uncited market-stat block | Trust risk without sources |
| REDUCE | Landing glows, hover lifts, universal reveals | Decorative effects outrun meaning |
| INTRODUCE | Project identity marker/provenance header | Cross-product signature |
| INTRODUCE | Lifecycle header/timeline | Playtests, applications, Jams, Events, contacts |
| INTRODUCE | Typed search/typeahead | Match product breadth and intent |
| INTRODUCE | Public Studio directory | Close orphaned IA |
| INTRODUCE | My applications/posts/testing views | Complete operational workflows |
| INTRODUCE | Notification reason/priority grouping | Support triage |
| INTRODUCE | Password recovery | Complete auth experience |

---

## 29. P0 / P1 / P2 / P3 findings

### P0 — must resolve before visual redesign claims

1. **Pricing/product-truth contradiction.** Public paid tiers and upgrade gating conflict with the permanent-free, no-upsell V1 authority and landing copy. Decide the business truth, then make every surface agree.

### P1 — core product experience

1. Internal product areas share one composition and do not express their jobs.
2. Developer → Project → Devlog provenance is weak outside the Project page.
3. Dashboard lacks one dominant resumptive next action.
4. Explore is database-like rather than editorial/intent-led discovery.
5. Search covers only three object types and lacks typeahead/object-specific previews.
6. Profile does not let current/selected work dominate identity.
7. Devlog reads as a generic article rather than Project progress.
8. Collaboration lacks consolidated applicant/owner operating views and strong Project proof.
9. Playtesting lacks a visually dominant lifecycle and requirement model.
10. Studios lack a public directory and strong team/work identity.
11. Jams, Events, and Publishers lack live data for actual route evaluation and need domain-specific composition.
12. Notification rows do not support consequence-based triage.
13. Login/Signup fields lack visible labels; password recovery is absent.
14. Landing uses unsupported statistics and fabricated engagement evidence.
15. Public and application visual worlds do not feel intentionally related.

### P2 — material refinement

1. Mobile context and Settings rails hide destinations without an overflow cue.
2. Intermediate breakpoints enlarge rather than fully recompose page jobs.
3. Browse/operational pages underuse 1024–1440 width.
4. Metadata is too small/muted and repeated.
5. Landing reveal/lift/glow motion is excessive.
6. Loading architecture remounts shell work and has inconsistent route coverage.
7. Admin retains a legacy component/token vocabulary.
8. Touch-target width is below 44 px for some inline/reaction controls.
9. Public empty hubs are truthful but visually interchangeable.
10. Event calendar/RSVP semantics and Jam phase urgency are not proven live.

### P3 — polish / later validation

1. Potential dark-background flash during shell navigation/loading.
2. Some page title/context labels repeat.
3. Initial fallbacks need a more deliberate media absence policy.
4. Long-title truncation and localization require real Spanish/zoom testing.
5. Hover treatments should be validated with pointer devices after the visual hierarchy is redesigned.

---

## 30. Dependency-ordered redesign plan

### Phase 0 — resolve truth and evidence

1. Decide V1 pricing/business truth; remove or rewrite `/pricing` and conflicting copy.
2. Remove/cite landing statistics and label/remove invented engagement metrics.
3. Seed or safely fixture one approved Jam, Event, and Publisher detail for live visual QA.

### Phase 1 — define the product visual grammar

1. Define expressive public vs quiet operational registers.
2. Define Project identity marker and provenance rules.
3. Define density tiers, lead/standard/utility hierarchy, media fallbacks, and lifecycle states.
4. Prototype Profile, Project, Devlog, Dashboard, and one workflow before changing primitives broadly.

### Phase 2 — close IA and auth prerequisites

1. Add public Studio discovery decision/route.
2. Define My applications/posts/testing homes.
3. Expand Search object coverage and typeahead information architecture.
4. Add labelled auth fields and password recovery.

### Phase 3 — flagship object chain

1. Rework Developer Profile around selected/current work.
2. Refine Project as canonical visual source.
3. Rework Devlog as editorial progress with persistent provenance.
4. Verify Project → Devlog → Profile continuity on all breakpoints.

### Phase 4 — discovery and circulation

1. Rework Explore into editorial entry + typed browse.
2. Rework Search previews/filters.
3. Rework Feed event taxonomy.
4. Carry Project identity into every circulation surface.

### Phase 5 — operational home and triage

1. Rework Dashboard around resume/attention/schedule.
2. Rework Notifications around reason/consequence.
3. Preserve Settings' content while improving mobile navigation and feedback.

### Phase 6 — structured connection lifecycles

1. Collaboration discovery + applicant/owner operations.
2. Playtesting recruiting/access/feedback lifecycle.
3. Studio public identity and management separation.
4. Jams, Events, Publishers with domain-specific compositions.

### Phase 7 — responsive and motion system

1. Recompose 375/768/1024/1440 for every major surface.
2. Add filter sheets, scroll cues, split views only where justified.
3. Reduce decorative landing motion; add lifecycle/save feedback motion.
4. Validate keyboard, reduced motion, zoom, localization, real touch/safe areas.

### Phase 8 — authenticated end-to-end validation

Test with isolated real roles: new developer, returning owner, collaborator, tester, studio member/admin, event participant/host, verified publisher, admin. Verify writes, redirects, notifications, success/failure, permissions, responsive states, and recovery. Only then assess completion.

---

## 31. Routes / states that remain untested and why

### Production page bodies not rendered in their intended state

The following **42 routes were opened and their access boundary was observed**, but their intended page body was not browser-tested because no authenticated session/role was available:

`/onboarding`; all 9 `/admin*` pages; `/collaborate/new`; all 19 `/dashboard*` pages; `/feed`; `/notifications`; all 7 `/settings*` pages; `/jams/[slug]/submit`; `/jams/[slug]/vote`; `/playtests/[id]/test/[session-id]`.

What mitigates—but does not erase—the gap:

- `/design/shell` covers signed-in navigation.
- `/design/dashboard` covers Dashboard/Feed states.
- `/design/workflows` covers Collaboration and Playtest lifecycles/forms.
- `/design/graph` covers Jam/Event/Studio/Publisher states and controls.
- `/design/account` covers Notifications/Settings/deletion states.
- `/design/objects` covers owner/visitor Profile/Project/Devlog/comments.

Fixtures do **not** prove database integration, role enforcement, cross-user continuity, email/auth providers, latency, success toasts, or real redirects.

### Production detail bodies blocked by absent current data

These **4 routes were opened and returned the real 404**; no matching approved/live object was available:

- `/jams/[slug]`
- `/jams/[slug]/results`
- `/events/[id]`
- `/publishers/[id]`

Their source and corresponding graph fixtures were reviewed, but their real media/content density, permissions, and transitions remain untested.

### Flows/states not claimed as tested

- Real signup, email verification, OAuth, interrupted/expired verification, password recovery, onboarding persistence.
- Actual Project creation/edit, Devlog create/edit/draft/delete, comment edit/delete, reaction write, follow/mute/block write.
- Collaboration create/apply/owner review across separate users.
- Playtest request/accept/build access/completion/feedback across separate users.
- Studio creation/invitation/role change/removal/leave.
- Jam host approval, live submission, voting integrity, completed results.
- Event RSVP/capacity/calendar/demo-slot/host flow.
- Publisher verification, shortlist/contact/inbox response.
- Admin moderation/approval/flags in an admin session.
- Real write success/failure under latency, offline/retry, and concurrency.
- Assistive technology, 200%/400% zoom, high contrast, Spanish expansion, landscape phone, physical safe areas, and on-screen keyboard.

### Final audit conclusion

This is not a “PASS” audit. Glyph has a strong structural foundation and unusually thoughtful state coverage, but it does not yet present the entire product as a mature, art-directed experience. The next step is not another global polish pass. It is a dependency-ordered redesign that makes each job visually distinct while using Project provenance to hold the whole system together.

