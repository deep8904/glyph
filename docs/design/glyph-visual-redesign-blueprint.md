# Glyph visual / product redesign blueprint

**Date:** 2026-09-22  
**Status:** definitive design blueprint; implementation has not started  
**Authority:** `docs/design/glyph-entire-application-ui-ux-audit.md`  
**Product authority:** `PRODUCT.md`  
**Scope:** visual design, page composition, interaction hierarchy, responsive behavior, content presentation, and design-system direction. Existing routes, permissions, data ownership, and backend behavior remain authoritative unless this document explicitly marks a comprehension-critical UX gap.

---

## 0. Decisions at a glance

### Core visual thesis

**Glyph is the living build record for unfinished games:** an editorial presentation of real work in progress, connected to a calm professional workspace for the people making it. Real Project media and visible provenance provide the character; the platform itself stays precise, restrained, and honest so creative work—not decorative chrome—carries the emotion.

Glyph should be recognizable through three repeated ideas:

1. a Project always keeps its visual identity as it travels through Devlogs, Feed, Search, Collaboration, Playtests, Jams, and Notifications;
2. progress is shown as chronology and state, not as generic social posting;
3. each product job gets a distinct composition while sharing the same type, color, control, and accessibility system.

### The ten highest-impact changes

1. Resolve the free-product contradiction by retiring paid-plan UI and redirecting `/pricing` to the landing page's truthful free-product section.
2. Introduce one reusable **Project Identity Marker** and one **Provenance Header** across all child/circulation surfaces.
3. Recompose Profile → Project → Devlog as Glyph's flagship visual chain.
4. Rework Dashboard around a single resumptive action, followed by actionable attention and scheduled commitments.
5. Split the current universal row grammar into typed compositions for discovery, opportunity, lifecycle, temporal, and triage work.
6. Rework Explore into editorial entry points plus dense typed browsing; keep Search retrieval-first and visually quiet.
7. Introduce a restrained lifecycle grammar for Collaboration, Playtesting, Jams, Events, and Publisher contact states.
8. Reduce landing-page template effects and replace invented proof with labelled real product content.
9. Recompose 375, 768, 1024, and 1440 as distinct layouts, including scroll cues, mobile filter sheets, and useful wide-screen secondary zones.
10. Preserve current accessibility/state foundations while adding visible Auth labels, clearer field feedback, and 44 px interactive targets.

---

## 1. Visual design thesis

### The visual idea: **The living build record**

Glyph is not a storefront for finished games, a social network for personal broadcasting, or a generic project-management tool. Its visual subject is **work becoming real**: experiments, milestones, rough builds, decisions, feedback, collaborators, and the trail connecting them.

The design therefore combines two coordinated registers:

- **Editorial record:** public Developer, Project, Devlog, Studio, Jam-result, and Event-recap surfaces. These use real media, stronger type hierarchy, authored rhythm, and visible provenance.
- **Working desk:** Dashboard, Feed, Search, Notifications, Settings, reviews, and management. These use dense scanning, explicit status, predictable controls, and quiet surfaces.

They share the same fonts, color semantics, control geometry, focus system, Project marker, and spacing logic. They do not share identical page anatomy.

### How the core relationship appears

`Developer → Project → Devlog`

- **Developer** owns a body of work. The page leads with what they are actively building, not follower counts.
- **Project** is the canonical visual object. It establishes a persistent cover crop, title, stage, creator/team, and current status.
- **Devlog** is a dated chapter in that Project. It inherits the Project marker but uses an editorial reading composition.

The same provenance pattern extends to `Opportunity`, `Playtest`, and `Jam entry`. A user should never have to remember which game a child object belongs to.

### How the product loop appears

| Loop | Primary surfaces | Required visual signal |
|---|---|---|
| **BUILD** | Dashboard, Project | current state, last meaningful change, one next action |
| **DOCUMENT** | Devlog editor/detail | date, authored progress, media, place in Project chronology |
| **DISCOVER** | Explore, Search, Feed | Project identity, why this item is here, typed preview |
| **CONNECT** | Collaboration, Playtesting, Studios, Jams, Events, Publishers | fit, people, lifecycle state, consequence |
| **BUILD AGAIN** | Dashboard, Project, Notifications | feedback/decision reflected as a resumptive action |

### What Glyph should feel like

- candid rather than promotional;
- crafted rather than decorated;
- active rather than “launched”;
- calm enough for serious work, expressive enough for creative work;
- community-rooted through real people, places, and projects;
- professional without corporate bureaucracy;
- unfinished in content, never unfinished in interface quality.

### What Glyph must not feel like

- an AI startup landing template;
- a cyberpunk/gamer dashboard;
- a marketplace optimized for conversion;
- LinkedIn with games attached;
- an issue tracker wearing creator imagery;
- a portfolio gallery that hides process;
- a wall of cards, pills, metrics, gradients, or gray dividers.

---

## 2. Product personality

### Personality attributes

| Attribute | Expressed through | Avoid |
|---|---|---|
| **Candid** | dates, stage, current state, constraints, honest empty/error copy | inflated proof, vanity metrics, “premium” language |
| **Skilled** | precise hierarchy, compact metadata, stable controls, strong writing measure | visual tricks that compensate for weak information |
| **Curious** | process media, Devlog chronology, experiments and decisions | gamified streaks or activity-for-activity's-sake |
| **Grounded** | neutral platform palette, real project media, local event/place evidence | blobs, glows, fantasy-tech theming |
| **Generous** | useful context before actions, safe states, clear requirements | dark patterns, urgency theater, paywall pressure |
| **Connected** | persistent provenance and relationship labels | generic feeds and detached posts |

### Voice implications

- Name the object and consequence directly: “Maya requested access to Emberfall Keep” rather than “You have new activity.”
- Prefer current state and next action: “Feedback due Friday” rather than “In progress.”
- Label examples as examples. Do not present invented counts as product evidence.
- Use “developer,” “project,” “devlog,” “playtest,” and “studio” consistently; avoid generic “content,” “item,” and “workspace” in user-facing text.
- Preserve the existing direct, transparent Settings and deletion language.

---

## 3. Visual principles

1. **Real work is the visual identity.** Covers, screenshots, clips, diagrams, process images, and authored text supply expression. The platform does not generate decorative identity around missing content.
2. **One subject leads each page.** A Developer's current work, a Project's media/proposition, a Devlog's dated claim, a Jam's phase, or an Event's date/location must visibly outrank secondary sections.
3. **Provenance travels with the object.** Every child or circulated item keeps Developer + Project context through one consistent composition, not repeated badges.
4. **Composition follows the job.** Reading, comparing, deciding, triaging, and administering use different page grammars and density.
5. **State is visible before detail.** Lifecycle position and next action are stated through text, order, and quiet semantic color; color never carries meaning alone.
6. **Space must do work.** It creates reading focus, separates decisions, or enables comparison. It is not a substitute for art direction.
7. **Motion confirms change.** Use it for menus, layers, state transitions, list updates, and feedback. Remove scroll theater and decorative hovering.

---

## 4. Page families

### A. Work / identity

**Routes:** `/dev/[username]`, `/p/[username]/[project-slug]`, `/p/.../[devlog-slug]`, `/studios/[slug]`, followers/following.

| Dimension | Specification |
|---|---|
| Purpose | Establish identity, creative proof, progress, and relationships. |
| Dominant object | Real Developer, Project, Devlog moment, or Studio body of work. |
| Hierarchy | Subject → proposition/current work → provenance/state → evidence → chronology → secondary biography/relationships. |
| Layout | Editorial lead region; asymmetric media/content relationship on desktop; readable single-column narrative on phone. |
| Density | Spacious/read, with dense factual clusters only where comparison is useful. |
| Media | Mandatory when real media exists; cover/screenshot never treated as a decorative afterthought. Missing media becomes a neutral typographic fallback, not generated art. |
| Navigation | Global shell recedes; object breadcrumb/provenance remains visible. No redundant local tabs unless content volume justifies them. |
| Side zones | At ≥1024, compact facts/action rail; never a second full navigation rail. |
| Actions | One primary contextual action; owner controls quiet and adjacent to object identity. |
| States | Draft/private/archived/incomplete expressed as explicit banners or state lines. |
| Color | Project media supplies expressive color; platform accent remains action/focus only. |
| Motion | Image/load fade only when content is ready; chronology/state changes use short transitions. |
| Mobile | Cover/current work first; title and proposition next; actions reachable without sticky obstruction; facts collapse below. |
| Distinction | Feels authored and specific, not like a record inspector. |

### B. Activity

**Routes:** `/dashboard`, `/feed`, `/notifications`.

| Dimension | Specification |
|---|---|
| Purpose | Resume work, understand change, and act on incoming activity. |
| Dominant object | Dashboard: next work; Feed: development event; Notifications: consequence requiring triage. |
| Hierarchy | Urgent/actionable → resumptive → scheduled → informational. Feed remains chronological but typed. |
| Layout | Operational canvas with one dominant module and compact lists; no equal-weight card grid. |
| Density | Medium-high; scanning takes priority over showcase spacing. |
| Media | Small Project marker or actor avatar only when it improves recognition. |
| Navigation | Global shell; filters local to Feed/Notifications. Dashboard does not become a second global nav. |
| Side zones | ≥1024 may hold schedule/status context, not generic recommendations. |
| Actions | Inline, consequence-specific, and limited to the next reasonable action. |
| States | Needs action, waiting, completed, unavailable, and informational must be visibly distinct. |
| Color | Semantic status only; unread is not just a purple dot. |
| Motion | New/removed row continuity; action confirmation; no animated feed entrance. |
| Mobile | Priority list first; secondary modules collapse behind clear links, not long stacked cards. |
| Distinction | Feels like a working desk, not a social dashboard. |

