'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setContactStatus } from '@/app/actions/publisher'
import { Button } from '@/components/ui/Button'

/** The developer's only controls on a contact: mark read, mark replied, archive. The message cannot be edited. */
export function ContactStatusActions({ contactId, status, publisherName }: { contactId: string; status: string; publisherName: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const set = (next: 'read' | 'replied' | 'archived') => {
    setError('')
    startTransition(async () => {
      const r = await setContactStatus(contactId, next)
      if ('error' in r) setError(r.error); else router.refresh()
    })
  }

  if (status === 'archived') return <p className="text-small text-fg-muted">Archived.</p>
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {status === 'sent' && <Button size="sm" variant="secondary" disabled={pending} onClick={() => set('read')} aria-label={`Mark message from ${publisherName} as read`}>Mark as read</Button>}
        {status !== 'replied' && <Button size="sm" variant="secondary" disabled={pending} onClick={() => set('replied')} aria-label={`Mark message from ${publisherName} as replied`}>I have replied</Button>}
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => set('archived')} aria-label={`Archive message from ${publisherName}`}>Archive</Button>
      </div>
      {error && <p role="alert" className="mt-2 text-small text-danger">{error}</p>}
    </div>
  )
}
