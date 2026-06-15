'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { approveGameJam } from '@/app/actions/admin'

type PendingJam = {
  id: string
  title: string
  slug: string
  description: string
  start_at: string
  end_at: string
  created_at: string
  profiles: { username: string; display_name: string | null } | null
}

export function AdminJamApprovalClient({ jams }: { jams: PendingJam[] }) {
  const [isPending, startTransition] = useTransition()
  const [approved, setApproved] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  function handleApprove(id: string) {
    setError(null)
    startTransition(async () => {
      const result = await approveGameJam(id)
      if ('error' in result) setError(result.error)
      else setApproved((prev) => new Set([...prev, id]))
    })
  }

  const pending = jams.filter((j) => !approved.has(j.id))

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight text-gray-900 mb-6">Pending Jams ({pending.length})</h1>
      {error && <p className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</p>}
      {pending.map((jam) => (
        <div key={jam.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{jam.title}</h2>
              {jam.profiles && (
                <Link href={`/dev/${jam.profiles.username}`} className="text-xs text-indigo-500 hover:underline">
                  by {jam.profiles.display_name ?? jam.profiles.username}
                </Link>
              )}
            </div>
            <button
              onClick={() => handleApprove(jam.id)}
              disabled={isPending}
              className="flex-shrink-0 rounded-full bg-green-600 px-4 py-2 text-xs font-medium text-white hover:bg-green-700 transition disabled:opacity-50"
            >
              Approve
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap line-clamp-3">{jam.description}</p>
          <div className="flex gap-4 text-[10px] font-mono text-gray-400">
            <span>Start: {new Date(jam.start_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span>End: {new Date(jam.end_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
