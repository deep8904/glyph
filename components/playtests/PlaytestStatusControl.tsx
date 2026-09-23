'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setPlaytestOpen } from '@/app/actions/playtests'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogClose, DialogContent, DialogFooter } from '@/components/ui/Dialog'

/** Developer's control to stop taking requests, or to open them again. Testers already accepted keep their access. */
export function PlaytestStatusControl({ requestId, status }: { requestId: string; status: 'open' | 'full' | 'closed' }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(false)
  const closing = status !== 'closed'

  const apply = () => {
    setError('')
    startTransition(async () => {
      const result = await setPlaytestOpen(requestId, !closing)
      if (result?.error) { setError(result.error); setConfirm(false) }
      else { setConfirm(false); router.refresh() }
    })
  }

  return (
    <div>
      <Button variant="secondary" onClick={closing ? () => setConfirm(true) : apply} loading={pending && !confirm}>{closing ? 'Close requests' : 'Reopen requests'}</Button>
      {error && <p role="alert" className="mt-2 text-small text-danger">{error}</p>}
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent title="Stop taking requests?" description="Testers you already accepted keep their access and can still send feedback. You can reopen requests later.">
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
            <Button variant="primary" onClick={apply} loading={pending}>Close requests</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
