'use client'

import { useState, useTransition } from 'react'
import { verifyPublisher } from '@/app/actions/admin'

type Pub = { id: string; company_name: string; description: string | null; website: string | null; created_at: string; username: string | null }

export function AdminPublisherVerifyClient({ publishers }: { publishers: Pub[] }) {
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const todo = publishers.filter((p) => !done.has(p.id))

  return (
    <div>
      <h1 className="mb-4 text-xl font-medium tracking-tight text-gray-900">Pending publisher verifications ({todo.length})</h1>
      {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}
      <ul className="divide-y divide-gray-100 border-y border-gray-100">
        {todo.map((p) => (
          <li key={p.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 [overflow-wrap:anywhere]">{p.company_name}{p.username && <span className="font-normal text-gray-500"> · @{p.username}</span>}</p>
              {p.description && <p className="mt-0.5 line-clamp-2 text-sm text-gray-600">{p.description}</p>}
              {p.website && <p className="mt-0.5 break-all text-xs text-gray-500">{p.website}</p>}
            </div>
            <button
              type="button"
              disabled={pending}
              aria-label={`Verify ${p.company_name}`}
              onClick={() => { setError(''); startTransition(async () => { const r = await verifyPublisher(p.id); if ('error' in r) setError(r.error); else setDone((s) => new Set([...s, p.id])) }) }}
              className="inline-flex min-h-11 items-center rounded-full bg-indigo-600 px-5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >Verify</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
