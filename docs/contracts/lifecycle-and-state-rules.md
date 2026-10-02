# Lifecycle & state rules contract

## Object lifecycles
- **Project:** `draft → published → archived`. Draft = owner-only; archived = excluded from Current Work and discovery.
- **Devlog:** gated by `published_at` (null or future = not public; owner sees drafts/scheduled).
- **Collaboration:** post lifecycle + an application lifecycle that is unique per (post, applicant).
- **Playtest:** request lifecycle (open / closed / reopen) + a session lifecycle unique per (tester, playtest); five-step tester journey.
- **Events:** RSVP ("Going" counted from RSVP rows); demo slots (`requestDemoSlot`, accepted slots link to project pages).
- **Jams:** `jam_entries` reference projects and surface only when `admin_approved`; entries stay Projects (nothing copied).

## Empty / error state distinctions (must stay distinct)
- **first-use** (nothing exists yet) vs **cleared** (following/exists but nothing published) vs **no-results** (filtered, or past the last page). Error state is separate from empty and offers a retry/reload path.
- Do not collapse editorial lifecycle, audience visibility, discovery eligibility, and domain phase into one status.
