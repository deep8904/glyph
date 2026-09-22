import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { NewCollabForm } from '@/components/collaborate/NewCollabForm'
import type { Project } from '@/lib/supabase/types'

export default async function NewCollabPage() {
  const { user, displayName, email, nav } = await getSidebarIdentity()
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, title')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const typedProjects = (projects ?? []) as Pick<Project, 'id' | 'title'>[]

  return (
    <AppShell displayName={displayName} email={email} nav={nav} headerLabel="Collaborate">
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-h1 font-semibold text-fg">Post an opportunity</h1>
          <p className="mt-1 text-small text-fg-secondary">Looking for someone to help build your game, or offering your skills to another project.</p>
        </div>
        <NewCollabForm projects={typedProjects} />
      </div>
    </AppShell>
  )
}
