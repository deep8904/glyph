import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { NewStudioForm } from '@/components/studios/NewStudioForm'

export default async function NewStudioPage() {
  const { user, displayName, email } = await getSidebarIdentity()
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
    <AppShell displayName={displayName} email={email} headerLabel="New Studio">
      <div className="max-w-xl">
        <h1 className="text-2xl font-display font-medium tracking-tight text-gray-900 mb-1">Create a Studio</h1>
        <p className="text-sm text-gray-500 mb-8">A studio page groups your projects and team under one verified presence.</p>
        <NewStudioForm />
      </div>
    </AppShell>
  )
}
