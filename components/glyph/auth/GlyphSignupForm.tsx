'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GButton } from '@/components/glyph/ui/primitives'
import { GAuthField } from './GAuthField'
import { GAuthPasswordToggle } from './GAuthPasswordToggle'
import { GAuthStatus } from './GAuthStatus'
import { GitHubIcon, GoogleIcon } from './ProviderIcons'
import { runMutationThenSignOut, retrySignOut } from '@/lib/glyph/finalizeSignOut'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD = 8
const RESEND_COOLDOWN = 45 // seconds

/**
 * Create an account — email/password (with a confirm field) or GitHub/Google. Preserves the exact
 * prior contract: `signUp` with `emailRedirectTo`; if confirmations are disabled and a session comes
 * back immediately, sign out and send to `/login?signup=success` rather than auto-logging in; if not,
 * show the 6-digit-code verify step (`verifyOtp`, `resend`, the same 45s cooldown), which itself signs
 * out and redirects to `/login?signup=success` on success.
 *
 * Account creation and OTP verification are each independent of the forced sign-out that must follow
 * them — either can succeed while the other fails. Both go through `finalizeSignOut`'s pure
 * orchestration: a sign-out failure (returned or thrown) is never reported as "account creation
 * failed" or "verification failed," since those already, genuinely, succeeded. Instead it's its own
 * honest partial-success screen (`stuckAfter`) with a retry that repeats only the sign-out — never
 * `signUp` or `verifyOtp` again.
 */
