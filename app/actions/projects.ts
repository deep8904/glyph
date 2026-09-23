'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type ActionResult = { error: string } | { success: true }

export async function deleteProject(projectId: string, confirmTitle: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('id, title, owner_id')
    .eq('id', projectId)
    .maybeSingle<{ id: string; title: string; owner_id: string }>()

  if (!project) return { error: 'Project not found.' }
  if (project.owner_id !== user.id) return { error: 'You do not have permission to delete this project.' }
  if (confirmTitle.trim() !== project.title) return { error: 'Confirmation text does not match the project title.' }

  // RLS ("Users can manage their own projects") independently enforces
  // owner_id = auth.uid() on this delete; the checks above are defense in
  // depth, not the only guard. Devlogs, playtest requests, event demo
  // slots, studio_projects, and jam submissions cascade via FK constraints
  // (on delete cascade); collaboration_posts detach via on delete set null.
  const { error } = await supabase.from('projects').delete().eq('id', projectId).eq('owner_id', user.id)

  if (error) return { error: 'Something went wrong. The project was not deleted.' }

  return { success: true }
}
