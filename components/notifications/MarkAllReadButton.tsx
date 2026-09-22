'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

export function MarkAllReadButton({ recipientId }: { recipientId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handle = async () => {
    setError(''); setLoading(true)
    const { error: e } = await createClient().from('notifications').update({ read_at: new Date().toISOString() }).eq('recipient_id', recipientId).is('read_at', null)
    setLoading(false)
    if (e) setError('Could not mark notifications as read.')
    else router.refresh()
  }

  return (
    <span className="inline-flex items-center gap-3">
      <span aria-live="polite">{error && <span role="alert" className="text-micro text-danger">{error}</span>}</span>
      <Button variant="secondary" size="sm" onClick={handle} loading={loading}>Mark all as read</Button>
    </span>
  )
}
