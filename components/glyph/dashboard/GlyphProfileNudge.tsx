import Link from 'next/link'

/**
 * A quiet, factual nudge — only the fields actually empty, never a completion percentage or a
 * fabricated "profile strength" score. One line, not a card, so it doesn't compete with the
 * decision above it.
 */
export function GlyphProfileNudge({ missingFields }: { missingFields: string[] }) {
  if (missingFields.length === 0) return null
  return (
    <p className="text-small text-ink-3">
      Profile missing {missingFields.join(', ')} —{' '}
      <Link href="/settings/profile" className="inline-flex min-h-11 items-center font-medium text-ink-2 underline-offset-4 outline-none hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">finish it</Link>.
    </p>
  )
}
