'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { respondStudioInvitation } from '@/app/actions/studios'
import { Button } from '@/components/ui/Button'

export function InvitationActions({ invitationId, studioName }: { invitationId: string; studioName: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const respond = (accept: boolean) => {
    setError('')
    startTransition(async () => {
      const r = await respondStudioInvitation(invitationId, accept)
      if ('error' in r) setError(r.error)
      else router.refresh()
    })
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="primary" loading={pending} onClick={() => respond(true)} aria-label={`Accept invitation to ${studioName}`}>Accept</Button>
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => respond(false)} aria-label={`Decline invitation to ${studioName}`}>Decline</Button>
      </div>
      {error && <p role="alert" className="mt-2 text-small text-danger">{error}</p>}
    </div>
  )
}
