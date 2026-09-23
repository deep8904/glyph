'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateApplicationStatus } from '@/app/actions/collaboration'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogClose, DialogContent, DialogFooter } from '@/components/ui/Dialog'

/** Accept or reject a pending application. Rejecting asks for one confirmation because the decision is final and the applicant is told. */
export function ApplicationActions({ applicationId, applicantName }: { applicationId: string; applicantName: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [confirmReject, setConfirmReject] = useState(false)

  const decide = (status: 'accepted' | 'rejected') => {
    setError('')
    startTransition(async () => {
      const result = await updateApplicationStatus(applicationId, status)
      if (result?.error) { setError(result.error); setConfirmReject(false) }
      else { setConfirmReject(false); router.refresh() }
    })
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" size="sm" onClick={() => decide('accepted')} loading={pending && !confirmReject} disabled={pending} aria-label={`Accept ${applicantName}`}>Accept</Button>
        <Button variant="secondary" size="sm" onClick={() => setConfirmReject(true)} disabled={pending} aria-label={`Reject ${applicantName}`}>Reject</Button>
      </div>
      {error && <p role="alert" className="mt-2 text-small text-danger">{error}</p>}
      <Dialog open={confirmReject} onOpenChange={setConfirmReject}>
        <DialogContent title={`Reject ${applicantName}?`} description="They will be told they were not selected. This cannot be undone.">
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
            <Button variant="danger" onClick={() => decide('rejected')} loading={pending}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
