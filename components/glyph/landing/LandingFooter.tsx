import Link from 'next/link'
import { GlyphWordmark } from './LandingWordmark'

const BROWSE = [
  { href: '/explore', label: 'Explore' },
  { href: '/search', label: 'Search' },
  { href: '/collaborate', label: 'Collaborate' },
  { href: '/playtests/browse', label: 'Playtests' },
]
const MORE = [
  { href: '/jams', label: 'Jams' },
  { href: '/events', label: 'Events' },
  { href: '/publishers', label: 'Publishers' },
]

/** Landing-specific footer — real internal destinations only, no invented social links, press, or
 * partner logos. */
export function LandingFooter() {
  return (
    <footer className="border-t border-hair bg-sunken">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2">
            <GlyphWordmark />
            <p className="mt-3 max-w-xs text-small text-ink-2">Free for individual developers, for as long as you&rsquo;re still building.</p>
          </div>
          <div>
            <h2 className="text-micro font-medium uppercase tracking-[0.1em] text-ink-3">Browse</h2>
            <ul className="mt-3 space-y-1 text-small text-ink-2">
              {BROWSE.map((l) => (
                <li key={l.href}><Link href={l.href} className="inline-flex min-h-11 items-center py-1 outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-micro font-medium uppercase tracking-[0.1em] text-ink-3">More</h2>
            <ul className="mt-3 space-y-1 text-small text-ink-2">
              {MORE.map((l) => (
                <li key={l.href}><Link href={l.href} className="inline-flex min-h-11 items-center py-1 outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">{l.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-hair pt-6 font-mono text-micro uppercase tracking-[0.08em] text-ink-3">© 2026 Glyph · Built with the Phoenix, AZ indie dev community</p>
      </div>
    </footer>
  )
}
