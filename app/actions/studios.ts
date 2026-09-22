'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { slugify, stripDangerousUnicode, isHttpsUrl } from '@/lib/utils'

/*
 * Membership, roles, invitations, ownership safety and privileged studio fields
 * are enforced in the database (migrations 034/035): who may invite, change
 * roles, remove, leave, and the last-owner rule cannot be bypassed by calling
 * the API directly. Messages the database raises deliberately (SQLSTATE P0001)
 * are shown as-is; anything else becomes a generic message.
 */

type ActionResult = { error: string } | { success: true; slug?: string }
type DbError = { code?: string; message: string } | null

function friendly(error: DbError, fallback: string): string {
  if (!error) return fallback
  if (error.code === 'P0001') return error.message
  return fallback
}

const SIZES = ['solo', '2-10', '11-50', '50+']

function readStudioFields(formData: FormData) {
  return {
    name: stripDangerousUnicode(((formData.get('name') as string) ?? '').trim()),
    description: stripDangerousUnicode(((formData.get('description') as string) ?? '').trim()),
    website: ((formData.get('website') as string) ?? '').trim(),
    location: stripDangerousUnicode(((formData.get('location') as string) ?? '').trim()),
    size: ((formData.get('size') as string) ?? 'solo'),
  }
}

function validateStudioFields(f: ReturnType<typeof readStudioFields>): string | null {
  if (!f.name) return 'Studio name is required.'
  if (f.name.length > 200) return 'Name must be 200 characters or fewer.'
  if (f.description.length > 5000) return 'Description must be 5000 characters or fewer.'
  if (f.location.length > 100) return 'Location must be 100 characters or fewer.'
  if (!SIZES.includes(f.size)) return 'Invalid size.'
  if (f.website && (f.website.length > 500 || !isHttpsUrl(f.website))) return 'Website must be a full https:// URL.'
  return null
}

export async function createStudio(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const f = readStudioFields(formData)
    const invalid = validateStudioFields(f)
    if (invalid) return { error: invalid }
    const foundedRaw = formData.get('founded_year') as string
    const founded = foundedRaw ? parseInt(foundedRaw, 10) : null
    if (founded !== null && (!Number.isInteger(founded) || founded < 1970 || founded > 2100)) return { error: 'Invalid founding year.' }

    // Product rule kept from before: one owned studio per developer.
    const { data: existing } = await supabase.from('studio_members').select('studio_id').eq('user_id', user.id).eq('role', 'owner').maybeSingle()
    if (existing) return { error: 'You already own a studio. Manage it from your dashboard.' }

    const baseSlug = slugify(f.name) || 'studio'
    let slug = baseSlug
    for (let attempt = 1; ; attempt++) {
      const { data: taken } = await supabase.from('studios').select('id').eq('slug', slug).maybeSingle()
      if (!taken) break
      if (attempt > 10) return { error: 'Could not generate a unique address. Try a different name.' }
      slug = `${baseSlug}-${attempt}`
    }

    // Creates the studio and its first owner atomically (no ownerless studio, nothing claimable).
    const { error } = await supabase.rpc('create_studio', {
      p_slug: slug, p_name: f.name, p_description: f.description, p_website: f.website,
      p_location: f.location, p_size: f.size, p_founded_year: founded,
    })
    if (error) return { error: friendly(error, 'Could not create the studio. Please try again.') }

    revalidatePath('/dashboard/studios')
    return { success: true, slug }
  } catch (e) {
    if (e && typeof e === 'object' && 'digest' in e) throw e // redirect()
    return { error: 'An unexpected error occurred.' }
  }
}

