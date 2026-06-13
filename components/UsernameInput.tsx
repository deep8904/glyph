'use client'

import { useEffect, useState } from 'react'
import { Loader2, Check, X } from 'lucide-react'

const USERNAME_REGEX = /^[a-z0-9][a-z0-9\-]{1,28}[a-z0-9]$/

type Resolved = { value: string; outcome: 'available' | 'taken' | 'error'; message: string }

export function UsernameInput({
  value,
  onChange,
  onValidityChange,
}: {
  value: string
  onChange: (value: string) => void
  onValidityChange: (valid: boolean) => void
}) {
  const [resolved, setResolved] = useState<Resolved | null>(null)

  const formatValid = USERNAME_REGEX.test(value)
  const resolvedForCurrent = resolved?.value === value ? resolved : null

  // Derive display status during render (no synchronous setState in the effect).
  const status: 'idle' | 'invalid' | 'checking' | 'available' | 'taken' | 'error' = !value
    ? 'idle'
    : !formatValid
      ? 'invalid'
      : !resolvedForCurrent
        ? 'checking'
        : resolvedForCurrent.outcome

  // Debounced availability check — setState happens only inside the async callback.
  useEffect(() => {
    if (!value || !formatValid) return
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/profile/check-username?username=${encodeURIComponent(value)}`
        )
        const data = (await res.json()) as { available: boolean; error?: string }
        if (data.error) {
          setResolved({ value, outcome: 'error', message: data.error })
        } else if (data.available) {
          setResolved({ value, outcome: 'available', message: 'Available' })
        } else {
          setResolved({ value, outcome: 'taken', message: 'That username is taken.' })
        }
      } catch {
        setResolved({ value, outcome: 'error', message: 'Could not check availability. Try again.' })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [value, formatValid])

  // Notify the parent whenever validity changes (calling a prop, not local setState).
  useEffect(() => {
    onValidityChange(status === 'available')
  }, [status, onValidityChange])

  const message =
    status === 'invalid'
      ? '3–30 chars, lowercase letters, numbers, and hyphens only.'
      : status === 'checking'
        ? 'Checking availability…'
        : resolvedForCurrent?.message ?? ''

  const indicator = {
    idle: null,
    invalid: <X className="h-4 w-4 text-red-500" />,
    checking: <Loader2 className="h-4 w-4 animate-spin text-gray-400" />,
    available: <Check className="h-4 w-4 text-green-500" />,
    taken: <X className="h-4 w-4 text-red-500" />,
    error: <X className="h-4 w-4 text-red-500" />,
  }[status]

  const messageColor =
    status === 'available'
      ? 'text-green-600'
      : status === 'taken' || status === 'invalid' || status === 'error'
        ? 'text-red-500'
        : 'text-gray-400'

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 font-mono text-sm text-gray-400">
          @
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase().trim())}
          placeholder="your-handle"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-9 pr-11 text-sm font-mono text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all duration-300"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2">{indicator}</span>
      </div>
      {message && (
        <p className={`text-xs font-mono ${messageColor}`}>
          {status === 'available' && value ? `glyph.gg/dev/${value} · ` : ''}
          {message}
        </p>
      )}
    </div>
  )
}