### C. Discovery

**Routes:** `/explore`, `/explore/[section]`, `/search`, result surfaces.

| Dimension | Specification |
|---|---|
| Purpose | Explore helps users who do not know what they want; Search retrieves known or typed intent. |
| Dominant object | Explore: selected work/theme; Search: query and results. |
| Hierarchy | Explore: editorial entry → themed shelves → browse. Search: query → types/counts → compact results. |
| Layout | Explore can use wider media-led modules; Search stays dense and mostly single-column. |
| Density | Explore medium/varied; Search compact/consistent. |
| Media | Explore uses authentic covers/avatars; Search uses smaller object-specific thumbnails. |
| Navigation | Type/section navigation remains visible; phone filters become a sheet with active summary. |
| Side zones | Search may use a filter rail at ≥1024; Explore may use an editorial context zone. |
| Actions | Enter the canonical object; filters remain secondary. |
| States | No-query, no-results, filtered-empty, loading, and end-of-results each remain distinct. |
| Color | Media carries variation; selected filters use accent underline/subtle fill, not pill confetti. |
| Motion | Results update without page-scale reveal; filter count/state responds immediately. |
| Mobile | Editorial module reduces to one featured object; shelves become horizontal only when the next item is visibly discoverable. |
| Distinction | Explore feels curated; Search feels fast and exact. |

### D. Opportunity

**Routes:** `/collaborate*`, `/playtests*`, `/publishers*`, corresponding dashboard management/contact routes.

| Dimension | Specification |
|---|---|
| Purpose | Evaluate fit, request/offer access, and manage consequential relationships. |
| Dominant object | Collaboration role, Playtest lifecycle, Publisher fit/contact. |
| Hierarchy | Requirement/state → parent Project proof → terms/access → people → action. |
| Layout | Comparable listing rows; detail uses primary content + decision rail; management uses state queues. |
| Density | Medium for public comparison; high for owner/reviewer queues. |
| Media | Persistent Project marker; Publisher logo/catalog only when verified and real. |
| Navigation | Public discovery and personal operations are visibly separate. |
| Side zones | Desktop decision rail holds deadline, terms, capacity, status, and primary action. |
| Actions | One lifecycle action at a time; destructive/irreversible choices confirmed. |
| States | Durable StatusSteps/lifecycle grammar; text labels always accompany color. |
| Color | Reserved state tones: positive, attention, danger, info, neutral. |
| Motion | Step changes, acceptance, withdrawal, capacity changes, and feedback confirmation. |
| Mobile | Decision summary precedes long description; action remains reachable but does not cover content. |
| Distinction | Collaboration feels evaluative; Playtest participatory; Publisher professional/business-like. |

### E. Temporal / community

**Routes:** `/jams*`, `/events*`.

| Dimension | Specification |
|---|---|
| Purpose | Orient users around time, place, phase, participation, and outcomes. |
| Dominant object | Jam phase/deadline; Event date/location/modality. |
| Hierarchy | When/where/state → premise → host → participation → entries/demos → archive/recap. |
| Layout | Time anchor in lead region; schedule/phase spine; entries or demos below. |
| Density | Temporal/urgent: compact facts near the top, more spacious narrative below. |
| Media | Jam entries retain Project media; Events use real venue/speaker/project media only when available. |
| Navigation | Phase/date filters; past content remains reachable without competing with upcoming. |
| Side zones | Desktop rail for countdown/date/location/RSVP, not generic metadata. |
| Actions | Join/submit/vote/RSVP/calendar action changes with phase. |
| States | Upcoming/live/voting/ended and interested/going/full/ended have visibly different priorities. |
| Color | Semantic phase/state line, never festival gradients or esports neon. |
| Motion | Countdown updates without pulsing; phase changes and live-state confirmations only. |
| Mobile | Date/phase block leads; schedule becomes a vertical sequence; secondary rules collapse accessibly. |
| Distinction | Feels communal and time-bound rather than another content directory. |

### F. Management

**Routes:** `/dashboard/projects*`, `/dashboard/studios*`, event/jam/publisher management, `/settings*`, `/admin*`.

| Dimension | Specification |
|---|---|
| Purpose | Configure, review, and administer known objects safely. |
| Dominant object | Current entity and task scope, not media. |
| Hierarchy | Scope → current state → form/table → save/result → destructive actions. |
| Layout | Parent/detail, tables/rows, bounded forms; no marketing hero or showcase cover. |
| Density | Compact to medium, predictable across modules. |
| Media | Only identity thumbnails needed for recognition. |
| Navigation | Desktop section navigation; mobile index → detail with explicit Back. |
| Side zones | Context/help or status summary only when useful; forms retain readable width. |
| Actions | Primary save/action at end and optionally sticky within long forms; cancel/back remains clear. |
| States | Dirty/saving/saved/error/restricted/empty/loading explicit. |
| Color | Neutral baseline; semantic warnings and destructive zones isolated. |
| Motion | Save feedback, drawers/dialogs, row changes. No page transitions. |
| Mobile | One task per screen; tables become labelled rows, not squeezed columns. |
| Distinction | Feels dependable and utilitarian, intentionally quieter than public pages. |

### G. Entry

**Routes:** `/`, `/login`, `/signup`, `/onboarding`, 404/error.

| Dimension | Specification |
|---|---|
| Purpose | Explain the product honestly and move users into their first meaningful loop. |
| Dominant object | Real Developer → Project → Devlog example and one clear entry action. |
| Hierarchy | Positioning → real product proof → loop → community/availability → CTA. |
| Layout | Editorial landing, focused auth, progressive onboarding. |
| Density | Landing varied but concise; auth/onboarding compact and low-friction. |
| Media | Real or clearly labelled fixture product media; no fake social proof. |
| Navigation | Landing header stays simple; auth focused; onboarding shows step/progress and safe exit. |
| Actions | One primary CTA per moment; no competing plan conversion. |
| States | Verification, expired code, existing account, interruption, and recovery are first-class. |
| Color | Same neutral/accent system as app; landing may use one dark editorial band, not a dark frame around everything. |
| Motion | One restrained hero entrance; layer/state feedback only. |
| Mobile | Product proof follows proposition immediately; auth labels remain visible; step actions stay reachable. |
| Distinction | Feels like the doorway to the same product—not a separate template. |

---

## 5. Typography system

### Font roles

- **Inter remains the only sans family.** Do not add a display font in R1. Distinction must first come from composition, scale, weight, width, and rhythm.
- **JetBrains Mono remains a utility face** for handles, build identifiers, short technical tokens, version/platform strings, and compact dates only where a “record” quality is useful.
- Do not set paragraphs, long dates, or ordinary metadata in mono.

### Proposed roles

| Role | Desktop | Mobile | Weight / line-height | Use |
|---|---:|---:|---|---|
| Marketing statement | 52–56 | 40–44 | 500 / 1.02–1.08 | Landing only; max two lines |
| Public object title | 40–48 | 32–36 | 600 / 1.08–1.15 | Project, Developer, Studio |
| Devlog title | 36–44 | 30–34 | 600 / 1.12–1.2 | Editorial article title |
| Operational page title | 28–32 | 24–28 | 600 / 1.2–1.3 | Dashboard, Search, Settings |
| Lead / deck | 18–21 | 17–19 | 400 / 1.45–1.55 | Project proposition, Devlog deck |
| Section heading | 18–20 | 17–18 | 600 / 1.35 | Primary section boundary |
| Utility heading | 14–15 | 14–15 | 600 / 1.4 | Compact operational groups |
| Editorial body | 17 | 16 | 400 / 1.65 | Devlog and long-form About |
| UI body | 15 | 15 | 400 / 1.5–1.6 | Forms, lists, descriptions |
| UI small | 13–14 | 13–14 | 400–500 / 1.45–1.55 | Metadata, helper text |
| Micro / record | 12 | 12 | 500 / 1.35 | Short timestamps/state only |

### Rules

1. Every page receives exactly one “lead” text treatment.
2. Important status cannot be micro text.
3. Metadata lines contain at most three primary facts before wrapping or moving to a detail area.
4. Use tabular numerals for dates, capacity, rankings, and counts where alignment matters.
5. Devlog prose measure is 62–72 characters; Project/About prose maxes around 70 characters.
6. Avoid uppercase except micro eyebrow/state labels under 20 characters; never use wide-tracked uppercase for full sentences.
7. Links are identifiable by color and hover/focus underline; body links do not rely on color alone.

---

## 6. Color system

### Foundation

Keep the existing semantic architecture and accent. Refine the neutrals slightly warmer so public media and long reading feel less like enterprise gray without becoming beige or lifestyle-branded.

| Token role | Direction | Proposed value / constraint |
|---|---|---|
| Canvas | warm-neutral working paper | `#F7F7F5` |
| Surface | primary reading/control surface | `#FFFFFF` |
| Surface muted | filters, selected rows, empty regions | `#F1F1EE` |
| Elevated | menus/dialogs only | `#FFFFFF` + existing elevation |
| Line | structure | `#E4E3DF` |
| Line strong | controls/important separation | `#CECCC6` |
| Text | near-black | `#17171B` |
| Text secondary | explanatory | `#55545E` |
| Text muted | nonessential metadata | no lighter than AA at target size; approximately `#73717D` |
| Accent | action/focus/selection | keep `#4F46E5`; hover `#4338CA` |
| Accent subtle | selected/filter context | keep within `#EEF2FF` family |
| Status | success/warning/danger/info | retain current semantic families; always pair with text/icon/position |

