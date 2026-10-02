import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getIP } from '@/lib/rate-limit'

const USERNAME_REGEX = /^[a-z0-9][a-z0-9\-]{1,28}[a-z0-9]$/

export async function GET(request: Request) {
  // Rate limit: 30 checks per IP per minute
  const ip = getIP(request)
  if (!rateLimit(`username-check:${ip}`, 30, 60_000)) {
    return NextResponse.json(
      { available: false, error: 'Too many requests. Slow down.' },
      { status: 429 }
    )
  }

  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')

  if (!username || username.length > 30) {
    return NextResponse.json({ available: false, error: 'Username required' })
  }

  if (!USERNAME_REGEX.test(username)) {
    return NextResponse.json({ available: false, error: 'Invalid format' })
  }

  // A failed lookup must never be reported as "available" — `available: !data` on a query that
  // actually errored (data is null either way) would be a false positive that could let a duplicate
  // slip through to the profile insert (which does still enforce uniqueness, but the UI would have
  // lied about it getting there). Any lookup failure — returned or thrown — is a real 503, never a
  // 2xx with a fabricated answer, and never exposes the underlying Supabase error text.
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: 'lookup_failed' }, { status: 503 })
    }
    return NextResponse.json({ available: !data })
  } catch {
    return NextResponse.json({ error: 'lookup_failed' }, { status: 503 })
  }
}
