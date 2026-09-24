'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type ActionResult = { error: string } | { success: true }

/**
 * Uploading media requires a real project row to own the storage path (write RLS checks
 * project_id -> owner_id). A brand-new project doesn't have an id yet — this creates the row on
 * first upload attempt, not on page load, so merely visiting "New project" never leaves an
 * abandoned empty draft behind. The row this creates is a real, resumable draft from that point
 * on (visible in "Your projects" with a Draft badge) — that's a feature, not a rough edge: it's
 * the same persistence the later "authoring recovery" work needs, arrived at for free here.
 */
export async function createDraftProject(title: string): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('projects')
    .insert({ owner_id: user.id, title: title.trim() || 'Untitled project', lifecycle: 'draft', is_primary: false })
    .select('id')
    .single()

  if (error || !data) return { error: 'Could not start this project. Try again.' }
  return { id: data.id }
}

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

/**
 * Archive is non-destructive (design doc project-state-model.md §11): nothing is deleted, the
 * project stays viewable exactly as before, just excluded from discovery and Current Work
 * framing. The one active side effect — force-closing recruiting — is deliberate: an archived
 * project shouldn't keep taking playtest sign-ups or collaboration applications the owner has
 * stopped watching for.
 */
export async function archiveProject(projectId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('id, owner_id, lifecycle')
    .eq('id', projectId)
    .maybeSingle<{ id: string; owner_id: string; lifecycle: string }>()

  if (!project) return { error: 'Project not found.' }
  if (project.owner_id !== user.id) return { error: 'You do not have permission to archive this project.' }
  if (project.lifecycle === 'archived') return { success: true }

  const { error } = await supabase.from('projects').update({ lifecycle: 'archived' }).eq('id', projectId).eq('owner_id', user.id)
  if (error) return { error: 'Something went wrong. The project was not archived.' }

  // Force-close open recruiting. Best-effort: the archive itself already succeeded above, so a
  // failure here doesn't roll it back — it would just leave a stale open post/request, which the
  // owner can still close manually from the project's own management pages.
  await supabase.from('playtest_requests').update({ status: 'closed' }).eq('project_id', projectId).eq('status', 'open')
  await supabase.from('collaboration_posts').update({ status: 'closed' }).eq('project_id', projectId).in('status', ['open', 'filled'])

  return { success: true }
}

/** Restore does not reopen anything that archiving closed — the owner reopens recruiting
 *  deliberately from Playtests/Collaborate if they still want it, same as any other project. */
export async function restoreProject(projectId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('id, owner_id')
    .eq('id', projectId)
    .maybeSingle<{ id: string; owner_id: string }>()

  if (!project) return { error: 'Project not found.' }
  if (project.owner_id !== user.id) return { error: 'You do not have permission to restore this project.' }

  const { error } = await supabase.from('projects').update({ lifecycle: 'published' }).eq('id', projectId).eq('owner_id', user.id)
  if (error) return { error: 'Something went wrong. The project was not restored.' }

  return { success: true }
}
