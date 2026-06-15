'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { requestPlaytestSession } from '@/app/actions/playtests'

const STATUS_LABELS: Record<string, string> = {
  requested: 'Requested — awaiting confirmation',
  accepted: 'Accepted — play and submit feedback',
  completed: 'Completed',
  skipped: 'Skipped by developer',
}

export function RequestSessionButton({
  requestId,
  currentStatus,
  isSignedIn,
}: {
  requestId: string
  currentStatus: string | null
  isSignedIn: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [localStatus, setLocalStatus] = useState(currentStatus)

  if (!isSignedIn) {
    return (
      <div className="mt-4">
        <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20">
          Sign up to be a tester
        </Link>
      </div>
    )
  }

  if (localStatus) {
    return (
      <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
        <p className="text-sm text-gray-700">{STATUS_LABELS[localStatus] ?? localStatus}</p>
        {localStatus === 'accepted' && (
          <Link href={`/playtests/${requestId}/test/new`} className="mt-3 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20">
            Submit feedback
          </Link>
        )}
      </div>
    )
  }

  const handleRequest = () => {
    setError('')
    startTransition(async () => {
      const result = await requestPlaytestSession(requestId)
      if (result?.error) {
        setError(result.error)
      } else {
        setLocalStatus('requested')
        router.refresh()
      }
    })
  }

  return (
    <div className="mt-4">
      <button
        onClick={handleRequest}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Request to test
      </button>
      {error && <p className="mt-2 text-xs font-mono text-red-500">{error}</p>}
    </div>
  )
}