Final values require contrast verification against every surface before implementation; token names and roles matter more than unverified hexadecimal precision.

### Color behavior

- **Project media is the expressive color channel.** Do not generate page-wide gradients from covers.
- A Project can own a persistent image crop; it does not own an arbitrary brand color unless future product data explicitly supports one.
- Selected navigation uses accent line + text; avoid fully filled purple tabs.
- Status can use a subtle background/line in headers or decision rails; list rows prefer colored text/icon plus explicit label.
- Destructive areas use danger only at the action/impact boundary, never as decorative page color.
- Dark surfaces are allowed only for authored media viewing, a single landing editorial band, or high-contrast overlays—not as a universal “gaming” theme.

---

## 7. Spacing and layout system

### Canvas widths

| Context | Maximum inner width | Reading/content measure |
|---|---:|---:|
| Public object (Profile/Project/Studio) | 1120–1200 | lead can span; prose 680–760 |
| Devlog article | 1120 media canvas | prose 680–720 |
| Explore editorial | 1200 | shelves/grid vary |
| Search/results | 960–1040 | result body 720–840 |
| Dashboard/operations | 1040–1120 | primary column 640–760 + context 280–320 |
| Forms/settings | 960 | form 600–680; nav/context outside |
| Auth | 440–480 | one focused form |

### Gutters

- 375: 16 px page gutter; 12 px internal dense-row inset.
- 768: 24 px page gutter.
- 1024: 32 px page gutter after rail.
- 1440: 40–48 px page gutter; width stops growing at the family maximum.

### Vertical rhythm

- Public lead → first section: 48–64 px desktop, 32–40 px phone.
- Major public sections: 56–72 px desktop, 40–48 px phone.
- Operational sections: 32–40 px desktop, 24–32 px phone.
- Dense row block: 8–12 px internal gaps, 12–16 px vertical padding.
- Editorial paragraphs: 20–24 px rhythm; headings receive more space before than after.

### Grid rules

- Use 12-column thinking at ≥1024, but do not expose a decorative grid.
- Public object lead: 7–8 columns media/content + 4–5 columns identity/actions.
- Operational split: 8 columns primary + 4 columns context, only when the context persists and matters.
- Never create a three-column equal-weight dashboard by default.
- A grid becomes a list when comparison, chronology, or long text is the task.

---

## 8. Surface, border, and radius system

### Surface rules

| Treatment | Use | Do not use for |
|---|---|---|
| No container | articles, page leads, simple forms, related sections | floating unrelated facts |
| Hairline row group | dense comparable results, settings, queues | every public content section |
| Bordered region | a discrete decision, application, build access, destructive zone | decorative grouping |
| Card | a self-contained browse object with media + state + destination | headings, forms, single facts, full page sections |
| Elevated layer | menus, popovers, dialogs, drawers, toasts | ordinary page content |
| Muted band | contextual summary, selected state, schedule/lifecycle | alternating every section |

### Border rules

- One border is enough to establish a region. Avoid nested bordered containers.
- Dividers separate comparable siblings, not every heading from its content.
- Use whitespace before adding a line; use a line before adding a card.
- Strong borders are reserved for controls, current lifecycle state, and safety-critical regions.

### Radius rules

- Badge 4 px; control 6 px; media 8 px; panel/dialog 12 px.
- Circular only for human avatars, small status dots when text also explains state, and radio-like controls.
- Studio/Publisher marks use rounded squares, distinguishing organizations from people.
- Avoid `rounded-full` buttons except a truly compact segmented control or icon affordance; primary actions remain 6 px.
- No 24–40 px marketing panel radii.

### Iconography rules

- Keep Lucide as the single interface icon family; use the regular stroke and do not mix filled, emoji, or custom outline styles inside controls.
- Standard sizes: 16 px in dense metadata/menus, 18 px in buttons and rows, 20 px in primary navigation, 24 px only for standalone object actions. Stroke weight remains optically consistent at each size.
- Icons supplement labels for unfamiliar or consequential actions. Icon-only controls are reserved for universally understood, repeatedly used actions and require accessible names plus tooltips where ambiguity remains.
- Do not place icons beside every section heading, metadata fact, or marketing claim. Dates, stages, roles, and locations should lead with text unless an icon materially improves scanning.
- Directional chevrons mean navigation or disclosure; they are not decoration. Status icons always accompany a text state. Brand/game-platform marks appear only where the real platform identity is useful.
- Redundant leading and trailing icons in one row should be collapsed to the single icon that explains either type or action.

---

## 9. Media system

### Media roles

- **Project cover:** canonical 16:9 identity crop; minimum source-quality guidance; reused consistently.
- **Project thumbnail:** 16:10 or 4:3 crop depending row density; one crop policy per component, not per page.
- **Devlog lead media:** optional 16:9/3:2 authored image; if absent, text leads without a fake placeholder.
- **Screenshot gallery:** authentic aspect ratios inside a stable max-height viewer; captions/alt text required.
- **Developer avatar:** circular 1:1; initials fallback is neutral and typographic.
- **Studio/Publisher mark:** rounded-square 1:1; fallback is name monogram, not a person avatar.
- **Event/Jam media:** subordinate to time/phase; use only when real and relevant.

### Project Identity Marker

This is the cross-product signature composition, not a generic card:

- 48–72 px cover crop depending density;
- Project title;
- Developer or Studio name;
- one state line: stage plus current lifecycle state;
- optional destination chevron only when the whole marker is a link.

Variants: `compact`, `standard`, `on-media`. It appears in Devlog headers, Feed events, Collaboration, Playtests, Jam entries, Search results, and high-value Notifications.

### Fallback hierarchy

1. verified real cover/media;
2. real screenshot crop;
3. neutral Project monogram with title, stage, and owner;
4. no media region when space is better used by text.

Never generate abstract gradients, fake screenshots, or game art to fill absence.

---

## 10. Component direction

### Composition primitives to introduce

1. **ProjectIdentityMarker** — compact/standard/on-media provenance unit.
2. **ProvenanceHeader** — Developer → Project → child object relationship, including date/state where relevant.
3. **LeadRegion** — layout composition supporting subject, media, proposition, facts, and action; not a styled card.
4. **LifecycleSummary** — current state, next step, and ordered compact steps; extends existing `StatusSteps` rather than replacing it.
5. **DecisionRail** — desktop detail-page terms/state/action region that becomes an in-flow summary on mobile.
6. **ResumptiveWork** — Dashboard composition for last work, current state, and one next action.
7. **TypedResult** — a layout API for Developer/Project/Devlog/etc. previews, not one uniform result markup.
8. **TemporalAnchor** — date/phase/location composition for Event/Jam.
9. **NotificationItem** — reason/action/object variants with priority and source identity.
10. **OverflowNavCue** — active-item centering and visible horizontal continuation cue.

### Existing primitives

| Primitive | Decision | Direction |
|---|---|---|
| `Button`, `IconButton` | KEEP | Preserve behavior; enforce non-pill geometry and ≥44 px coarse targets. |
| `Field`, controls | KEEP / REFINE | Preserve semantics; Auth must adopt them; add consistent field-result association. |
| `Badge` | REFINE | Use only for status/category that changes decisions; eliminate decorative badge use. |
| `Avatar` | KEEP | Preserve people semantics; organization marks need a separate square shape. |
| `Tabs` / `TabLinks` | REFINE | Add overflow cues, active centering, and mobile filter replacement. |
| `Menu`, `Popover`, `Dialog/Drawer`, `Toast` | KEEP | Preserve Radix behavior; align motion specification. |
| `Skeleton` | REFINE | Object-specific identity; layout-level ownership; reduced-motion-safe. |
| `EmptyState`, `ErrorState` | REFINE | Keep taxonomy; allow family-specific composition/copy without illustrations. |
| `MetadataBar` | REWORK | Limit fact count; establish priority; do not flatten every fact equally. |
| `Section`, `SectionHeader` | REWORK | Add `lead`, `standard`, `utility` hierarchy and optional no-divider behavior. |
| `ObjectHeader` | REWORK | Split into family compositions; retain shared accessible structure only. |
| `StatusLabel`, `StatusSteps` | KEEP / REFINE | Normalize lifecycle language and compact/mobile behavior. |

### Domain components

| Component | Decision | Reason |
|---|---|---|
| `ProfileHeader` | REWORK | Current work must become part of identity, not a later row. |
| `ProjectRow` | REFINE | Preserve variants but anchor them in canonical cover/provenance rules. |
| `DevlogRow` | REWORK | Distinguish editorial chronology, Feed event, and Search preview. |
| `DeveloperRow` | REFINE | Show focus/current proof; reduce generic directory anatomy. |
| `CollaborationListing` | REWORK | Opportunity comparison anatomy, terms, Project trust. |
| `PlaytestListing` | REWORK | Lifecycle/capacity/requirement anatomy. |
| `JamRow`, `EventRow`, `PublisherRow` | REWORK | Each receives a domain-specific dominant cue. |
| `NotificationsView` / `NotificationLink` | REWORK | Consequence/reason triage, actor/object identity, action state. |
| Settings components | KEEP / REFINE | Preserve content and semantics; improve mobile navigation and save feedback. |
| `watermelon/card-split-accordian.tsx` | REMOVE | Unreferenced demo and separate visual vocabulary. |

Do not create a component for every page section. These compositions should accept content and layout slots while keeping domain meaning visible.

