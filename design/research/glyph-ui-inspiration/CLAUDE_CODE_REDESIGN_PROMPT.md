# Claude Code Prompt — Audit and Redesign Glyph

Copy the prompt below into Claude Code while its working directory is the real Glyph repository.

---

You are redesigning Glyph, an indie game-developer community and product platform centered on Projects, Devlogs, discovery, profiles, collaboration, playtesting, studios, jams/events, publishers, notifications, search, settings, and onboarding.

Your objective is to audit the current product first, then implement a cohesive redesign that feels premium, editorial, developer-centric, and visually rich enough for games without becoming generic gaming/neon or generic AI/SaaS. The visual thesis is **“the living build record”: real unfinished game work presented editorially, connected to a calm professional workspace.**

## 0. Mandatory preflight — stop if the checkout is wrong

Before changing anything:

1. Print the absolute working directory.
2. Confirm this is the actual Glyph repository, not an artifact/handoff folder.
3. Read `AGENTS.md` and all nested applicable instruction files.
4. Record Git branch, HEAD, status, remotes, package manager, framework, route structure, test commands, and current uncommitted changes.
5. Locate and read product/design truth documents such as `PRODUCT.md`, existing audit/blueprint files, design-system docs, route specs, and fixture/state docs.
6. Identify the running app or start it using the repository's documented command. Do not invent a new app or mock repository if the source is absent.
7. If the working directory is wrong, the app source is absent, or the authority documents contradict the requested work: **STOP. Do not implement anything. Report the exact blocker.**
8. Preserve all unrelated user changes. Do not reset, discard, or overwrite them.

## 1. Audit before editing

Do not begin with a homepage rewrite. Build an evidence-backed baseline:

- Inventory every production route and classify it by page family: Entry, Work/Identity, Activity, Discovery, Opportunity, Temporal/Community, or Management.
- Inspect the actual rendered experience at representative widths: 375, 768, 1024, and 1440 px.
- Cover public, authenticated, owner, member, visitor, forbidden, empty, loading, error, deleted/expired, long-content, and missing-media states where the repository permits.
- Use real authenticated states or existing fixtures. Never claim a protected workflow passed if it was not accessible.
- Audit keyboard access, focus, contrast, reduced motion, semantic structure, readable text sizes, responsive recomposition, image cropping, and loading behavior.
- Trace the visible object graph `Developer / Studio → Project → Devlog / Collaboration / Playtest`, plus Jams/Events as contextual extensions.
- Find product-truth contradictions before styling. In particular, verify that pricing, upgrade, plan, billing, or paywall language matches current `PRODUCT.md` and shipped behavior.
- Identify reusable components/tokens and distinguish your edits from preexisting dirty-worktree changes.

Write the audit to an appropriate design document in the repo. Label evidence precisely: browser-observed, code-verified, fixture-only, inaccessible, 404, or not tested.

## 2. Visual direction

Use two coordinated registers on one token and accessibility system:

### Expressive public/editorial

Apply to landing, Explore, Project, Profile, and Devlog reading:

- authentic project media is the visual subject;
- strong but restrained editorial typography;
- varied composition instead of repeated equal card grids;
- explicit creator/project provenance, dates, credits, stage, and object type;
- warm neutral foundation; real game art supplies most visual color;
- motion explains continuity and relationships.

### Quiet operational

Apply to Home/Dashboard, collaboration, playtesting, notifications, search, settings, onboarding, and management:

- compact, aligned, scan-friendly structure;
- next action, owner, date, stage, and blocker are easy to find;
- use rows, timelines, tables, inspectors, and grouped lists when they fit the job;
- deliberately recompose at mobile/tablet widths;
- decoration never competes with task state.

## 3. Required cross-product primitives

Audit existing components first. Reuse or extend them where sound; do not introduce a parallel design system.

- `ProjectIdentityMarker`: durable project identity at row, card, header, and hero scales.
- `ProvenanceHeader`: linked Developer/Studio → Project → current object, plus relevant state.
- `TypedResult`: differentiated Project, Person, Devlog, Collaboration, Playtest, Studio, Jam, Event, and Publisher results.
- `LifecycleSummary`: current state/phase, owner, next action, date, blocker, and history.
- `DecisionRail`: contextual management actions beside evidence.
- `ResumptiveWork`: helps a returning developer continue meaningful work.
- `TemporalAnchor`: date/phase model for Devlogs, jams, events, and releases.
- `NotificationItem`: actor, Project, event, reason, time, unread state, and destination.
- `OverflowNavCue`: explicit access to navigation items that do not fit.

