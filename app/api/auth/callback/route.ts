import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data } = await supabase.auth.exchangeCodeForSession(code)

    if (data.session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_done, username')
        .eq('id', data.session.user.id)
        .single()

      if (profile?.onboarding_done && profile?.username) {
        return NextResponse.redirect(`${origin}/feed`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/onboarding`)
}