---

## 11. Motion system

### Timing and easing

- Press/color feedback: 100–140 ms.
- Tabs/selection/row state: 140–180 ms.
- Menu/popover: 120–160 ms, 4 px maximum translation.
- Dialog: 160–200 ms opacity + 0.98→1 scale.
- Drawer/sheet: 180–240 ms, transform tied to edge.
- Toast: 160–220 ms entry; no bouncing.
- List insert/remove: 180–240 ms height/opacity only when caused by the user's action.
- No general transition longer than 300 ms except deliberate image viewer changes up to 360 ms.
- Use one standard decelerating ease for entry and a faster ease for exit.

### Pattern classification

| Pattern | Decision | Specification |
|---|---|---|
| Page transition | REMOVE / do not add | Navigation stays immediate; preserve shell continuity structurally. |
| Menu | KEEP | Short opacity + 4 px translation; focus moves correctly. |
| Dialog | KEEP / REFINE | Opacity + tiny scale; return focus; no spring. |
| Sheet/drawer | KEEP | Edge-linked translation; no overshoot. |
| Tab | IMPROVE | Immediate content; 140 ms active indicator/color; no sliding page panels. |
| Accordion | KEEP sparingly | Height/opacity for rules/help/replies; state announced. |
| Hover | REDUCE | Color/border/underline; media scale max 1.01 only when image is clearly clickable. No lift + glow + scale stack. |
| Pressed | KEEP | 0.99 scale or darker fill for buttons; `aria-pressed` for toggles/scores. |
| List update | INTRODUCE | Local insertion/removal continuity after user action; preserve scroll position. |
| Toast | KEEP / IMPROVE | Clear action result; persistent inline error for consequential failures. |
| Content reveal | REMOVE globally | No scroll-triggered section reveals. Optional single hero entrance only. |
| Image transition | INTRODUCE sparingly | Crossfade selected gallery media; no autoplay or parallax. |
| Lifecycle change | INTRODUCE | State label/step updates in place and confirms consequence. |
| Reduced motion | KEEP / EXPAND | Disable transforms, smooth scroll, pulse, reveal, and crossfade; preserve instant status changes. |

Motion never supplies hierarchy that static layout fails to provide.

---

## 12. Responsive system

### 375 — phone

- Preserve top utility bar + bottom global navigation and safe-area padding.
- All page families use one content column, but **order changes by job** rather than mechanically stacking desktop columns.
- Public object order: media/current work → state/title/proposition → primary action → owner/provenance → facts → narrative/evidence.
- Opportunity order: role/state → Project marker → key terms → action → description/process.
- Event/Jam order: date/phase → title/premise → action → schedule → content.
- Search filters open in a bottom sheet; active filters remain summarized above results.
- Settings/management uses index → detail; do not retain a horizontally hidden six-item rail.
- Context tabs show a visible next-item edge/gradient and center the active destination.
- Bottom navigation never covers the last action; reserve at least bar height + safe area + 16 px.
- Sticky CTAs are allowed only for a single lifecycle action and must not cover content or keyboard.

### 768 — tablet / compact rail

- Keep the compact global rail.
- Use a deliberate two-zone layout where useful: content + 240–280 px summary/filter rail. Do not simply enlarge phone spacing.
- Profile/Project may place identity/facts beside lead media; Devlog prose remains centered.
- Dashboard places resumptive work above; attention and schedule can share a two-column row.
- Search filter controls stay inline or in a compact popover depending count.
- Long management navigation uses a compact parent list and detail, not a squeezed sidebar.

### 1024 — desktop threshold

- Keep the full 240 px rail, but avoid immediately forcing every page into a narrow centered column.
- Public objects use 7/5 or 8/4 lead compositions.
- Opportunity details use content + DecisionRail.
- Dashboard/Notifications/Search can use primary + context/filter layouts.
- Devlog uses 680–720 px prose with media allowed to extend to 960–1120 px.
- Context bars should not repeat the page title; use them for actual object/section orientation.

### 1440 — wide desktop

- Cap family canvas widths. Extra width becomes calm outer margin only after the layout has meaningful internal composition.
- Explore may show an editorial lead and dense secondary rail/shelf; Search remains constrained for scan efficiency.
- Project/Profile/Studio use broader media and a stable facts/action rail.
- Dashboard uses a 2/3 + 1/3 composition, never three equal cards.
- Avoid fixed-height hero regions that create empty lower viewports.

### Shared responsive acceptance

- No document overflow at all four widths.
- No hidden route/functionality without a discoverable replacement.
- All custom interactive controls meet 44×44 px on coarse pointers.
- Long titles, missing media, empty states, Spanish expansion, 200% zoom, and keyboard focus are designed—not deferred.

---

## 13. Object identity rules

The same entity must be recognizable before its name is read. Identity comes from stable anatomy, media geometry, provenance, and the information needed to act—not from giving every entity a different decorative color.

### Developer

- **Signature:** circular avatar, display name/handle, discipline or one-line practice, availability, and current work evidence.
- **Canonical compact anatomy:** 40–48 px avatar → name/handle → discipline/context → current Project marker or relationship reason → relevant action.
- **Canonical detail anatomy:** identity and availability → current/featured Project → recent build record → skills/about → connections.
- **Use:** Profile, search results, collaborator/member lists, Devlog authorship, notifications.
- **Do not:** lead with follower counts, render initials when a real avatar exists, or make skill pills louder than authored work.

### Project

- **Signature:** rectangular media, title, owner, development stage/state, and latest evidence of progress.
- **Canonical `ProjectIdentityMarker`:** 48×36 px cover (or deterministic fallback) + title + owner + stage/status; optional one contextual line such as latest Devlog or sought role.
- **Canonical detail anatomy:** lead media → title/proposition/state/action → owner/provenance → facts → development record → opportunities/playtests/team.
- **Use:** everywhere a child object appears—Devlog, Collaboration, Playtest, Jam entry, Studio work, notification.
- **Do not:** reduce Projects to interchangeable square-icon rows or repeat title, stage, and owner in several adjacent blocks.

### Devlog

- **Signature:** date/sequence, author, parent Project marker, title, and editorial content.
- **Canonical compact anatomy:** date → Project marker → title/excerpt → author/reaction summary.
- **Canonical detail anatomy:** `ProvenanceHeader` → title/deck/date → lead media → readable prose → supporting media → response/actions → adjacent chronology.
- **Use:** Feed, Project timeline, Profile activity, search, notifications.
- **Do not:** style it as a generic social post, detach it from its Project, or use metadata pills as the main hierarchy.

### Collaboration opportunity

- **Signature:** role needed, Project proof, working terms, fit signals, and application state/action.
- **Canonical compact anatomy:** role lead → Project marker → commitment/location/compensation facts → deadline/state → action.
- **Canonical detail anatomy:** role + state → Project proof → fit/requirements → terms → process → owner credibility → `DecisionRail` action.
- **Do not:** present the Project as a tiny afterthought, hide compensation status in prose, or duplicate Apply actions.

### Playtest

- **Signature:** lifecycle state, Project, access/platform, schedule/capacity, requirements, and participation action.
- **Canonical compact anatomy:** lifecycle label → Project marker → access/platform + schedule/capacity → CTA.
- **Canonical detail anatomy:** Project media/state → what is being tested → eligibility/access → schedule/capacity → expectations/privacy → lifecycle action.
- **Do not:** make recruitment, active session, feedback, and completed states look identical.

### Studio

- **Signature:** rounded-square organization mark, studio name, location/size when relevant, featured Projects, and member/role context.
- **Canonical compact anatomy:** mark → name → short focus → featured Project thumbnails or member context.
- **Canonical detail anatomy:** organization identity → featured work → current activity/opportunities → team → about/links.
- **Do not:** reuse personal-profile anatomy unchanged or substitute member avatars for authored work.

### Jam

- **Signature:** phase and deadline first, then theme/premise, host, participation state, and Project entries.
- **Canonical compact anatomy:** phase/deadline anchor → title/theme → host → participation/entry state.
- **Canonical detail anatomy:** timeline/phase → premise/rules → join/submit action → entries as Projects → updates/results.
- **Do not:** hide time-critical state in a generic badge cluster or show entries as anonymous image tiles.

### Event

- **Signature:** date tile or date line, title, host, location/modality, RSVP state, and schedule.
- **Canonical compact anatomy:** date → title → host/location → RSVP state.
- **Canonical detail anatomy:** date/time + title → host/location/modality → RSVP → agenda/details → attendees/context.
- **Do not:** use Project-stage treatment for calendar information or repeat date/time in three formats above the fold.

### Publisher

- **Signature:** organization mark, verification/official status where real, publishing fit, representative catalog, territories/platforms, and submission policy.
- **Canonical compact anatomy:** mark → name → fit/focus → representative catalog/context.
- **Canonical detail anatomy:** identity + fit → representative games → what they support → criteria/process → factual contact/action.
- **Do not:** fabricate endorsement, bury fit under corporate prose, or render an empty company directory row with no evidence.

### Cross-object rules

1. Parent provenance appears once, early, and consistently.
2. State is adjacent to the object it changes and never relies on color alone.
3. Media geometry communicates type: circular people; rounded-square organizations; landscape Projects; date blocks for temporal objects.
4. A compact object representation has one primary line, at most two supporting lines, and one action zone.
5. Badges are reserved for verified state, lifecycle, access, or material constraints—not generic categories already evident in nearby text.
6. Fallbacks preserve geometry and label the entity; they do not introduce random illustrations.

---

