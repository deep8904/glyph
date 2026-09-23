import { notFound } from 'next/navigation'
import { ShellFrame } from '@/components/shell/Shell'

export const metadata = { title: 'Shell (signed-in fixture) — Glyph', robots: { index: false, follow: false } }

/**
 * Development-only fixture: renders the shell as a signed-in user WITHOUT authentication, so the
 * signed-in chrome (rail, Create/Me menus, bottom bar, unread badge) can be inspected where a real
 * sign-in is not possible. The user below is a labelled fixture, not product data. 404 in production.
 */
export default function ShellFixture() {
  if (process.env.NODE_ENV === 'production') notFound()
  return (
    <ShellFrame
      user={{
        displayName: 'Fixture User',
        username: 'fixture-user',
        email: 'fixture@example.invalid',
        nav: { isAdmin: true, hasPublisherAccount: true, hasStudio: true, hasPublisherContacts: true, unreadNotifications: 3 },
      }}
      headerLabel="Fixture"
      breadcrumb={[{ label: 'Fixture User', href: '/design/shell' }, { label: 'Some project' }]}
    >
      <div className="max-w-2xl space-y-4">
        <h1 className="text-h1 font-semibold">Signed-in shell fixture</h1>
        <p className="text-small text-fg-secondary">Development only. Content below is filler to test scrolling and bottom-bar clearance.</p>
        {Array.from({ length: 24 }, (_, i) => (
          <p key={i} className="border-b border-line-subtle py-2 text-body text-fg-secondary">Filler row {i + 1}</p>
        ))}
        <a href="#end" id="end" className="inline-flex min-h-11 items-center text-link underline">Last focusable element</a>
      </div>
    </ShellFrame>
  )
}
