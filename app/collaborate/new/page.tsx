import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { NewCollabForm } from '@/components/collaborate/NewCollabForm'
import type { Project } from '@/lib/supabase/types'

export default async function NewCollabPage() {
  const { user, displayName, email } = await getSidebarIdentity()
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, title')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const typedProjects = (projects ?? []) as Pick<Project, 'id' | 'title'>[]

  return (
    <AppShell displayName={displayName} email={email} headerLabel="Post a Collaboration">
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-medium tracking-tight text-gray-900 mb-1">Post a Collaboration</h1>
          <p className="text-sm text-gray-500">Looking for a collaborator on your project, or advertising your availability? Posts expire after 60 days.</p>
        </div>
        <NewCollabForm projects={typedProjects} />
      </div>
    </AppShell>
  )
}
