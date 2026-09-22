import { Badge } from '@/components/ui/Badge'

type Tone = 'neutral' | 'positive' | 'attention' | 'negative'

const TONES = { neutral: 'neutral', positive: 'success', attention: 'warning', negative: 'neutral' } as const

/**
 * Workflow state as visible text. Colour is only reinforcement — the label
 * itself always says what the state is, so nothing depends on colour alone.
 * Thin wrapper over Badge so status chips and badges are one component.
 */
export function StatusLabel({ label, tone = 'neutral', className }: { label: string; tone?: Tone; className?: string }) {
  return (
    <Badge tone={TONES[tone]} className={className}>
      {label}
    </Badge>
  )
}

export const APPLICATION_STATUS: Record<string, { label: string; tone: Tone }> = {
  pending: { label: 'Awaiting review', tone: 'attention' },
  accepted: { label: 'Accepted', tone: 'positive' },
  rejected: { label: 'Not selected', tone: 'negative' },
  withdrawn: { label: 'Withdrawn', tone: 'negative' },
}

export const SESSION_STATUS: Record<string, { label: string; tone: Tone }> = {
  requested: { label: 'Waiting for developer', tone: 'attention' },
  accepted: { label: 'Accepted', tone: 'positive' },
  completed: { label: 'Feedback submitted', tone: 'positive' },
  skipped: { label: 'Not selected', tone: 'negative' },
  withdrawn: { label: 'Withdrawn', tone: 'negative' },
}

export const POST_STATUS: Record<string, { label: string; tone: Tone }> = {
  open: { label: 'Open', tone: 'positive' },
  filled: { label: 'Filled', tone: 'neutral' },
  closed: { label: 'Closed', tone: 'negative' },
}

export const PLAYTEST_STATUS: Record<string, { label: string; tone: Tone }> = {
  open: { label: 'Taking requests', tone: 'positive' },
  full: { label: 'Full', tone: 'neutral' },
  closed: { label: 'Closed', tone: 'negative' },
}

const DOT = { neutral: 'bg-line-strong', positive: 'bg-success', attention: 'bg-warning', negative: 'bg-line-strong' } as const
const TEXT = { neutral: 'text-fg-secondary', positive: 'text-success', attention: 'text-warning', negative: 'text-fg-muted' } as const

/**
 * Quiet state marker for list rows: a small dot plus the state in words. Use `StatusLabel` (badge) only in
 * page headers; a column of badges reads as noise. The word is the state; the dot only reinforces it.
 */
export function StatusText({ label, tone = 'neutral', className }: { label: string; tone?: Tone; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-small font-medium ${TEXT[tone]} ${className ?? ''}`}>
      <span aria-hidden className={`size-1.5 rounded-full ${DOT[tone]}`} />
      {label}
    </span>
  )
}
