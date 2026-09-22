'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Gamepad2, MailCheck, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { FocusedShell } from '@/components/shell/FocusedShell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Input } from '@/components/ui/controls'
import { cn } from '@/lib/utils'

type Mode = 'login' | 'signup'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD = 8
const RESEND_COOLDOWN = 45 // seconds

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.2 3.44 9.6 8.21 11.16.6.11.82-.25.82-.56 0-.28-.01-1.02-.02-2-3.34.71-4.04-1.58-4.04-1.58-.55-1.36-1.33-1.73-1.33-1.73-1.09-.73.08-.71.08-.71 1.2.08 1.84 1.21 1.84 1.21 1.07 1.8 2.81 1.28 3.5.98.11-.76.42-1.28.76-1.57-2.67-.3-5.47-1.31-5.47-5.81 0-1.28.47-2.33 1.23-3.15-.12-.3-.53-1.51.12-3.15 0 0 1.01-.32 3.3 1.2a11.6 11.6 0 0 1 3-.4c1.02 0 2.05.13 3 .4 2.29-1.52 3.3-1.2 3.3-1.2.65 1.64.24 2.85.12 3.15.77.82 1.23 1.87 1.23 3.15 0 4.51-2.81 5.5-5.49 5.79.43.36.82 1.09.82 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.22.68.83.56A12.02 12.02 0 0 0 24 12.29C24 5.78 18.63.5 12 .5Z" />
    </svg>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  )
}

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const isSignup = mode === 'signup'

  const [view, setView] = useState<'form' | 'verify'>('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'github' | 'google' | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [cooldown, setCooldown] = useState(0)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const redirectTo = `${origin}/auth/callback`

  // Success message after returning from email signup verification (derived, no setState).
  const signupSuccess = !isSignup && searchParams.get('signup') === 'success'
  const formNotice = notice || (signupSuccess ? 'Account created. Please log in to continue.' : '')

  // Resend cooldown timer.
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  const reset = () => {
    setError('')
    setNotice('')
  }

  // ── OAuth (GitHub / Google) — same provider call signs in or signs up ──
  const handleOAuth = async (provider: 'github' | 'google') => {
    reset()
    setOauthLoading(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        ...(provider === 'google'
          ? { queryParams: { access_type: 'offline', prompt: 'consent' } }
          : {}),
      },
    })
    if (error) {
      setError(error.message)
      setOauthLoading(null)
    }
    // On success the browser is redirected to the provider.
  }

  // ── Email + password login ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    reset()
    if (!EMAIL_REGEX.test(email) || !password) {
      setError('Invalid email or password.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      // Generic — never reveal whether the email or the password was wrong.
      setError('Invalid email or password.')
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  // ── Email + password signup → send confirmation OTP ──
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    reset()
    if (!EMAIL_REGEX.test(email)) {
      setError('Enter a valid email address.')
      return
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`)
      return
    }
    if (password !== confirm) {
      setError('Passwords don’t match.')
      return
    }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    // If confirmations are disabled, signUp returns a session (auto-login).
    // We do NOT auto-login: sign out and send them to login.
    if (data.session) {
      await supabase.auth.signOut()
      router.push('/login?signup=success')
      return
    }
    setCooldown(RESEND_COOLDOWN)
    setView('verify')
  }

  // ── Verify signup OTP → create account → redirect to login (no auto-login) ──
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    reset()
    if (token.length < 6) {
      setError('Enter the 6-digit code from your email.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    })
    if (error) {
      setLoading(false)
      setError('That code is invalid or has expired. Request a new one.')
      return
    }
    // Verified — but do not keep them logged in. Clear session, go to login.
    await supabase.auth.signOut()
    router.push('/login?signup=success')
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    reset()
    setLoading(true)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: redirectTo },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setCooldown(RESEND_COOLDOWN)
    setNotice('A new code is on its way — check your inbox.')
  }

  const anyLoading = loading || oauthLoading !== null

  return (
    <FocusedShell>
      <div className="overflow-hidden rounded-panel border border-line bg-surface">
        <div className="px-6 py-8 sm:px-8 sm:py-10 md:px-10 md:py-12">
          {view === 'form' ? (
            <div className="flex flex-col text-center">
              <div className="flex justify-center">
                <Badge tone="accent" className="mb-6"><Gamepad2 aria-hidden strokeWidth={1.75} className="size-3.5" /> {isSignup ? 'New account' : 'Returning'}</Badge>
              </div>

              <h1 className="mb-2 text-display font-semibold tracking-tight text-fg">{isSignup ? 'Create your profile.' : 'Welcome back.'}</h1>
              <p className="mb-8 text-small text-fg-secondary">{isSignup ? 'Free forever. No credit card.' : 'Sign in to your home base.'}</p>

              <div className="flex flex-col gap-3">
                <Button variant="primary" onClick={() => handleOAuth('github')} disabled={anyLoading} loading={oauthLoading === 'github'} className="w-full justify-center bg-fg text-fg-on-accent hover:bg-fg/90">
                  <GitHubIcon className="size-4" /> Continue with GitHub
                </Button>
                <Button variant="secondary" onClick={() => handleOAuth('google')} disabled={anyLoading} loading={oauthLoading === 'google'} className="w-full justify-center">
                  <GoogleIcon className="size-4" /> Continue with Google
                </Button>

                <div className="my-2 flex items-center gap-4">
                  <div className="h-px flex-1 bg-line" />
                  <span className="text-micro font-medium uppercase tracking-wide text-fg-muted">or</span>
                  <div className="h-px flex-1 bg-line" />
                </div>

                <form onSubmit={isSignup ? handleSignup : handleLogin} className="flex flex-col gap-3 text-left">
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" autoComplete="email" />
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isSignup ? 'Create a password' : 'Password'}
                      autoComplete={isSignup ? 'new-password' : 'current-password'}
                      className="pr-11"
                    />
                    <IconButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword((s) => !s)}
                      label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff aria-hidden strokeWidth={1.75} className="size-4" /> : <Eye aria-hidden strokeWidth={1.75} className="size-4" />}
                    </IconButton>
                  </div>
                  {isSignup && (
                    <Input type={showPassword ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" autoComplete="new-password" />
                  )}
                  <Button type="submit" variant="primary" disabled={anyLoading} loading={loading} className="w-full justify-center">
                    {loading ? (isSignup ? 'Creating…' : 'Signing in…') : isSignup ? 'Create account' : 'Sign in'}
                  </Button>
                </form>

                {error && <p role="alert" className="text-left text-small font-medium text-danger">{error}</p>}
                {formNotice && <p role="status" className="text-left text-small text-link">{formNotice}</p>}
              </div>

              <p className="mt-8 text-small text-fg-secondary">
                {isSignup ? (
                  <>Already have an account? <Link href="/login" className="font-medium text-link underline-offset-2 hover:underline">Log in</Link></>
                ) : (
                  <>No account? <Link href="/signup" className="font-medium text-link underline-offset-2 hover:underline">Sign up</Link></>
                )}
              </p>
            </div>
          ) : (
            <div className="flex flex-col text-center">
              <div className="flex justify-center">
                <Badge tone="accent" className="mb-6"><MailCheck aria-hidden strokeWidth={1.75} className="size-3.5" /> Check your inbox</Badge>
              </div>

              <h1 className="mb-2 text-display font-semibold tracking-tight text-fg">Verify your email.</h1>
              <p className="mb-8 text-small leading-relaxed text-fg-secondary">
                We sent a 6-digit code to <span className="font-mono text-fg-secondary">{email}</span>. Enter it below to finish creating your account.
              </p>

              <form onSubmit={handleVerify} className="flex flex-col gap-3">
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className={cn('text-center font-mono text-h2 tracking-[0.5em]')}
                />
                <Button type="submit" variant="primary" disabled={loading} loading={loading} className="w-full justify-center">
                  {loading ? 'Verifying…' : 'Verify & create account'}
                </Button>
                {error && <p role="alert" className="text-left text-small font-medium text-danger">{error}</p>}
                {notice && <p role="status" className="text-left text-small text-link">{notice}</p>}
              </form>

              <div className="mt-8 flex flex-col items-center gap-3">
                <Button variant="link" onClick={handleResend} disabled={loading || cooldown > 0}>
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                </Button>
                <Button variant="link" onClick={() => { setView('form'); setToken(''); reset() }} className="text-fg-muted">
                  ← Use a different email
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </FocusedShell>
  )
}