## 14. Major-page composition specifications

These are composition contracts, not pixel-perfect mockups. They define what dominates, what follows, and how mobile changes the reading order.

### Dashboard

- **Above the fold:** personal greeting/context, one large `ResumptiveWork` region, then Needs attention. The page answers “what should I resume or resolve?” within one viewport.
- **Desktop:** 2/3 main work column + 1/3 schedule/attention rail. Current Project/task is visually dominant; secondary counts become compact lines.
- **Order:** resume work → attention requiring decisions → upcoming commitments → recent outcomes → shortcuts.
- **Primary action:** contextual to the dominant work item, not a permanent generic Create button duplicated across modules.
- **Mobile:** resume work → attention → today/upcoming → recent; no equal card grid.
- **States:** first-run setup explains the next meaningful action; returning empty states distinguish “nothing urgent” from “no data.”

### Feed

- **Above the fold:** feed purpose, relevant scope/tabs, and the first authored update with visible Project provenance.
- **Desktop:** 640–720 px event stream with a narrow context rail only when it explains sources or offers real filtering.
- **Order:** chronological activity grouped lightly by time; Devlogs, milestones, follows, and opportunities use different typed anatomy.
- **Primary action:** open the underlying object; social actions remain secondary.
- **Mobile:** full-width typed stream, Project marker retained, metadata reduced without losing source/reason.
- **States:** explain why each update appears; empty feed points to Explore/following rather than canned celebration copy.

### Explore

- **Above the fold:** an editorial lead based on real Project/creator content, followed by immediately useful discovery paths.
- **Desktop:** one lead region plus asymmetric shelves/rows: noteworthy Projects, recent build records, opportunities, and time-bound activity. Avoid a dashboard of equal cards.
- **Order:** lead → action-oriented shelf → people/work shelf → temporal shelf → browse-more destinations.
- **Primary action:** enter a real Project or discovery family; filter/search is prominent but not a fake hero centerpiece.
- **Mobile:** lead becomes compact media + text; shelves become 1.2-card peeks or strong rows with clear horizontal overflow cues.
- **States:** no fake popularity metrics; sparse data shows curated/chronological truth, not invented momentum.

### Search

- **Above the fold:** persistent query field, active type/scope, filters, and result count/status.
- **Desktop:** 240–280 px filter rail + dense result column. Results use typed anatomy for Developer, Project, Devlog, and other supported types.
- **Order:** query → type/facets → results → pagination/load state; recent searches may appear only before a query.
- **Primary action:** open result; secondary object-specific action stays subordinate.
- **Mobile:** query fixed at top of flow, filter opens a sheet, active filters summarize in removable chips, results remain typed.
- **States:** distinguish no query, no results, filter-eliminated results, error, and loading; preserve query on retry.

### Public developer profile

- **Above the fold:** person identity and availability beside/above current work evidence; a visitor should understand craft and current Project before statistics.
- **Desktop:** 5/7 identity and current-work composition, followed by featured work and chronological build record; about/skills/links are supporting zones.
- **Order:** identity → current work → featured Projects → recent Devlogs/progress → collaboration availability → about/skills/connections.
- **Primary action:** relationship-appropriate action; owner controls are visually and positionally distinct.
- **Mobile:** identity → current Project → primary action → work evidence → about. Tabs, if retained, visibly overflow.
- **States:** private/missing work leaves truthful structure; initials appear only when avatar is missing.

### Project detail

- **Above the fold:** landscape media, title/proposition, stage/state, owner provenance, and one primary action.
- **Desktop:** 7/5 lead composition; media left, title/state/action/facts right. Below: development timeline is the spine, not a collection of equal sections.
- **Order:** media/state → proposition/action → owner/facts → latest development → Devlog timeline → playtesting/collaboration → team/gallery/links.
- **Primary action:** depends on relationship and lifecycle (follow, manage, apply, test); never show competing equal CTAs.
- **Mobile:** media → title/state → action → owner/facts → latest development → chronology; sticky action only if lifecycle-critical.
- **States:** missing media uses stable fallback; draft/private/owner views clearly differ without leaking content.

### Devlog detail

- **Above the fold:** Project provenance, title/deck/date/author, and lead media—not a generic ObjectHeader plus disconnected article.
- **Desktop:** 680–720 px prose measure; media may extend to 960–1120 px; adjacent chronology can occupy a modest side rail.
- **Order:** provenance → headline → editorial body/media → reactions/comments → previous/next in Project chronology.
- **Primary action:** read/open Project; response actions are secondary.
- **Mobile:** provenance remains compact above title; prose and media are edge-conscious; chronology moves below.
- **States:** unsupported media, missing cover, draft/private, and empty comments retain the article's integrity.

### Collaboration

- **Directory:** role-led rows/cards with prominent Project evidence, terms, and filters; not a generic marketplace grid.
- **Detail:** opportunity proposition + Project proof above fold; requirements and terms in main column; `DecisionRail` holds application state/action.
- **Desktop:** filter rail + results for directory; 2/3 content + 1/3 decision rail for detail.
- **Mobile:** filters in sheet; detail order is role/state → Project → key terms → apply/status → requirements/process.
- **States:** applied, closed, owner, not eligible, loading, and error each have explicit action consequences.

### Playtesting

- **Directory:** group by lifecycle or clearly expose lifecycle filters; each item shows Project, test goal, platform/access, schedule/capacity, and state.
- **Detail:** Project and active phase dominate; participation requirements and next action remain adjacent.
- **Desktop:** dense typed list + filter rail; detail uses lead media/state and a decision rail.
- **Mobile:** phase/state → Project → CTA → facts → expectations; capacity/deadline never disappears.
- **States:** recruiting, scheduled, active, feedback due, completed, full, and owner views must be visually distinguishable.

### Studios

- **Directory:** organization marks plus featured work evidence; search/filter is a product dependency if a public directory is intended, not something to fake visually.
- **Detail:** studio identity and featured Projects above fold; current activity/opportunities and team follow.
- **Desktop:** broad work-led composition with a quieter organization facts rail.
- **Mobile:** identity → featured work → action → current activity → team/about.
- **States:** a studio without published work should not look falsely established; empty evidence is explicit.

### Jams

- **Directory:** phase/deadline-led rows; active/upcoming/past distinctions are structural, not merely badge color.
- **Detail:** timeline/phase and premise above fold; Join/Submit state follows; Project entries form the main content evidence.
- **Desktop:** timeline/premise main column + deadline/action rail; entries use Project anatomy.
- **Mobile:** date/phase → title/theme → CTA → rules → entries/updates.
- **States:** upcoming, active, submission due, judging, completed, host, joined, and submitted have distinct action language.

### Events

- **Directory:** chronological grouping with date anchors, location/modality, host, and RSVP state.
- **Detail:** date/time and title dominate; RSVP and modality are immediately actionable; agenda and context follow.
- **Desktop:** date-led content + compact RSVP rail.
- **Mobile:** date → title/location → RSVP → agenda/details; timezone remains visible.
- **States:** upcoming, live, past, cancelled, full, RSVPed, owner; never color-only.

### Publishers

- **Directory:** fit-led organization rows with representative work and real filters, not logo wallpaper.
- **Detail:** identity + publishing fit + representative catalog above fold; support/criteria/process below.
- **Desktop:** evidence main column + fit/contact rail.
- **Mobile:** identity → fit → catalog → criteria/process → factual action.
- **States:** unavailable submission/contact is stated plainly; do not imply a verified relationship without data.

### Notifications

- **Above the fold:** title, unread scope, and honest mark-read control; first notification shows actor/object/action clearly.
- **Desktop:** dense inbox list with grouping by recency; no card per item. Optional type controls remain compact.
- **Anatomy:** actor/object marker → action sentence → context/reason → time → unread/action state.
- **Mobile:** retain actor/object and consequence; move tertiary metadata after the message.
- **States:** empty unread differs from empty history; failures preserve unread truth.

### Settings

- **Desktop:** stable category rail + bounded form/detail; page title and save consequence are unambiguous.
- **Mobile:** settings index → category detail. Back returns to index; avoid an overflowing desktop rail.
- **Order:** account/profile/preferences/privacy/notifications/destructive controls according to existing product model.
- **Actions:** local save status, validation, and destructive confirmation; one save owner per form.
- **Do not:** redesign Settings as marketing cards or introduce categories the product does not support.

### Auth and onboarding

- **Composition:** quiet entry register: product mark/context + bounded form, with no decorative dashboard preview competing with the task.
- **Copy:** field labels remain visible; placeholders are examples; password requirements and recovery routes are explicit when supported.
- **Onboarding:** show progress and consequence; ask only what is needed to establish identity/current intent.
- **Mobile:** form remains above keyboard, errors adjacent, actions reachable, and return paths clear.
- **Product dependencies:** password recovery and any missing authentication path require separate functional scope; the visual blueprint must not imply they work.

---

## 15. Explicit removal list

Remove an element only when its job is redundant, misleading, or actively weakens hierarchy.

