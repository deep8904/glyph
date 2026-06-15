'use client'

import { useState, useTransition } from 'react'
import { toggleFeatureFlag } from '@/app/actions/admin'

type Flag = { id: string; key: string; enabled: boolean; description: string | null; updated_at: string }

export function FeatureFlagsClient({ flags }: { flags: Flag[] }) {
  const [isPending, startTransition] = useTransition()
  const [states, setStates] = useState<Record<string, boolean>>(
    Object.fromEntries(flags.map((f) => [f.key, f.enabled]))
  )
  const [error, setError] = useState<string | null>(null)

  function handleToggle(key: string) {
    const next = !states[key]
    setError(null)
    setStates((prev) => ({ ...prev, [key]: next }))
    startTransition(async () => {
      const result = await toggleFeatureFlag(key, next)
      if ('error' in result) {
        setStates((prev) => ({ ...prev, [key]: !next }))
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-2">
      {error && <p className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 mb-4">{error}</p>}
      {flags.length === 0 && (
        <p className="text-sm text-gray-500">No feature flags configured. Add them to the <span className="font-mono">feature_flags</span> table.</p>
      )}
      {flags.map((flag) => (
        <div key={flag.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
          <div>
            <p className="text-sm font-mono text-gray-900">{flag.key}</p>
            {flag.description && <p className="text-xs text-gray-500 mt-0.5">{flag.description}</p>}
            <p className="text-[10px] font-mono text-gray-400 mt-1">
              Updated {new Date(flag.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => handleToggle(flag.key)}
            disabled={isPending}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
              states[flag.key] ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
            role="switch"
            aria-checked={states[flag.key]}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                states[flag.key] ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  )
}
