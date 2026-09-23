# Settings, account lifecycle and notification patterns — research notes (Phase 10)

Sources actually retrieved this pass are linked; items marked *(prior research)* come from `docs/glyph-platform-pattern-library.md` because the page could not be fetched (Discord and LinkedIn help pages returned 403/404 to the fetch tool; their behaviour below comes from search-result summaries of those help pages).

## Account deletion
- **GitHub** — [Deleting your personal account](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-your-personal-account/deleting-your-personal-account): back up first; "GitHub cannot restore your content"; a dialog asks for your username/email **and** a shown phrase; reached from the bottom of Settings → Account. Immediate, no grace period.
- **Discord** — summarised from search of Discord's help centre: you must transfer or delete owned servers before deleting; a deleted account is anonymised ("Deleted User") while messages remain; *disable* is a separate reversible state.
- **LinkedIn** — summarised from search of LinkedIn Help: closing is reversible for ~20 days by signing back in; premium subscriptions/groups must be resolved first; data removed from production within ~24h.
- **Adopted for Glyph:** GitHub's immediate deletion with a named typed phrase; Discord/LinkedIn's *ownership gate* (resolve owned shared resources first); a plain inventory of what goes. **Not adopted:** grace period and disable (no retention/deactivation infrastructure; a half-deleted account is worse than a truthful permanent one), anonymise-and-keep (the schema cascades rather than anonymises, and keeping content after account deletion would contradict the copy).

## Notifications
- **GitHub** — [Configuring notifications](https://docs.github.com/en/subscriptions-and-notifications/get-started/configuring-notifications): two categories (participating / watching) with independent email vs web delivery per category. **Adopted:** a small number of categories; delivery channel as a separate axis, only for channels that exist (Glyph: in-product only).
- **LinkedIn / Linear / Notion** *(prior research)*: actor → action → object in one line, unread state, one-click deep link, grouping of same-object activity. **Adopted:** exactly that, with a fixed merge rule (follows, comments, reactions on the same object merge; everything else is one row).
- Batching/digests: **not adopted** — volume does not justify it and no email channel exists.

## Settings information architecture
- **GitHub** — sectioned personal settings with a persistent left rail; destructive actions at the bottom of Account. **LinkedIn** *(prior research)* — categories: Account preferences, Sign in & security, Visibility, Data privacy, Notifications. **Discord** *(prior research)* — user settings separate from per-server settings.
- **Adopted:** persistent nav; Profile (public identity) separated from Account (sign-in); Privacy = truthful visibility summary + block/mute management; object-level settings (studio, publisher, billing) stay with their objects.
- **Rejected:** Accessibility/Preferences/Data categories — no preference or export infrastructure exists, so they would be empty pages; Advertising — no ads.
