import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function isSafePath(path: string): boolean {
  // Must start with / and must not contain // (open redirect) or backslash
  return (
    typeof path === 'string' &&
    path.startsWith('/') &&
    !path.startsWith('//') &&
    !path.includes('\\') &&
    !path.toLowerCase().startsWith('/redirect')
  )
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/dashboard'

  // Reject non-safe redirect targets — prevents open redirect via the ?next= param
  const next = isSafePath(rawNext) ? rawNext : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, is_onboarded')
          .eq('id', user.id)
          .maybeSingle()

        if (!profile || !profile.is_onboarded) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
