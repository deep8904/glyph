import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSidebarIdentity } from '@/lib/dashboard/identity'
import { AppShell } from '@/components/dashboard/AppShell'
import { DevlogForm } from '@/components/dashboard/DevlogForm'
import type { Project } from '@/lib/supabase/types'

export default async function NewDevlogPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { user, displayName, email } = await getSidebarIdentity()
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('id, title')
    .eq('id', id)
    .eq('owner_id', user.id)
    .maybeSingle<Pick<Project, 'id' | 'title'>>()

  if (!project) notFound()

  return (
    <AppShell displayName={displayName} email={email} headerLabel="New Devlog">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-display font-medium tracking-tight text-gray-900 mb-1">Write a Devlog</h1>
        <p className="text-sm text-gray-500 mb-8">
          Share your progress on <span className="font-medium text-gray-700">{project.title}</span>.
        </p>
        <DevlogForm projectId={project.id} authorId={user.id} />
      </div>
    </AppShell>
  )
}