export async function updateStudio(studioId: string, formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sign in to continue.' }

    const f = readStudioFields(formData)
    const invalid = validateStudioFields(f)
    if (invalid) return { error: invalid }

    // Only owners/admins match the RLS update policy, and only identity columns are writable.
    const { data, error } = await supabase
      .from('studios')
      .update({ name: f.name, description: f.description || null, website: f.website || null, location: f.location || null, size: f.size })
      .eq('id', studioId)
      .select('slug')
    if (error) return { error: 'Could not update the studio.' }
    if (!data || data.length === 0) return { error: 'Only studio owners and admins can edit the studio.' }

    revalidatePath(`/studios/${data[0].slug}`)
    revalidatePath('/dashboard/studios')
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function addStudioProject(studioId: string, projectId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sign in to continue.' }

    const { error } = await supabase.from('studio_projects').insert({ studio_id: studioId, project_id: projectId })
    if (error) {
      if (error.code === '23505') return { error: 'That project is already linked to this studio.' }
      if (error.code === '42501') return { error: 'Only studio owners and admins can link projects, and only their own.' }
      return { error: 'Could not link the project.' }
    }
    revalidatePath('/dashboard/studios')
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

/** Owners/admins can unlink any studio project; a project's own owner can always unlink their project. */
export async function removeStudioProject(studioId: string, projectId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sign in to continue.' }

    const { data, error } = await supabase.from('studio_projects').delete().eq('studio_id', studioId).eq('project_id', projectId).select('project_id')
    if (error) return { error: 'Could not unlink the project.' }
    if (!data || data.length === 0) return { error: 'You cannot unlink that project.' }
    revalidatePath('/dashboard/studios')
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function inviteStudioMember(studioId: string, username: string, role: 'admin' | 'member'): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sign in to continue.' }
    const clean = stripDangerousUnicode(username.trim().replace(/^@/, ''))
    if (!clean) return { error: 'Enter a username.' }

    const { error } = await supabase.rpc('invite_studio_member', { p_studio: studioId, p_username: clean, p_role: role })
    if (error) return { error: friendly(error, 'Could not send the invitation.') }
    revalidatePath('/dashboard/studios')
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function respondStudioInvitation(invitationId: string, accept: boolean): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sign in to continue.' }
    const { error } = await supabase.rpc('respond_studio_invitation', { p_invitation: invitationId, p_accept: accept })
    if (error) return { error: friendly(error, 'Could not respond to the invitation.') }
    revalidatePath('/dashboard/studios')
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function revokeStudioInvitation(invitationId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sign in to continue.' }
    const { error } = await supabase.rpc('revoke_studio_invitation', { p_invitation: invitationId })
    if (error) return { error: friendly(error, 'Could not cancel the invitation.') }
    revalidatePath('/dashboard/studios')
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function updateMemberRole(studioId: string, targetUserId: string, role: 'owner' | 'admin' | 'member'): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sign in to continue.' }
    if (!['owner', 'admin', 'member'].includes(role)) return { error: 'Invalid role.' }

    // Only an owner may change roles and a studio always keeps an owner — both enforced by studio_members_guard.
    const { data, error } = await supabase.from('studio_members').update({ role }).eq('studio_id', studioId).eq('user_id', targetUserId).select('user_id')
    if (error) return { error: friendly(error, 'Could not change the role.') }
    if (!data || data.length === 0) return { error: 'Member not found.' }
    revalidatePath('/dashboard/studios')
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function removeStudioMember(studioId: string, targetUserId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sign in to continue.' }

    const { data, error } = await supabase.from('studio_members').delete().eq('studio_id', studioId).eq('user_id', targetUserId).select('user_id')
    if (error) return { error: friendly(error, 'Could not remove the member.') }
    if (!data || data.length === 0) return { error: 'You cannot remove that member.' }
    revalidatePath('/dashboard/studios')
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function leaveStudio(studioId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sign in to continue.' }

    const { data, error } = await supabase.from('studio_members').delete().eq('studio_id', studioId).eq('user_id', user.id).select('user_id')
    if (error) return { error: friendly(error, 'Could not leave the studio.') }
    if (!data || data.length === 0) return { error: 'You are not a member of this studio.' }
    revalidatePath('/dashboard/studios')
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}
