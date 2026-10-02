'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GButton } from '@/components/glyph/ui/primitives'
import { runMarkAllRead } from '@/lib/glyph/markAllRead'

/** Mark-all-read stays visible and retryable on failure — a returned Supabase error and a thrown
 * network rejection surface the same visible message (both branches live in the pure, unit-tested
 * `runMarkAllRead`, which never rejects), loading always resolves, and nothing reaches the console
 * unhandled. `router.refresh()` only runs after confirmed success. */
export function GlyphMarkAllReadButton({ recipientId }: { recipientId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handle = async () => {
    if (loading) return
    setError('')
    setLoading(true)
    const result = await runMarkAllRead(() =>
      createClient().from('notifications').update({ read_at: new Date().toISOString() }).eq('recipient_id', recipientId).is('read_at', null)
    )
    setLoading(false)
    if (result.ok) router.refresh()
    else setError(result.message)
  }

  return (
    <span className="inline-flex items-center gap-3">
      {error && <span role="alert" className="text-small text-gdanger">{error}</span>}
      <GButton variant="outline" size="touchSm" onClick={handle} disabled={loading} aria-busy={loading}>
        {loading ? 'Marking…' : 'Mark all as read'}
      </GButton>
    </span>
  )
}
