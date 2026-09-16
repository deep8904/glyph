import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { NewPlaytestForm } from '@/components/playtests/NewPlaytestForm'
import type { Project } from '@/lib/supabase/types'

export default async function NewPlaytestPage() {
  const { user, displayName, email } = await getSidebarIdentity()
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, title')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const typedProjects = (projects ?? []) as Pick<Project, 'id' | 'title'>[]

  return (
    <AppShell displayName={displayName} email={email} headerLabel="Request Playtesters">
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-medium tracking-tight text-gray-900 mb-1">Request Playtesters</h1>
          <p className="text-sm text-gray-500">Share your build with community testers and collect structured feedback.</p>
        </div>
        {typedProjects.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-500">
            You need to <a href="/dashboard/projects/new" className="text-indigo-600 hover:underline">create a project</a> before requesting testers.
          </div>
        ) : (
          <NewPlaytestForm projects={typedProjects} />
        )}
      </div>
    </AppShell>
  )
}
