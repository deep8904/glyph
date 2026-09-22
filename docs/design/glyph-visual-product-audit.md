# Glyph visual product audit

**Date:** 2026-09-22  
**Scope:** Read-only repository/design-doc review, live browser audit of `http://localhost:58387`, responsive review, interaction/state review, and external pattern research. No implementation files were changed.  
**Review posture:** senior UI/UX, product, interaction, visual direction, and frontend product review—not a technical-consistency sign-off.

## Executive diagnosis

Glyph is coherent, legible, responsive, and unusually honest about its product model. It is not visually finished.

The core problem is not “bad components.” It is that the component system has become the art direction. Outside the landing page and the media-rich project page, nearly every surface resolves to the same visual sentence: quiet title, explanatory line, hairline, compact text rows, muted metadata. That is a good anti-slop baseline, but it erases the difference between browsing games, evaluating a collaborator, joining a playtest, reading a build story, checking notifications, and operating one’s own work.

The result is technically consistent but emotionally flat:

- **Strongest surface:** the project page, because the cover image immediately creates a subject.
- **Most promising surface:** the dashboard, because its two-column information hierarchy answers real returning-user questions.
- **Weakest family:** Explore / Collaboration / Playtests / Jams / Events / Publishers, which look like variations of the same documentation list.
- **Largest product-brand break:** the landing page uses rounded cards, glow/shadow, illustrative UI, synthetic metrics, smooth scrolling, reveal motion, and marketing-scale type; the application uses flat white/gray, hairlines, small type, and almost no imagery. They feel like adjacent products.
- **Largest missed opportunity:** Developer → Project → Devlog is present in links and data but not consistently encoded as a visual lineage. BUILD → DOCUMENT → DISCOVER → CONNECT can be explained from the copy, but it is not yet perceptible as the interface’s organizing rhythm.

The next pass should not add more decoration or replace the system wholesale. It should introduce a small number of content-specific compositions: a strong identity header, project media carried through the graph, distinct page grammars for browse/read/operate surfaces, clearer status semantics, and fewer repeated section formulas.

## Audit method and evidence boundaries

### Observed in the browser

Reviewed at desktop, intermediate, and phone layouts (requested browser viewports 1440, 1024, 768, and 390; the in-app browser reported proportional inner viewports). Representative screenshots were inspected for landing, Explore, profile, project, devlog, Collaboration, dashboard fixtures, account/notification fixtures, and 404.

Routes and states inspected:

- `/`, `/explore`, `/explore/projects?stage=alpha`
- `/search`, `/search?q=ember`, a no-result query
- `/dev/demo-nova`
- `/p/demo-nova/emberfall-keep`
- `/p/demo-nova/emberfall-keep/alpha-build-live`
- `/collaborate`, type and remote filters, and a collaboration detail
- `/playtests/browse` and an open playtest detail
- `/jams`, `/events`, `/publishers`
- `/studios/phase1-test-studio`
- `/login`, `/signup`
- protected `/feed`, `/notifications`, `/dashboard`, `/settings` redirects
- development fixtures at `/design/dashboard` and `/design/account`
- nonexistent object route / 404

Keyboard focus order and focus visibility were spot-checked on Explore. DOM landmarks, heading levels, image alt behavior, touch-target dimensions, overflow, and responsive layout changes were also inspected.

### Repository/design evidence

The review read `PRODUCT.md`, the product-design blueprint, visual direction, design decisions, design-system notes, state matrix, Phase L reassessment, final audit, shell/dashboard/notification implementations, and motion CSS. These establish the intended pre-launch/local-community positioning, the Developer → Project → Devlog model, and the deliberate anti-glass/anti-card decisions.

### Not tested

- No real account was created and no external OAuth flow was started.
- No form that would create, edit, delete, apply, RSVP, react, follow, message, or change preferences was submitted.
- Real authenticated Dashboard, Feed, Notifications, Settings, project-owner editing, collaboration applicant/owner, tester/requester, studio-member, event-participant, publisher, and admin workflows were unavailable. Development fixtures were used only to inspect presentation and state coverage.
- No real jam, upcoming event, or verified publisher detail was reachable from current public data.
- Reduced-motion support was verified in CSS/code, not with an OS-level preference emulation.
- Accessibility observations are not a VoiceOver/NVDA/TalkBack audit and are not a WCAG conformance claim.

## What currently works

