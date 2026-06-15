'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { verifyStudio } from '@/app/actions/admin'
import { STUDIO_SIZES } from '@/lib/supabase/types'

const SIZE_LABELS = Object.fromEntries(STUDIO_SIZES.map((s) => [s.value, s.label]))

type Studio = { id: string; slug: string; name: string; location: string | null; size: string; created_at: string }

export function AdminStudioVerifyClient({ studios }: { studios: Studio[] }) {
  const [isPending, startTransition] = useTransition()
  const [verified, setVerified] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  function handleVerify(id: string) {
    setError(null)
    startTransition(async () => {
      const result = await verifyStudio(id)
      if ('error' in result) setError(result.error)
      else setVerified((prev) => new Set([...prev, id]))
    })
  }

  const pending = studios.filter((s) => !verified.has(s.id))

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold tracking-tight text-gray-900 mb-6">Pending Studio Verifications ({pending.length})</h1>
      {error && <p className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</p>}
      {pending.map((studio) => (
        <div key={studio.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
          <div>
            <Link href={`/studios/${studio.slug}`} className="text-sm font-semibold text-indigo-600 hover:underline">{studio.name}</Link>
            <p className="text-[10px] font-mono text-gray-400 mt-0.5">
              {SIZE_LABELS[studio.size] ?? studio.size}{studio.location ? ` · ${studio.location}` : ''}
            </p>
          </div>
          <button
            onClick={() => handleVerify(studio.id)}
            disabled={isPending}
            className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 transition disabled:opacity-50"
          >
            Verify
          </button>
        </div>
      ))}
    </div>
  )
}
