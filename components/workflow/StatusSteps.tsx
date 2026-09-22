import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Step = {
  label: string
  /** done: happened. current: where things stand. todo: still ahead. ended: the path stopped here (rejected, withdrawn, closed). */
  state: 'done' | 'current' | 'todo' | 'ended'
  note?: string
}

/**
 * Where an application or a playtest sign-up stands, as a plain ordered list: what has happened, what is
 * happening now, what is next. Not a progress bar or score — every step is words, and the current one is
 * marked with aria-current="step" and read out ("done", "current", "not reached").
 */
export function StatusSteps({ steps, label }: { steps: Step[]; label: string }) {
  return (
    <ol aria-label={label} className="space-y-3">
      {steps.map((s, i) => (
        <li key={`${s.label}-${i}`} aria-current={s.state === 'current' ? 'step' : undefined} className="flex gap-3">
          <span
            aria-hidden
            className={cn(
              'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-micro font-medium',
              s.state === 'done' && 'border-success bg-success text-fg-on-accent',
              s.state === 'current' && 'border-accent bg-surface text-link',
              s.state === 'todo' && 'border-line-strong bg-surface text-fg-muted',
              s.state === 'ended' && 'border-fg-muted bg-fg-muted text-fg-on-accent'
            )}
          >
            {s.state === 'done' ? <Check strokeWidth={2.5} className="size-3" /> : s.state === 'ended' ? '–' : i + 1}
          </span>
          <div className="min-w-0">
            <p className={cn('text-body', s.state === 'current' ? 'font-semibold text-fg' : s.state === 'todo' ? 'text-fg-muted' : 'text-fg-secondary')}>
              {s.label}
              <span className="sr-only">
                {s.state === 'done' ? ' (done)' : s.state === 'current' ? ' (current step)' : s.state === 'ended' ? ' (ended here)' : ' (not reached)'}
              </span>
            </p>
            {s.note && <p className="text-small text-fg-muted">{s.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}