1. **The product model is real and specific.** “Still building” is meaningfully different from a storefront or generic professional network. Projects, devlogs, playtests, collaboration, events, and publisher discovery fit a coherent pre-launch ecosystem.
2. **The project page proves the visual direction can work.** Its wide cover, title, stage, creator, structured facts, screenshots, devlogs, and open-playtest handoff form a credible canonical work page.
3. **Copy is usually concrete.** “0 of 12 taken,” “Focus on: combat feel, level difficulty, bugs,” compensation, hours/week, expiry, project stage, and recency help users decide.
4. **Search is useful rather than ornamental.** A single query returns developers, projects, and devlogs with explicit ranking logic and meaningful result context.
5. **The public shell is learnable.** Home, Explore, search, login, and sign-up are obvious; object breadcrumbs preserve orientation.
6. **Responsive mechanics are reliable.** No inspected page produced document-level horizontal overflow. Project media, two-column object layouts, dashboard columns, settings navigation, and bottom navigation collapse predictably.
7. **Touch targets are mostly appropriate.** Important mobile controls were generally about 44px or larger; the bottom bar is easy to reach.
8. **Focus is visible.** Keyboard navigation exposed outlines on the skip link, shell links, search, and section navigation.
9. **States are honest.** Empty Events, Jams, Publishers, studio projects, notifications, and dashboard modules do not invent activity. The fixture suite includes populated, empty, no-result, failed-load, incomplete-profile, and destructive-account states.
10. **Motion restraint inside the product is correct.** 150–200ms state changes for controls/overlays and reduced-motion rules are appropriate. The application does not bounce, lift, or animate every row.

## What looks or feels weak, and why

### 1. Consistency has become sameness

Explore, Collaboration, Playtests, Jams, Events, Publishers, Feed, Notifications, and several object pages reuse the same max-width column, section heading, divider, row, and metadata treatment. Similarity correctly communicates “same product,” but it also communicates “same task.” A job board should support comparison of role, commitment, compensation, and project credibility. A playtest board should support comparison of platform, capacity, focus, and build access. An event surface should make time and place dominant. Those facts exist, but their visual structures do not differ enough.

### 2. The page subject often has no visual anchor

On profile, an initials avatar and 32px name do not create a memorable person. On devlog, the article has no screenshot/cover and only a purple project link connects it to Emberfall Keep. On collaboration detail and playtest detail, the page begins with text when project imagery could instantly establish credibility. The interface is asking typography alone to carry identity.

### 3. Hierarchy is mostly font size plus order

The type scale is sensible, but the difference between page subject, section title, object title, metadata, and action is too subtle across long pages. Many screens scan as equally weighted gray text. The project page improves only because its image supplies contrast.

### 4. The landing page overpromises a different visual product

The landing page uses a dark rounded stage, very large two-tone headline, pills, shadowed rounded feature cards, tinted icon tiles, hover lift, smooth scrolling, scroll reveals, and a fabricated-looking UI illustration. The application deliberately removes nearly all of those devices. The gap is more than marketing-versus-product; it is a different design philosophy.

The mock devlog/playtest card shows “12 comments,” “34 views,” and “7 signed up.” Those look like real proof but are not labeled as illustrative. The market-stat block (250K, 8,554, 48%, $10.8B) has no visible sources. This weakens trust in a product whose best brand asset is authenticity.

### 5. Browse surfaces are text-heavy and weakly comparable

Explore’s first viewport repeats project descriptions and metadata in long rows. Collaboration titles foreground roles but bury contract, compensation, time, project, and recency in one low-contrast string. Playtests need a capacity/progress cue and focus-category structure. On mobile these become long reading tasks rather than fast scanning tasks.

### 6. Secondary product areas are presented as first-class but often empty

The Explore subnav gives equal persistent weight to Jams, Events, and Publishers even when they contain no data. This makes the product feel broader but thinner. Empty surfaces are handled well locally, yet their permanent prominence dilutes the Developer → Project → Devlog core.

### 7. The brand’s local/community anchor is almost invisible

The product documents emphasize Phoenix/ASU/UAT/IGDA roots, but the rendered experience reads globally generic. “Local events” exists as a feature label; locality is not a navigation, discovery, or identity signal. Do not add partner logos without evidence. Do make city, nearby activity, and community provenance perceptible where real data supports it.

## Route-by-route findings

### Landing `/`

**Observed:** Strong opening proposition, confident display type, a clear primary CTA, and good contrast between problem, features, steps, free model, and closing statement. The page is long and uses smooth scrolling plus reveal animation. Feature modules use a familiar rounded-card marketing composition. The illustrative UI contains unsupported engagement numbers. Footer links include Jobs even though Jobs is not a distinct audited product surface.

**Diagnosis:** Visually stronger than the app, but closer to an AI-startup landing template than Glyph’s restrained build-record product. Too many ideas—market stats, seven-platform problem, six features, three steps, pricing thesis, persona statement—compete before the user sees convincing real work from Glyph.

**Direction:** Lead with a real project + devlog + playtest chain. Keep the headline and free-first promise. Remove or source the market statistics, label illustrative UI, reduce generic feature cards, and replace the “everything” pitch with evidence of one live build loop.

### Explore `/explore`

**Observed:** Useful groups (joinable playtests, projects, available developers, recent devlogs), transparent activity-first ranking, real content, and links into the core graph. The same projects repeat in adjacent sections. Most rows share nearly identical anatomy; only some have thumbnails.

