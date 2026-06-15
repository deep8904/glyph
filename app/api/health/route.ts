import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const start = Date.now()
  const checks: Record<string, { status: 'ok' | 'error'; latencyMs?: number; message?: string }> = {}

  // Database check
  try {
    const supabase = await createClient()
    const dbStart = Date.now()
    const { error } = await supabase.from('profiles').select('id').limit(1)
    checks.database = error
      ? { status: 'error', message: error.message }
      : { status: 'ok', latencyMs: Date.now() - dbStart }
  } catch (err) {
    checks.database = { status: 'error', message: err instanceof Error ? err.message : 'Unknown' }
  }

  // Environment check
  const requiredEnv = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']
  const missingEnv = requiredEnv.filter((k) => !process.env[k])
  checks.env = missingEnv.length === 0
    ? { status: 'ok' }
    : { status: 'error', message: `Missing: ${missingEnv.join(', ')}` }

  const allOk = Object.values(checks).every((c) => c.status === 'ok')
  const status = allOk ? 200 : 503

  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      version: process.env.npm_package_version ?? 'unknown',
      timestamp: new Date().toISOString(),
      uptimeMs: Date.now() - start,
      checks,
    },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex',
      },
    }
  )
}
