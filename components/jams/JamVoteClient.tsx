'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { castJamVote } from '@/app/actions/jams'
import { JAM_VOTE_CATEGORIES } from '@/lib/supabase/types'
import { Button } from '@/components/ui/Button'
import { cn, isHttpsUrl } from '@/lib/utils'

type Entry = {
  id: string
  submission_url: string | null
  submission_notes: string | null
  projects: { title: string; slug: string | null; short_description: string | null } | null
  profiles: { username: string; display_name: string | null } | null
}

/**
 * Voting: one entry per section — the project (linked to its canonical page), an optional play link (https only),
 * the entrant's notes, then a 1–5 score per category. A score saves as soon as it is chosen; the server decides
 * whether it is allowed (for example, you cannot vote for your own entry) and its message is shown next to the row.
 */
export function JamVoteClient({ entries, existingVotes }: { entries: Entry[]; existingVotes: Record<string, Record<string, number>> }) {
  const [votes, setVotes] = useState<Record<string, Record<string, number>>>(existingVotes)
  const [saving, setSaving] = useState<string>('')
  const [pending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleVote = (entryId: string, category: string, score: number) => {
    const key = `${entryId}-${category}`
    setVotes((prev) => ({ ...prev, [entryId]: { ...(prev[entryId] ?? {}), [category]: score } }))
    setSaving(key)
    setErrors((prev) => ({ ...prev, [key]: '' }))
    startTransition(async () => {
      const result = await castJamVote({ entry_id: entryId, category: category as 'overall' | 'innovation' | 'fun' | 'theme' | 'visuals' | 'audio', score })
      setSaving('')
      if (result?.error) setErrors((prev) => ({ ...prev, [key]: result.error }))
    })
  }

  return (
    <ul className="divide-y divide-line-subtle border-y border-line-subtle">
      {entries.map((entry) => {
        const entryVotes = votes[entry.id] ?? {}
        const play = isHttpsUrl(entry.submission_url) ? entry.submission_url : null
        const href = entry.profiles?.username && entry.projects?.slug ? `/p/${entry.profiles.username}/${entry.projects.slug}` : null
        return (
          <li key={entry.id} id={`entry-${entry.id}`} className="scroll-mt-20 py-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-h3 font-semibold text-fg [overflow-wrap:anywhere]">
                  {href ? <Link href={href} className="inline-flex min-h-11 items-center hover:text-link sm:min-h-0">{entry.projects?.title ?? 'Untitled'}</Link> : entry.projects?.title ?? 'Untitled'}
                </h2>
                <p className="text-small text-fg-muted">by {entry.profiles?.display_name ?? entry.profiles?.username}</p>
                {entry.projects?.short_description && <p className="mt-1 max-w-prose text-body text-fg-secondary">{entry.projects.short_description}</p>}
              </div>
              {play && (
                <Button asChild variant="secondary" size="sm" className="shrink-0">
                  <a href={play} target="_blank" rel="noopener noreferrer"><ExternalLink aria-hidden strokeWidth={1.75} className="size-3.5" /> Play<span className="sr-only"> (opens in a new tab)</span></a>
                </Button>
              )}
            </div>
            {entry.submission_notes && <p className="mt-3 max-w-prose whitespace-pre-wrap border-l border-line pl-4 text-body text-fg-secondary [overflow-wrap:anywhere]">{entry.submission_notes}</p>}

            <div className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {JAM_VOTE_CATEGORIES.map((cat) => {
                const key = `${entry.id}-${cat.value}`
                const current = entryVotes[cat.value] ?? 0
                return (
                  <div key={cat.value} role="group" aria-label={`${cat.label} for ${entry.projects?.title ?? 'this entry'}`}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-small font-medium text-fg">{cat.label}</span>
                      <span className="font-mono text-micro text-fg-muted" role="status">{saving === key ? 'Saving…' : current > 0 ? `${current}/5` : ''}</span>
                    </div>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          disabled={pending}
                          onClick={() => handleVote(entry.id, cat.value, score)}
                          aria-pressed={current === score}
                          aria-label={`${score} out of 5`}
                          className={cn(
                            'h-10 flex-1 rounded-control border font-mono text-small transition-colors duration-150 disabled:opacity-50 pointer-coarse:h-11',
                            current >= score ? 'border-accent bg-accent text-fg-on-accent' : 'border-line-strong bg-surface text-fg-secondary hover:bg-surface-muted'
                          )}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                    {errors[key] && <p role="alert" className="mt-1 text-micro text-danger">{errors[key]}</p>}
                  </div>
                )
              })}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