**Diagnosis:** Correct information architecture, weak editorial direction. It feels like four database queries stacked vertically. The repeated Phase1/Emberfall/Rift/Emberreach rows make the page look padded rather than curated.

**Direction:** Make Explore an editorial index: one lead “active build,” a compact “needs testers now” strip, a people module, and recent build notes. Avoid repeating the same object in multiple above-the-fold sections unless the treatment and user action differ materially.

### Search `/search`

**Observed:** Clear input, useful scope tabs/counts, explicit sort rule, and mixed-object results. Empty initial guidance is concise. Results use the same row primitives as Explore.

**Direction:** Keep utilitarian. Add query-term emphasis and stronger object-type differentiation. Preserve one consistent result density; do not turn it into a gallery.

### Developer profile `/dev/[username]`

**Observed:** Identity, location/role/engine, collaboration availability, social counts, current work with image, devlogs, activity, about, collaboration, and external links. The current project becomes the strongest element.

**Diagnosis:** Good information, but the developer still feels like a record wrapped around a project. Initials avatars and the pale header lack personality. “Activity” repeats facts already visible above.

**Direction:** Treat “what I am building now” as part of the identity header. Use a larger real avatar when available, a concise craft/location statement, and a current-build visual band. Merge redundant activity facts into recency annotations rather than a separate generic section.

### Project `/p/[username]/[project]`

**Observed:** Best page in the product. Cover image, title, pitch, creator, stage/engine/genre/start date, About, screenshots, devlogs, and open playtest create credible depth. Desktop composition uses media, narrative, and a fact rail; mobile stacks cleanly.

**Weaknesses:** The cover is atmospheric stock-like imagery and not obviously gameplay. The side metadata can feel detached from the narrative. The project’s current state is split among badges, last-devlog time, devlogs, and playtest.

**Direction:** Keep the composition. Introduce a single “current build” summary near the identity block: stage, latest milestone/devlog, playable status, and next need. Prefer gameplay media and label concept/cover art honestly.

### Devlog `/p/.../[devlog]`

**Observed:** Excellent readable measure, clear title/date/author, sensible headings, reactions, comments, earlier post, and links back to project/profile. On mobile, the title wraps cleanly and actions remain reachable.

**Diagnosis:** It reads like a generic markdown article. No project media, stage, build number, or visual token survives from the parent project. The breadcrumb and small purple project link carry too much responsibility.

**Direction:** Give devlogs a persistent project masthead (small cover crop or project mark, stage/build context, project link) and allow one lead image/video when present. Keep the restrained article body.

### Collaboration

**Observed:** Filters are understandable; detail pages include project/author, contract, compensation, time, expiry, role description, and a clear sign-in gate. The “Looking for” label repeats on every listing.

**Diagnosis:** Functionally credible but visually indistinguishable from a text classifieds page. Project quality is hard to assess without leaving the list. “Remote OK” is simultaneously a filter and repeated metadata, while high-value facts remain in a flat sentence.

**Direction:** Use a job-board grammar: role first, project thumbnail/name second, then a consistent comparison grid for commitment, compensation, location, and age. Preserve the project/identity trust chain. Remove repeated labels that do not help scan.

### Playtesting

**Observed:** Browse and detail pages communicate platform, places remaining, focus areas, and a five-step lifecycle. The detail flow is one of the clearest product-specific experiences.

**Weaknesses:** Browse rows do not visually foreground capacity, platform, or focus. Raw labels such as `combat_feel` and `level_difficulty` leak implementation vocabulary. The five-step sequence is informative but visually modest.

**Direction:** Make availability and focus the scan anchors; humanize labels (“Combat feel,” “Level difficulty”). Use a restrained progress/capacity treatment and a clearer current-step lifecycle, not gamification.

### Studios

**Observed:** Public studio detail clearly states that work lives on project pages, shows size and team, and links to a developer profile. Empty project state is honest.

**Diagnosis:** A studio with no projects is almost entirely text and has little organizational identity. It is correctly secondary, but the empty page does not explain what makes a studio worth following or evaluating.

**Direction:** Keep studios as wrappers. Lead with member work and shared projects when available; do not invent corporate-dashboard chrome.

### Jams

**Observed:** Empty state: “No game jams yet” with sign-in-to-host action.

**Untested:** real jam detail, phase changes, submission, voting, and results.

**Direction:** When data exists, make time/phase/submission state the visual grammar. Jams should look temporal, not like another generic list.

### Events

**Observed:** Type filters and honest empty state. City/locality is described but not visible with no data.

**Untested:** event detail, RSVP, city browse, demo-slot request, owner management.

**Direction:** Date, city, distance/context, and RSVP state should dominate. A date-led agenda is more appropriate than project-style rows. Avoid a decorative map unless density makes it useful.

### Publishers

**Observed:** Clear explanation of verified publishers and developer control; no verified publishers currently exist.

