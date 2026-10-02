'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GButton } from '@/components/glyph/ui/primitives'
import { GAuthField } from './GAuthField'
import { GAuthPasswordToggle } from './GAuthPasswordToggle'
import { GAuthStatus } from './GAuthStatus'
import { runResetRequest } from '@/lib/glyph/resetRequestOutcome'
import { runMutationThenSignOut, retrySignOut } from '@/lib/glyph/finalizeSignOut'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD = 8

type CheckStatus = 'checking' | 'has-session' | 'no-session' | 'error'

/**
 * Password recovery — one route, two states, distinguished by whether Supabase has already given
 * this visit a short-lived recovery session: with no session, request a link
 * (`resetPasswordForEmail`, via the pure `runResetRequest`); with one, set a new password
 * (`updateUser`) and sign out immediately after. The initial `getSession()` check itself is
 * hardened — a returned error or a thrown rejection is its own retryable state, never silently
 * folded into "no recovery session" (which would send a genuine link-holder down the wrong path).
 *
 * Setting the password and the forced sign-out that must follow it are independent: `updateUser`
 * can succeed while sign-out fails. `runMutationThenSignOut` (`lib/glyph/finalizeSignOut`) makes that
 * explicit — "Password updated" only renders once sign-out is confirmed; a sign-out failure is its
 * own honest partial-success screen with a retry that repeats only the sign-out.
 */
export function GlyphResetPasswordForm() {
  const router = useRouter()
  const supabase = createClient()

  const [checkStatus, setCheckStatus] = useState<CheckStatus>('checking')
  const [stuck, setStuck] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [newPasswordError, setNewPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [done, setDone] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const newPasswordRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  const runCheck = useCallback(() => {
    supabase.auth.getSession().then(
      ({ data, error }) => {
        if (error) { setCheckStatus('error'); return }
        setCheckStatus(data.session ? 'has-session' : 'no-session')
      },
      () => setCheckStatus('error')
    )
  }, [supabase])

  useEffect(() => { runCheck() }, [runCheck])

  const handleRetryCheck = () => {
    setCheckStatus('checking')
    runCheck()
  }

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setFormError(''); setNotice('')
    if (!EMAIL_REGEX.test(email)) { setEmailError('Enter a valid email address.'); emailRef.current?.focus(); return }
    setEmailError('')
    setLoading(true)
    try {
      const result = await runResetRequest(() => supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/reset-password` }))
      if (!result.ok) { setFormError(result.message); return }
      // Always the same confirmation, whether or not the address has an account — this must
      // never reveal which emails are registered.
      setNotice(`If ${email} has a Glyph account, a password reset link is on its way.`)
    } finally {
      setLoading(false)
    }
  }

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setFormError('')
    if (password.length < MIN_PASSWORD) { setNewPasswordError(`Password must be at least ${MIN_PASSWORD} characters.`); newPasswordRef.current?.focus(); return }
    setNewPasswordError('')
    if (password !== confirm) { setConfirmError('Passwords don’t match.'); confirmRef.current?.focus(); return }
    setConfirmError('')
    setLoading(true)
    const outcome = await runMutationThenSignOut(
      () => supabase.auth.updateUser({ password }),
      () => supabase.auth.signOut()
    )
    if (outcome.kind === 'mutation-failed') {
      setFormError('Could not update your password. The link may have expired — request a new one.')
      setLoading(false)
      return
    }
    if (outcome.kind === 'partial') {
      setStuck(true)
      setLoading(false)
      return
    }
    setDone(true)
    setLoading(false)
  }

  const handleRetrySignOut = async () => {
    if (retrying) return
    setRetrying(true)
    const outcome = await retrySignOut(() => supabase.auth.signOut())
    if (outcome.kind === 'done') {
      setStuck(false)
      setDone(true)
      setRetrying(false)
      return
    }
    setRetrying(false)
  }

  if (checkStatus === 'checking') {
    return <p role="status" className="text-body text-ink-2">Checking your link…</p>
  }

  if (checkStatus === 'error') {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-h1 font-semibold tracking-[-0.02em] text-ink">We couldn&apos;t check your link</h1>
          <p className="mt-1.5 text-body text-ink-2">This may be temporary. Try again.</p>
        </div>
        <GButton variant="ember" size="md" onClick={handleRetryCheck} className="justify-center">Try again</GButton>
      </div>
    )
  }

  if (stuck) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-h1 font-semibold tracking-[-0.02em] text-ink">Almost there</h1>
          <p className="mt-1.5 text-body text-ink-2">Your password was updated, but we couldn&apos;t finish signing you out. For your security, sign in again to continue.</p>
        </div>
        <GButton variant="ember" size="md" onClick={handleRetrySignOut} disabled={retrying} aria-busy={retrying} className="justify-center">
          {retrying ? 'Signing out…' : 'Try signing out again'}
        </GButton>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-h1 font-semibold tracking-[-0.02em] text-ink">Password updated</h1>
          <p className="mt-1.5 text-body text-ink-2">Sign in with your new password.</p>
        </div>
        <GButton variant="ember" size="md" onClick={() => router.push('/login')} className="justify-center">Go to log in</GButton>
      </div>
    )
  }

  if (checkStatus === 'has-session') {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-h1 font-semibold tracking-[-0.02em] text-ink">Choose a new password</h1>
          <p className="mt-1.5 text-body text-ink-2">At least {MIN_PASSWORD} characters.</p>
        </div>
        <form onSubmit={handleSetPassword} className="flex flex-col gap-4" noValidate>
          <GAuthField
            ref={newPasswordRef}
            label="New password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (newPasswordError) setNewPasswordError('') }}
            autoComplete="new-password"
            required
            error={newPasswordError}
            endAdornment={<GAuthPasswordToggle visible={showPassword} onToggle={() => setShowPassword((s) => !s)} />}
          />
          <GAuthField
            ref={confirmRef}
            label="Confirm new password"
            type={showPassword ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); if (confirmError) setConfirmError('') }}
            autoComplete="new-password"
            required
            error={confirmError}
          />
          {formError && <GAuthStatus error={formError} />}
          <GButton type="submit" variant="ember" size="md" disabled={loading} aria-busy={loading} className="justify-center">
            {loading ? 'Saving…' : 'Set new password'}
          </GButton>
        </form>
      </div>
    )
  }

  // No recovery session: either a direct visit, or an expired/used link — either way, the honest,
  // actionable thing is to let them request a fresh link right here, not a dead-end notice.
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h1 font-semibold tracking-[-0.02em] text-ink">Reset your password</h1>
        <p className="mt-1.5 text-body text-ink-2">Enter your email and we&apos;ll send a link to set a new one.</p>
      </div>
      <form onSubmit={handleRequest} className="flex flex-col gap-4" noValidate>
        <GAuthField
          ref={emailRef}
          label="Email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError('') }}
          autoComplete="email"
          placeholder="you@example.com"
          required
          error={emailError}
        />
        {formError && <GAuthStatus error={formError} />}
        {notice && !formError && <GAuthStatus notice={notice} />}
        <GButton type="submit" variant="ember" size="md" disabled={loading} aria-busy={loading} className="justify-center">
          {loading ? 'Sending…' : 'Send reset link'}
        </GButton>
      </form>
    </div>
  )
}
