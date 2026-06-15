import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody } from '@/components/layout/PageShell'
import { NewStudioForm } from '@/components/studios/NewStudioForm'

export default async function NewStudioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
    <PageShell>
      <PanelHeader breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Studios', href: '/dashboard/studios/new' }, { label: 'New Studio' }]} />
      <PanelBody>
        <div className="max-w-xl mx-auto">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 mb-1">Create a Studio</h1>
          <p className="text-sm text-gray-500 mb-8">A studio page groups your projects and team under one verified presence.</p>
          <NewStudioForm />
        </div>
      </PanelBody>
    </PageShell>
  )
}
