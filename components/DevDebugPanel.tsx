'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Bug, X, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type TsState =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'pass'; errors: number }
  | { status: 'fail'; errors: number }

type AuthInfo = {
  email: string | null
  provider: string | null
  expiresAt: number | null
}

function Row({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-gray-400">{label}</span>
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
      ) : (
        <XCircle className="h-3.5 w-3.5 text-red-400" />
      )}
    </div>
  )
}

export function DevDebugPanel() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [auth, setAuth] = useState<AuthInfo>({ email: null, provider: null, expiresAt: null })
  const [ts, setTs] = useState<TsState>({ status: 'idle' })
  const [errors, setErrors] = useState<string[]>([])

  // Environment checks (NEXT_PUBLIC_* are inlined at build time)
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const hasKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)

  // Auth state
  useEffect(() => {
    const supabase = createClient()
    let active = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return
      setAuth({
        email: session?.user?.email ?? null,
        provider: session?.user?.app_metadata?.provider ?? null,
        expiresAt: session?.expires_at ?? null,
      })
    })
    return () => {
      active = false
    }
  }, [pathname])

  // Capture last 5 console / runtime errors
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      setErrors((prev) => [`${e.message}`, ...prev].slice(0, 5))
    }
    const onRejection = (e: PromiseRejectionEvent) => {
      setErrors((prev) => [`Unhandled rejection: ${String(e.reason)}`, ...prev].slice(0, 5))
    }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  const runTsCheck = async () => {
    setTs({ status: 'running' })
    try {
      const res = await fetch('/api/dev/ts-check')
      const data = (await res.json()) as { status: string; errors: number }
      setTs(
        data.status === 'pass'
          ? { status: 'pass', errors: 0 }
          : { status: 'fail', errors: data.errors ?? 0 }
      )
    } catch {
      setTs({ status: 'fail', errors: -1 })
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-mono text-[11px]">
      {open ? (
        <div className="w-80 rounded-2xl border border-white/10 bg-[#16151c]/95 backdrop-blur-xl text-gray-200 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="flex items-center gap-2 text-indigo-300 uppercase tracking-widest text-[10px] font-semibold">
              <Bug className="h-3.5 w-3.5" /> Dev Debug
            </span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-4 py-3 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Auth */}
            <section>
              <h4 className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Auth</h4>
              <div className="space-y-1">
                <div className="flex justify-between gap-3"><span className="text-gray-400">User</span><span className="text-gray-200 truncate max-w-[170px]">{auth.email ?? '—'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-gray-400">Provider</span><span className="text-gray-200">{auth.provider ?? '—'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-gray-400">Expires</span><span className="text-gray-200">{auth.expiresAt ? new Date(auth.expiresAt * 1000).toLocaleTimeString() : '—'}</span></div>
              </div>
            </section>

            {/* Env */}
            <section>
              <h4 className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Environment</h4>
              <Row label="NEXT_PUBLIC_SUPABASE_URL" ok={hasUrl} />
              <Row label="NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" ok={hasKey} />
            </section>

            {/* Route */}
            <section>
              <h4 className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Route</h4>
              <div className="flex justify-between gap-3"><span className="text-gray-400">pathname</span><span className="text-gray-200 truncate max-w-[170px]">{pathname}</span></div>
            </section>

            {/* TypeScript */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] uppercase tracking-widest text-gray-500">TypeScript</h4>
                <button onClick={runTsCheck} className="flex items-center gap-1 text-indigo-300 hover:text-indigo-200 transition-colors">
                  <RefreshCw className="h-3 w-3" /> check
                </button>
              </div>
              <div className="flex items-center gap-2">
                {ts.status === 'idle' && <span className="text-gray-500">Not run yet</span>}
                {ts.status === 'running' && <span className="flex items-center gap-2 text-gray-300"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Running tsc…</span>}
                {ts.status === 'pass' && <span className="flex items-center gap-2 text-green-400"><CheckCircle2 className="h-3.5 w-3.5" /> Pass — 0 errors</span>}
                {ts.status === 'fail' && <span className="flex items-center gap-2 text-red-400"><XCircle className="h-3.5 w-3.5" /> Fail — {ts.errors} error{ts.errors === 1 ? '' : 's'}</span>}
              </div>
            </section>

            {/* Error log */}
            <section>
              <h4 className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Error log (last 5)</h4>
              {errors.length === 0 ? (
                <span className="text-gray-500">No errors captured</span>
              ) : (
                <ul className="space-y-1">
                  {errors.map((err, i) => (
                    <li key={i} className="text-red-300/90 leading-snug break-words">{err}</li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center h-11 w-11 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-colors"
          aria-label="Open dev debug panel"
        >
          <Bug className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