**Untested:** publisher profile, shortlist, contact, developer response, and publisher dashboard.

**Direction:** Verification alone is not enough. Future rows should foreground thesis, genres/stages, typical support, geography, and recent relevant work. Keep this role-gated/secondary until supply exists.

### Dashboard fixture

**Observed:** Strong two-column desktop model: current build, next action, attention, feedback, network, and opportunities. Mobile correctly prioritizes current build and attention. New-user and failed-load variants exist.

**Diagnosis:** The information model is better than the visual hierarchy. Every module returns to section heading + hairline rows, and the current project lacks imagery in the fixture. “Opportunities” is generic navigation rather than personalized value.

**Direction:** Keep the question-based ordering. Give the current build one strong visual/status anchor, and treat the right column as contextual assistance. Personalize or remove generic opportunity links when they do not respond to user state.

### Feed

**Observed:** Protected route redirects to login; feed row fixture inspected.

**Untested:** real populated/empty feed, follow/unfollow consequences, pagination, and reaction/comment flow.

**Direction:** Feed should be a chronological build-delta stream, not a generic social feed. Project identity and the changed artifact should outrank actor avatar and engagement totals.

### Notifications fixture

**Observed:** All/unread filters, unread count, merged actors, unavailable objects, empty/no-result/error states, long-name wrapping, and readable mobile layout. Rows communicate actor → action → object → time.

**Diagnosis:** Semantically strong, visually weak. Colored dots plus text make different event types feel interchangeable; long notifications become dense paragraphs. No actor/project imagery or event grouping is present.

**Direction:** Add actor avatars or project thumbnails where meaningful, group by time only if it reduces noise, and use small event-type icons sparingly. Keep the sentence structure and unavailable-object explanation.

### Settings fixture

**Observed:** Profile, account, security, privacy, notifications, and delete-account states exist; desktop side navigation becomes a mobile horizontal tab strip. Forms and destructive confirmation are comprehensive.

**Direction:** Keep quiet and form-forward. Settings should not inherit discovery imagery. Improve section intros and progressive disclosure where very long pages create fatigue.

### Auth

**Observed:** Focused, centered, clear provider buttons, email/password fields, password reveal, and cross-link. Mobile targets are adequate.

**Weakness:** Generic and visually disconnected from the “still building” value. OAuth and email sit in a standard template without reassurance about what happens next.

**Direction:** Add one concise onboarding expectation (“Create a profile, add a project, post when ready”) and a subtle real project/devlog cue. Do not add testimonials or fake trust marks.

### 404

**Observed:** Clear, calm, centered message with one recovery action.

**Direction:** Keep. Consider context-aware return links only where routing data makes that safe.

## Cross-product design-system findings

### Layout and composition

- The 768px discovery column is readable but overused. Browse surfaces can use a wider comparison layout on desktop while articles remain narrow.
- The shell’s left rail + top utility + context bar is coherent at desktop. At phone widths, the top utility bar, horizontally scrolling Explore subnav, and bottom nav consume substantial attention before content.
- Asymmetry exists primarily on the landing and dashboard. Public application pages are highly symmetrical and centered, which contributes to the assembled-from-primitives feeling.
- Hairlines are doing too much: grouping, separation, rhythm, hierarchy, and closure. Introduce whitespace, media, alignment changes, and typographic contrast so every boundary does not require a rule.

### Typography

- Inter is a sound interface face; JetBrains Mono is appropriately limited to handles/technical values.
- The 12/13/15/16/20/24/32 scale is disciplined but creates insufficient contrast on visually important object pages.
- Large titles need stronger contextual pairing rather than merely becoming larger. A display face is not required; use weight, measure, layout, and adjacent media first.
- Metadata strings frequently combine too many dimensions at one visual level. Convert only the most decision-relevant values into structured fields; do not pill every noun.

### Color

- Neutral + indigo is calm and professional; status green is used meaningfully for collaboration availability.
- Too much gray-on-white makes the app feel unfinished. The answer is not more purple or gradients. Use project media, restrained semantic status surfaces, and one quiet warm/local secondary neutral.
- Status/category semantics need consistency: stage, availability, lifecycle, urgency, and verification should each have a defined role and should never rely on color alone.

### Components

- Keep Button, Field, Tabs, Avatar, Badge, Section, EmptyState, ErrorState, MetadataBar, and rows as primitives.
- The missing layer is domain composition: ProjectLead, ProjectReference, DeveloperIdentity, OpportunitySummary, PlaytestCapacity, EventDateBlock, and DevlogMasthead. These should be compositions, not a new universal card.
- Arbitrary pills are mostly controlled in the app. Landing still uses pill CTAs and oversized rounded cards heavily, which breaks the system.
- Initial avatars and initial project tiles are acceptable fallbacks but appear too often to be invisible. Encourage real media rather than decorating fallbacks.

### Motion and microinteractions

