'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Loader2, Check } from 'lucide-react'
import { rsvpToEvent } from '@/app/actions/events'

const STATUS_OPTIONS = [
  { value: 'going', label: 'Going' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'cancelled', label: 'Cancel RSVP' },
] as const

export function RsvpButton({
  eventId,
  currentStatus,
  isSignedIn,
}: {
  eventId: string
  currentStatus: string | null
  isSignedIn: boolean
}) {
  const [status, setStatus] = useState(currentStatus)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  if (!isSignedIn) {
    return (
      <Link href="/login" className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20">
        Sign in to RSVP
      </Link>
    )
  }

  const handleRsvp = (newStatus: 'going' | 'maybe' | 'cancelled') => {
    setError('')
    startTransition(async () => {
      const result = await rsvpToEvent(eventId, newStatus)
      if (result?.error) setError(result.error)
      else setStatus(newStatus === 'cancelled' ? null : newStatus)
    })
  }

  if (status && status !== 'cancelled') {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 border border-green-200">
          <Check className="h-4 w-4" />
          {status === 'going' ? "You're going" : "You said maybe"}
        </div>
        <div className="flex gap-2">
          {status !== 'going' && (
            <button onClick={() => handleRsvp('going')} disabled={pending} className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1.5 text-xs font-mono text-gray-600 hover:border-indigo-200 hover:text-indigo-600 transition-all duration-200 disabled:opacity-50">
              Going
            </button>
          )}
          <button onClick={() => handleRsvp('cancelled')} disabled={pending} className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1.5 text-xs font-mono text-gray-600 hover:border-red-200 hover:text-red-500 transition-all duration-200 disabled:opacity-50">
            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Cancel'}
          </button>
        </div>
        {error && <p className="w-full text-xs font-mono text-red-500">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button onClick={() => handleRsvp('going')} disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        RSVP — Going
      </button>
      <button onClick={() => handleRsvp('maybe')} disabled={pending} className="inline-flex items-center rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all duration-300 disabled:opacity-60 disabled:pointer-events-none">
        Maybe
      </button>
      {error && <p className="w-full text-xs font-mono text-red-500">{error}</p>}
    </div>
  )
}
