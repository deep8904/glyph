import { cn } from '@/lib/utils'

/**
 * Structured key/value facts for an object (project stage, engine, platforms, updated…). The
 * repository "About" analogue: compact, scannable, next to — not inside — the narrative.
 * `mono` is for technical values (versions, dates in dense lists), not for words.
 */
export function MetadataBar({
  items,
  layout = 'inline',
  className,
}: {
  items: { label: string; value: React.ReactNode; mono?: boolean }[]
  /** inline: wrapping row of pairs. stacked: label above value, for a side column. responsive: inline below lg, stacked from lg. */
  layout?: 'inline' | 'stacked' | 'responsive'
  className?: string
}) {
  const shown = items.filter((i) => i.value !== null && i.value !== undefined && i.value !== '')
  if (shown.length === 0) return null
  return (
    <dl
      className={cn(
        layout === 'inline' && 'flex flex-wrap gap-x-6 gap-y-2',
        layout === 'stacked' && 'space-y-3',
        layout === 'responsive' && 'flex flex-wrap gap-x-6 gap-y-2 lg:block lg:space-y-3',
        className
      )}
    >
      {shown.map((i) => (
        <div key={i.label} className={cn(layout === 'inline' && 'flex items-baseline gap-2', layout === 'responsive' && 'flex items-baseline gap-2 lg:block')}>
          <dt className="text-micro font-medium text-fg-muted">{i.label}</dt>
          <dd className={cn('text-small text-fg [overflow-wrap:anywhere]', i.mono && 'font-mono', layout === 'stacked' && 'mt-0.5', layout === 'responsive' && 'lg:mt-0.5')}>{i.value}</dd>
        </div>
      ))}
    </dl>
  )
}
