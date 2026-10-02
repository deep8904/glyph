# Signed-in App Direction

## App shell

The shell should feel calm and fast. Keep global navigation stable, distinguish personal work from public discovery, and preserve current context. Use a compact navigation rail, a page-specific command area, and an optional inspector/decision rail when the workflow needs it.

## Surface map

### Home / Dashboard

- Lead with **Resumptive Work**: continue a draft Devlog, review playtest feedback, respond to a collaboration request, or finish Project setup.
- Separate “needs action” from “recent activity.”
- Do not turn the page into an equal-weight widget grid.

### Feed / Following

- Public activity only; never leak private operational requests.
- Each item shows creator, ProjectIdentityMarker, object type, reason for appearance, timestamp, and meaningful content preview.
- Prioritize reading rhythm over engagement counters.

### Explore

- Visually led, curated browsing with strong project covers and typed filters.
- Make editorial curation distinct from exact Search.
- Use varied but systematic composition; avoid an endless identical card grid.

### Search

- Command-palette entry plus full results page.
- TypedResult rows distinguish Projects, People, Devlogs, Collaboration, Playtests, Studios, Jams, Events, and Publishers.
- Support keyboard navigation, recent queries, clear filter state, and truthful empty states.

### Project

- Canonical source of identity: media, purpose, stage, team, latest proof, Devlog chronology, collaboration needs, and playtest status.
- Separate public presentation from owner controls.
- Use a LifecycleSummary instead of scattered badges.

### Devlog

- Reading-first composition with visible Developer → Project provenance.
- Support mixed media, captions, headings, build/version metadata, and next/previous chronology.
- Editor preview should preserve reading layout without making editing controls decorative.

### Profile

- Person first, then credible Project proof, roles, skills, and recent Devlogs.
- Avoid résumé-card overload and vanity stats.

### Collaboration

- Foreground role, scope, project stage, commitment, compensation/expectation truth, owner, and lifecycle.
- Structured contact/request flow beats open-DM-first contact.
- Management view prioritizes pending decisions and history.

### Playtesting

- Guided setup is justified here: target build, audience, access, tasks, feedback prompts, and close date.
- Results emphasize themes, severity, build/version, and evidence; do not reduce feedback to a vanity score.

### Studios

- Studio identity groups people and Projects. Keep permissions and membership distinct from public presentation.
- Use a quiet management area and expressive public profile.

### Jams / Events

- Date and phase dominate. Use TemporalAnchor for registration, submission, judging/review, and completion.
- Jam entries remain Projects with a contextual participation state.

### Publishers

- Keep this lightweight until real workflows justify CRM depth.
- Focus on discovery context, project fit, contact boundaries, and evidence—not speculative deal pipelines.

### Notifications

- Group by actionability and Project, not icon color.
- Show actor, object, reason, timestamp, unread state, and destination.
- Notifications inform; contextual management screens execute complex work.

### Settings

- Plain, trustworthy, and utilitarian.
- Use explicit save states, recovery boundaries, permission explanations, and truthful destructive-action copy.

### Onboarding

- Fast, optional where possible, and progressively disclosed.
- Get a developer to one credible Project quickly; defer nonessential customization.
- Teach advanced actions in context. Apple recommends fast, optional onboarding and interactive learning: [Apple HIG Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding).

## Product UI references

- [ClauseOS dashboard](https://dribbble.com/shots/27166432-ClauseOS-Dashboard-Compliance-Management-Platform) — PUBLISHER DESCRIPTION; extract scan hierarchy, status, dates, and activity grouping, not its domain-specific dashboard furniture.
- [Raktor dashboard](https://dribbble.com/shots/26864675-Raktor-Drone-Mission-Web-Dashboard) — PUBLISHER DESCRIPTION; extract prioritized signal and operational context, not HUD aesthetics.
- [NotifyHub](https://dribbble.com/shots/25897849-NotifyHub-Notification-Platform-Landing-Page) — PUBLISHER DESCRIPTION; extract structured multi-channel workflow explanation.
- [Linear](https://linear.app/) — DIRECTLY REVIEWED; extract density, focus, compact metadata, and product proof.
- [GitHub Primer](https://primer.style/product/) — OFFICIAL DOC; use as a reference for cohesive, accessible, responsive product patterns.
- [Behance search/filter guidance](https://help.behance.net/hc/en-us/articles/204483864-Guide-Search-Filter-Creative-Work) and [featured projects](https://help.behance.net/hc/en-us/articles/204483974-Guide-Featured-Projects) — OFFICIAL DOC; extract typed discovery and visible curation.

## State completeness

Every redesigned surface needs realistic examples for:

- populated;
- empty but available;
- loading/skeleton;
- inline failure;
- full-page failure;
- unauthorized/forbidden;
- deleted/expired;
- long text and missing media;
- keyboard focus;
- reduced motion;
- narrow mobile and large desktop.

