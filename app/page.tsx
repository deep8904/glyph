import { createClient } from '@/lib/supabase/server'
import { Landing } from '@/components/landing/Landing'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <Landing isAuthed={!!user} />
}
