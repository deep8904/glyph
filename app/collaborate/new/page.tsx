import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody } from '@/components/layout/PageShell'
import { NewCollabForm } from '@/components/collaborate/NewCollabForm'
import type { Project } from '@/lib/supabase/types'

export default async function NewCollabPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('id, title')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const typedProjects = (projects ?? []) as Pick<Project, 'id' | 'title'>[]

  return (
    <PageShell>
      <PanelHeader breadcrumb={[{ label: 'Collaborate', href: '/collaborate' }, { label: 'New Post' }]} />
      <PanelBody>
        <div className="mb-6">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900 mb-1">Post a Collaboration</h1>
          <p className="text-sm text-gray-500">Looking for a collaborator on your project, or advertising your availability? Posts expire after 60 days.</p>
        </div>
        <NewCollabForm projects={typedProjects} />
      </PanelBody>
    </PageShell>
  )
}
