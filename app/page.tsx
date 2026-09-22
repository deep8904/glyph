import { createClient } from '@/lib/supabase/server'
import { Landing } from '@/components/landing/Landing'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div id="main-content">
      <Landing isAuthed={!!user} />
    </div>
  )
}
