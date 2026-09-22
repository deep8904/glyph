'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/controls'
import { createClient } from '@/lib/supabase/client'
import { FormStatus } from './FormStatus'

/** Change the sign-in email. Supabase sends a confirmation link; the address does not change until it is followed. */
export function AccountEmailForm({ currentEmail }: { currentEmail: string }) {
  const [newEmail, setNewEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setNotice(''); setError('')
    const next = newEmail.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) { setError('Enter a valid email address.'); return }
    if (next.toLowerCase() === currentEmail.toLowerCase()) { setError('That is already your email address.'); return }
    setBusy(true)
    const { error: e2 } = await createClient().auth.updateUser({ email: next })
    setBusy(false)
    if (e2) { setError('Could not start the email change. Try again.'); return }
    setNotice(`We sent a confirmation link to ${next}. Your sign-in email stays ${currentEmail} until you confirm it.`)
    setNewEmail('')
  }

  return (
    <form onSubmit={submit} className="max-w-md space-y-3">
      <Field label="New email address">
        {(p) => <Input {...p} type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} maxLength={200} autoComplete="email" />}
      </Field>
      <FormStatus error={error} notice={notice} className="min-h-5" />
      <Button type="submit" variant="secondary" loading={busy} disabled={!newEmail}>Send confirmation link</Button>
    </form>
  )
}
