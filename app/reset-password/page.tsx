'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { FocusedShell } from '@/components/shell/FocusedShell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/controls'

const MIN_PASSWORD = 8

/**
 * Landing page for a password-reset email link. Supabase exchanges the link's token for a
 * short-lived recovery session before this page loads, so a new password can be set directly
 * with updateUser() — no re-authentication with the (forgotten) old password is required or
 * possible. If no recovery session is present (expired link, or a direct visit), say so plainly.
 */
export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
      setChecking(false)
    })
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < MIN_PASSWORD) { setError(`Password must be at least ${MIN_PASSWORD} characters.`); return }
    if (password !== confirm) { setError('Passwords don’t match.'); return }
    setLoading(true)
    const { error: e2 } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (e2) { setError('Could not update your password. The link may have expired — request a new one.'); return }
    setDone(true)
    await supabase.auth.signOut()
  }

  return (
    <FocusedShell>
      <div className="overflow-hidden rounded-panel border border-line bg-surface">
        <div className="px-6 py-8 text-center sm:px-8 sm:py-10 md:px-10 md:py-12">
          <div className="flex justify-center">
            <Badge tone="accent" className="mb-6"><KeyRound aria-hidden strokeWidth={1.75} className="size-3.5" /> Reset password</Badge>
          </div>

          {checking ? (
            <p role="status" className="text-small text-fg-secondary">Checking your link…</p>
          ) : done ? (
            <>
              <h1 className="mb-2 text-display font-semibold tracking-tight text-fg">Password updated.</h1>
              <p className="mb-8 text-small text-fg-secondary">Sign in with your new password.</p>
              <Button variant="primary" onClick={() => router.push('/login')} className="w-full justify-center">Go to log in</Button>
            </>
          ) : !hasSession ? (
            <>
              <h1 className="mb-2 text-display font-semibold tracking-tight text-fg">This link isn&apos;t valid.</h1>
              <p className="mb-8 text-small text-fg-secondary">It may have expired, or already been used. Request a new one from the log-in page.</p>
              <Button variant="primary" onClick={() => router.push('/login')} className="w-full justify-center">Back to log in</Button>
            </>
          ) : (
            <>
              <h1 className="mb-2 text-display font-semibold tracking-tight text-fg">Choose a new password.</h1>
              <p className="mb-8 text-small text-fg-secondary">At least {MIN_PASSWORD} characters.</p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-left">
                <Field label="New password">
                  {(p) => <Input {...p} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />}
                </Field>
                <Field label="Confirm new password">
                  {(p) => <Input {...p} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />}
                </Field>
                <Button type="submit" variant="primary" disabled={loading} loading={loading} className="w-full justify-center">
                  {loading ? 'Saving…' : 'Set new password'}
                </Button>
                {error && <p role="alert" className="text-small font-medium text-danger">{error}</p>}
              </form>
            </>
          )}
        </div>
      </div>
    </FocusedShell>
  )
}
