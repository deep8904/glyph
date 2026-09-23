# Glyph component inventory

Status: **built** (in `components/ui`, shown at `/design`), **adopted** (used by product pages), **planned**. As of Phase A nothing is adopted except `Badge` (10 callers) and `StatusLabel` (16 callers, via Badge). Migration of pages happens phase by phase.

## Primitives (Phase A, built)
| Component | File | Variants / API | Behavior source |
|---|---|---|---|
| Button | `Button.tsx` | `variant` primary/secondary/ghost/danger/link; `size` sm/md/lg; `asChild`; `loading` (aria-busy, disabled) | Radix Slot |
| IconButton | `IconButton.tsx` | required `label` (aria-label + title); `variant` ghost/secondary | native |
| Field | `Field.tsx` | render-prop; wires `id`, `aria-describedby`, `aria-invalid`, hint, error, required | native label |
| Input / Textarea / Select | `controls.tsx` | error via `aria-invalid`; disabled/read-only styles; native select | native |
| Badge | `Badge.tsx` | `tone` neutral/accent/success/warning/danger/info/on-dark; `size` sm/md; `mono`; legacy `variant` | — |
| Avatar | `Avatar.tsx` | `size` sm–xl (no xs: initials would fall below 12px); image only if `isHttpsUrl`, else initials (`initialsOf`); decorative unless `label` | — |
| Tabs | `Tabs.tsx` | `Tabs/TabsList/TabsTrigger/TabsContent` (in-page ARIA tabs); `TabLinks` (route tabs as `<nav>` + `aria-current`) | Radix Tabs |
| Menu | `Menu.tsx` | `Menu/MenuTrigger/MenuContent/MenuItem(danger)/MenuLabel/MenuSeparator` | Radix DropdownMenu |
| Popover | `Popover.tsx` | `Popover/Trigger/Content/Close` | Radix Popover |
| Dialog / Drawer | `Dialog.tsx` | one component; `side` center/right/left/bottom; required `title`; optional `description`; `DialogFooter` | Radix Dialog |
| Toast | `Toast.tsx` | `toast(title, {description, tone})`; `<Toaster/>` in root layout | Radix Toast + zustand |
| Skeleton | `Skeleton.tsx` | `Skeleton`, `SkeletonText`, `SkeletonRow`, `LoadingRegion` (one `role=status`) | — |
| EmptyState | `EmptyState.tsx` | `kind` first-use / cleared / no-results / restricted; icon, action | — |
| ErrorState | `ErrorState.tsx` | `role=alert`; `onRetry` or `retryHref`; `inline` | — |
| MetadataBar | `MetadataBar.tsx` | `layout` inline/stacked; per-item `mono`; drops empty values | — |
| SectionHeader | `SectionHeader.tsx` | title + optional real count + action | — |

## Shell (Phase B, built and adopted)
`Shell`/`ShellFrame`, `ShellNav` (`Rail`, `BottomBar`, Create/Me menus and sheets), `ContextBar`, `FocusedShell` — see `glyph-shell-architecture.md`. `AppShell`, `DiscoveryFrame`, `PageShell` are now thin wrappers over `Shell`; identity props on `AppShell` are deprecated and ignored.

## Domain components — Phase C (built and adopted)
| Component | File | Variants |
|---|---|---|
| ProfileHeader | `components/profile/ProfileHeader.tsx` | owner / signed-in visitor / signed-out (action cluster only) |
| ProjectRow | `components/project/ProjectRow.tsx` | `feature`, `compact` |
| DevlogRow | `components/devlog/DevlogRow.tsx` | `list` (+ optional owner action), `timeline` (drafts, edit link) |
| CommentThread | `components/devlog/CommentThread.tsx` | signed-in / signed-out / empty / load-failed; collapsible threads |
| Section | `components/ui/Section.tsx` | hairline + `SectionHeader` |
| MetadataBar | (Phase A) | `layout` inline / stacked / responsive (added) |
| BlockMuteButtons, FollowButton, FeaturedToggleButton, ReactionsBar | existing files | restyled on primitives; logic unchanged |