- Application motion is appropriately quiet and state-based.
- Landing smooth scrolling (Lenis) changes a basic browser behavior without clear product value. Remove unless user testing shows a real benefit.
- Scroll reveal is acceptable in moderation, but the current long page makes motion a recurring marketing motif. One entrance sequence is enough.
- Hover lifts/scales on landing cards/icons are generic template gestures. Prefer color, border, and content-state response.
- Reduced-motion CSS is present and comprehensive in intent; verify it on real devices before release.

### Navigation and information architecture

- The core signed-out nav is understandable.
- Explore’s persistent secondary nav gives Level-3 areas the same weight as core discovery. This conflicts with the documented hierarchy.
- “Home” means landing signed out and Dashboard signed in, while Feed is separate. That can work, but labels and post-login destination behavior need consistent product language.
- The Developer → Project → Devlog upward links work. Downward/contextual links are less systematic, and cross-feature objects (playtest/collaboration/jam submission) do not always visibly carry project identity.

## UX and flow findings

### New user

Landing → sign-up is obvious. The product promise is broader than the first-use path. Make the first session explicitly: profile → first project → optional first devlog. Do not expose every ecosystem feature at once.

### Returning developer/project owner

The dashboard model is strong in fixtures, but real authenticated behavior was not testable. The next-action concept is correct; it should remain singular and state-driven.

### Reader/follower

Profile → project → devlog is easy to traverse. The reverse visual lineage is weak. A reader should always know which project changed and why the update matters.

### Collaboration applicant

Browse → detail → sign-in gate is clear. Actual application form, confirmation, status tracking, acceptance/rejection, and owner review were untested.

### Tester

Browse → detail → sign-in gate is very clear. The lifecycle is a standout. Request, acceptance, build access, play, and feedback submission were untested.

### Studio member, event participant, jam participant, publisher

Public entry points exist, but no complete live journey was available. These must remain explicitly unvalidated rather than inferred from route coverage.

## Responsive findings

- No inspected page overflowed the document viewport.
- Mobile media and project facts stack cleanly.
- Bottom navigation targets are large and stable.
- Explore rows become tall because description + long metadata are preserved; mobile scanning is slower than necessary.
- The horizontally scrolling Explore context bar is usable but hides destinations off-screen without an explicit overflow cue.
- Project and devlog breadcrumbs can occupy a full row or more; keep only the useful ancestors on narrow screens.
- Dashboard’s desktop two-column model becomes a sensible linear priority order on mobile.
- Settings and notification fixture pages become very long; preserve progress/orientation within deep forms.

## Accessibility observations

**Positive observed cues:** skip link, semantic headings, named navigation landmarks, visible keyboard focus, adequate main text contrast, approximately 44px mobile targets, descriptive project-image alt text, decorative list thumbnails with empty alt, explicit “opens in a new tab” text, and non-color unread text in fixtures.

**Risks / follow-up:**

- Focus outline color appeared to inherit different foreground colors on several shell links rather than always using the accent token; visually verify against every background.
- Emoji-only reaction controls expose emoji plus counts, which may be ambiguous to screen-reader users; ensure accessible names communicate reaction types and state.
- Horizontal tab/context bars need keyboard-scroll visibility and clear focus retention.
- Long notification rows need a sensible spoken sentence and not duplicated actor/object text.
- A real screen-reader pass is still required for landmark announcements, breadcrumb behavior, dialogs/menus, auth errors, and step-state announcements.
- Verify zoom/reflow at 200% and 400%, not only narrow viewports.

## Content and copy findings

- Keep concrete product language and real lifecycle facts.
- Replace raw enum copy (`combat_feel`) with human labels.
- Remove repeated qualifiers (“Looking for” on every row) where layout already communicates category.
- Audit landing claims and statistics for source, date, and scope. Uncited market numbers should not be presented as proof.
- Label mock interfaces as examples or use real anonymized product content. Do not show invented engagement as if observed.
- “Everything you need… nothing you don’t” is generic SaaS copy and conflicts with the visibly large feature surface.
- Make the local/community promise concrete only with supported data: city, nearby event, community chapter, or creator location—not vague community imagery.

## AI-slop diagnosis

