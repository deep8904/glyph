# Components, Patterns, and Motion

## Pattern-selection rule

Choose a component because it matches the job, not because it appears in an inspiration shot. Extend the existing Glyph system before adding a new dependency. If a new primitive is required, preserve semantics, focus management, keyboard behavior, and state visibility.

Behavior references: [Radix accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility), [React Aria](https://react-spectrum.adobe.com/react-aria/), and [GitHub Primer](https://primer.style/product/). These are references, not automatic dependency instructions.

## Core composition primitives

### ProjectIdentityMarker

**Purpose:** preserve Project identity across unrelated-looking workflows.

Anatomy: media fragment or monogram fallback; project name; optional studio/developer; stage; object-specific context. It must work in compact rows, cards, headers, and hero regions without becoming a logo wall.

### ProvenanceHeader

**Purpose:** make the relationship between creator, Project, and current object obvious.

Anatomy: linked creator/studio; ProjectIdentityMarker; object type; published/updated date; visibility/discovery state where relevant; overflow actions. This is richer than a breadcrumb and more stable than prose.

### TypedResult

**Purpose:** let Search and command surfaces mix object types without ambiguity.

Anatomy: type icon/label; primary label; project/creator context; matched excerpt; state; destination; keyboard selection. Type must remain clear without color.

### LifecycleSummary

**Purpose:** replace scattered badges with a coherent status story.

Anatomy: current phase/state; owner; next action; date/deadline; blocker; short history link.

### DecisionRail

**Purpose:** keep review and management actions visible beside the evidence they affect.

Rules: one primary decision; related secondary actions; destructive actions separated; collapses below content on mobile; never duplicates full navigation.

### ResumptiveWork

**Purpose:** help returning users continue, not admire a dashboard.

Anatomy: object and Project identity; why it matters now; last activity; next action; compact progress.

### NotificationItem

**Purpose:** communicate a meaningful event with enough context to decide whether to open it.

Anatomy: actor; ProjectIdentityMarker; event; reason; time; unread state; destination. Avoid generic bell-icon rows.

### TemporalAnchor

**Purpose:** foreground date and phase for jams, events, releases, and Devlog chronology.

Anatomy: date/time; phase; timezone when necessary; relationship to current time; associated Project.

## Component library research

- [Watermelon UI](https://ui.watermelon.sh/) — REFERENCE INDEX; useful for implementation-oriented React blocks and dashboard compositions. Treat as a pattern shelf, not a theme to install wholesale.
- [Landingfolio](https://www.landingfolio.com/) — REFERENCE INDEX; useful for locating specific landing sections and comparing hierarchy.
- [Radix Primitives](https://www.radix-ui.com/primitives) — OFFICIAL DOC; useful for unstyled behavior, focus, and keyboard models.
- [React Aria](https://react-spectrum.adobe.com/react-aria/) — OFFICIAL DOC; useful for accessible interaction and internationalization behavior.
- [GitHub Primer](https://primer.style/product/) — OFFICIAL DOC; useful for responsive, compact developer-product patterns.
- [Awwwards](https://www.awwwards.com/) — REFERENCE INDEX; use for art direction and motion ideas, then remove anything that harms performance, accessibility, or task clarity.
- [Behance](https://www.behance.net/) — REFERENCE INDEX; use for project storytelling and authorship models.
- [Dribbble](https://dribbble.com/) — REFERENCE INDEX; use for visual fragments and compositions, never as usability proof.

## Motion principles

Apple's guidance emphasizes purposeful motion, brief and precise feedback, realistic continuity, user control, and alternatives for people who reduce motion: [HIG Motion](https://developer.apple.com/design/human-interface-guidelines/motion) and [HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility).

### Motion map

| Event | Standard treatment | Reduced-motion treatment |
|---|---|---|
| Button press | 80–120 ms tone/position response | Immediate tone change |
| Menu/popover | 120–180 ms opacity + 2–4 px origin-aware movement | Near-instant opacity |
| Accordion/filter | 160–220 ms height/opacity, content remains readable | Instant layout change |
| Save success | Local icon/text morph, 160–220 ms | Text/icon swaps instantly |
| Project cover → detail | Shared element, 240–360 ms, preserves spatial context | Crossfade or direct navigation |
| Notification read | Local background/state transition | Immediate state change |
| Reorder/drag | Object tracks pointer; spring only on release | Direct tracking, minimal settle |
| Loading | Stable skeleton/progress without pulsing glare | Static skeleton/progress label |

### Apple-like microinteractions for Glyph

- **Project expansion:** a clicked project image becomes the detail-page lead image, keeping identity continuous.
- **Contextual menu origin:** menus expand from the trigger and return focus to it when dismissed.
- **Save state:** “Saving…” changes locally to “Saved” without a toast storm.
- **Selection continuity:** the selected result remains visually anchored when an inspector opens.
- **Soft boundary:** drag/reorder feedback resists invalid zones without a dramatic shake.
- **Interruptibility:** users can dismiss overlays or navigate before a flourish completes.

The conceptual source for continuity, response, spatial consistency, and interruptible motion is Apple's [Designing Fluid Interfaces](https://developer.apple.com/videos/play/wwdc2018/803/). The implementation-oriented transition reference is [Enhance your UI animations and transitions](https://developer.apple.com/videos/play/wwdc2024/10145/).

## Accessibility contract

- Visible focus on every interactive element.
- Full keyboard operation for menus, dialogs, tabs, comboboxes, command palette, drag alternatives, and carousels if any remain.
- Semantic HTML first; ARIA only where necessary.
- Minimum target size appropriate to the input context.
- Meaning never conveyed by color or motion alone.
- Contrast tested in light/dark and hover/selected/disabled states.
- Layout survives zoom, long strings, localization, and larger text.
- Loading shows content or progress promptly; see [Apple HIG Loading](https://developer.apple.com/design/human-interface-guidelines/loading).

