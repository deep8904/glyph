import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { ProjectForm } from '@/components/dashboard/ProjectForm'
import { DeleteProjectForm } from '@/components/dashboard/DeleteProjectForm'
import type { Project } from '@/lib/supabase/types'

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { user, displayName, email } = await getSidebarIdentity()
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .maybeSingle<Project>()

  if (!project) notFound()

  return (
    <AppShell displayName={displayName} email={email} headerLabel="Edit Project">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-display font-medium tracking-tight text-gray-900 mb-1">Edit Project</h1>
        <p className="text-sm text-gray-500 mb-8 truncate">{project.title}</p>
        <ProjectForm projectId={id} initial={project} ownerId={user.id} />
        <DeleteProjectForm projectId={id} title={project.title} />
      </div>
    </AppShell>
  )
}