export function GlyphSignupForm() {
  const router = useRouter()
  const supabase = createClient()

  const [view, setView] = useState<'form' | 'verify'>('form')
  const [stuckAfter, setStuckAfter] = useState<'signup' | 'verify' | null>(null)
  const [retrying, setRetrying] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'github' | 'google' | null>(null)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [tokenError, setTokenError] = useState('')
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)
  const tokenRef = useRef<HTMLInputElement>(null)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const redirectTo = `${origin}/auth/callback`
  const anyLoading = loading || oauthLoading !== null

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  const handleOAuth = async (provider: 'github' | 'google') => {
    setFormError(''); setNotice('')
    setOauthLoading(provider)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo, ...(provider === 'google' ? { queryParams: { access_type: 'offline', prompt: 'consent' } } : {}) },
      })
      if (error) {
        setFormError(error.message)
        setOauthLoading(null)
      }
    } catch {
      setFormError('Could not start sign-up right now. Try again.')
      setOauthLoading(null)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setFormError(''); setNotice('')
    if (!EMAIL_REGEX.test(email)) { setEmailError('Enter a valid email address.'); emailRef.current?.focus(); return }
    setEmailError('')
    if (password.length < MIN_PASSWORD) { setPasswordError(`Password must be at least ${MIN_PASSWORD} characters.`); passwordRef.current?.focus(); return }
    setPasswordError('')
    if (password !== confirm) { setConfirmError('Passwords don’t match.'); confirmRef.current?.focus(); return }
    setConfirmError('')
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } })
      if (error) { setFormError(error.message); setLoading(false); return }
      if (data.session) {
        // Confirmations are disabled and Supabase auto-logged us in — the account itself is already
        // created; only the forced sign-out that must follow it can still fail.
        const outcome = await retrySignOut(() => supabase.auth.signOut())
        if (outcome.kind === 'done') {
          router.push('/login?signup=success')
          return // stay pending — navigation takes over
        }
        setStuckAfter('signup')
        setLoading(false)
        return
      }
      setCooldown(RESEND_COOLDOWN)
      setView('verify')
      setLoading(false)
    } catch {
      setFormError('Could not create your account right now. Try again.')
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setFormError(''); setNotice('')
    if (token.length < 6) { setTokenError('Enter the 6-digit code from your email.'); tokenRef.current?.focus(); return }
    setTokenError('')
    setLoading(true)
    const outcome = await runMutationThenSignOut(
      () => supabase.auth.verifyOtp({ email, token, type: 'signup' }),
      () => supabase.auth.signOut()
    )
    if (outcome.kind === 'mutation-failed') {
      setTokenError('That code is invalid or has expired. Request a new one.')
      setLoading(false)
      return
    }
    if (outcome.kind === 'partial') {
      setStuckAfter('verify')
      setLoading(false)
      return
    }
    router.push('/login?signup=success')
    // stay pending — navigation takes over
  }

  const handleRetrySignOut = async () => {
    if (retrying) return
    setRetrying(true)
    const outcome = await retrySignOut(() => supabase.auth.signOut())
    if (outcome.kind === 'done') {
      router.push('/login?signup=success')
      return // stay pending
    }
    setRetrying(false)
  }

  const handleResend = async () => {
    if (cooldown > 0 || loading) return
    setFormError(''); setNotice(''); setTokenError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirectTo } })
      if (error) { setFormError(error.message); return }
      setCooldown(RESEND_COOLDOWN)
      setNotice('A new code is on its way — check your inbox.')
    } catch {
      setFormError('Could not resend a code right now. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (stuckAfter) {
    const message = stuckAfter === 'signup'
      ? 'Your account was created, but we couldn’t finish signing you out.'
      : 'Your email was verified, but we couldn’t finish signing you out.'
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-h1 font-semibold tracking-[-0.02em] text-ink">Almost there</h1>
          <p className="mt-1.5 text-body text-ink-2">{message} For your security, sign in again to continue.</p>
        </div>
        <GButton variant="ember" size="md" onClick={handleRetrySignOut} disabled={retrying} aria-busy={retrying} className="justify-center">
          {retrying ? 'Signing out…' : 'Try signing out again'}
        </GButton>
      </div>
    )
  }

  if (view === 'verify') {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-h1 font-semibold tracking-[-0.02em] text-ink">Verify your email</h1>
          <p className="mt-1.5 text-body text-ink-2">
            We sent a 6-digit code to <span className="font-mono text-ink">{email}</span>. Enter it to finish creating your account.
          </p>
        </div>
        <form onSubmit={handleVerify} className="flex flex-col gap-4" noValidate>
          <GAuthField
            ref={tokenRef}
            label="6-digit code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={token}
            onChange={(e) => { setToken(e.target.value.replace(/\D/g, '')); if (tokenError) setTokenError('') }}
            placeholder="000000"
            autoComplete="one-time-code"
            required
            error={tokenError}
            inputClassName="text-center font-mono text-h2 tracking-[0.5em]"
          />
          {formError && <GAuthStatus error={formError} />}
          {notice && !formError && <GAuthStatus notice={notice} />}
          <GButton type="submit" variant="ember" size="md" disabled={loading} aria-busy={loading} className="justify-center">
            {loading ? 'Verifying…' : 'Verify & create account'}
          </GButton>
        </form>
        <div className="flex flex-col items-center gap-2 text-small">
          <button type="button" onClick={handleResend} disabled={loading || cooldown > 0} className="min-h-11 font-medium text-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember disabled:cursor-not-allowed disabled:text-ink-3 disabled:no-underline">
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </button>
          <button type="button" onClick={() => { setView('form'); setToken(''); setTokenError(''); setFormError(''); setNotice('') }} className="min-h-11 text-ink-2 underline-offset-4 outline-none hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-ember">
            ← Use a different email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h1 font-semibold tracking-[-0.02em] text-ink">Create your account</h1>
        <p className="mt-1.5 text-body text-ink-2">Free for individual developers. No credit card.</p>
      </div>

      <div className="flex flex-col gap-2.5">
        <GButton type="button" variant="outline" size="md" onClick={() => handleOAuth('github')} disabled={anyLoading} aria-busy={oauthLoading === 'github'} className="justify-center gap-2.5">
          <GitHubIcon className="size-4" /> {oauthLoading === 'github' ? 'Connecting…' : 'Continue with GitHub'}
        </GButton>
        <GButton type="button" variant="outline" size="md" onClick={() => handleOAuth('google')} disabled={anyLoading} aria-busy={oauthLoading === 'google'} className="justify-center gap-2.5">
          <GoogleIcon className="size-4" /> {oauthLoading === 'google' ? 'Connecting…' : 'Continue with Google'}
        </GButton>
      </div>

      <div className="flex items-center gap-3" role="separator" aria-label="or">
        <div className="h-px flex-1 bg-hair" />
        <span className="font-mono text-micro uppercase tracking-[0.08em] text-ink-3">or</span>
        <div className="h-px flex-1 bg-hair" />
      </div>

      <form onSubmit={handleSignup} className="flex flex-col gap-4" noValidate>
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
        <GAuthField
          ref={passwordRef}
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError('') }}
          autoComplete="new-password"
          description={`At least ${MIN_PASSWORD} characters.`}
          required
          error={passwordError}
          endAdornment={<GAuthPasswordToggle visible={showPassword} onToggle={() => setShowPassword((s) => !s)} />}
        />
        <GAuthField
          ref={confirmRef}
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); if (confirmError) setConfirmError('') }}
          autoComplete="new-password"
          required
          error={confirmError}
        />
        {formError && <GAuthStatus error={formError} />}
        <GButton type="submit" variant="ember" size="md" disabled={anyLoading} aria-busy={loading} className="justify-center">
          {loading ? 'Creating…' : 'Create account'}
        </GButton>
      </form>

      <p className="flex flex-wrap items-center justify-center gap-x-1.5 text-small text-ink-2">
        Already have an account?
        <Link href="/login" className="inline-flex min-h-11 items-center font-medium text-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">Log in</Link>
      </p>
    </div>
  )
}
