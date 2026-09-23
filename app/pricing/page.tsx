import Link from 'next/link'
import { Check } from 'lucide-react'
import { Shell } from '@/components/shell/Shell'
import { Button } from '@/components/ui/Button'

// Glyph is free in V1 — no payments, no tiers, no paywall visual language (PRODUCT.md).
// Stripe is present in the stack for future use only; it gates nothing today and is not
// mentioned here — this page states the real, current policy, not a roadmap.
const INCLUDED = [
  'Public developer profile',
  'Projects and devlogs, unlimited posts',
  'Playtest requests and feedback',
  'Collaboration board',
  'Events and game jams',
  'Studios',
  'Search and Explore',
  'Notifications and following',
]

export const metadata = { title: 'Pricing — Glyph' }

export default function PricingPage() {
  return (
    <Shell headerLabel="Pricing">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-display font-semibold tracking-tight text-fg">Glyph is free.</h1>
        <p className="mt-2 max-w-prose text-body text-fg-secondary">
          Every feature below is free for individual developers in this version of Glyph. There are no paid tiers, no usage limits that unlock with payment, and nothing on Glyph is held back until you upgrade.
        </p>

        <ul className="mt-8 divide-y divide-line-subtle border-y border-line-subtle">
          {INCLUDED.map((f) => (
            <li key={f} className="flex items-center gap-3 py-3 text-body text-fg">
              <Check aria-hidden strokeWidth={1.75} className="size-4 shrink-0 text-success" />
              {f}
            </li>
          ))}
        </ul>

        <p className="mt-6 max-w-prose text-small text-fg-secondary">
          If that ever changes, we&apos;ll say so plainly, ahead of time, on this same page — not with a countdown or a locked feature.
        </p>

        <Button asChild variant="primary" className="mt-6"><Link href="/signup">Create your profile</Link></Button>
      </div>
    </Shell>
  )
}