| Pattern | Concrete Glyph evidence | Judgment |
|---|---|---|
| Repetitive section anatomy | heading → muted description → hairline → rows across most public surfaces | **Present; high impact** |
| Generic rows/cards | Explore, Collaboration, Playtests, Notifications share near-identical row rhythm | **Present; high impact** |
| Arbitrary pills | Mostly removed in app; landing CTA/chips retain pill language | **Localized** |
| Overly symmetric layouts | centered 768px columns with equal side whitespace | **Present on browse/object pages** |
| Generic SaaS spacing | uniform 32/40px section gaps regardless of content intent | **Present** |
| Excessive whitespace | landing hero and centered list pages use space without enough visual anchors | **Present in places** |
| Decorative gradients/glows | not in app; landing uses accent glow/shadows/tinted cards | **Localized brand mismatch** |
| Repeated metadata treatments | dot-separated muted strings for project, developer, role, playtest | **Present** |
| Interchangeable components | domain objects too often differ only in words | **Present; central problem** |
| Canned empty states | copy is generally specific; visual presentation is generic | **Copy good, composition weak** |
| Unnecessary animation | app restrained; landing smooth scrolling/repeated reveal/hover lift is not essential | **Localized** |
| Missing visual anchors | profiles, devlogs, collab/playtest rows often text-only | **Present; high impact** |
| Primitive-assembled pages | shared Section/Row system visibly dictates page shape | **Present; high impact** |

## Missing / needed elements to introduce

- A project-reference unit used consistently in devlogs, collaboration posts, playtests, jam submissions, feed items, and notifications.
- A developer identity header that can combine person, craft, location, availability, and current build without becoming a portfolio hero.
- A current-build summary on project/dashboard surfaces.
- Domain-specific scanning patterns for opportunities, playtests, events, and publishers.
- Humanized lifecycle/status vocabulary and a status-token map.
- Real media guidance: preferred gameplay screenshot, fallback hierarchy, crop ratios, and alt-text requirements.
- A visible but evidence-based local discovery affordance when events/community data exists.

## Unnecessary elements to remove or reduce

- Uncited/synthetic landing metrics and unlabeled fake engagement.
- Smooth-scroll takeover on the landing page.
- Repeated “Looking for” labels and redundant activity sections.
- Duplicate objects across adjacent Explore modules above the fold.
- Equal persistent navigation weight for empty Level-3 areas.
- Generic hover lift/scale on landing feature cards/icons.
- Hairlines where whitespace or alignment already establishes grouping.

## Reference research: transferable lessons

The following references were reviewed from first-party product documentation, help centers, design systems, and product announcements. They are evidence for interaction and information-architecture patterns, not instructions to copy current pixels.

