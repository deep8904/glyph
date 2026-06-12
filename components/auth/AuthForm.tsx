'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Gamepad2, MailCheck, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'signup'

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
  const supabase = createClient()

  const isSignup = mode === 'signup'

  const [view, setView] = useState<'form' | 'verify'>('form')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const redirectTo = `${origin}/auth/callback`

  const handleOAuth = async (provider: 'github' | 'google') => {
    setError('')
    setNotice('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')
    if (!email) {
      setError('Enter your email address.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setView('verify')
  }

  const handleResend = async () => {
    setError('')
    setNotice('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setNotice('Sent again — check your inbox.')
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')
    if (token.length < 6) {
      setError('Enter the 6-digit code from your email.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    router.push('/dashboard')
  }

  const inputCls =
    'w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm text-gray-900 font-mono placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all duration-300'
  const primaryBtn =
    'w-full inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3.5 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none'

  return (
    <div className="min-h-screen relative overflow-hidden font-sans">
      {/* Plasma background */}
      <div className="fixed inset-0 z-0 bg-plasma pointer-events-none" />

      {/* Glass slices overlay */}
      <div className="fixed inset-y-0 right-0 w-[120vw] md:w-[70vw] translate-x-[10%] md:translate-x-0 z-0 flex pointer-events-none opacity-40 mix-blend-overlay">
        <div className="h-full flex-1 relative border-l border-white/60 shadow-[-15px_0_30px_-10px_rgba(255,255,255,1)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0.4))', backdropFilter: 'blur(20px)' }} />
        <div className="h-full flex-1 relative border-l border-white/40 shadow-[-15px_0_30px_-10px_rgba(255,255,255,0.8)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0.1))', backdropFilter: 'blur(10px)' }} />
        <div className="h-full flex-1 relative border-l border-white/20 shadow-[-15px_0_30px_-10px_rgba(255,255,255,0.4)]" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,0))', backdropFilter: 'blur(4px)' }} />
      </div>

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1 text-2xl font-semibold tracking-tighter text-white mb-8">
          Glyph<span className="text-indigo-400 leading-none">°</span>
        </Link>

        <div className="w-full max-w-[480px] bg-white/95 backdrop-blur-2xl rounded-[2.5rem] panel-shadow border border-white overflow-hidden">
          <div className="px-8 py-10 md:px-10 md:py-12">
            {view === 'form' ? (
              <div className="reveal active flex flex-col text-center">
                <div className="flex justify-center">
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/50 px-3 py-1 text-[11px] uppercase tracking-wider font-semibold text-indigo-600 shadow-sm backdrop-blur-md font-mono">
                    <Gamepad2 className="h-3.5 w-3.5" /> {isSignup ? 'New Account' : 'Returning'}
                  </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-light tracking-tighter text-gray-900 mb-2">
                  {isSignup ? 'Create your profile.' : 'Welcome back.'}
                </h1>
                <p className="text-sm text-gray-500 mb-8">
                  {isSignup ? 'Free forever. No credit card.' : 'Sign in to your home base.'}
                </p>

                <div className="flex flex-col gap-3">
                  <button onClick={() => handleOAuth('github')} disabled={loading} className="w-full inline-flex items-center justify-center gap-3 rounded-full bg-gray-900 px-6 py-3.5 text-sm font-medium text-white hover:bg-gray-800 transition-all duration-300 disabled:opacity-60 disabled:pointer-events-none">
                    <GitHubIcon className="h-4 w-4" /> Continue with GitHub
                  </button>
                  <button onClick={() => handleOAuth('google')} disabled={loading} className="w-full inline-flex items-center justify-center gap-3 rounded-full border border-gray-200 bg-white px-6 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-300 disabled:opacity-60 disabled:pointer-events-none">
                    <GoogleIcon className="h-4 w-4" /> Continue with Google
                  </button>

                  <div className="flex items-center gap-4 my-2">
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">or</span>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>

                  <form onSubmit={handleSendMagicLink} className="flex flex-col gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      autoComplete="email"
                      className={inputCls}
                    />
                    <button type="submit" disabled={loading} className={primaryBtn}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {loading ? 'Sending…' : 'Send Magic Link'}
                    </button>
                  </form>

                  {error && <p className="text-xs font-mono text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3 leading-relaxed">{error}</p>}
                  {notice && <p className="text-xs font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 leading-relaxed">{notice}</p>}
                </div>

                <p className="text-sm text-gray-500 mt-8">
                  {isSignup ? (
                    <>Already have an account? <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors">Log in →</Link></>
                  ) : (
                    <>No account? <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors">Sign up →</Link></>
                  )}
                </p>
              </div>
            ) : (
              <div className="reveal active flex flex-col text-center">
                <div className="flex justify-center">
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/50 px-3 py-1 text-[11px] uppercase tracking-wider font-semibold text-indigo-600 shadow-sm backdrop-blur-md font-mono">
                    <MailCheck className="h-3.5 w-3.5" /> Check your inbox
                  </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-light tracking-tighter text-gray-900 mb-2">Check your email.</h1>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                  We sent a magic link to <span className="font-mono text-gray-700">{email}</span>. Click it to sign in — no password needed. Or enter the 6-digit code below.
                </p>

                <form onSubmit={handleVerify} className="flex flex-col gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className={`${inputCls} text-center tracking-[0.5em] text-lg`}
                  />
                  <button type="submit" disabled={loading} className={primaryBtn}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {loading ? 'Verifying…' : 'Verify Code'}
                  </button>
                  {error && <p className="text-xs font-mono text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3 leading-relaxed">{error}</p>}
                  {notice && <p className="text-xs font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 leading-relaxed">{notice}</p>}
                </form>

                <div className="flex flex-col items-center gap-3 mt-8">
                  <button onClick={handleResend} disabled={loading} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors disabled:opacity-60">Resend email</button>
                  <button onClick={() => { setView('form'); setToken(''); setError(''); setNotice('') }} className="text-xs font-mono text-gray-400 hover:text-gray-600 transition-colors">← Use a different email</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
