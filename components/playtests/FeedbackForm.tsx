'use client'

import { useId, useState, useTransition } from 'react'
import Link from 'next/link'
import { submitPlaytestFeedback } from '@/app/actions/playtests'
import { FEEDBACK_CATEGORIES } from '@/lib/supabase/types'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input, Textarea } from '@/components/ui/controls'

/** Structured feedback for the developer: a 1–10 rating and optional notes per area, time spent, and a privacy choice. */
export function FeedbackForm({ sessionId, requestId }: { sessionId: string; requestId: string }) {
  const uid = useId()
  const [ratings, setRatings] = useState<Record<string, number>>(Object.fromEntries(FEEDBACK_CATEGORIES.map((c) => [c.key, 5])))
  const [text, setText] = useState<Record<string, string>>({})
  const [minutes, setMinutes] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await submitPlaytestFeedback({
        sessionId,
        ratings,
        text_responses: text,
        time_spent_minutes: minutes ? Number.parseInt(minutes, 10) : null,
        is_private: isPrivate,
      })
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="divide-y divide-line-subtle border-y border-line-subtle">
        {FEEDBACK_CATEGORIES.map((cat) => (
          <fieldset key={cat.key} className="space-y-2 py-4">
            <legend className="text-body font-medium text-fg">{cat.label}</legend>
            <div className="flex items-center gap-4">
              <input
                id={`${uid}-r-${cat.key}`}
                type="range"
                min={1}
                max={10}
                value={ratings[cat.key]}
                onChange={(e) => setRatings((r) => ({ ...r, [cat.key]: Number.parseInt(e.target.value, 10) }))}
                aria-label={`${cat.label} rating, 1 poor to 10 excellent`}
                aria-valuetext={`${ratings[cat.key]} out of 10`}
                className="h-11 flex-1 accent-[var(--accent)]"
              />
              <output htmlFor={`${uid}-r-${cat.key}`} className="w-12 text-right font-mono text-small font-medium text-fg">{ratings[cat.key]}/10</output>
            </div>
            <label htmlFor={`${uid}-t-${cat.key}`} className="sr-only">Notes on {cat.label.toLowerCase()} (optional)</label>
            <Textarea id={`${uid}-t-${cat.key}`} rows={2} maxLength={2000} placeholder={`Notes on ${cat.label.toLowerCase()} (optional)`} value={text[cat.key] ?? ''} onChange={(e) => setText((r) => ({ ...r, [cat.key]: e.target.value }))} />
          </fieldset>
        ))}
      </div>

      <Field label="Time spent playing" hint="Minutes. Optional." className="max-w-40">
        {(p) => <Input {...p} type="number" min={1} max={9999} inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} />}
      </Field>

      <label htmlFor={`${uid}-private`} className="flex min-h-11 cursor-pointer items-start gap-3">
        <input id={`${uid}-private`} type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="mt-1 size-5 accent-[var(--accent)]" />
        <span className="text-body text-fg">
          Keep this feedback private
          <span className="block text-small text-fg-muted">Only you and the developer can read it. If unchecked, it may be visible to others.</span>
        </span>
      </label>

      {error && <p role="alert" className="rounded-media border border-danger-line bg-danger-subtle px-4 py-3 text-small text-danger">{error}</p>}

      <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
        <Button asChild variant="ghost"><Link href={`/playtests/${requestId}`}>Cancel</Link></Button>
        <Button type="submit" variant="primary" loading={pending}>Send feedback</Button>
      </div>
    </form>
  )
}
