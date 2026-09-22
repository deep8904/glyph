'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from '@/components/ui/Dialog'
import { createClient } from '@/lib/supabase/client'
import { FormStatus } from './FormStatus'

/** Ends every other session for this account. This browser stays signed in. Confirmed in a Dialog because other devices lose access immediately. */
export function SignOutOthers() {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const run = async () => {
    setBusy(true); setError('')
    const { error: e } = await createClient().auth.signOut({ scope: 'others' })
    setBusy(false)
    if (e) { setError('Could not sign out other devices. Nothing was changed.'); return }
    setOpen(false)
    setNotice('Every other browser and device was signed out. This one stays signed in.')
  }

  return (
    <div>
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) { setError(''); setNotice('') } }}>
        <DialogTrigger asChild><Button variant="secondary">Sign out other devices</Button></DialogTrigger>
        <DialogContent title="Sign out other devices?" description="Every other browser and device signed in to this account will be signed out now. They can sign in again with your credentials. You stay signed in here.">
          <FormStatus error={error} />
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost" disabled={busy}>Cancel</Button></DialogClose>
            <Button variant="danger" onClick={run} loading={busy}>Sign out other devices</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <FormStatus notice={notice} className="mt-3 min-h-5" />
    </div>
  )
}
