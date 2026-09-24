import Link from 'next/link'
import { markdownExcerpt } from '@/lib/utils'

export const JAM_PHASE: Record<string, { label: string; tone: 'neutral' | 'positive' | 'attention' | 'negative' }> = {
  upcoming: { label: 'Upcoming', tone: 'neutral' },
  running: { label: 'Running now', tone: 'positive' },
  voting: { label: 'Voting open', tone: 'attention' },
  completed: { label: 'Finished', tone: 'negative' },
  cancelled: { label: 'Cancelled', tone: 'negative' },
}
// Phase reads visually at a glance (a coloured edge, not just text) — but the countdown text is
// always the real signal, so nothing here depends on colour alone.
const EDGE: Record<string, string> = {
  upcoming: 'border-line-strong',
  running: 'border-success',
  voting: 'border-warning',
  completed: 'border-line',
  cancelled: 'border-line',
}

export const fmtShort = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
export const fmtRange = (start: string, end: string) => `${fmtShort(start)} – ${fmtShort(end)}, ${new Date(end).getFullYear()}`

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}

/** The one line a time-boxed event needs most: how much of this phase is left, or when it happened. */
function countdown(jam: JamListRow): string {
  const { status, start_at, end_at, voting_end_at } = jam
  if (status === 'upcoming') {
    const d = daysUntil(start_at)
    return d <= 0 ? 'Starts today' : `Starts in ${d} ${d === 1 ? 'day' : 'days'}`
  }
  if (status === 'running') {
    const d = daysUntil(end_at)
    return d <= 0 ? 'Submissions close today' : `${d} ${d === 1 ? 'day' : 'days'} left to submit`
  }
  if (status === 'voting') {
    const d = daysUntil(voting_end_at)
    return d <= 0 ? 'Voting closes today' : `Voting ends in ${d} ${d === 1 ? 'day' : 'days'}`
  }
  return `Finished ${fmtShort(end_at)}`
}

export type JamListRow = {
  id: string
  slug: string
  title: string
  description: string
  theme: string | null
  start_at: string
  end_at: string
  voting_end_at: string
  status: string
  profiles: { username: string; display_name: string | null } | null
}

/** One jam: what it is, which phase it is in (edge colour + words, never colour alone), a live
 *  countdown for that phase, and who hosts it. The title links to the canonical jam page. Renders an <li>. */
export function JamRow({ jam }: { jam: JamListRow }) {
  const phase = JAM_PHASE[jam.status] ?? { label: jam.status, tone: 'neutral' as const }
  return (
    <li className={`border-l-2 py-4 pl-4 ${EDGE[jam.status] ?? 'border-line'}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <h3 className="text-h3 font-semibold text-fg [overflow-wrap:anywhere]">
          <Link href={`/jams/${jam.slug}`} className="inline-flex min-h-11 items-center hover:text-link focus-visible:text-link sm:min-h-0">{jam.title}</Link>
        </h3>
        <span className="whitespace-nowrap font-mono text-micro font-medium text-fg-secondary">{countdown(jam)}</span>
      </div>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-small text-fg-muted">
        <span className="font-medium text-fg-secondary">{phase.label}</span>
        <span>{fmtRange(jam.start_at, jam.end_at)}</span>
        {jam.profiles && <span>hosted by {jam.profiles.display_name ?? jam.profiles.username}</span>}
      </p>
      {jam.theme && <p className="mt-1 text-small text-fg-secondary"><span className="font-medium text-fg">Theme:</span> {jam.theme}</p>}
      <p className="mt-1 line-clamp-2 max-w-prose text-body text-fg-secondary">{markdownExcerpt(jam.description, 200)}</p>
    </li>
  )
}
