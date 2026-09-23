import Link from 'next/link'
import { ArrowRight, Inbox } from 'lucide-react'
import { relativeTime } from '@/lib/utils'

/**
 * One thing waiting for a decision: WHAT (who + what happened), WHEN, and a direct ACTION.
 * A leading inbox glyph plus the accent edge mark "this wants you" — meaning never rests on the
 * accent colour alone (the explicit action label carries it in text too). Normal pending items,
 * not danger states.
 */
export function AttentionItem({ href, time, actionLabel, children }: { href: string; time: string; actionLabel: string; children: React.ReactNode }) {
  return (
    <li className="group/att relative">
      <Link href={href} className="group flex items-start gap-3 rounded-control border-l-2 border-accent-line py-2.5 pl-3 pr-2 transition-colors hover:bg-accent-subtle/60">
        <span aria-hidden className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-accent-hover">
          <Inbox strokeWidth={1.75} className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1 text-body text-fg [overflow-wrap:anywhere]">{children}</span>
        <span className="flex shrink-0 flex-col items-end gap-0.5 text-small text-fg-muted sm:flex-row sm:items-center sm:gap-2">
          <time dateTime={time} className="font-mono text-micro">{relativeTime(time)}</time>
          <span className="inline-flex items-center gap-1 font-medium text-link group-hover:underline">{actionLabel} <ArrowRight aria-hidden strokeWidth={1.75} className="size-3.5" /></span>
        </span>
      </Link>
    </li>
  )
}
