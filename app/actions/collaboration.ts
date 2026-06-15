'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { stripDangerousUnicode } from '@/lib/utils'

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

  // Verify project ownership if provided
  let projectId: string | null = null
  if (input.project_id) {
    const { data: project } = await supabase.from('projects').select('id').eq('id', input.project_id).eq('owner_id', user.id).maybeSingle()
    if (!project) return { error: 'Project not found or not yours.' }
    projectId = project.id
  }

  // "Seeking collaborator" requires a linked project
  if (input.post_type === 'seeking_collaborator' && !projectId) {
    return { error: 'Seeking collaborator posts must link to a project.' }
  }

  const { error } = await supabase.from('collaboration_posts').insert({
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
  })

  if (error) return { error: error.message }
  redirect('/collaborate')
}

export async function applyToCollabPost(postId: string, message: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in to apply.' }

  if (!message || message.length > 2000) return { error: 'Message required (max 2000 chars).' }

  const { data: post } = await supabase.from('collaboration_posts').select('author_id, status').eq('id', postId).maybeSingle()
  if (!post) return { error: 'Post not found.' }
  if (post.author_id === user.id) return { error: "You can't apply to your own post." }
  if (post.status !== 'open') return { error: 'This post is no longer open.' }

  const { error } = await supabase.from('collaboration_applications').insert({
    post_id: postId,
    applicant_id: user.id,
    message: stripDangerousUnicode(message.trim()),
  })
  if (error?.code === '23505') return { error: 'You already applied to this post.' }
  if (error) return { error: error.message }

  // Notify post author
  await supabase.from('notifications').insert({
    recipient_id: post.author_id,
    actor_id: user.id,
    type: 'mention',
    entity_type: 'collaboration_post',
    entity_id: postId,
  })

  return { ok: true }
}

export async function updateApplicationStatus(applicationId: string, status: 'accepted' | 'rejected') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: app } = await supabase
    .from('collaboration_applications')
    .select('post_id, applicant_id')
    .eq('id', applicationId)
    .maybeSingle()
  if (!app) return { error: 'Application not found.' }

  const { data: post } = await supabase.from('collaboration_posts').select('author_id').eq('id', app.post_id).maybeSingle()
  if (!post || post.author_id !== user.id) return { error: 'Not authorized.' }

  await supabase.from('collaboration_applications').update({ status }).eq('id', applicationId)
  revalidatePath(`/collaborate/${app.post_id}`)
  return { ok: true }
}

export async function closeCollabPost(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('collaboration_posts').update({ status: 'closed' }).eq('id', postId).eq('author_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/collaborate')
  return { ok: true }
}
