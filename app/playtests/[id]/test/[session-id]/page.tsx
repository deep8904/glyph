'use client'

import { useState, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ChevronLeft } from 'lucide-react'
import { submitPlaytestFeedback } from '@/app/actions/playtests'
import { FEEDBACK_CATEGORIES } from '@/lib/supabase/types'

const inputCls = 'w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all duration-300'
const labelCls = 'block text-[11px] font-mono font-semibold uppercase tracking-widest text-gray-400 mb-2'

export default function PlaytestFeedbackPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params['session-id'] as string

  const [ratings, setRatings] = useState<Record<string, number>>(
    Object.fromEntries(FEEDBACK_CATEGORIES.map((c) => [c.key, 5]))
  )
  const [textResponses, setTextResponses] = useState<Record<string, string>>({})
  const [timeSpent, setTimeSpent] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await submitPlaytestFeedback({
        sessionId,
        ratings,
        text_responses: textResponses,
        time_spent_minutes: timeSpent ? parseInt(timeSpent) : null,
        is_private: isPrivate,
      })
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="min-h-screen relative overflow-hidden font-sans">
      <div className="fixed inset-0 z-0 bg-plasma pointer-events-none" />
      <main className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 md:py-12 min-h-screen flex flex-col">
        <div className="flex-1 bg-white/95 backdrop-blur-2xl rounded-[2.5rem] panel-shadow border border-white overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 px-6 py-5 sm:px-8 border-b border-gray-100/50">
            <Link href="/playtests/browse" className="flex items-center gap-1 text-lg font-semibold tracking-tighter text-gray-900">
              Glyph<span className="text-indigo-600">°</span>
            </Link>
            <span className="text-gray-300">/</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-gray-500">Playtest Feedback</span>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 px-6 sm:px-8 py-8 space-y-8">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-gray-900 mb-1">Submit your feedback</h1>
              <p className="text-sm text-gray-500">Rate each category 1–10 and leave optional notes.</p>
            </div>

            {FEEDBACK_CATEGORIES.map((cat) => (
              <div key={cat.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className={labelCls} style={{ marginBottom: 0 }}>{cat.label}</label>
                  <span className="font-mono text-lg font-semibold text-indigo-600">{ratings[cat.key]}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={ratings[cat.key]}
                  onChange={(e) => setRatings((r) => ({ ...r, [cat.key]: parseInt(e.target.value) }))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] font-mono text-gray-300">
                  <span>1 — Poor</span><span>10 — Excellent</span>
                </div>
                <textarea
                  className={`${inputCls} resize-none text-xs font-mono`}
                  rows={2}
                  placeholder={`Optional notes on ${cat.label.toLowerCase()}…`}
                  maxLength={2000}
                  value={textResponses[cat.key] ?? ''}
                  onChange={(e) => setTextResponses((r) => ({ ...r, [cat.key]: e.target.value }))}
                />
              </div>
            ))}

            <div>
              <label className={labelCls}>Time spent (minutes)</label>
              <input
                type="number"
                min={1}
                max={9999}
                className={`${inputCls} w-32`}
                value={timeSpent}
                onChange={(e) => setTimeSpent(e.target.value)}
                placeholder="e.g. 30"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={isPrivate}
                onClick={() => setIsPrivate((p) => !p)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${isPrivate ? 'bg-indigo-600' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${isPrivate ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm text-gray-700">Keep feedback private (only visible to you and the developer)</span>
            </div>

            {error && <p className="text-xs font-mono text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-4 border-t border-gray-100">
              <Link href="/playtests/browse" className="inline-flex items-center justify-center rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all duration-300">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 disabled:opacity-60 disabled:pointer-events-none"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit Feedback
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
