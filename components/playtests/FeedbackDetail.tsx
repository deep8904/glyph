'use client'

import { useId, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FEEDBACK_CATEGORIES } from '@/lib/supabase/types'

type Feedback = {
  ratings: Record<string, number>
  text_responses: Record<string, string>
  time_spent_minutes: number | null
  created_at: string
}

const labelOf = (key: string) => FEEDBACK_CATEGORIES.find((c) => c.key === key)?.label ?? key.replace(/_/g, ' ')

/** One tester's feedback, collapsed until the developer asks for it: ratings as words and numbers, then notes. */
export function FeedbackDetail({ feedback }: { feedback: Feedback }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const ratingEntries = Object.entries(feedback.ratings ?? {})
  const textEntries = Object.entries(feedback.text_responses ?? {}).filter(([, v]) => v?.trim())

  return (
    <div className="mt-1">
      <Button size="sm" variant="ghost" className="-ml-3" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={panelId}>
        {open ? <ChevronDown aria-hidden strokeWidth={1.75} className="size-3.5" /> : <ChevronRight aria-hidden strokeWidth={1.75} className="size-3.5" />}
        {open ? 'Hide feedback' : 'Read feedback'}
      </Button>
      <div id={panelId} hidden={!open} className="mt-2 space-y-3 border-l border-line pl-4">
        {ratingEntries.length > 0 && (
          <dl className="flex flex-wrap gap-x-6 gap-y-1">
            {ratingEntries.map(([key, value]) => (
              <div key={key} className="flex items-baseline gap-2">
                <dt className="text-small text-fg-muted">{labelOf(key)}</dt>
                <dd className="font-mono text-small font-medium text-fg">{value}/10</dd>
              </div>
            ))}
          </dl>
        )}
        {textEntries.map(([key, value]) => (
          <div key={key}>
            <h4 className="text-small font-medium text-fg-muted">{labelOf(key)}</h4>
            <p className="max-w-prose whitespace-pre-wrap text-body text-fg-secondary [overflow-wrap:anywhere]">{value}</p>
          </div>
        ))}
        {feedback.time_spent_minutes != null && <p className="text-small text-fg-muted">Time spent: {feedback.time_spent_minutes} min</p>}
        {ratingEntries.length === 0 && textEntries.length === 0 && <p className="text-small text-fg-muted">No detailed responses were left.</p>}
      </div>
    </div>
  )
}
