import { GlyphProfileDevlogRow, type ProfileDevlogData } from '@/components/glyph/profile/GlyphProfileDevlogRow'
import { GEmptyState } from '@/components/glyph/ui/States'

/**
 * The chronological record of how this person builds — a single running list with a connecting
 * rail, not a bordered "Recent devlogs" section stacked under a separate "Featured" section.
 * Curated entries carry an inline pin marker (see GlyphProfileDevlogRow) so the curated/chronology
 * distinction survives without a second stacked section.
 */
export function GlyphWorkTimeline({ devlogs, isOwner, emptyTitle, emptyDescription, emptyAction }: {
  devlogs: ProfileDevlogData[]
  isOwner: boolean
  emptyTitle: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
}) {
  if (devlogs.length === 0) {
    return <GEmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
  }
  return (
    <ul className="border-l border-hair pl-5">
      {devlogs.map((d) => (
        <GlyphProfileDevlogRow key={d.id} devlog={d} isOwner={isOwner} />
      ))}
    </ul>
  )
}
