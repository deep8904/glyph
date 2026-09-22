import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { NewStudioForm } from '@/components/studios/NewStudioForm'

export default async function NewStudioPage() {
  const { user, displayName, email, nav } = await getSidebarIdentity()
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('studio_members')
    .select('studio_id, studios!studio_id(slug, name)')
    .eq('user_id', user.id)
    .eq('role', 'owner')
    .maybeSingle()

  if (existing) {
    type Existing = { studio_id: string; studios: { slug: string; name: string } | null }
    const e = existing as unknown as Existing
    if (e.studios?.slug) redirect(`/dashboard/studios/${e.studios.slug}`)
  }

  return (
    <AppShell displayName={displayName} email={email} nav={nav} headerLabel="Studios">
      <div className="max-w-xl">
        <h1 className="text-h1 font-semibold text-fg">Create a studio</h1>
        <p className="mb-8 mt-1 text-small text-fg-secondary">A studio is a shared identity for a team and the games it makes. Its page lists your linked projects and your team.</p>
        <NewStudioForm />
      </div>
    </AppShell>
  )
}