Names may adapt to the existing codebase, but the responsibilities must remain clear.

## 4. Page requirements

### Landing

Tell one product story: Build → Document → Discover → Connect → Build again. Use a real Project as the continuing proof. Include a concise hero, Project proof, Devlog reading slice, discovery, structured collaboration/playtesting, and a truthful final CTA. Do not create fake users, game art, metrics, testimonials, pricing, or activity.

### Home / Dashboard

Prioritize resumptive work and items needing action. Separate action from passive activity. Avoid a widget mosaic.

### Feed / Following

Public activity only. Each item needs author, Project identity, object type, reason, time, and content preview. Do not expose private operational requests.

### Explore and Search

Explore is visual/curated browsing. Search is exact retrieval with typed results and filters. Do not collapse them into one generic grid.

### Project / Profile / Devlog

Make this the canonical identity family. Project pages hold credible proof; Profiles foreground people through Projects; Devlogs are reading-first and always retain Developer → Project provenance.

### Collaboration

Show role, scope, stage, commitment, compensation/expectation truth, owner, lifecycle, and structured contact/request state. Do not default to an unbounded gig marketplace or open-DM-first system.

### Playtesting

Guided setup is appropriate: target build/version, audience, access, tasks, prompts, and deadline. Results emphasize evidence, themes, severity, and build context—not vanity scores.

### Studios / Jams / Events / Publishers

Studios group people and Projects. Jams/Events foreground date and phase and keep entries as Projects. Keep Publisher workflows light until repository/product evidence supports CRM depth.

### Notifications / Settings / Onboarding

Notifications inform and route; contextual screens execute. Settings are plain and trustworthy. Onboarding should get the user to one credible Project quickly, defer nonessential setup, and teach advanced features in context.

## 5. Typography, color, layout, and media

- Preserve the current typefaces unless the audit proves a change is necessary. Prefer a restrained sans system and reserve mono for technical metadata.
- Use no more than one purposeful display voice; avoid ultra-light body text.
- Use warm neutral canvases and high-contrast ink. One controlled action accent plus semantic state colors.
- Real work provides visual color; platform color communicates action and state.
- Avoid global gradients, glassmorphism, neon glow, decorative blobs, gamer HUDs, and ornamental 3D.
- Use large media selectively, consistent crop rules, captions/credits, and stable control surfaces.
- Public pages may use a broad editorial grid; operational pages may use more viewport width. Long-form reading remains at a comfortable measure.

## 6. Motion contract

Borrow Apple principles—response, continuity, brevity, precision, interruptibility, and reduced motion—not Apple's visual materials.

- 80–140 ms for direct press feedback.
- 120–180 ms for menus/popovers/tooltips.
- 180–260 ms for local state or panel changes.
- 240–360 ms for a justified shared-element transition.
- Menus originate from triggers and restore focus.
- Selected Project media may carry into detail view when technically appropriate.
- Save/read/filter state changes are local and immediate.
- No global scroll reveals, scroll-jacking, cursor followers, perpetual floating, automatic parallax, or transitions that block the next action.
- Honor `prefers-reduced-motion`; remove translation/scale/depth/blur motion and keep state understandable without animation.

Primary references:

- Apple HIG Motion: https://developer.apple.com/design/human-interface-guidelines/motion
- Designing Fluid Interfaces: https://developer.apple.com/videos/play/wwdc2018/803/
- Apple HIG Accessibility: https://developer.apple.com/design/human-interface-guidelines/accessibility
- Apple HIG Layout: https://developer.apple.com/design/human-interface-guidelines/layout
- Apple HIG Typography: https://developer.apple.com/design/human-interface-guidelines/typography
- Apple HIG Color: https://developer.apple.com/design/human-interface-guidelines/color
- Apple HIG Loading: https://developer.apple.com/design/human-interface-guidelines/loading
- Apple HIG Onboarding: https://developer.apple.com/design/human-interface-guidelines/onboarding

## 7. Inspiration sources and extraction rules

Use references as ingredients, never templates:

