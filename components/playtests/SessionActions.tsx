'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateSessionStatus } from '@/app/actions/playtests'
import { Button } from '@/components/ui/Button'

/** Developer's decision on a waiting tester. Capacity is enforced by the database; its message is shown if it refuses. */
export function SessionActions({ sessionId, testerName, atCapacity }: { sessionId: string; testerName: string; atCapacity: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const decide = (status: 'accepted' | 'skipped') => {
    setError('')
    startTransition(async () => {
      const result = await updateSessionStatus(sessionId, status)
      if (result?.error) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="primary" onClick={() => decide('accepted')} loading={pending} disabled={atCapacity} aria-label={`Accept ${testerName}`}>Accept</Button>
        <Button size="sm" variant="secondary" onClick={() => decide('skipped')} disabled={pending} aria-label={`Skip ${testerName}`}>Skip</Button>
      </div>
      {atCapacity && <p className="mt-1 text-small text-fg-muted">All places are taken. Skip this tester, or raise the tester limit to accept more.</p>}
      {error && <p role="alert" className="mt-2 text-small text-danger">{error}</p>}
    </div>
  )
}
