import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const USERNAME_REGEX = /^[a-z0-9][a-z0-9\-]{1,28}[a-z0-9]$/

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')

  if (!username) {
    return NextResponse.json({ available: false, error: 'Username required' })
  }

  if (!USERNAME_REGEX.test(username)) {
    return NextResponse.json({ available: false, error: 'Invalid format' })
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .maybeSingle()

  return NextResponse.json({ available: !data })
}
