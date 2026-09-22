import Link from 'next/link'
import { relativeTime } from '@/lib/utils'

/** One thing that happened or is waiting, as a sentence with a time. The whole row is the link. */
export function EventRow({ href, time, children }: { href: string; time: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="group flex min-h-11 items-center justify-between gap-3 py-2">
        <span className="min-w-0 text-body text-fg-secondary group-hover:text-fg [overflow-wrap:anywhere]">{children}</span>
        <time dateTime={time} className="shrink-0 text-small text-fg-muted">{relativeTime(time)}</time>
      </Link>
    </li>
  )
}