## Domain components — Phase D (built and adopted)
| Component | File | Variants |
|---|---|---|
| ProjectRow | `components/project/ProjectRow.tsx` | `feature`, `compact`, `listing` (discovery/search/studio) |
| DevlogRow | `components/devlog/DevlogRow.tsx` | `list`, `timeline`, `feed`, `listing` (+ adapters `fromFeedRow`, `fromDiscoveryRow`) |
| DeveloperRow | `components/developer/DeveloperRow.tsx` | `listing`, `compact` |
| FilterLinks | `components/discovery/FilterLinks.tsx` | URL-driven chips (`aria-current`) |
| DashboardView / EventRow | `components/dashboard/` | six-question layout; row for pending/happened items |

## Domain components — Phase E (built and adopted)
| Component | File | Notes |
|---|---|---|
| CollaborationListing | `components/collaborate/CollaborationListing.tsx` | `board` (eyebrow → role · project → excerpt → arrangement → poster · posted), `mine` (state + next step) |
| PlaytestListing | `components/playtests/PlaytestListing.tsx` | `board` (game → developer · time → what to test → build · platforms · places left → focus), `mine` |
| StatusText | `components/workflow/StatusLabel.tsx` | list-row state marker; `StatusLabel` (badge) for headers only |
| StatusSteps | `components/workflow/StatusSteps.tsx` | application progress and tester journey (ordered list, `aria-current="step"`) |
| DeveloperPlaytests / TesterPlaytests | `components/playtests/PlaytestsViews.tsx` | the two sides of `/dashboard/playtests` |

## Domain components — Phase F (built and adopted)
| Component | File | Notes |
|---|---|---|
| ObjectHeader | `components/object/ObjectHeader.tsx` | eyebrow · title · state · byline; used by Studio, Jam, Event, Publisher (not a page abstraction) |
| MemberRow | `components/studios/MemberRow.tsx` | one developer on a studio's team, role text |
| JamRow (+ `JAM_PHASE`) | `components/jams/JamRow.tsx` | phase in words, dates, host |
| EventRow | `components/events/EventRow.tsx` | kind → title → when → where → going |
| PublisherRow | `components/publisher/PublisherRow.tsx` | identity only |
| DemoSlotRequest | `components/events/DemoSlotRequest.tsx` | offer an existing project for a demo |

## Settings and notifications — Phase G
| Component | File | Notes |
|---|---|---|
| SettingsNav | `components/settings/SettingsNav.tsx` | six items, `aria-current`, delete set apart |
| SettingsHeading / SettingsSection | `components/settings/SettingsSection.tsx` | hairline sections, no cards |
| FormStatus | `components/settings/FormStatus.tsx` | always-mounted live region for action results |
| ProfileCompleteness | `components/settings/ProfileCompleteness.tsx` | names empty fields, no score |
| AccountEmailForm / PasswordForm / SignOutOthers | `components/settings/` | Account and Security |
| PrivacyRules / RelationshipList | `components/settings/` | control vs fixed; block/mute undo |
| NotificationPreferencesForm | `components/settings/` | families = `notification_category()` |
| DeleteAccountFlow | `components/settings/` | page explanation → Dialog → result |
| NotificationsView | `components/notifications/NotificationsView.tsx` | pure view; every state fixture-renderable |

## Domain components (still planned)
| Component | Replaces (from audit) | Phase |
|---|---|---|
| ProjectRow / ProjectCard (`compact/standard/feature`) | `ProjectResult`, `CurrentProjectCard`, `CurrentWork`, `ProjectsList`, inline project markup in 4 pages | C |
| DevlogRow / DevlogCard (`feed/timeline/list`) | `DevlogRow`, `DevlogResult`, `DevlogCard`, `FeedItem`, `DevlogTimeline` | C |
| ProfileHeader (owner/visitor action layer) | `ProfileHeader`, `ProfileCard`, plasma profile header | C |
| CommentThread | `components/devlog/CommentThread.tsx` (restyle + collapse) | C |
| ActivityItem / NotificationItem | `ActivityList`, notifications page rows | D / G |
| CollaborationListing, PlaytestListing | `CollaborationCard`, playtest browse rows | E |
| ~~Global shell~~ | done in Phase B | B ✅ |

## Legacy to retire
`components/watermelon/card-split-accordian.tsx` (only `react-icons` consumer, unreferenced demo), `.bg-plasma/.bg-grain/.panel-shadow` CSS (only the landing page still uses them), `AppShell` identity props and the wrappers themselves once pages call `Shell` directly, 13 local `initials()` copies (→ `Avatar`).
