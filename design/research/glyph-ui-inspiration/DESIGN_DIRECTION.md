# Synthesized Glyph Design Direction

## 1. Positioning

Glyph should feel like **a carefully edited creative publication connected to a serious maker workspace**. It is not a game storefront, social feed clone, portfolio gallery, or generic project-management dashboard. It connects proof of work, project history, collaboration, and feedback around a durable Project identity.

The emotional target is:

- premium without luxury theatrics;
- expressive without visual noise;
- developer-centric without becoming terminal cosplay;
- game-aware without neon or sci-fi clichés;
- social without engagement bait;
- operational without becoming enterprise software.

## 2. Core visual idea: the living build record

The visual subject is the work itself: cover art, gameplay stills, concept sketches, build clips, changelog excerpts, contributors, milestones, and test feedback. Glyph's chrome should frame that evidence rather than compete with it.

Every content surface should answer four questions quickly:

1. **Whose work is this?** Developer or Studio.
2. **Which Project does it belong to?** Persistent project identity.
3. **What kind of object is this?** Devlog, collaboration opening, playtest, jam entry, event, publisher note, or notification.
4. **What state is it in?** Editorial status, audience visibility, discovery eligibility, domain phase, and latest activity must remain distinct.

## 3. Two registers, one system

### Expressive public/editorial

Use for landing, Explore, Project, Profile, and Devlog reading.

- Media-led compositions with one dominant visual subject.
- Editorial type scale with restrained display moments.
- Alternating wide/narrow reading regions instead of repeated equal cards.
- Captions, provenance, dates, and credits treated as meaningful editorial furniture.
- Warm neutral canvas; deep ink text; project art supplies most chroma.
- Motion reveals relationships: cover-to-detail continuity, image-to-caption linkage, and state changes.

### Quiet operational

Use for dashboard, collaboration management, playtest setup/results, search, notifications, settings, and onboarding.

- Compact rows and panels with strong alignment.
- State and next action above decoration.
- Persistent context header naming the Project and current workflow.
- Tables, timelines, grouped lists, and inspector rails used when they match the job.
- Dense desktop layouts deliberately recompose at tablet and mobile widths.

## 4. Typography

Keep the existing typography until the repository audit proves a change is warranted. A strong default is:

- **UI/body:** Inter or the existing sans, with 400/500/600 doing most work.
- **Technical metadata:** JetBrains Mono or the existing mono, reserved for versions, dates, build IDs, tags, shortcuts, and code-like data.
- **Display/editorial:** first try the existing sans at larger optical sizes, tighter tracking, and more assertive line breaks. Introduce a separate editorial face only if it materially improves Project and Devlog storytelling without fragmenting the system.

Recommended hierarchy:

- Display: `clamp(2.5rem, 6vw, 5.5rem)`, compact line height, used sparingly.
- Page title: 32–48 px desktop, 28–36 px mobile.
- Section title: 20–28 px.
- Body: 16–18 px for reading; 14–15 px for application UI.
- Metadata: 12–13 px, never low-contrast to the point of illegibility.

Avoid ultra-light weights, all-caps paragraphs, excessive typefaces, and giant headings that consume the viewport without explaining the product.

## 5. Color and material

Suggested semantic direction, not a replacement token file:

- Canvas: warm off-white (`#F4F1EA` family) and true near-black (`#11110F` family).
- Surface: one or two quiet elevation steps, mostly created with tone and border rather than blur.
- Ink: high-contrast charcoal; subdued ink remains comfortably readable.
- Action accent: one distinctive but controlled color, tested in both themes.
- State colors: semantic success, warning, danger, info; never rely on color alone.
- Project color: sampled or curated from authentic project media and scoped to that project's identity marker—not global navigation or every control.

Borrow the warm editorial contrast seen in Designity and the disciplined functional palettes seen in Attio, NotifyHub, ClauseOS, and Raktor. Do not copy their exact palettes. The source pages are cataloged in [MOODBOARD_REFERENCE_CATALOG.md](./MOODBOARD_REFERENCE_CATALOG.md).

## 6. Layout

