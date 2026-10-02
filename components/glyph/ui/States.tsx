import { AlertTriangle } from 'lucide-react'

/** New-surface empty state — quiet, gg-token, no legacy presentation. */
export function GEmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-[13px] border border-dashed border-hair-strong bg-panel/40 px-6 py-8 text-center">
      <p className="text-body font-medium text-ink">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-sm text-small text-ink-2">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

/** New-surface inline error — paired icon + label (meaning not by color alone). */
export function GErrorState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-[13px] border border-hair bg-panel px-4 py-3.5">
      <AlertTriangle aria-hidden strokeWidth={1.75} className="mt-0.5 size-4 shrink-0 text-gdanger" />
      <div>
        <p className="text-small font-medium text-ink">{title}</p>
        {description && <p className="mt-0.5 text-small text-ink-2">{description}</p>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  )
}