| Remove | Scope | Reason / replacement |
|---|---|---|
| Paid pricing cards, upgrade language, and billing navigation | `/pricing`, landing, dashboard navigation, `/dashboard/billing` | Contradicts V1 permanent-free product truth. Replace with a truthful free commitment and route redirects in R0. |
| Uncited market statistics and fake activity/popularity counts | Landing and discovery surfaces | False evidence damages trust. Use product mechanics, real content, or omit. |
| Giant dark outer landing frame | Landing | Makes the product look like a template showcase. Use editorial bands and real work media. |
| Decorative gradient/glow stacks and repeated shine treatments | Landing/global | Accent should communicate action/state. Keep at most one restrained brand field if evidence supports it. |
| Global scroll-triggered section reveals | Landing/public pages | Slows comprehension and produces template rhythm. Preserve immediate content; optional single hero entrance only. |
| Hover lift + scale + glow combinations | Cards/rows | Creates generic SaaS motion and false click priority. Use border/color/underline, optional 1.01 media scale. |
| Repeated `heading + description + divider + rows` anatomy | Across app | Makes unlike pages interchangeable. Replace with family-specific leads, timelines, streams, rails, and typed rows. |
| Initial-only tiles where real media exists | Project/Studio/Publisher lists | Erases object identity. Use deterministic media hierarchy. |
| Duplicated title, metadata, status, or owner context | Object pages | One canonical provenance/state region should own each fact. |
| Decorative pills for ordinary categories | Global | Reserve badges for lifecycle, access, verification, or constraints. Use plain metadata/text otherwise. |
| Equal-weight dashboard module grids | Dashboard | Obscures priority. Replace with resumptive work + attention hierarchy. |
| Generic notification dots detached from actor/object/action | Notifications | Replace with typed notification anatomy and explicit unread treatment. |
| Unnecessary section labels that merely restate the route | Shell/object pages | Context bars should orient, not duplicate headings. |
| Unreferenced `watermelon/card-split-accordian.tsx` visual experiment | Component library | It has no current product job. Remove in the implementation phase only after reference verification. |
| Legacy administrator styling props that create a third visual dialect | Admin/management | Consolidate after role/behavior verification; do not remove functional controls. |
| Local wrappers duplicating `Shell`, `Section`, `ObjectHeader`, or state ownership | Routes/components | Consolidate only after behavior audit; preserve route and loading boundaries. |
| Canned “all caught up” or celebratory empty-state copy | Empty states | Use factual, route-specific explanations and next actions. |

Never remove necessary density, boundaries, or compact rows merely to appear minimalist.

---

## 16. Explicit introduction list

These additions are composition tools, not a mandate to create another generic component layer.

| Introduce | Job | Reuse target | Constraint |
|---|---|---|---|
| `ProjectIdentityMarker` | Preserve Project identity in every child/context | Devlogs, opportunities, playtests, jams, studios, notifications, search | One canonical compact anatomy; no local variants without a semantic need. |
| `ProvenanceHeader` | Show Developer → Project → child relationship once | Devlog, opportunity, playtest, event update | Must not become breadcrumbs plus duplicated object header. |
| `LeadRegion` composition | Give public/detail pages an intentional above-fold hierarchy | Profile, Project, Studio, Publisher, Jam, Event | Layout primitive, not a white card. |
| `ResumptiveWork` | Make next work obvious | Dashboard | One dominant item; not a carousel of equal suggestions. |
| `LifecycleSummary` | Bind state, next action, deadline/capacity, consequence | Playtest, Jam, Event, opportunity | Text label + status; never color-only. |
| `DecisionRail` | Keep high-value facts and one action together | Opportunity, Playtest, Event, Publisher | Becomes an inline block on mobile. |
| Typed activity/result rows | Differentiate object classes while retaining scan rhythm | Feed, Search, Notifications, dashboard activity | Share alignment/tokens, not identical content anatomy. |
| `TemporalAnchor` | Make date/phase/deadline perceptible | Devlog, Jam, Event, notification groups | Use date tile/line/timeline based on family. |
| `OrganizationMark` | Give Studios/Publishers stable non-person identity | Studio/Publisher directory and detail | Rounded-square; deterministic fallback. |
| Horizontal overflow cue | Make mobile tabs/shelves discoverable | Context tabs, Explore shelves | Visible next edge/fade; preserve keyboard scrolling. |
| Media fallback system | Preserve object geometry without fake imagery | All public objects | Entity-specific neutral fallback, then initials only where appropriate. |
| State-specific empty/loading/error grammar | Make system states match page job | Every family | Use existing primitives first; vary composition and copy. |

### Product dependencies—not silently introduced by this redesign

The audit identifies possible needs such as broader Studio discovery, richer search types, password recovery, and application management. These may be essential product work, but they require route/data/permission decisions. The redesign may reserve space and define honest unavailable states; it must not fabricate those capabilities or include them as visual-only controls.

---

## 17. Reference-to-Glyph mapping

External references are evidence for principles, not skins to copy. URLs and pattern claims were verified in the source audit's research pass.