- Designity: https://dribbble.com/shots/26617849-Designity-Landing-Page — editorial warmth and creative-community rhythm.
- Attio Developer Platform: https://dribbble.com/shots/26762768-Attio-Developer-Platform and https://attio.com/platform/developers — developer clarity, quiet hierarchy, modular proof.
- API-as-a-Service: https://dribbble.com/shots/26636553-API-as-a-Service-SaaS-Landing-Page-for-Developer-Platforms — technical storytelling and documentation flow.
- NotifyHub: https://dribbble.com/shots/25897849-NotifyHub-Notification-Platform-Landing-Page — structured complex workflows.
- AI Developer Platform: https://dribbble.com/shots/27457391-AI-Developer-Platform-Landing-Page — user-supplied; verify visually before extracting details.
- AI Clinic: https://dribbble.com/shots/27399872-AI-Clinic-Platform-Landing-Page-Design — custom workflow motion.
- ClauseOS: https://dribbble.com/shots/27166432-ClauseOS-Dashboard-Compliance-Management-Platform — status, dates, activity, operational scan.
- Raktor: https://dribbble.com/shots/26864675-Raktor-Drone-Mission-Web-Dashboard — prioritized operational signal; do not copy HUD aesthetics.
- Linear: https://linear.app/ — compact product proof and calm application density.
- GitHub Primer: https://primer.style/product/ — accessible, responsive, reusable developer-product patterns.
- Behance search/filter: https://help.behance.net/hc/en-us/articles/204483864-Guide-Search-Filter-Creative-Work — typed creative discovery.
- Behance featured work: https://help.behance.net/hc/en-us/articles/204483974-Guide-Featured-Projects — visible curation.
- Watermelon UI: https://ui.watermelon.sh/ — implementation-oriented component inspiration.
- Landingfolio: https://www.landingfolio.com/ — landing section comparison.
- Awwwards: https://www.awwwards.com/ — art direction only; reject inaccessible or performance-heavy patterns.
- Radix accessibility: https://www.radix-ui.com/primitives/docs/overview/accessibility and React Aria: https://react-spectrum.adobe.com/react-aria/ — behavior references, not automatic dependency instructions.

For each adopted idea, record: source URL, extracted principle, target Glyph surface, required states, accessibility behavior, and what was intentionally not copied.

## 8. Hard exclusions

- No blind visual rewrite.
- No backend, schema, RLS, ranking, billing, or permissions changes unless explicitly required and separately verified.
- No fabricated data, media, metrics, reviews, or user activity.
- No collapsing editorial lifecycle, audience visibility, discovery eligibility, domain phase, and history into one status.
- No engagement-ranked feed, pay-to-rank discovery, developer ratings, uncontrolled public voting, or default AI-authored content.
- No broad component deletion before behavior and usage are traced.
- No unrelated dependency churn.
- No claim of successful testing where authentication/data/setup prevented it.

## 9. Implementation order

1. R0 — product truth and contradictions.
2. R1 — semantic tokens, typography, spacing, media, focus, and motion foundation.
3. R2 — shell and cross-product composition primitives.
4. R3 — Profile, Project, Devlog.
5. R4 — Home and Feed.
6. R5 — Explore and Search.
7. R6 — Collaboration and Playtesting.
8. R7 — Studios, Jams, Events, Publishers.
9. R8 — Notifications, Settings, Auth, Onboarding.
10. R9 — landing page, responsive recomposition, and motion polish.
11. R10 — full regression and evidence package.

At the end of each phase: run the smallest relevant automated checks, visually verify affected routes and states, inspect the diff for collateral changes, and keep the app runnable.

## 10. Definition of done

- The repository and product truth were verified before edits.
- Every production page family has a distinct job and composition.
- Project identity persists across Devlogs, Feed, Explore, Search, Collaboration, Playtests, Notifications, Jams/Events, and management views.
- Landing and app feel related but not identical.
- No fake proof or unsupported product promise was introduced.
- Responsive layouts were verified at 375/768/1024/1440.
- Keyboard, focus, contrast, reduced motion, loading, empty, error, permission, long-content, and missing-media states were tested.
- Existing tests pass; new tests cover changed behavior where appropriate.
- A final report lists changed files, route/state evidence, automated results, unresolved blockers, and before/after screenshots where permitted.
- The final Git diff contains no unrelated user changes authored by this task.

Do not call the redesign finished because it builds. Finish only when the rendered product is coherent, truthful, accessible, responsive, and verified.

