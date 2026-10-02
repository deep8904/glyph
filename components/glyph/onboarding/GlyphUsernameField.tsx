'use client'

import * as React from 'react'
import { Check, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { normalizeUsernameInput, isValidUsernameFormat, classifyUsernameStatus, type UsernameCheckResult } from '@/lib/glyph/username'
import { runUsernameCheck } from '@/lib/glyph/usernameCheck'

/**
 * The claimed-handle field — the same `/api/profile/check-username` endpoint, the same 400ms
 * debounce, and the same staleness guard (a response is only trusted when it answers the value
 * currently on screen, via the pure `classifyUsernameStatus`). The network call itself goes through
 * `runUsernameCheck`, which fails closed: a non-2xx status, a malformed body, or a thrown network
 * error are all the same honest "couldn't check" outcome, never a false "Available." The final
 * profile insert's own unique-username constraint remains the authoritative gate regardless of what
 * this check reports. Rebuilt on Graphite & Bone tokens with real accessibility: the status is a
 * polite live region (announced once it settles, not per keystroke), the input carries
 * `aria-invalid`/`aria-describedby` when the current value can't be used, and no network request is
 * ever sent for a value that doesn't even match the format — that's a pure, local, free check.
 */
export const GlyphUsernameField = React.forwardRef<HTMLInputElement, {
  value: string
  onChange: (value: string) => void
  onValidityChange: (valid: boolean) => void
  error?: string
}>(function GlyphUsernameField({ value, onChange, onValidityChange, error: externalError }, ref) {
  const id = React.useId()
  const [resolved, setResolved] = React.useState<UsernameCheckResult | null>(null)
  const status = classifyUsernameStatus(value, resolved)
  const formatValid = isValidUsernameFormat(value)

  React.useEffect(() => {
    if (!value || !formatValid) return
    const timer = setTimeout(async () => {
      const outcome = await runUsernameCheck(() => fetch(`/api/profile/check-username?username=${encodeURIComponent(value)}`))
      if (outcome.outcome === 'available') setResolved({ value, outcome: 'available', message: 'Available' })
      else if (outcome.outcome === 'taken') setResolved({ value, outcome: 'taken', message: 'That username is taken.' })
      else setResolved({ value, outcome: 'error', message: 'Could not check availability. Try again.' })
    }, 400)
    return () => clearTimeout(timer)
  }, [value, formatValid])

  React.useEffect(() => {
    onValidityChange(status === 'available')
  }, [status, onValidityChange])

  const message =
    status === 'invalid' ? '3–30 characters: lowercase letters, numbers, and hyphens — not first or last.'
    : status === 'checking' ? 'Checking availability…'
    : status === 'idle' ? ''
    : resolved?.message ?? ''

  const isProblem = status === 'invalid' || status === 'taken' || status === 'error' || !!externalError
  const descId = `${id}-status`

  const indicator =
    status === 'checking' ? <Loader2 aria-hidden className="size-4 animate-spin text-ink-3" />
    : status === 'available' ? <Check aria-hidden className="size-4 text-gsuccess" />
    : status === 'invalid' || status === 'taken' || status === 'error' ? <X aria-hidden className="size-4 text-gdanger" />
    : null

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-small font-medium text-ink">Username</label>
      <div className="relative">
        <span aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-body text-ink-3">@</span>
        <input
          ref={ref}
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(normalizeUsernameInput(e.target.value))}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="your-handle"
          aria-invalid={isProblem ? true : undefined}
          aria-describedby={message || externalError ? descId : undefined}
          className={cn(
            'h-11 w-full rounded-[10px] border bg-panel pl-8 pr-11 font-mono text-body text-ink outline-none transition-colors placeholder:text-ink-3',
            'focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-1 focus-visible:ring-offset-paper',
            isProblem ? 'border-gdanger' : 'border-hair-strong focus-visible:border-ember'
          )}
        />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{indicator}</span>
      </div>
      <p id={descId} role="status" aria-live="polite" className={cn('font-mono text-micro', status === 'available' ? 'text-gsuccess' : isProblem ? 'text-gdanger' : 'text-ink-3')}>
        {externalError || (status === 'available' && value ? `glyph.gg/dev/${value} · ${message}` : message)}
      </p>
    </div>
  )
})
