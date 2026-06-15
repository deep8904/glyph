'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Loader2, ExternalLink } from 'lucide-react'
import { castJamVote } from '@/app/actions/jams'
import { JAM_VOTE_CATEGORIES } from '@/lib/supabase/types'

type Entry = {
  id: string
  submission_url: string | null
  submission_notes: string | null
  projects: { title: string; slug: string | null; short_description: string | null } | null
  profiles: { username: string; display_name: string | null } | null
}

export function JamVoteClient({
  entries,
  existingVotes,
  userId,
}: {
  entries: Entry[]
  existingVotes: Record<string, Record<string, number>>
  userId: string
}) {
  const [votes, setVotes] = useState<Record<string, Record<string, number>>>(existingVotes)
  const [saving, setSaving] = useState<string>('')
  const [pending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleVote = (entryId: string, category: string, score: number) => {
    setVotes((prev) => ({
      ...prev,
      [entryId]: { ...(prev[entryId] ?? {}), [category]: score },
    }))
    setSaving(`${entryId}-${category}`)
    setErrors((prev) => ({ ...prev, [`${entryId}-${category}`]: '' }))

    startTransition(async () => {
      const result = await castJamVote({
        entry_id: entryId,
        category: category as 'overall' | 'innovation' | 'fun' | 'theme' | 'visuals' | 'audio',
        score,
      })
      setSaving('')
      if (result?.error) {
        setErrors((prev) => ({ ...prev, [`${entryId}-${category}`]: result.error }))
      }
    })
  }

  return (
    <div className="space-y-8">
      {entries.map((entry) => {
        const entryVotes = votes[entry.id] ?? {}
        return (
          <div key={entry.id} id={`entry-${entry.id}`} className="rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-medium tracking-tight text-gray-900">{entry.projects?.title ?? 'Untitled'}</h3>
                <p className="text-[11px] font-mono text-gray-400">by {entry.profiles?.display_name ?? entry.profiles?.username}</p>
                {entry.projects?.short_description && (
                  <p className="text-sm text-gray-500 mt-1">{entry.projects.short_description}</p>
                )}
              </div>
              {entry.submission_url && (
                <a href={entry.submission_url} target="_blank" rel="noopener noreferrer" className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 px-4 py-2 text-xs font-mono text-indigo-600 hover:bg-indigo-50 transition-colors">
                  <ExternalLink className="h-3 w-3" /> Play
                </a>
              )}
            </div>

            {entry.submission_notes && (
              <p className="text-sm text-gray-600 mb-4 bg-gray-50 rounded-xl px-4 py-3">{entry.submission_notes}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {JAM_VOTE_CATEGORIES.map((cat) => {
                const key = `${entry.id}-${cat.value}`
                const current = entryVotes[cat.value] ?? 0
                return (
                  <div key={cat.value}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-mono text-gray-500">{cat.label}</span>
                      {saving === key && <Loader2 className="h-3 w-3 animate-spin text-indigo-400" />}
                      {current > 0 && saving !== key && <span className="text-[11px] font-mono text-indigo-600 font-semibold">{current}/5</span>}
                    </div>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          disabled={pending}
                          onClick={() => handleVote(entry.id, cat.value, score)}
                          className={`flex-1 rounded-lg py-2 text-xs font-mono transition-all duration-150 ${
                            current >= score
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-400 hover:bg-indigo-100 hover:text-indigo-600'
                          } disabled:opacity-50`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                    {errors[key] && <p className="mt-1 text-[10px] font-mono text-red-500">{errors[key]}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
