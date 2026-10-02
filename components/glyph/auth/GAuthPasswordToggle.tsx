'use client'

import { Eye, EyeOff } from 'lucide-react'

/** The password field's show/hide toggle — a 44×44 hit target regardless of its visually compact
 * icon, positioned inside the field via the caller's relative wrapper. */
export function GAuthPasswordToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? 'Hide password' : 'Show password'}
      className="absolute right-0 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center text-ink-3 outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ember"
    >
      {visible ? <EyeOff aria-hidden strokeWidth={1.75} className="size-4" /> : <Eye aria-hidden strokeWidth={1.75} className="size-4" />}
    </button>
  )
}
