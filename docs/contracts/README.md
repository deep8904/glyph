# Product contracts (extracted evidence)

Durable, non-visual facts extracted from documents deleted in the greenfield redesign — the technical/product/security/state/accessibility truth worth keeping, with all obsolete visual compositions, component prescriptions, layouts, phase plans, and style judgments removed.

**These are contracts/evidence, not design authority.** Current design authority: `DESIGN.md` + `design/NEW_GLYPH_PRODUCT_DIRECTION.md`. Current product truth: `PRODUCT.md`. Facts here predate the greenfield build — verify against live code/schema before relying (see `verification-debt.md`).

- `routes-and-visibility.md` — route inventory, visibility/lifecycle gating, App-Router 404/loading correctness.
- `authentication-permissions-privacy.md` — auth, RLS/flag gates, block/mute/privacy rules, minimal-identity read.
- `lifecycle-and-state-rules.md` — object lifecycles, empty/error state distinctions.
- `data-relationships.md` — object graph + key tables/columns.
- `loading-error-accessibility-contracts.md` — boundaries + WCAG AA contract.
- `architecture-performance-findings.md` — query discipline, feed paging, presentation-only rule.
- `verification-debt.md` — what still needs real verification.

The raw mixed documents they were extracted from have been deleted (they carried superseded rail/bottom-bar/card/layout prescriptions).
