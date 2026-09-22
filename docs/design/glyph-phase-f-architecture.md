# Phase F — Studios, Jams, Events, Publishers: object model and how each connects to the graph

Written before implementation. Everything below describes what exists in the schema/RLS today (read from code and migrations 009, 011, 012, 014, 034). **Phase F is presentation and information architecture only**: no new tables, no policy changes, no new lifecycle states, no duplicated content.

The graph is **Developer ↔ Project ↔ Devlog**. These four objects are *contexts around it*, never parallel content systems:
| Object | What it is (identity) | How people take part (participation) | What it points at |
|---|---|---|---|
| **Studio** | A group identity that owns or represents work | Membership (owner / admin / member); invitations | Existing **projects** (`studio_projects` links) and existing **developers** |
| **Jam** | A time-bounded context in which projects are made | Hosting; **entries** (`jam_entries` → an existing `project`, plus its team lead); votes | Existing **projects** (entries). A jam has no posts or devlogs of its own |
| **Event** | An occurrence people attend | Hosting; RSVP (`event_rsvps`); **demo slots** (`event_demo_slots` → an existing project + the demoer) | Existing **projects** (demo slots); **developers** (host, attendees as a count) |
| **Publisher** | A professional entity (verified by an admin) | Shortlists (private), **contacts** (a publisher's message to a developer about a *public project*) | Existing **projects** (shortlist items, contact subject); the developer who owns them |

Identity is the row itself (name, description, links). Participation is a separate relationship row. Pages show identity first and participation as sections; they never merge the two (a jam is not "a page of entries", an event is not "a list of RSVPs", a studio is not "a developer with more members").

## Object model
| | Studio | Jam | Event | Publisher |
|---|---|---|---|---|
| Canonical URL | `/studios/[slug]` (public), `/dashboard/studios/[slug]` (manage) | `/jams/[slug]`, `/jams/[slug]/{submit,vote,results}` | `/events/[id]`, `/events/city/[city]`, `/events/[id]/calendar.ics` | `/publishers/[id]` (verified only, or own) |
| Owner | studio owner(s) (`studio_members.role = owner`; last-owner rule in DB) | host (`host_id`) | host (`host_id`) | account user (`user_id`) |
| Participants | members with role; pending invitations (managers only) | entrants (project + team lead); voters | hosts, RSVP'd users (count), demoers | none public; developers who were contacted (private) |
| Developer relation | members are developers; each links to `/dev/[u]` | host and team leads are developers | host is a developer; demoers are developers | the rep is a developer (`profiles`); contacts target developers |
| Project relation | linked projects (`studio_projects`); shown with the same `ProjectRow` and link to `/p/[u]/[slug]` | entries are projects; link to the canonical project page | demo slots are projects; link to canonical page | shortlist items and contacts reference projects; link to canonical page |
| Devlog relation | "Recent work" = the newest published devlogs of the studio's public projects (existing devlogs, shown with `DevlogRow`, linking to the canonical devlog) | none (a jam does not host devlogs; entries link to project pages where devlogs live) | none (demoed projects link to project pages) | none (a publisher reads project pages and devlogs like anyone else) |
| Primary action | Manage (members) / read | Submit entry (running) · Vote (voting) · View results (completed) · Host a jam | RSVP going / maybe / cancel · Host an event | Contact developer is on the **project page**; here: Register / manage account |
| Secondary | Follow through to projects and developers | Read rules; open entries | Add to calendar (.ics); manage (host) | Website; the rep's profile |
| Discovery | Project page (studio line), developer profile (affiliation), Explore lists projects not studios (unchanged) | `/jams` (approved only) | `/events` (published, upcoming), city pages | `/publishers` directory (verified) |
| Lifecycle | `active` / `deleted` (closed when its last member deletes an account); verified flag (admin) | `upcoming → running → voting → completed`, or `cancelled`; `admin_approved` gate | `draft → published → completed` or `cancelled` | unverified → `verified` (admin) |
| Permissions | RLS + guard triggers + definer RPCs (Phase 9): only owner changes roles; managers invite; anyone reads active studios | public read when approved (host sees own before approval); entry/vote rules in DB incl. self-vote block | public read published/completed; RSVP signed-in; host manages | verified accounts public; own account always; contacts only for verified publishers about public projects (DB) |
| Notifications | `studio_invitation`, `studio_removed`, `studio_role_changed`, … (Phase 9 triggers) | none | none | `publisher_contact` to the developer |
| Empty state | no projects / no team members to show | no jams; no entries yet; no results (no entries) | no upcoming events; city with none; no demo slots (section omitted) | no verified publishers; no shortlists; no messages sent/received |
| Error state | `ErrorState` where a list query can fail | `ErrorState` on list/entries | `ErrorState` on list | `ErrorState` on directory |

## Identity vs participation (what each page shows, in order)
- **Studio** — Identity (mark, name, size · location · founded, website, verified) → About → Projects (linked, canonical rows) → Team (members with roles) → Recent work (devlogs from those projects). Never a follower count, never studio-owned posts.
- **Jam** — Who runs it and what it is (title, host, theme) → **When** (phases as an ordered list with the current one marked) → About → Rules → Prizes → Participation (entries = projects; results only when the jam is in voting/completed). One primary action, chosen by phase.
- **Event** — What and when/where (title, type, date, place, attendance, calendar) → About → Participation (demo slots = projects, only accepted ones) → RSVP. Host gets a manage link.
- **Publisher** — Identity only on the public page (name, verified, about, website, who represents them on Glyph). The *relationship* with a developer/project lives where the project is: the project page (shortlist/contact for publisher viewers), the publisher's private dashboard (shortlists, sent messages) and the developer's private inbox (received messages). The public page says so.

## Shared primitives, no universal page
Reused: `SectionHeader/Section`, `MetadataBar`, `ProjectRow` (`listing`, `compact`), `DevlogRow` (`listing`), `DeveloperRow`, `StatusText`, `StatusSteps`, `Badge`, `Avatar`, `EmptyState`, `ErrorState`, `FilterLinks`, `Pager`, `Field/Input/Select/Textarea`, `Button`, `Dialog`.
New, small, single-purpose (each used by ≥2 places): `ObjectHeader` (eyebrow · title · state · byline), `MemberRow` (studio team line), `EventRow`, `JamRow`, `PublisherRow`. No `UniversalObjectPage`; each route decides its own hierarchy.

## Out of scope / not changed
Backend, RLS, migrations, server actions; the loading/404 architecture; query counts; compensation on collaboration. Admin pages (`/admin/*`) also render through the old `PageShell` panel helpers but are staff tools, not these four objects — untouched. `/pricing` likewise.

## Known issues found while reading (fixed in presentation only)
1. `/events/[id]` compared the host's *username* to the viewer's *user id* (`evt.profiles.username !== user?.id`), so a host got a 404 on their own draft or cancelled event even though the `events_read` policy lets the host read it (`published`/`completed` are public; other states host-only). The page's "Cancelled" state was therefore unreachable. Fixed by comparing `host_id` to the viewer; RLS remains the real gate (non-hosts still 404 on draft/cancelled).
2. Jam entry `submission_url` was rendered as an `href` without an https check (open issue since Phase 10). Guarded with `isHttpsUrl`.
3. `/jams/[slug]` host check re-queried a profile inside the `notFound` condition; replaced by `host_id === user.id`.

---

# Implementation record (what shipped)

**Shared, single-purpose components:** `ObjectHeader`, `MemberRow`, `EventRow`, `JamRow` (+ `JAM_PHASE`), `PublisherRow`, `DemoSlotRequest`; existing `StatusText`, `StatusSteps`, `MetadataBar`, `Section`, `ProjectRow`, `DevlogRow`, `Field`/controls, `Dialog`, `Popover` reused. No universal object page.
**Studio** — `/studios/[slug]`: Identity → About → Projects (`ProjectRow listing`, same rows as Explore) → Team (`MemberRow`) → Recent work (`DevlogRow listing` from the studio's own public projects, matched by owner + slug). `/dashboard/studios*`: list, invitations, new, and management migrated onto tokens/primitives; every confirm flow and server call unchanged.
**Jam** — `/jams` by phase; `/jams/[slug]`: header (host, theme), one primary action chosen by phase, **When** as an ordered list with the current phase marked, About (+ team size / assets), Rules (markdown), Prizes, Entries = existing projects linked to `/p/…` (rank and votes only in voting/completed). Results and voting are rows, not cards; medals/emoji removed; the play link is https-only. Hosts see a "awaiting review" note on their own unapproved jam. **The project page now shows "Entered in <jam>"** so the link runs both ways.
**Event** — `/events` (kind filter chips + city, URL state), `/events/city/[city]`, `/events/[id]` (header, When/Where/Going/Calendar, RSVP, About, **Being shown** = accepted demo slots → project pages, **Demo a project** for signed-in non-hosts using the existing `requestDemoSlot` action), host management. "Going" is counted from RSVP rows.
**Publisher** — `/publishers` and `/publishers/[id]` identity-only (rows, header, About, website, who represents them, a short "how publishers work with developers" note); relationship surfaces restyled: publisher dashboard, contact page, developer inbox (now links each subject to the canonical project page), shortlist popover on the project page.
**Removed:** every use of `PageShell`/`PanelHeader`/`PanelBody` from these four objects (only `/admin/*` and `/pricing` still use it), rounded-3xl cards, colored status pills, mono-caps labels, medals.

## Backend findings (documented, not migrated)
1. **`events.rsvp_count` never moves for a non-host RSVP.** `rsvpToEvent` updates it from the RSVPer's client but `events_update` only allows the host. The UI now counts `event_rsvps` rows instead (`lib/events.ts`). A real fix is a trigger; deferred.
2. **Accepted demo slots are invisible to the public.** `demo_slots_read` allows only the demoer and the host to read, so "Being shown" is empty for everyone else. Making it public is an RLS change; deferred. (The demoer and host do see it.)
3. `event_demo_slots` requests had no UI at all (action existed); `DemoSlotRequest` exposes it.
4. Past `published` events stay `published` forever; the page now derives "Ended" and hides RSVP/demo requests.
5. No jam or publisher rows exist in the database, so their detail pages were verified through fixtures only.

## Verified
- Production build smoke: `/jams`, `/events` (+ filter), an event, its `.ics`, `/events/city/…`, a studio, `/publishers`, a project page all 200; unknown jam, jam results, event id, studio, publisher (non-uuid) and an **unverified** publisher (RLS-hidden) **404**; every submit/vote/host/dashboard route redirects signed-out users to `/login`; 0 legacy panel/plasma/shadow classes in the public HTML of jams, events, studio, publishers.
- Browser: signed-out `/jams`, `/events` and filters, `/events/[id]` (375 and 1024), `/studios/[slug]` (1024) with real data and their empty states; `/design/graph` fixture (dev only) at **375, 768, 1024**: no horizontal overflow, no unlabelled control, rail/bottom bar switch correctly at 768, no button under 44px (inline name links in sentences excepted), studio remove-confirm, shortlist popover (opens, `aria-pressed` items, Escape returns focus to trigger), vote controls (`aria-pressed`, unsafe `javascript:` link not rendered).
## Not verified (email-OTP; no real session; missing data)
All writes and role checks in a browser: RSVP, demo request/accept, submit/vote/host a jam, studio invite/role/leave/link, publisher register/shortlist/contact/inbox status, event publish/cancel. A populated studio page and any jam/publisher detail page with real data. 1440 wide, real touch devices, screen readers.