| Reference | Specific pattern | Why it works | Glyph application | Do not copy |
|---|---|---|---|---|
| [GitHub profiles](https://docs.github.com/en/account-and-profile/concepts/personal-dashboard) and [organization profiles](https://docs.github.com/en/organizations/collaborating-with-groups-in-organizations/customizing-your-organizations-profile) | Work evidence and contribution/activity establish identity; organizations have distinct anatomy | Credibility is attached to inspectable work and ownership | Put current Projects and build record ahead of vanity metrics; distinguish Studios from people | Repository chrome, contribution heatmap as identity, or developer-tool density everywhere |
| [Primer page layouts](https://primer.style/product/components/page-layout/) and [navigation](https://primer.style/product/components/nav-list/) | Explicit layout regions, stable navigation, compact information | Predictable regions reduce relearning without forcing identical pages | Formalize rail/content/pane contracts and typed compact rows | GitHub's exact visual language or universal gray utility surfaces |
| [Behance profiles](https://help.behance.net/hc/en-us/articles/204483864-Guide-Profile) and [projects](https://help.behance.net/hc/en-us/articles/204484024-Guide-Creating-Projects) | Authored work is visual proof; Project pages have editorial sequencing | Large, sequenced media lets craft establish trust quickly | Strong Project media, curated Profile work, intentional Devlog image rhythm | Portfolio-only gloss, oversized art with weak lifecycle/product facts |
| [itch.io project pages](https://itch.io/docs/creators/design) and [devlogs](https://itch.io/docs/creators/devlogs) | Creator-controlled game identity and Devlogs tied to a game | The game remains the stable parent while updates accumulate | Preserve Project ownership and chronology; make build record canonical | Unbounded creator theming or marketplace clutter that breaks product consistency |
| [itch.io jams](https://itch.io/docs/creators/game-jams) | Phase, dates, rules, submission, and entries form a clear lifecycle | Time and eligibility make the next action self-evident | Jam timeline, action state, and Project entries | Copying the hobby-marketplace aesthetic or burying professional identity |
| [Steam Playtest](https://partner.steamgames.com/doc/features/playtest) and [store graphical assets](https://partner.steamgames.com/doc/store/assets) | Access state is explicit; strong media assets identify games | Participants can distinguish the work and current access consequence at a glance | Clear Playtest lifecycle and Project media hierarchy | Storefront sales density, price/purchase treatment, or cinematic excess |
| [Linear My issues](https://linear.app/docs/my-issues), [Pulse](https://linear.app/docs/pulse), [Inbox](https://linear.app/docs/inbox), and [Search](https://linear.app/docs/search) | Dense operational views prioritize resume/triage; calm motion and keyboard clarity | A strong priority model makes density feel controlled | Dashboard resumptive work, typed notifications, dense search/filtering | Making public/editorial pages look like an issue tracker |
| [Figma search](https://help.figma.com/hc/en-us/articles/360040529373-Search-for-files-and-projects) and [teams](https://help.figma.com/hc/en-us/articles/360040328273-Guide-to-teams) | Search scope/facets and distinct team/work relationships | Scope and ownership stay visible during retrieval | Typed Search and Studio/Project relationships | File-grid metaphors where narrative and lifecycle matter |
| [LinkedIn search](https://www.linkedin.com/help/linkedin/answer/a507571) and [job search](https://www.linkedin.com/help/linkedin/answer/a507734) | Typed results, filters, professional opportunity facts, relationship context | Comparison fields align with a real professional decision | Collaboration filters, role-led results, relevant credibility | Engagement bait, connection-count primacy, or crowded ad/feed patterns |
| [LinkedIn Featured](https://www.linkedin.com/help/linkedin/answer/a551201) and [Pages](https://www.linkedin.com/help/linkedin/answer/a543852) | Selected work and organization identity reinforce professional credibility | Curation prevents meaningful evidence from disappearing into chronology | Curated Profile work and distinct Studio/Publisher marks | Social résumé boilerplate or corporate-template sameness |
| [Are.na blocks](https://help.are.na/hc/en-us/articles/360039912014-What-are-blocks) | Mixed media share a calm, content-first system | Media can vary while surrounding chrome stays quiet | Devlog media and Explore collections can vary without decorative chrome | Ambiguous block semantics or art-board looseness in operational flows |
| [Discord events](https://support.discord.com/hc/en-us/articles/4409494125719-Scheduled-Events) and [onboarding](https://support.discord.com/hc/en-us/articles/11074987197975-Community-Onboarding-FAQ) | Temporal state/action and guided entry are explicit | Users see when participation happens and what setup unlocks | Event anatomy and concise onboarding progress | Server-like channel architecture or chat-first product identity |
| [Discord mobile navigation](https://support.discord.com/hc/en-us/articles/12654190110999-New-Mobile-App-Updates-Layout) | Mobile structure changes to match reach and context | Recomposition respects smaller viewports rather than compressing desktop | Preserve bottom global nav; convert rails to index/detail or sheets | Porting Discord's information density or gestures without need |
| [Notion settings](https://www.notion.com/help/account-settings) | Clear category grouping and bounded settings forms | Stable categories make utilitarian configuration predictable | Desktop rail + form, mobile index/detail | Workspace-document metaphors for every management page |
| [Reddit Discover](https://support.reddithelp.com/hc/en-us/articles/360043043412-What-is-the-Discover-Tab) | Discovery uses mixed topical/media entry points | Varied entry objects encourage browsing without forcing one result type | Explore can mix Projects, people, opportunities, and temporal items with clear types | Popularity-led ranking, infinite engagement loops, or anonymous-content tone |
| [Dribbble](https://dribbble.com/) | Strong thumbnail rhythm and fast visual browsing | Consistent crops make visual scanning fast | Use only for media crop/thumbnail craft in Explore | Shot-grid sameness, context-poor images, or aesthetic popularity as product value |

---

## 18. KEEP / REFINE / REWORK / REMOVE / INTRODUCE matrix

| Classification | System / element | Implementation meaning |
|---|---|---|
| **KEEP** | Three-tier shell behavior: public utility, desktop rail, mobile bottom navigation | Preserve route access and mental model; adjust styling only where needed. |
| **KEEP** | Semantic token approach; Inter + JetBrains Mono; restrained radius/elevation foundation | Extend and tune before replacing. |
| **KEEP** | Core primitives: Button, IconButton, Field, Tabs, Menu, Popover, Dialog, Toast, Skeleton, EmptyState, ErrorState | Preserve behavior/accessibility contracts; refine appearance and composition use. |
| **KEEP** | Existing routes, product terminology, fixture truth, privacy/ownership rules | Redesign must not alter access semantics. |
| **KEEP** | Strong mobile Project order and settings copy called out in audit | Use as baseline, not collateral damage. |
| **REFINE** | Canvas/surface/line/text tokens, spacing scale, max widths | Warm the neutral system slightly; document family canvases and contrast. |
| **REFINE** | Button hierarchy, Tabs overflow, Badge semantics, Skeleton geometry, empty/error copy | Make semantics and responsive cues explicit. |
| **REFINE** | `Section`, `SectionHeader`, `MetadataBar` | Reduce default use; keep only where the content truly forms a section/metadata band. |
| **REFINE** | Landing art direction | Replace template decoration with product mechanics and real work evidence. |
| **REWORK** | `ObjectHeader` as a one-size public header | Split composition responsibilities into lead, provenance, lifecycle, and decision regions. |
| **REWORK** | Profile, Project, Devlog | Establish the canonical Developer → Project → Devlog chain. |
| **REWORK** | Dashboard, Feed, Explore, Search | Give each family a distinct job/composition instead of shared card grammar. |
| **REWORK** | Collaboration, Playtesting, Studios, Jams, Events, Publishers | Adopt role/lifecycle/organization/temporal evidence anatomies. |
| **REWORK** | Notification items and Settings mobile navigation | Actor-object-action inbox; index/detail settings. |
| **REMOVE** | Paid pricing/billing UI and route destinations as content | Redirect safely; state V1 free truth. |
| **REMOVE** | Fake metrics, generic reveals, glow/lift stacks, ornamental pills, repeated dividers | Eliminate unsupported proof and decorative sameness. |
| **REMOVE** | Real-media suppression by initials; duplicate metadata; equal dashboard cards | Restore identity and priority. |
| **REMOVE** | Unused Watermelon visual experiment and verified-redundant wrappers/legacy props | Clean only within an implementation phase after reference/behavior checks. |
| **INTRODUCE** | `ProjectIdentityMarker`, `ProvenanceHeader`, `LeadRegion` | Core identity/composition vocabulary. |
| **INTRODUCE** | `ResumptiveWork`, `LifecycleSummary`, `DecisionRail` | Family-specific priority/action structures. |
| **INTRODUCE** | Typed rows/results, `TemporalAnchor`, `OrganizationMark`, overflow cue | Recognition and scan improvements without card proliferation. |
| **INTRODUCE** | Entity media fallback hierarchy and state-specific UX grammar | Coherent handling of missing data/loading/error/empty states. |

---

## 19. Prioritized issues and outcomes

Priority measures product truth first, then effect on the Developer → Project → Devlog loop, reuse radius, and dependency order.

### P0 — product truth / release gate

1. **Pricing contradiction:** the paid `/pricing` experience and dashboard Billing entry conflict with the permanent-free V1 model. Resolve in R0 before visual work.
2. **Truthful route behavior:** preserve inbound compatibility while removing paywall implication; verify signed-out and signed-in states.

### P1 — visual identity and core comprehension

1. Establish the two-register system and family layouts.
2. Make Developer → Project → Devlog persistent via Project marker and provenance.
3. Recompose Profile, Project, and Devlog as the canonical identity chain.
4. Recompose Dashboard around resumptive work and attention.
5. Differentiate Feed, Explore, and Search by activity, editorial discovery, and retrieval.
6. Replace fake/weak landing evidence with actual product mechanics/content.
7. Give core entity types distinct media/anatomy and reliable fallbacks.
8. Fix mobile tab/filter/rail discoverability and context loss on priority routes.

### P2 — breadth, lifecycle, and system completion

1. Rework Collaboration and Playtesting around Project proof and lifecycle decisions.
2. Give Studios, Jams, Events, and Publishers organization/temporal/fit-specific compositions.
3. Convert Notifications to actor-object-action grammar.
4. Convert Settings mobile navigation to index/detail.
5. Align empty/loading/error states to each page family.
6. Consolidate overlapping header/row/metadata patterns after route migration.
7. Resolve administrator visual dialect without changing permission behavior.

### P3 — polish and validation depth

1. Remove theme flash and residual unnecessary motion.
2. Tune hover/pressed/focus feedback and image transitions.
3. Validate 200% zoom, long content, Spanish expansion, missing media, and reduced motion across full inventory.
4. Refine sparse-data editorial handling after real content is available.
5. Remove verified-dead components and legacy styling props.

---

## 20. Dependency-ordered implementation plan

This plan is deliberately staged. No phase begins merely because the previous phase's CSS landed; its acceptance criteria must pass.

### R0 — Product truth and pricing retirement

- **Affected routes:** `/pricing`, `/dashboard/billing`, landing `/#free`, and every surface linking to pricing/billing.
- **Affected components:** pricing sections/cards, landing free section, desktop rail, mobile/global navigation, account/upgrade links, redirect and route-test fixtures.
- **Decision:** retire paid pricing UI. `/pricing` permanently redirects to `/#free`; `/dashboard/billing` redirects to `/dashboard` (or the same truthful free section if signed out); remove Billing and upgrade destinations from navigation. The landing free section states the actual V1 commitment without inventing future tiers.
- **Visual objective:** eliminate contradictory monetization surfaces.
- **UX objective:** existing links resolve predictably; users never enter a dead or misleading billing flow.
- **Must not change:** authentication, entitlements, data access, or introduce payment infrastructure.
- **Verification:** signed-out/signed-in redirect matrix, no paid-plan strings or Upgrade/Billing links, canonical URL/analytics decision documented.

### R1 — Visual foundation and fixtures

- **Affected routes:** `/design` and representative fixture routes only.
- **Affected components:** global tokens/theme initialization, typography styles, Button, IconButton, Field/controls, Badge, Avatar, Tabs, Menu, Popover, Dialog/Drawer, Toast, Skeleton, EmptyState, ErrorState.
- **Visual objective:** implement typography roles, family canvases, spacing, media geometry, focus, surface, radius, and motion tokens.
- **UX objective:** make control/state behavior consistent and perceivable before domain layouts migrate.
- **Must not change:** domain behavior or route layouts beyond fixtures.
- **Verification:** component/state fixture matrix; WCAG contrast; keyboard/focus; reduced motion; no arbitrary local values without rationale.

### R2 — Shell and composition infrastructure

- **Affected routes:** all public, authenticated, and management routes through their shared shells; no domain composition migration yet.
- **Affected components:** Shell, public utility header, desktop rail, mobile bottom navigation, ContextBar, Tabs/TabLinks, Section/SectionHeader, ObjectHeader migration adapter, loading/skeleton owners, and the new composition primitives.
- **Visual objective:** support family canvases, leads, rails, provenance, mobile overflow, and index/detail navigation.
- **UX objective:** preserve orientation and destination parity while allowing page families to stop sharing one composition.
- **Must not change:** route availability, authorization, or mobile destination parity.
- **Verification:** shell at 375/768/1024/1440, tab overflow, safe areas, keyboard nav, no duplicate headings, no layout shift from competing skeleton owners.

### R3 — Canonical identity chain

- **Affected routes:** public Profile, Project, Devlog, and their owner/private/draft variants.
- **Affected components:** ProfileHeader, ProjectRow, DevlogRow, ProjectIdentityMarker, ProvenanceHeader, LeadRegion, MetadataBar, media gallery/viewer, author/owner action regions.
- **Visual objective:** make Developer → Project → Devlog unmistakable and media-led.
- **UX objective:** keep authorship, parentage, state, and next action understandable throughout the core loop.
- **Must not change:** slugs, privacy, owner actions, follow/reaction/comment behavior.
- **Verification:** provenance visible above fold; all relationship/permission variants; long/missing content; Project media fallback; article readability; mobile sequence.

### R4 — Personal activity surfaces

- **Affected routes:** Dashboard and Feed, including first-run, populated, empty, loading, and error variants.
- **Affected components:** ResumptiveWork, attention/schedule groups, typed Feed events, ProjectIdentityMarker, state primitives, empty/error/skeleton compositions.
- **Visual objective:** Dashboard prioritizes resume/attention; Feed becomes a typed, provenance-rich activity stream.
- **UX objective:** let a returning user resume work or understand followed activity without decoding a card grid.
- **Must not change:** task/action semantics or feed data ordering unless separately authorized.
- **Verification:** first-run/returning, no urgent work, mixed activity types, keyboard actions, mobile priority, no equal-card regression.

### R5 — Discovery and retrieval

- **Affected routes:** Explore, Search, and all currently supported query/type/filter states.
- **Affected components:** editorial lead/shelves, DeveloperRow, ProjectRow, DevlogRow, TypedResult, filter rail, active-filter summary, Tabs, Dialog/Drawer-based mobile filter sheet.
- **Visual objective:** Explore becomes editorial discovery; Search becomes dense, typed retrieval.
- **UX objective:** distinguish browsing from retrieval while preserving fast comparison and query state.
- **Must not change:** ranking, searchable entity scope, or backend query semantics without separate product approval.
- **Verification:** real/sparse fixtures, all supported types, query preserved on errors, filter summary, no-results variants, horizontal shelf discoverability.

### R6 — Opportunity and playtest journeys

- **Affected routes:** Collaboration directory/detail/application states and Playtesting directory/detail/participation states.
- **Affected components:** CollaborationListing, PlaytestListing, ProjectIdentityMarker, LifecycleSummary/StatusSteps, DecisionRail, terms/facts group, application/participation action region.
- **Visual objective:** bind every decision to Project proof, terms, lifecycle, and one clear action.
- **UX objective:** make eligibility, commitment, access, state, and consequence clear before an application or participation action.
- **Must not change:** eligibility, application, capacity, privacy, or owner permissions.
- **Verification:** new user, applicant/tester, owner, closed/full/ineligible, error/retry, desktop DecisionRail to mobile inline transformation.

### R7 — Organizations and temporal community

- **Affected routes:** Studios, Jams, Events, and Publishers directory/detail/member/participant/management-linked views.
- **Affected components:** OrganizationMark, Studio/Publisher rows and headers, JamRow, EventRow, PublisherRow, TemporalAnchor, LifecycleSummary, DecisionRail, Project entry/result compositions.
- **Visual objective:** distinguish organizations, deadlines, RSVP/submission lifecycles, and publishing fit.
- **UX objective:** make role, time, place, fit, and participation consequences scannable without conflating domains.
- **Must not change:** membership, RSVP, submission, jam, verification, or contact truth.
- **Verification:** each lifecycle/role, timezone, long rules/catalog, sparse organization evidence, Project entries, no implied unsupported directory/search capability.

### R8 — Inbox, settings, and entry

- **Affected routes:** Notifications, all Settings categories, sign-in/sign-up/auth routes, onboarding, and only recovery routes already supported.
- **Affected components:** NotificationsView/NotificationLink/NotificationItem, settings category rail/index/forms/save feedback, Field/controls, auth form shell, onboarding progress/actions, Dialog confirmation and Toast/inline result states.
- **Visual objective:** typed actor-object-action inbox; comprehensible management; quiet trustworthy entry.
- **UX objective:** enable fast triage, predictable configuration, and low-friction entry without implying unsupported actions.
- **Must not change:** mark-read behavior, save semantics, authentication, deletion confirmation, or preference defaults.
- **Verification:** unread/history/empty/failure, settings index/detail, validation/save/destructive flows, keyboard/voice labels, mobile keyboard and back behavior.

### R9 — Landing and whole-product polish

- **Affected routes:** landing plus every priority route with residual responsive, motion, localization, zoom, or media-fallback findings.
- **Affected components:** landing hero/product proof/free section, media frames/crops, hover/pressed/focus states, motion tokens, overflow cues, long-content/fallback variants.
- **Visual objective:** make the public promise visually continuous with the redesigned product and remove remaining template effects.
- **UX objective:** finish responsiveness and feedback without adding decorative delay or false product claims.
- **Must not change:** product claims beyond verified capability.
- **Verification:** no fake stats, no giant dark frame or global reveal sequence, product screenshots/mechanics are truthful, reduced motion and performance budgets pass.

### R10 — Full regression and release review

- **Affected routes:** complete 74-route inventory and every representative role/state/permission variant reachable with safe fixtures.
- **Affected components:** all migrated primitives/compositions, design-system fixtures, route/error/loading boundaries, navigation, and audit documentation.
- **Visual objective:** prove visual direction, functional integrity, responsive behavior, and product truth as one release.
- **UX objective:** demonstrate that the redesign improves comprehension without breaking flows, state truth, accessibility, or permissions.
- **Must not change:** anything not explicitly approved during stabilization.
- **Verification:** automated build/type/lint, route/status sweep, browser QA, keyboard/zoom/reduced-motion pass, screenshot matrix, role/permission truth, reconciled findings with owners.

---

## 21. Acceptance criteria by phase

| Phase | Completion criteria |
|---|---|
| **R0** | `/pricing` redirects to `/#free`; `/dashboard/billing` no longer presents billing; no paid tier, Upgrade, checkout, or unsupported entitlement copy remains; navigation and direct-link tests pass signed in/out. |
| **R1** | All specified text roles/tokens exist in fixtures; normal text and controls meet contrast; focus is visible; 44×44 coarse-pointer targets pass; reduced-motion fixtures remove nonessential transforms; light/dark initialization does not flash if theme support remains. |
| **R2** | All three shell tiers retain destination parity; each family can use its documented canvas; mobile tabs visibly overflow; rails become intentional mobile structures; one owner renders loading structure; no route title is redundantly repeated. |
| **R3** | A reviewer can identify Developer, Project, and Devlog relationships in five seconds at 375 and 1440; real media wins over fallbacks; state/action/owner context is not duplicated; article measure and gallery behavior pass; private/draft/owner cases remain correct. |
| **R4** | Dashboard's dominant resume/attention item is visually first in all supported states; Feed entries identify type, actor, object, reason, and time where available; no generic equal-card grid; first-run and empty-returning copy differ truthfully. |
| **R5** | Explore and Search cannot be mistaken for each other; shelves have overflow cues; supported result types have distinct anatomy; filters are reachable and summarized on mobile; no-query/no-results/filter-empty/error/loading states are reproducible. |
| **R6** | Opportunity and Playtest detail pages show Project proof, material terms/lifecycle, and one primary action above fold; closed/full/ineligible/applied/owner states are distinct; mobile order keeps consequences before long prose; permission behavior is unchanged. |
| **R7** | Studio/Publisher objects look organizational, Jam/Event objects look temporal, and Project entries retain identity; deadlines/timezones/actions remain visible at all widths; sparse data does not imply false credibility; all role/lifecycle variants are captured. |
| **R8** | Notifications express actor-object-action and honest unread state; Settings works as desktop rail and mobile index/detail; save/error/destructive states are explicit; auth labels remain visible, errors are adjacent, and unsupported recovery capabilities are not implied. |
| **R9** | Landing uses verified product evidence, shares typography/media language with the app, and contains no global reveal/glow/lift stack or fake metric; animation timing is within spec; 200% zoom, Spanish expansion, long titles, and missing media pass priority routes. |
| **R10** | All 74 inventoried routes are reconciled as pass/fail/untested with evidence; desktop/tablet/mobile screenshots cover every family; signed-out and available authenticated roles are tested without fabrication; build/type/lint and route checks pass; remaining findings have severity, owner, and explicit release decision. |

### Whole-blueprint acceptance test

The redesign succeeds only if a neutral reviewer can answer these questions without reading documentation:

1. Who is the Developer, what are they building, and what changed recently?
2. What Project does this Devlog, opportunity, playtest, jam entry, or notification belong to?
3. Is this page for discovering, retrieving, deciding, participating, or managing?
4. What is the one meaningful next action, and what happens after it?
5. Is the shown state real, current, and supported by the product?

---

## 22. Explicitly out of scope

- Implementing any redesign in this documentation pass.
- Changing database schema, RLS, server actions, ranking, search indexing, or data contracts.
- Adding payments, subscriptions, entitlements, paid plans, or speculative monetization. R0 removes contradictory UI only.
- Inventing successful flows for password recovery, Studio discovery, broader search types, application management, messaging, or any capability the product does not currently support.
- Dark mode as a redesign goal; retain existing support only if already productized and verified.
- Per-creator arbitrary themes, dynamic gradients, shader effects, parallax, autoplay video, or decorative 3D.
- Chat/DM, gamification, streaks, popularity leaderboards, follower-growth mechanics, or algorithmic engagement features.
- A new logo, product name, illustration system, or wholesale brand identity exercise.
- Replacing Inter/JetBrains Mono before composition and hierarchy are validated with real content.
- Generating fake screenshots, fabricated community activity, endorsements, testimonials, or market statistics.
- Destructive route removal. Retired destinations use intentional redirects until a separate deprecation decision is approved.
- Permission, privacy, ownership, or lifecycle behavior changes disguised as visual work.
- Large-scale component deletion before reference, role, and state verification.
- Copying any reference product's complete visual skin or interaction model.

### Decisions that require separate product authorization

- Whether Studios need a public directory/search surface beyond existing routes.
- Whether Search expands to additional object types and which facets are supported.
- Whether password recovery and application-management gaps become new functional work.
- Future monetization, if any, after the permanent-free V1 commitment.
- Any feed ranking, personalization, recommendation, or notification-policy change.

This blueprint is therefore definitive about visual/product structure while remaining honest about functional boundaries. Its purpose is to give implementation teams a stable art direction, composition system, migration order, and verification contract—not to smuggle new product scope into a redesign.
