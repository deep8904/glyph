# Glyph — V2 Competitor Research (Focused)

Purpose: ground V2 feature selection in how adjacent platforms actually work. Glyph's thesis: indie game devs are scattered across 7+ single-purpose tools with **no pre-launch identity layer**. This report studies the platforms Glyph competes with or borrows from, then justifies Feature 1.

---

## 1. itch.io — the closest competitor
- **Purpose / users:** marketplace + community for indie games; hobbyists → small studios.
- **Onboarding (first 5 min):** account → upload a game. Identity is a *byproduct* of having a game to sell; there is no "developer profile" first-class flow.
- **Devlogs:** a genuinely strong pattern — projects are "living pages" with an appended **Development log** section; itch explicitly encourages building an audience *during* development. ([introducing devlogs](https://itch.io/updates/introducing-devlogs))
- **Discovery:** browse/tags/jams; **554k+ games created for jams** — jams are the social engine. ([game jams](https://itch.io/jams), [devlogs feed](https://itch.io/devlogs))
- **Glyph adopts:** devlog-as-append-to-project; build-in-public framing; jams as community magnet.
- **Glyph differs:** profile/identity is the *root object*, not a game listing. You exist on Glyph before you have anything to sell.

## 2. GitHub — the identity model to emulate
- **Purpose:** code host; the profile became the de-facto developer résumé.
- **What works:** one canonical URL (`/username`), pinned work, activity history, follow graph. Onboarding is progressive — profile is usable immediately, enriches over time.
- **Glyph adopts:** clean `@username` identity, public-by-default, progressive enrichment, "one link that says everything."
- **Glyph differs:** GitHub is code-centric and invisible to non-programmers (artists, designers, composers). Glyph models **engine, role, dev-stage, collaboration availability** — the things a game team actually filters on.

## 3. GameDevFinder / Work With Indies / IndieSynergy — collaboration & jobs
- **GameDevFinder:** signup collects **skills, time commitment, game preferences, remuneration/profit-share**; a filterable profile DB across ~15 roles (programmer, artist, designer, composer, QA, playtester…). ([gamedevfinder.net](https://gamedevfinder.net/))
- **Work With Indies:** weekly digest of indie job opportunities. ([workwithindies.com](https://www.workwithindies.com/))
- **IndieSynergy / Develteam:** community + portfolio browsing to vet collaborators before contact. ([indiesynergy.com](https://indiesynergy.com/))
- **Glyph adopts:** structured role/availability/comp fields on the profile so collaboration matching is a query, not a forum thread.
- **Glyph differs:** these are *single-purpose* and disconnected from a living profile/devlog. Glyph unifies identity + collaboration so every listing links back to a real project page.

## 4. Meetup — local events & RSVP
- **Purpose:** discover/RSVP local events.
- **What works:** city-scoped discovery, RSVP, recurring groups; frictionless "find your people nearby."
- **What frustrates:** generic (not dev-aware), paywalled organizing, noisy.
- **Glyph adopts:** city-based event discovery + RSVP + demo slots, scoped to game-dev meetups/showcases/jams.

## 5. Indie Hackers / Dev.to / Reddit — build-in-public & community feed
- **Indie Hackers:** founders posting build-in-public progress; milestone/revenue framing drives accountability and following.
- **Dev.to / Reddit:** tag-based feeds, lightweight post creation, upvotes + threaded comments; low-friction posting is the key to volume.
- **Glyph adopts:** devlog feed as the community surface; tags by engine/genre; lightweight composer; follow + react.
- **Glyph differs:** content is anchored to *projects and profiles*, not anonymous threads — every post strengthens a developer's identity.

---

## Cross-cutting UX lessons (drive the build)
1. **Identity first, content second.** Every studied platform that retains users gives a durable profile; the ones that don't (itch pre-game) feel transactional.
2. **Onboarding ≤ 4 steps, mostly skippable, one decision per screen.** Required field count is the #1 drop-off lever.
3. **Real-time validation** (username availability) removes the worst onboarding dead-end.
4. **Public-by-default + a single shareable URL** is what makes a profile worth completing.
5. **Build-in-public works** when posting friction is near zero and posts accrue to *your* identity.

## Why Feature 1 = Developer Profile + Onboarding
Identity is the root object the entire platform hangs off of — collaboration matching, devlogs, events RSVP, and the feed all reference a profile. No competitor offers a game-dev-native identity (GitHub is code-only; itch is store-only; GameDevFinder is a matching silo). It delivers immediate single-user value (a shareable `@username` page on day one, no two-sided problem), and is achievable without complex infrastructure. Everything else in the roadmap is blocked on it.

## Sources
- [itch.io — Introducing devlogs](https://itch.io/updates/introducing-devlogs) · [Devlogs feed](https://itch.io/devlogs) · [Game jams](https://itch.io/jams)
- [GameDevFinder](https://gamedevfinder.net/) · [Work With Indies](https://www.workwithindies.com/) · [IndieSynergy](https://indiesynergy.com/) · [Develteam](https://www.develteam.com/)