- Use a 12-column desktop grid, an 8-column tablet grid, and a 4-column mobile grid as composition aids, not rigid card generators.
- Public/editorial max width: roughly 1280–1440 px; long-form reading measure: 64–74 characters.
- App shell: allow high-density work areas to use the viewport, with a stable navigation rail and optional context/inspector rail.
- Preserve meaningful whitespace around media and headings, but keep action groups compact.
- At 375 px, reorder by task priority; do not merely stack desktop columns.

## 7. Object identities

Create a small set of cross-product primitives:

- **ProjectIdentityMarker:** cover fragment or project glyph, project name, stage, and optional studio; usable from 24 px row scale to hero scale.
- **ProvenanceHeader:** `Developer / Studio → Project → Object`, with links and state, not a generic breadcrumb.
- **TypedResult:** visually differentiates Project, Developer, Devlog, Collaboration, Playtest, Studio, Jam, Event, and Publisher search results.
- **LifecycleSummary:** key state, next action, owner, date, and blockers.
- **DecisionRail:** contextual actions and status for management views.
- **TemporalAnchor:** date/phase/timeline marker for jams, events, releases, and devlogs.
- **NotificationItem:** actor, project, event, reason, time, unread state, and destination; never just an icon plus sentence.
- **ResumptiveWork:** a compact module that helps a developer continue the most relevant work.

## 8. Imagery

- Require real or clearly labeled fixture media; never fabricate fake engagement proof.
- Use consistent crop rules by context: cinematic 16:9 for lead project media, 4:3 for discovery, square only for avatars or small identity marks.
- Preserve subject focus with object-position metadata when available.
- Prefer a small number of large images to a wall of thumbnails.
- Textures, screenshots, concept art, and build footage may overlap editorially, but controls must remain on stable, readable surfaces.

## 9. Motion

Apple-like does not mean glass. It means response, continuity, precision, and respect for user control.

- Button/press feedback: 80–140 ms.
- Menus, popovers, and tooltips: 120–180 ms, origin-aware.
- Local panel state changes: 180–260 ms.
- Shared-element or cover-to-detail transitions: 240–360 ms when they genuinely preserve context.
- Avoid global page reveals, scroll-jacking, perpetual floating, cursor followers, automatic parallax, or animation that delays the next action.
- Make overlays dismissible immediately; keep long transitions interruptible when practical.
- Under `prefers-reduced-motion: reduce`, replace translation/scale with near-instant opacity or no animation.

Primary references: [Apple HIG Motion](https://developer.apple.com/design/human-interface-guidelines/motion), [Designing Fluid Interfaces](https://developer.apple.com/videos/play/wwdc2018/803/), [Apple HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), and [Enhance your UI animations and transitions](https://developer.apple.com/videos/play/wwdc2024/10145/).

## 10. What to borrow / what not to copy

### Borrow

- Designity: editorial rhythm, warmth, human/creative framing.
- Attio: exact hierarchy, developer credibility, quiet chrome, modular storytelling.
- API-as-a-Service concept: documentation-aware sequencing and technical proof.
- NotifyHub: structured developer-facing product explanation and operational clarity.
- AI Clinic: custom motion as product explanation, not decoration.
- ClauseOS: scan-friendly status, dates, and activity organization.
- Raktor: strong control-room hierarchy and prioritized operational signal.
- Behance: media-led discovery and explicit creator/project attribution.
- Linear/GitHub Primer: compact product UI, consistent patterns, and focus on flow.
- Apple: responsive feedback, spatial continuity, brevity, optional motion, and reduced-motion support.

### Do not copy

- Any source's brand marks, illustrations, exact layout, palette, or animation choreography.
- Dribbble-only hero spectacle without real product states.
- Unsupported ROI claims, fake users, fake metrics, or fictional testimonials.
- Bento layouts repeated on every section or dashboard.
- Glass material as a universal surface treatment.
- Thin gray text, microscopic labels, hover-only meaning, or beautiful-but-inoperable controls.
- Dense dashboard charts where a prioritized list, timeline, or status summary is the real task.

## 11. Acceptance test for the direction

The redesign is successful only if a new viewer can identify Glyph's product loop, a returning developer can resume work quickly, and every secondary surface preserves Project provenance without making the product feel repetitive. Visual polish cannot compensate for unclear product truth, broken states, inaccessible controls, or invented content.

