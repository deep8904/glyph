# Glyph IA and structure benchmark

## Benchmark principles

The strongest products separate four jobs that weak “everything apps” collapse:

1. **Operate:** act on owned or joined work.
2. **Discover:** browse unfamiliar people, projects, opportunities, and time-bound activities.
3. **Retrieve:** search for a known object or satisfy a specific query.
4. **Respond:** handle invitations, applications, access decisions, and notifications.

GitHub distinguishes repository context from global navigation. itch.io preserves a canonical game while devlogs and jam submissions refer back to it. Meetup separates event discovery from organizer management. Linear separates actionable inbox items from ordinary activity. Glyph should preserve these boundaries.

## Top-level IA comparison

| Product family | Global navigation | Contextual navigation | Canonical objects | Creation entry | Structural lesson for Glyph |
|---|---|---|---|---|---|
| LinkedIn / Wellfound / Contra | Home/network/jobs/messages/notifications/profile | Profile sections; job/applicant management | Person, company, job, application | Global post/create or employer workspace | Separate public identity from private hiring operations |
| GitHub / GitLab | Dashboard, Issues, Pull requests, Explore, search, create, inbox | Repository/org local tabs | Repository, org, issue, discussion, release | Global `+`, then contextual create | Carry owner/project identity through every child workflow |
| itch.io / Steam | Browse/search, jams/community, creator dashboard | Project/store-page tabs and creator controls | Game/project, devlog, jam entry, playtest | Global upload/create, then dashboard | The Project is the durable hub; publishing and operations are separate |
| Meetup / Luma / Eventbrite | Discover, calendars/groups, create, tickets/RSVPs | Event page plus host dashboard | Event, series/calendar/group, registration | Prominent Create | Keep attendee-facing page separate from host management |
| Devpost / Ludum Dare | Browse competitions, dashboard, submissions | Competition overview/rules/participants/submissions/results | Competition, team, submission | Host create or participant join | Make deadlines and eligibility part of the object model |
| Linear / Slack / Discord | Workspace switcher, inbox/activity, search | Team/channel/project/thread context | Workspace, team/channel, issue/message | Contextual create | Notification scope and reason must be legible |

## Recommended Glyph global navigation

### Primary authenticated desktop navigation

- **Home** — owned/joined work and “Needs attention.”
- **Explore** — editorial and categorical discovery outside the user's graph.
- **Following** — work updates from followed people/projects/studios and joined contexts.
- **Opportunities** — two explicit tabs: Collaborate and Playtest.

**Create** is a prioritized action, not a navigation destination: Project; Devlog after Project selection; Opportunity (Collaboration/Playtest); Event/Jam/Studio under More or recently used.

### Global utilities

- **Search** — universal typeahead and result page with type tabs.
- **Notifications** — awareness/action triage, not a second feed.
- **Profile/account** — public profile, saved items, Settings.

### Secondary discovery destinations

Jams, Events, Studios, and Publishers remain directly addressable and appear in Explore. They do not all deserve equal permanent global weight on narrow screens. Desktop may expose destinations supported by actual inventory and repeat use; mobile uses a More/Explore hierarchy without hiding current tasks.

## Contextual navigation

| Context | Public/collaborator tabs | Owner/manager tabs |
|---|---|---|
| Project | Overview, Devlogs, Team/Credits, Playtests, Opportunities | Edit, Media, Access, Activity, Archive |
| Developer | Work, Devlogs, About, Availability | Edit profile, Pins, Visibility |
| Studio | Overview, Projects, People, Activity | Members, Invitations, Roles, Settings |
| Event | Overview, Schedule/Details, Attendees when public | Registrations, Messages, Check-in, Settings |
| Jam | Overview, Rules, Entries, Participants, Results | Setup, Eligibility, Submissions, Judging, Moderation |
| Playtest | Brief, Eligibility, Status, Feedback after completion | Requests, Cohorts, Build access, Responses, Settings |
| Collaboration | Role brief, Project, Terms, Apply/Status | Applicants, Review, Close/Reopen |

Local tabs should be permission- and lifecycle-aware. Hiding an unavailable management tab is acceptable; hiding object status is not.

## Object hierarchy

```text
Developer ──owns/joins──> Project <──owned by── Developer or Studio
   │                        ├── Devlogs
   │                        ├── Media / links / builds
   │                        ├── Credits / collaborators
   │                        ├── Collaboration openings ──> Applications
   │                        ├── Playtests ──> Requests ──> Sessions ──> Feedback
   │                        ├── Jam entries ──> Jam
   │                        └── Publisher contacts / shortlist (private)
   └──member of──> Studio ──> Members / invitations / attached Projects

Event ──organized by──> Developer or Studio
Jam ──hosted by──> Developer or Studio
Notification ──references──> durable object identity + safe fallback
```

The graph should not manufacture duplicate “social posts.” A Devlog is a project update; a jam entry is a versioned Project submission; a Playtest is a Project operation.

## Canonical pages and management separation

Every durable object needs one shareable public or participant-facing canonical route plus a separate management surface. The canonical route answers: what is this, who owns it, what state is it in, and what can I do? The management route answers: what requires attention, who has access, and what transition happens next?

Do not place private applicant notes, tester eligibility, publisher relationship notes, draft content, or private build URLs into public page payloads. Public and management queries should be separate, with server-side authorization and field-level selection.

## Settings benchmark and proposal

Use a stable left navigation on desktop and drill-in list on mobile:

1. Account and identity
2. Public profile
3. Security and sessions
4. Privacy and visibility
5. Notifications and digests
6. Connected services
7. Data/export
8. Danger zone

Studio/project settings are contextual, not mixed into personal account settings. Destructive actions sit behind explicit consequence copy, typed confirmation where proportionate, reauthentication for sensitive changes, and recovery/transfer options when possible.

## Mobile behavior

- Mobile bottom navigation is **Home, Explore, Create, Alerts, You**. Search is the first control in Explore and a header action elsewhere.
- Convert facet rails to filter sheets with an applied-count indicator and removable chips.
- Keep state and primary action above the fold on canonical pages.
- Use sticky save/publish controls only when they do not cover validation or the keyboard.
- Preserve project/event/jam context in headers during multi-step creation and management.

## Action ownership and canonical/manage handoff

- Home aggregates actionable domain tasks across objects.
- The contextual management queue is where the task is processed and remains source of truth.
- Notifications record awareness/delivery; read is never equivalent to complete.
- Following contains public/followed activity only.
- Canonical pages expose one restrained Manage action to authorized users.
- Management headers preserve object identity/status and link to an audience-safe public preview.
- Creation ends on management Overview with one next action and a secondary View public page.

## Avoid

- One global feed mixing projects, people, jobs, jams, events, and notifications with identical cards.
- Seven equally weighted permanent destinations on mobile.
- Private manager controls embedded unpredictably in public pages.
- Separate duplicated objects for “post,” “update,” and “announcement” when a typed Devlog suffices.
- Settings organized by internal database/table names.
