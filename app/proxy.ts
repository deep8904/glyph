import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const appRoutes = ['/feed', '/discover', '/dev', '/projects/new', '/playtest', '/onboarding']
  if (!user && appRoutes.some(r => request.nextUrl.pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && ['/login', '/signup'].includes(request.nextUrl.pathname)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_done, username')
      .eq('id', user.id)
      .single()

    if (!profile?.onboarding_done || !profile?.username) {
      if (request.nextUrl.pathname !== '/onboarding') {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
    } else {
      return NextResponse.redirect(new URL('/feed', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
