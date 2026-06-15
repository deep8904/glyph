import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageShell, PanelHeader, PanelBody } from '@/components/layout/PageShell'
import { NewPlaytestForm } from '@/components/playtests/NewPlaytestForm'
import type { Project } from '@/lib/supabase/types'

export default async function NewPlaytestPage() {
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
      <PanelHeader breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Playtests', href: '/dashboard/playtests' }, { label: 'New Request' }]} />
      <PanelBody>
        <div className="mb-6">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900 mb-1">Request Playtesters</h1>
          <p className="text-sm text-gray-500">Share your build with community testers and collect structured feedback.</p>
        </div>
        {typedProjects.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-500">
            You need to <a href="/dashboard/projects/new" className="text-indigo-600 hover:underline">create a project</a> before requesting testers.
          </div>
        ) : (
          <NewPlaytestForm projects={typedProjects} />
        )}
      </PanelBody>
    </PageShell>
  )
}