| Reference | First-party sources | Transferable lesson for Glyph | What not to import |
|---|---|---|---|
| LinkedIn | [Homepage IA](https://www.linkedin.com/help/linkedin/answer/a518701), [search](https://www.linkedin.com/help/linkedin/answer/a523136), [featured work](https://www.linkedin.com/help/linkedin/answer/a550399/manage-featured-samples-of-your-work-on-your-linkedin-profile) | Keep primary jobs few; let profiles lead with identity and selected evidence; make opportunity state visible. | Resume bureaucracy, engagement-heavy feed chrome, endless modules. |
| GitHub / Primer | [layout foundations](https://primer.style/product/getting-started/foundations/layout/), [navigation](https://primer.style/product/ui-patterns/navigation/), [profile pinning](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/pinning-items-to-your-profile), [motion](https://primer.style/accessibility/design-guidance/motion-and-animation/) | Separate global/local context, main content, and supporting rail; preserve parent-child paths; make motion small and purposeful. | Code-centric gray density and contribution gamification. |
| Linear | [2026 UI refresh](https://linear.app/changelog/2026-03-12-ui-refresh), [design rationale](https://linear.app/now/behind-the-latest-design-refresh), [display options](https://linear.app/docs/display-options) | Let chrome recede and use job-specific list, board, timeline, split, or full-screen views. | A wholesale dark, keyboard-first issue-tracker aesthetic. |
| Behance | [product model](https://help.behance.net/hc/en-us/articles/204483894-What-is-Behance), [search/filtering](https://help.behance.net/hc/en-us/articles/204483864-Guide-Search-Filter-Creative-Work) | Make Project the canonical authored work and show project proof in developer/search results. | Gallery monoculture, vanity counts, hover-dependent controls. |
| Dribbble | [product portfolio guidance](https://dribbble.com/resources/tips/what-to-look-for-in-a-product-design-portfolio), [designer search](https://dribbble.com/stories/2020/09/24/new-designer-search) | Pair a strong visual anchor with constraints, process, state, and outcome; show relevant work in matching flows. | Polished “shot” culture without build context. |
| itch.io | [project design](https://itch.io/docs/creators/design), [indexing](https://itch.io/docs/creators/getting-indexed), [followers/feed](https://itch.io/docs/accounts/followers) | Allow bounded project expression inside a stable shell; integrate devlogs into project and follower activity. | Unrestricted theming, noisy GIFs, and storefront-first commerce. |
| Steam | [asset rules](https://partner.steamgames.com/doc/store/assets/rules), [store description](https://partner.steamgames.com/doc/store/page/description?l=french&language=english), [tags](https://partner.steamgames.com/doc/store/tags) | Use authentic gameplay media, a clear short proposition, and taxonomy that improves retrieval. | Pricing/promotional density, review-score dominance, sales mechanics. |
| Letterboxd | [product walkthrough](https://letterboxd.com/welcome/), [FAQ](https://embed.letterboxd.com/about/faq/) | Keep a canonical object recognizable across profile, lists, and activity; separate outbound activity from inbound notifications. | Star ratings, charts, and poster-grid monoculture. |
| Are.na | [blocks](https://help.are.na/docs/getting-started/blocks), [channels](https://help.are.na/docs/getting-started/channels), [care/attribution](https://help.are.na/docs/guides/handling-blocks-with-care) | Make provenance and relationships visible; support calm, intentional curation. | Ambiguous semantics for workflows that require explicit status. |
| Discord | [mobile hierarchy](https://discord.com/blog/how-discord-made-android-in-app-navigation-easier), [mobile refinement](https://discord.com/blog/refining-discords-mobile-experience-with-your-feedback), [accessibility examples](https://discord.com/blog/discord-patch-notes-april-6-2026) | Express one primary hierarchy on mobile; adapt placement without breaking the cross-device mental model. | Channel/server sprawl, presence clutter, always-on chat density. |
| Reddit | [Discover](https://redditinc.com/news/introducing-our-discover-tab-a-new-way-to-use-reddit-and-find-more-communities), [search improvements](https://redditinc.com/news/new-on-reddit-improved-search-capabilities-and-speed-media-tab-and-more), [participation barriers](https://redditinc.com/news/modernizing-reddits-infrastructure-and-moderation-tools) | Separate discovery, feed, and typed search; explain participation requirements and unavailable states early. | Voting, karma, infinite engagement, hyperactive live indicators. |

### Transferable principles

- **GitHub/Primer:** let identity, pinned/current work, compact metadata, and activity evidence coexist; keep actions conventional and status explicit.
- **LinkedIn:** professional opportunity flows need visible state and identity-backed trust; avoid engagement-heavy profile clutter.
- **Linear:** chrome should recede, density should be intentional, and motion should explain state; avoid applying issue-tracker minimalism to expressive project storytelling.
- **Behance/Dribbble:** media creates rapid work recognition; avoid portfolio vanity metrics and image-first treatment where structured progress matters more.
- **itch.io/Steam:** keep project identity through updates and make playtest/access state explicit; avoid storefront sales pressure, review scores, and release-first framing.
- **Letterboxd/Reddit:** activity and discussion benefit from scannable repeated units; avoid karma/ranking mechanics that distort building behavior.
- **Are.na:** calm collections and visible relationships can support non-algorithmic discovery; avoid making every object an abstract tile.
- **Discord:** persistent community context and role clarity help groups; avoid server/channel complexity as Glyph’s top-level IA.

### Inappropriate to copy

- LinkedIn’s crowded engagement loops, endorsement mechanics, and recruiter theater.
- GitHub’s code/repository vocabulary or contribution gamification.
- Linear’s extreme monochrome density on public storytelling pages.
- Behance/Dribbble’s portfolio-polish bias and popularity sorting.
- itch.io/Steam storefront chrome, discounts, reviews, and ownership/library metaphors.
- Reddit voting/karma and Discord’s channel sprawl.
- Letterboxd diary ratings where project progress is not a review object.

## Clear visual direction: “the living build record”

Glyph should feel like a living editorial record of work in progress: part studio notebook, part professional project page, part local build community.

Principles:

1. **The work is the color.** Keep chrome neutral; let authentic project screenshots, covers, and creator media provide most visual energy.
2. **Every page has one subject.** A person, project, update, role, test, event, or organization should dominate composition before metadata.
3. **Relationships are visible.** Project identity follows every devlog, playtest, collaboration post, jam submission, feed item, and relevant notification.
4. **Different jobs, different rhythms.** Browse is dense/comparable; read is narrow/editorial; operate is structured/quiet; event is date-led; opportunity is requirement-led.
5. **Status is evidence.** Stage, recency, capacity, lifecycle, verification, and availability are the meaningful visual signals—never decorative scores.
6. **Locality is real or absent.** Show actual city/community context when data exists; never simulate community proof.
7. **One expressive moment per page.** A cover, current-build band, timeline, date block, or capacity meter may lead. Everything else returns to the restrained system.

## KEEP / REFINE / REWORK / REMOVE / INTRODUCE

| Item | Classification | Reason |
|---|---|---|
| Neutral app shell and semantic tokens | KEEP | calm foundation, accessible, product-appropriate |
| Project page composition | KEEP / REFINE | strongest embodiment of the model; clarify current state |
| Devlog readable measure/body | KEEP | excellent reading behavior |
| Dashboard question-based hierarchy | KEEP | maps to returning-user needs |
| Search scope and ranking explanation | KEEP | transparent and useful |
| Section/row primitives | KEEP | good baseline, not sufficient art direction |
| Profile identity/current-work composition | REWORK | current work should be part of identity |
| Explore composition | REWORK | reduce duplicate queries; add editorial prioritization |
| Collaboration list grammar | REWORK | comparison and project trust need structure |
| Playtest browse grammar | REWORK | foreground capacity/platform/focus |
| Notifications visual treatment | REFINE | preserve sentence model; add actor/object anchors |
| Landing/product visual relationship | REWORK | presently two design philosophies |
| Landing smooth scroll and generic hover lifts | REMOVE | low value, template-like |
| Unsupported/synthetic proof metrics | REMOVE or source/label | trust risk |
| Repeated generic activity/metadata blocks | REFINE/REMOVE | merge into primary objects where redundant |
| ProjectReference and DevlogMasthead compositions | INTRODUCE | make the product graph visible |
| Domain-specific browse compositions | INTRODUCE | differentiate jobs without new universal cards |
| Current-build status summary | INTRODUCE | makes “still building” immediately legible |

## Priority list

### P0

No P0 visual/UX defect was observed in the accessible public and fixture states.

### P1

1. Unify landing and product art direction; remove or label synthetic proof and source market claims.
2. Make Developer → Project → Devlog visually persistent with project media/context across downstream objects.
3. Rework Explore, Collaboration, and Playtest browse so each supports its distinct scanning decision.
4. Establish one clear visual subject/anchor per major public page.
5. Validate real authenticated core flows with actual safe test accounts before calling the experience complete.

### P2

1. Refine profile identity and remove redundant Activity treatment.
2. Improve notification differentiation and long-row scanning.
3. Humanize enum/status copy and formalize semantic status rules.
4. Reduce mobile chrome competition and make horizontal overflow discoverable.
5. Make Level-3 navigation contextual to real supply/roles.
6. Verify reduced motion, screen readers, zoom/reflow, auth errors, and focus across overlays.

### P3

1. Tune divider density and section spacing by page mode.
2. Refine 404 return context.
3. Tighten footer information architecture and remove unsupported Jobs labeling if no route exists.
4. Add subtle event-type iconography where it improves notification scanning.

## Proposed page-level direction

- **Landing:** one real end-to-end build story; fewer claims; real product screenshots; no fake engagement.
- **Explore:** editorial lead + compact action-oriented modules; de-duplicate objects.
- **Profile:** identity/current-build header, then recent build record and about.
- **Project:** keep media-first canonical page; add current-build summary.
- **Devlog:** project masthead + optional lead media + restrained article.
- **Feed:** project-centric deltas, chronological, low engagement emphasis.
- **Search:** compact utilitarian results with clear object types and highlighted matches.
- **Collaboration:** comparable role board backed by project identity.
- **Playtesting:** capacity/focus/platform board with explicit lifecycle.
- **Studios:** member work as proof; organization is a wrapper.
- **Jams:** phase/timeline/submission-led.
- **Events:** date/city/RSVP-led.
- **Publishers:** thesis/fit/proof-led and secondary until supply exists.
- **Dashboard:** operational current-build home; one next action.
- **Notifications:** actor/action/object with imagery and controlled grouping.
- **Settings:** remain quiet, direct, and form-focused.

## Dependency-ordered implementation plan

1. **Evidence cleanup:** inventory landing claims/mock metrics, real media availability, project cover quality, and authenticated test accounts. Remove or label unsupported proof.
2. **Define page modes:** document browse, read, object, operate, and event/opportunity layout rules; assign each route to one mode.
3. **Define relationship visuals:** specify ProjectReference, DeveloperIdentity, DevlogMasthead, CurrentBuildSummary, and semantic status mapping using existing tokens.
4. **Prototype three canonical pages first:** Explore, profile, and devlog. Use Emberfall Keep/Nova as real-content controls. Do not touch all routes yet.
5. **Rework domain browse surfaces:** Collaboration and Playtests first; then Events/Jams/Publishers only when representative data exists.
6. **Align landing:** reuse real canonical product compositions and remove standalone marketing-only visual language.
7. **Refine authenticated fixtures:** dashboard, feed row, notifications, and settings; then validate against real signed-in data.
8. **Responsive/accessibility pass:** 320/375/390/768/1024/1440, 200–400% zoom, keyboard, reduced motion, and screen readers.
9. **Flow validation:** execute new user, returning developer, project owner, applicant, tester, studio, event, jam, and publisher journeys; mark unavailable roles/states explicitly.
10. **Final visual QA:** compare route families side by side. Success means they are recognizably Glyph without being interchangeable.

## Release bar for the next visual pass

Do not call the visual work complete because tokens, lint, responsiveness, or route coverage pass. Call it complete only when:

- a five-second glance distinguishes Explore, Collaboration, Playtests, Event, Devlog, and Dashboard;
- a devlog unmistakably belongs to its project and developer;
- the landing looks like the product users actually enter;
- representative real imagery—not fallback initials or synthetic mock metrics—carries identity;
- core authenticated journeys have been exercised with real safe fixtures/sessions;
- every recommendation can be tied to observed content or a documented product principle.
