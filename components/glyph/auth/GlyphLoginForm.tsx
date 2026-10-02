'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GButton } from '@/components/glyph/ui/primitives'
import { GAuthField } from './GAuthField'
import { GAuthPasswordToggle } from './GAuthPasswordToggle'
import { GAuthStatus } from './GAuthStatus'
import { GitHubIcon, GoogleIcon } from './ProviderIcons'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CREDENTIAL_ERROR = 'Invalid email or password.'

/**
 * Log in — one task: let a returning developer in. Preserves the exact prior contract:
 * `signInWithPassword`, a deliberately generic "invalid email or password" message (never reveals
 * which was wrong — shown once, as a form-level alert, never attached to either field), GitHub/Google
 * OAuth via the same `/auth/callback` redirect, and the `?signup=success` notice after email
 * confirmation. Malformed-email and missing-password are client-side shape checks, not credential
 * checks, so they attach to their own field instead.
 */
export function GlyphLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'github' | 'google' | null>(null)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const redirectTo = `${origin}/auth/callback`
  const signupSuccess = searchParams.get('signup') === 'success'
  const anyLoading = loading || oauthLoading !== null

  const handleOAuth = async (provider: 'github' | 'google') => {
    setFormError('')
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
      // On success the browser is redirected to the provider.
    } catch {
      setFormError('Could not start sign-in right now. Try again.')
      setOauthLoading(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setFormError('')
    let firstInvalid: HTMLInputElement | null = null
    if (!EMAIL_REGEX.test(email)) { setEmailError('Enter a valid email address.'); firstInvalid ??= emailRef.current } else setEmailError('')
    if (!password) { setPasswordError('Enter your password.'); firstInvalid ??= passwordRef.current } else setPasswordError('')
    if (firstInvalid) { firstInvalid.focus(); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        // Generic — never reveal whether the email or the password was wrong, and never attach it
        // to either field (that would itself be a signal).
        setFormError(CREDENTIAL_ERROR)
        setLoading(false)
        return
      }
      // Success: stay pending — navigation takes over, so the button never flashes back to its
      // idle label before the page actually changes.
      router.push('/dashboard')
      router.refresh()
    } catch {
      setFormError(CREDENTIAL_ERROR)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h1 font-semibold tracking-[-0.02em] text-ink">Log in</h1>
        <p className="mt-1.5 text-body text-ink-2">Sign in to your home base.</p>
      </div>

      {signupSuccess && !formError && <GAuthStatus notice="Account created. Log in to continue." />}

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

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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
          autoComplete="current-password"
          required
          error={passwordError}
          endAdornment={<GAuthPasswordToggle visible={showPassword} onToggle={() => setShowPassword((s) => !s)} />}
        />
        <Link href="/reset-password" className="inline-flex min-h-11 w-fit items-center text-small font-medium text-ink-2 underline-offset-4 outline-none hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">
          Forgot password?
        </Link>
        {formError && <GAuthStatus error={formError} />}
        <GButton type="submit" variant="ember" size="md" disabled={anyLoading} aria-busy={loading} className="justify-center">
          {loading ? 'Signing in…' : 'Sign in'}
        </GButton>
      </form>

      <p className="flex flex-wrap items-center justify-center gap-x-1.5 text-small text-ink-2">
        No account?
        <Link href="/signup" className="inline-flex min-h-11 items-center font-medium text-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">Sign up</Link>
      </p>
    </div>
  )
}
