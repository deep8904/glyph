import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { relativeTime } from '@/lib/utils'

/**
 * One thing waiting for a decision: WHAT (who + what happened), WHEN, and a direct ACTION.
 * A restrained accent edge marks "this wants you," not a red alert — these are normal pending
 * items, not danger states.
 */
export function AttentionItem({ href, time, actionLabel, children }: { href: string; time: string; actionLabel: string; children: React.ReactNode }) {
  return (
    <li className="border-l-2 border-accent-line py-2.5 pl-3">
      <Link href={href} className="group flex items-center justify-between gap-3">
        <span className="min-w-0 text-body text-fg [overflow-wrap:anywhere]">{children}</span>
        <span className="flex shrink-0 items-center gap-2 text-small text-fg-muted">
          <time dateTime={time}>{relativeTime(time)}</time>
          <span className="inline-flex items-center gap-1 font-medium text-link group-hover:underline">{actionLabel} <ArrowRight aria-hidden strokeWidth={1.75} className="size-3.5" /></span>
        </span>
      </Link>
    </li>
  )
}
