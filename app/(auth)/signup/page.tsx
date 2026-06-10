'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

function GitHubIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  )
}
import { createClient } from '@/lib/supabase/client'

function passwordStrength(pw: string): number {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[a-z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}

const STRENGTH_LABEL = ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong']
const STRENGTH_COLOR = ['', 'bg-red-500', 'bg-red-400', 'bg-amber-400', 'bg-green-400', 'bg-green-500']

function mapAuthError(msg: string): string {
  if (msg.includes('User already registered')) return 'An account with this email already exists.'
  if (msg.includes('Password should be')) return 'Password must be at least 6 characters.'
  if (msg.includes('Unable to validate')) return 'Please enter a valid email address.'
  if (msg.includes('Too many requests')) return 'Too many attempts. Please wait a moment.'
  return msg
}

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const strength = passwordStrength(password)

  async function handleGitHub() {
    setGithubLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
    if (error) {
      setError('Could not connect to GitHub. Please try again.')
      setGithubLoading(false)
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setNotice('')

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (strength < 2) {
      setError('Please choose a stronger password.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setLoading(false)
      setError(mapAuthError(error.message))
      return
    }

    if (data.session) {
      router.push('/onboarding')
    } else {
      setLoading(false)
      setNotice("Check your email — we sent you a confirmation link. Once confirmed, you'll be redirected to set up your profile.")
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel ─────────────────────────────────────── */}
      <div className="relative hidden w-[45%] flex-col justify-between bg-[var(--color-glyph-black)] p-10 lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_85%,rgba(255,61,0,0.13),transparent_55%)]" />

        <Link href="/" className="relative flex items-center gap-2">
          <span className="font-mono text-lg text-[var(--color-glyph-orange)]">◈</span>
          <span className="font-heading text-xl font-bold text-[var(--color-glyph-text)]">Glyph</span>
        </Link>

        <div className="relative">
          <p className="mb-5 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-glyph-orange)]">
            Join the community
          </p>
          <h2 className="mb-6 font-heading text-4xl font-bold leading-[1.1] text-[var(--color-glyph-text)]">
            Your dev identity<br />starts here.
          </h2>
          <p className="font-sans text-sm leading-relaxed text-[var(--color-glyph-text-2)]">
            Glyph is free — forever — for individual developers. No credit card required.
            Set up your profile in under 2 minutes.
          </p>
        </div>

        <p className="relative font-mono text-xs text-[var(--color-glyph-text-3)]">
          © 2026 Glyph · Phoenix, AZ
        </p>
      </div>

      {/* ── Right panel ────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[var(--color-glyph-surface)] px-6 py-12">
        <Link href="/" className="mb-10 flex items-center gap-2 lg:hidden">
          <span className="font-mono text-lg text-[var(--color-glyph-orange)]">◈</span>
          <span className="font-heading text-xl font-bold text-[var(--color-glyph-text)]">Glyph</span>
        </Link>

        <div className="w-full max-w-sm">
          <h1 className="mb-1 font-heading text-2xl font-bold text-[var(--color-glyph-text)]">
            Create your account
          </h1>
          <p className="mb-8 font-sans text-sm text-[var(--color-glyph-text-2)]">
            Free forever · No credit card
          </p>

          {/* GitHub */}
          <button
            onClick={handleGitHub}
            disabled={githubLoading || loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--color-glyph-border-hi)] bg-[var(--color-glyph-surface-2)] px-5 py-3.5 font-sans text-sm font-medium text-[var(--color-glyph-text)] transition hover:bg-[var(--color-glyph-surface-3)] disabled:opacity-50"
          >
            <GitHubIcon size={18} />
            {githubLoading ? 'Connecting…' : 'Continue with GitHub'}
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-[var(--color-glyph-border)]" />
            <span className="font-mono text-xs text-[var(--color-glyph-text-3)]">or continue with email</span>
            <div className="h-px flex-1 bg-[var(--color-glyph-border)]" />
          </div>

          {/* Signup form */}
          <form onSubmit={handleSignup} className="space-y-3">
            <div>
              <label className="mb-1.5 block font-mono text-xs font-medium text-[var(--color-glyph-text-2)]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-[var(--color-glyph-border)] bg-[var(--color-glyph-surface-2)] px-4 py-3 font-sans text-sm text-[var(--color-glyph-text)] placeholder:text-[var(--color-glyph-text-3)] outline-none transition focus:border-[var(--color-glyph-border-hi)] focus:ring-1 focus:ring-[var(--color-glyph-orange)]/30"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-xs font-medium text-[var(--color-glyph-text-2)]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-[var(--color-glyph-border)] bg-[var(--color-glyph-surface-2)] px-4 py-3 font-sans text-sm text-[var(--color-glyph-text)] placeholder:text-[var(--color-glyph-text-3)] outline-none transition focus:border-[var(--color-glyph-border-hi)] focus:ring-1 focus:ring-[var(--color-glyph-orange)]/30"
              />
              {/* Strength bar */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength ? STRENGTH_COLOR[strength] : 'bg-[var(--color-glyph-border)]'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="font-mono text-xs text-[var(--color-glyph-text-3)]">
                    {STRENGTH_LABEL[strength]}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-xs font-medium text-[var(--color-glyph-text-2)]">
                Confirm password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-[var(--color-glyph-border)] bg-[var(--color-glyph-surface-2)] px-4 py-3 font-sans text-sm text-[var(--color-glyph-text)] placeholder:text-[var(--color-glyph-text-3)] outline-none transition focus:border-[var(--color-glyph-border-hi)] focus:ring-1 focus:ring-[var(--color-glyph-orange)]/30"
              />
              {confirm && password !== confirm && (
                <p className="mt-1.5 font-mono text-xs text-red-400">Passwords don't match</p>
              )}
            </div>

            {error && (
              <p className="rounded-xl bg-red-500/10 px-4 py-2.5 font-sans text-sm text-red-400">
                {error}
              </p>
            )}
            {notice && (
              <p className="rounded-xl bg-[var(--color-glyph-orange-lo)] px-4 py-2.5 font-sans text-sm text-[var(--color-glyph-orange)]">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || githubLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-glyph-orange)] px-5 py-3.5 font-sans text-sm font-medium text-white transition hover:bg-[#ff5c27] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Creating account…' : <>Create Account <ArrowRight size={15} /></>}
            </button>
          </form>

          <p className="mt-6 text-center font-sans text-sm text-[var(--color-glyph-text-2)]">
            Already have an account?{' '}
            <Link href="/login" className="text-[var(--color-glyph-orange)] hover:underline">
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
