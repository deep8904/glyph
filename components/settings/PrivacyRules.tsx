import Link from 'next/link'
import { SettingsSection } from './SettingsSection'

// Two lists, both taken from real behaviour. "You control" rows link to where the control is.
// "Set by Glyph" rows are statements: Glyph has no per-user setting for them, so no switch is shown.
const CONTROL: { label: string; text: string; href?: string; cta?: string }[] = [
  { label: 'Projects', text: 'Choose per project: public, unlisted (only people with the link) or private (only you). New projects start private.', href: '/dashboard/projects', cta: 'Your projects' },
  { label: 'Blocked people', text: 'Below. Hides you and them from each other and stops their notifications.' },
  { label: 'Muted people', text: 'Below. Keeps their work out of what you see and stops their notifications.' },
  { label: 'Notifications', text: 'Choose which kinds of activity appear in your list.', href: '/settings/notifications', cta: 'Notification settings' },
  { label: 'Playtest builds', text: 'Per playtest, you choose which testers get the build. The build link is visible only to you and the testers you accept.', href: '/dashboard/playtests', cta: 'Your playtests' },
]

const FIXED: [string, string][] = [
  ['Your profile', 'Public. Anyone, signed in or not, can open it: name, bio, location, role, links, studios and public projects. Your sign-in email is never shown.'],
  ['Devlogs', 'They follow their project. Drafts are visible only to you.'],
  ['Comments and reactions', 'Public on the devlog they are on.'],
  ['Follows', 'Who you follow and your followers are public.'],
  ['Collaboration posts', 'Public while open. Applications are visible only to you and the post owner.'],
  ['Studio membership', 'Public on the studio team page.'],
  ['Publisher messages', 'Visible only to the publisher who sent them and the developer who received them.'],
  ['Notifications', 'Visible only to you.'],
]

export function PrivacyRules() {
  return (
    <>
      <SettingsSection id="priv-control" title="What you control" className="border-t-0 pt-0">
        <dl className="divide-y divide-line-subtle border-y border-line-subtle">
          {CONTROL.map((r) => (
            <div key={r.label} className="grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[11rem_1fr]">
              <dt className="text-small font-medium text-fg">{r.label}</dt>
              <dd className="text-small text-fg-secondary">
                {r.text}
                {r.href && <> <Link href={r.href} className="text-link underline-offset-2 hover:underline">{r.cta}</Link></>}
              </dd>
            </div>
          ))}
        </dl>
      </SettingsSection>

      <SettingsSection id="priv-fixed" title="Set by Glyph" description="These have no setting. They work the same for everyone.">
        <dl className="divide-y divide-line-subtle border-y border-line-subtle">
          {FIXED.map(([k, v]) => (
            <div key={k} className="grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[11rem_1fr]">
              <dt className="text-small font-medium text-fg">{k}</dt>
              <dd className="text-small text-fg-secondary">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-small text-fg-muted">Glyph also counts page views in aggregate with Vercel Web Analytics.</p>
      </SettingsSection>
    </>
  )
}

export const BLOCK_COPY = 'Blocking hides you and them from each other in Feed, Explore, Search, studio teams and the collaboration and playtest boards. They cannot apply to your posts, sign up to your playtests, invite you to a studio or contact you as a publisher, and you receive no notifications from them. They are not told. Their public pages and direct links still open.'
export const MUTE_COPY = 'Muting keeps their work out of your Feed, Explore, Search and the boards, and stops their notifications. They can still see and interact with your public work, and are not told.'
