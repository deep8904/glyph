'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { stripDangerousUnicode } from '@/lib/utils'

/*
 * Lifecycle rules (who may apply, valid status changes, notifications) are
 * enforced in the database by migration 032 — these actions validate input,
 * give clear errors, and never duplicate those rules as the only line of defence.
 * Errors raised deliberately by the database (SQLSTATE P0001) are safe to show;
 * anything else becomes a generic message.
 */

type DbError = { code?: string; message: string } | null
function friendly(error: DbError, fallback: string): string {
  if (!error) return fallback
  if (error.code === 'P0001') return error.message
  if (error.code === '23505') return 'You have already applied to this post.'
  return fallback
}

export type CollabPostInput = {
  project_id: string
  post_type: 'seeking_collaborator' | 'available_to_collaborate'
  role_needed: string
  role_offered: string
  contract_type: 'full_time' | 'part_time' | 'freelance' | 'rev_share' | 'volunteer'
  compensation_range: string
  time_commitment: string
  remote_allowed: boolean
  location: string
  description: string
}

export async function createCollabPost(input: CollabPostInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!input.description || input.description.length > 5000) return { error: 'Description required (max 5000 chars).' }
  if (!['seeking_collaborator', 'available_to_collaborate'].includes(input.post_type)) return { error: 'Invalid post type.' }
  if (!['full_time', 'part_time', 'freelance', 'rev_share', 'volunteer'].includes(input.contract_type)) return { error: 'Invalid contract type.' }

  let projectId: string | null = null
  if (input.project_id) {
    const { data: project } = await supabase.from('projects').select('id').eq('id', input.project_id).eq('owner_id', user.id).maybeSingle()
    if (!project) return { error: 'Project not found or not yours.' }
    projectId = project.id
  }

  if (input.post_type === 'seeking_collaborator' && !projectId) {
    return { error: 'Seeking collaborator posts must link to a project.' }
  }
  if (input.post_type === 'seeking_collaborator' && !input.role_needed.trim()) {
    return { error: 'Say which role you are looking for.' }
  }

  const { data: created, error } = await supabase.from('collaboration_posts').insert({
    project_id: projectId,
    author_id: user.id,
    post_type: input.post_type,
    role_needed: input.role_needed ? stripDangerousUnicode(input.role_needed.slice(0, 100)) : null,
    role_offered: input.role_offered ? stripDangerousUnicode(input.role_offered.slice(0, 100)) : null,
    contract_type: input.contract_type,
    compensation_range: input.compensation_range ? stripDangerousUnicode(input.compensation_range.slice(0, 200)) : null,
    time_commitment: input.time_commitment ? stripDangerousUnicode(input.time_commitment.slice(0, 200)) : null,
    remote_allowed: input.remote_allowed,
    location: input.location ? stripDangerousUnicode(input.location.slice(0, 100)) : null,
    description: stripDangerousUnicode(input.description.trim()),
  }).select('id').single()

  if (error || !created) return { error: 'Could not publish the post. Try again.' }
  revalidatePath('/collaborate')
  // Land on the post itself so the author sees exactly what was published.
  redirect(`/collaborate/${created.id}`)
}

export async function applyToCollabPost(postId: string, message: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to apply.' }

  const clean = stripDangerousUnicode((message ?? '').trim())
  if (!clean || clean.length > 2000) return { error: 'Message required (max 2000 chars).' }

  // Open / not expired / not your own post / not blocked are enforced by the
  // collab_applications_guard trigger; its message is shown as-is.
  const { error } = await supabase.from('collaboration_applications').insert({
    post_id: postId,
    applicant_id: user.id,
    message: clean,
  })
  if (error) return { error: friendly(error, 'Could not send your application. Try again.') }

  revalidatePath(`/collaborate/${postId}`)
  revalidatePath('/collaborate')
  return { ok: true }
}

export async function updateApplicationStatus(applicationId: string, status: 'accepted' | 'rejected') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to continue.' }
  if (status !== 'accepted' && status !== 'rejected') return { error: 'Invalid decision.' }

  // Only the post owner may decide, and only on a pending application (guard trigger + RLS).
  const { data, error } = await supabase
    .from('collaboration_applications')
    .update({ status })
    .eq('id', applicationId)
    .select('post_id')
  if (error) return { error: friendly(error, 'Could not save your decision. Try again.') }
  if (!data || data.length === 0) return { error: 'Application not found or not yours to decide.' }

  revalidatePath(`/collaborate/${data[0].post_id}`)
  return { ok: true }
}

export async function withdrawApplication(applicationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to continue.' }

  const { data, error } = await supabase
    .from('collaboration_applications')
    .update({ status: 'withdrawn' })
    .eq('id', applicationId)
    .eq('applicant_id', user.id)
    .select('post_id')
  if (error) return { error: friendly(error, 'Could not withdraw your application. Try again.') }
  if (!data || data.length === 0) return { error: 'Application not found.' }

  revalidatePath(`/collaborate/${data[0].post_id}`)
  return { ok: true }
}

/** 'filled' = you found someone; 'closed' = you are no longer looking. Both stop new applications. */
export async function closeCollabPost(postId: string, outcome: 'filled' | 'closed' = 'closed') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to continue.' }
  if (outcome !== 'filled' && outcome !== 'closed') return { error: 'Invalid outcome.' }

  const { data, error } = await supabase
    .from('collaboration_posts')
    .update({ status: outcome })
    .eq('id', postId)
    .eq('author_id', user.id)
    .eq('status', 'open')
    .select('id')
  if (error) return { error: 'Could not update the post. Try again.' }
  if (!data || data.length === 0) return { error: 'This post is already closed.' }

  revalidatePath('/collaborate')
  revalidatePath(`/collaborate/${postId}`)
  return { ok: true }
}
