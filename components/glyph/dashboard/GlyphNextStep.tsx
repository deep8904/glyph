import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { GButton } from '@/components/glyph/ui/primitives'
import { GlyphReloadButton } from '@/components/glyph/dashboard/GlyphReloadButton'
import type { NextStep } from '@/lib/glyph/dashboardNextAction'

type Props = { status: 'ready'; step: NextStep } | { status: 'unavailable' }

/**
 * The one thing this session is for. Not a card in a grid — the dominant object on the page,
 * because everything else here is secondary to "what do I do right now." The reason line states
 * only facts already computed server-side (a real pending count, a real staleness threshold,
 * or nothing) — never an invented urgency.
 *
 * When any of the decision's dependencies failed, `status` is `'unavailable'` — the panel never
 * guesses at a next step or falls through to a lower-priority action from incomplete data. The
 * heading stays an `h1` in both branches so the page's heading hierarchy is unaffected by which
 * one renders.
 */
export function GlyphNextStep(props: Props) {
  if (props.status === 'unavailable') {
    return (
      <div role="alert" className="rounded-[20px] border border-hair bg-panel/60 px-5 py-6 sm:px-7 sm:py-7">
        <p className="text-micro font-semibold uppercase tracking-[0.08em] text-ink-3">Next</p>
        <h1 className="mt-2 text-h1 font-semibold tracking-[-0.02em] text-ink">We couldn&apos;t determine what needs doing next</h1>
        <p className="mt-1.5 text-body text-ink-2">Reload to try again.</p>
        <GlyphReloadButton />
      </div>
    )
  }

  const { step } = props
  return (
    <div className="rounded-[20px] border border-ember-line bg-ember-quiet px-5 py-6 sm:px-7 sm:py-7">
      <p className="text-micro font-semibold uppercase tracking-[0.08em] text-ember-ink/80">Next</p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-h1 font-semibold tracking-[-0.02em] text-ink [overflow-wrap:anywhere]">{step.label}</h1>
          {step.reason && <p className="mt-1.5 text-body text-ink-2">{step.reason}</p>}
        </div>
        <GButton asChild variant="ember" size="lg" className="shrink-0">
          <Link href={step.href}>
            Go <ArrowRight aria-hidden strokeWidth={1.75} className="size-4" />
          </Link>
        </GButton>
      </div>
    </div>
  )
}
