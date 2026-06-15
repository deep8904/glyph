'use client'

import { useState, useTransition } from 'react'
import { updateModerationStatus } from '@/app/actions/admin'
import { Badge } from '@/components/ui/Badge'

type Item = {
  id: string
  entity_type: string
  entity_id: string
  reason: string
  description: string | null
  status: string
  created_at: string
  profiles: { username: string } | null
}

export function ModerationQueueClient({ items, adminId }: { items: Item[]; adminId: string }) {
  const [isPending, startTransition] = useTransition()
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [resolutions, setResolutions] = useState<Record<string, string>>({})

  function handleAction(id: string, status: 'actioned' | 'dismissed') {
    setError(null)
    startTransition(async () => {
      const result = await updateModerationStatus(id, status, resolutions[id])
      if ('error' in result) setError(result.error)
      else setDismissed((prev) => new Set([...prev, id]))
    })
  }

  const visible = items.filter((i) => !dismissed.has(i.id))

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight text-gray-900 mb-6">Moderation Queue ({visible.length})</h1>
      {error && <p className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</p>}
      {visible.map((item) => (
        <div key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="secondary">{item.entity_type.replace(/_/g, ' ')}</Badge>
            <Badge>{item.reason}</Badge>
            <span className="text-[10px] font-mono text-gray-400 ml-auto">
              {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <p className="text-xs font-mono text-gray-400 mb-2">Entity ID: {item.entity_id}</p>
          {item.profiles && <p className="text-xs text-gray-500 mb-2">Reported by: @{item.profiles.username}</p>}
          {item.description && <p className="text-sm text-gray-700 mb-4 whitespace-pre-wrap">{item.description}</p>}
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Resolution note (optional)"
              value={resolutions[item.id] ?? ''}
              onChange={(e) => setResolutions((prev) => ({ ...prev, [item.id]: e.target.value }))}
              maxLength={1000}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs focus:border-indigo-400 focus:outline-none transition"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleAction(item.id, 'actioned')}
                disabled={isPending}
                className="rounded-full bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                Action
              </button>
              <button
                onClick={() => handleAction(item.id, 'dismissed')}
                disabled={isPending}
                className="rounded-full border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:border-gray-300 transition disabled:opacity-50"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
