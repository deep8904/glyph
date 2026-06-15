'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Loader2, Check } from 'lucide-react'
import { applyToCollabPost } from '@/app/actions/collaboration'

export function ApplyToPostButton({
  postId,
  isSignedIn,
  hasApplied,
}: {
  postId: string
  isSignedIn: boolean
  hasApplied: boolean
}) {
  const [applied, setApplied] = useState(hasApplied)
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  if (!isSignedIn) {
    return (
      <Link href="/login" className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20">
        Sign in to apply
      </Link>
    )
  }

  if (applied) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-5 py-2.5 text-sm font-medium text-green-700">
        <Check className="h-4 w-4" /> Application sent
      </div>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5"
      >
        Apply / Reach out
      </button>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await applyToCollabPost(postId, message)
      if (result?.error) setError(result.error)
      else { setApplied(true); setOpen(false) }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-3">
      <div>
        <label className="block text-[11px] font-mono font-semibold uppercase tracking-widest text-gray-400 mb-2">
          Your message
        </label>
        <textarea
          className="w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none transition-all duration-300"
          rows={4}
          maxLength={2000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Introduce yourself, share relevant work, and explain why you'd be a great fit…"
          required
        />
        <p className="mt-1 text-right text-[11px] font-mono text-gray-400">{message.length}/2000</p>
      </div>
      {error && <p className="text-xs font-mono text-red-500">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending || !message.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 disabled:opacity-60 disabled:pointer-events-none"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Send Application
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex items-center rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all duration-300"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
