'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { rsvpToEvent } from '@/app/actions/events'
import { Button } from '@/components/ui/Button'
import { StatusText } from '@/components/workflow/StatusLabel'

/** Your relationship to one event: not responded → going / maybe; responded → your answer and how to change it. */
export function RsvpButton({ eventId, currentStatus, isSignedIn }: { eventId: string; currentStatus: string | null; isSignedIn: boolean }) {
  const [status, setStatus] = useState(currentStatus)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  if (!isSignedIn) {
    return <Button asChild variant="primary"><Link href="/login">Sign in to RSVP</Link></Button>
  }

  const handleRsvp = (newStatus: 'going' | 'maybe' | 'cancelled') => {
    setError('')
    startTransition(async () => {
      const result = await rsvpToEvent(eventId, newStatus)
      if (result && 'error' in result && result.error) setError(result.error)
      else setStatus(newStatus === 'cancelled' ? null : newStatus)
    })
  }

  const responded = status && status !== 'cancelled'
  return (
    <div>
      {responded ? (
        <div role="status" className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <StatusText label={status === 'going' ? "You're going" : 'You said maybe'} tone="positive" />
          {status !== 'going' && <Button size="sm" variant="secondary" onClick={() => handleRsvp('going')} disabled={pending}>I&apos;m going</Button>}
          <Button size="sm" variant="ghost" onClick={() => handleRsvp('cancelled')} loading={pending}>Cancel RSVP</Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => handleRsvp('going')} loading={pending}>I&apos;m going</Button>
          <Button variant="secondary" onClick={() => handleRsvp('maybe')} disabled={pending}>Maybe</Button>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-small text-danger">{error}</p>}
    </div>
  )
}
