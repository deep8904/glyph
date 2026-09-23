'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/controls'
import { createClient } from '@/lib/supabase/client'
import { FormStatus } from './FormStatus'

/** Password change for accounts that have an email/password identity. The current password is checked first. */
export function PasswordForm({ email }: { email: string }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [fieldErr, setFieldErr] = useState<{ current?: string; next?: string; confirm?: string }>({})

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setNotice(''); setError(''); setFieldErr({})
    if (next.length < 8) { setFieldErr({ next: 'Use at least 8 characters.' }); return }
    if (next !== confirm) { setFieldErr({ confirm: 'The new passwords do not match.' }); return }
    setBusy(true)
    const supabase = createClient()
    const { error: reauth } = await supabase.auth.signInWithPassword({ email, password: current })
    if (reauth) { setBusy(false); setFieldErr({ current: 'That password is not correct.' }); return }
    const { error: e2 } = await supabase.auth.updateUser({ password: next })
    setBusy(false)
    if (e2) { setError('Could not update your password. Try again.'); return }
    setNotice('Password updated.')
    setCurrent(''); setNext(''); setConfirm('')
  }

  return (
    <form onSubmit={submit} className="max-w-md space-y-4">
      <Field label="Current password" error={fieldErr.current}>
        {(p) => <Input {...p} type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />}
      </Field>
      <Field label="New password" hint="At least 8 characters." error={fieldErr.next}>
        {(p) => <Input {...p} type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />}
      </Field>
      <Field label="Confirm new password" error={fieldErr.confirm}>
        {(p) => <Input {...p} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />}
      </Field>
      <FormStatus error={error} notice={notice} className="min-h-5" />
      <Button type="submit" variant="secondary" loading={busy} disabled={!current || !next || !confirm}>Update password</Button>
    </form>
  )
}
