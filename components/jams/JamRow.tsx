import Link from 'next/link'
import { StatusText } from '@/components/workflow/StatusLabel'
import { markdownExcerpt } from '@/lib/utils'

export const JAM_PHASE: Record<string, { label: string; tone: 'neutral' | 'positive' | 'attention' | 'negative' }> = {
  upcoming: { label: 'Upcoming', tone: 'neutral' },
  running: { label: 'Running now', tone: 'positive' },
  voting: { label: 'Voting open', tone: 'attention' },
  completed: { label: 'Finished', tone: 'negative' },
  cancelled: { label: 'Cancelled', tone: 'negative' },
}

export const fmtShort = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
export const fmtRange = (start: string, end: string) => `${fmtShort(start)} – ${fmtShort(end)}, ${new Date(end).getFullYear()}`

export type JamListRow = {
  id: string
  slug: string
  title: string
  description: string
  theme: string | null
  start_at: string
  end_at: string
  status: string
  profiles: { username: string; display_name: string | null } | null
}

/** One jam: what it is, which phase it is in (in words), when, who hosts it. The title links to the canonical jam page. Renders an <li>. */
export function JamRow({ jam }: { jam: JamListRow }) {
  const phase = JAM_PHASE[jam.status] ?? { label: jam.status, tone: 'neutral' as const }
  return (
    <li className="py-4">
      <h3 className="text-h3 font-semibold text-fg [overflow-wrap:anywhere]">
        <Link href={`/jams/${jam.slug}`} className="inline-flex min-h-11 items-center hover:text-link focus-visible:text-link sm:min-h-0">{jam.title}</Link>
      </h3>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-small text-fg-muted">
        <StatusText label={phase.label} tone={phase.tone} />
        <span>{fmtRange(jam.start_at, jam.end_at)}</span>
        {jam.profiles && <span>hosted by {jam.profiles.display_name ?? jam.profiles.username}</span>}
      </p>
      {jam.theme && <p className="mt-1 text-small text-fg-secondary"><span className="font-medium text-fg">Theme:</span> {jam.theme}</p>}
      <p className="mt-1 line-clamp-2 max-w-prose text-body text-fg-secondary">{markdownExcerpt(jam.description, 200)}</p>
    </li>
  )
}
