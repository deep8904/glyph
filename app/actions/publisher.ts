'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { stripDangerousUnicode, isHttpsUrl } from '@/lib/utils'

/*
 * Verification, who may contact whom (verified publishers only, not across a
 * block, only about the developer's own PUBLIC project), one contact per
 * publisher+developer+project, the daily limit, contact immutability, shortlist
 * validity and the developer notification are enforced by the database
 * (migration 034). These actions validate input and surface its messages.
 */

type ActionResult = { error: string } | { success: true; id?: string }
type DbError = { code?: string; message: string } | null

function friendly(error: DbError, fallback: string): string {
  if (!error) return fallback
  if (error.code === 'P0001') return error.message
  if (error.code === '23505') return 'You have already contacted this developer about this project.'
  return fallback
}

function readProfileFields(formData: FormData) {
  return {
    company_name: stripDangerousUnicode(((formData.get('company_name') as string) ?? '').trim()),
    description: stripDangerousUnicode(((formData.get('description') as string) ?? '').trim()),
    website: ((formData.get('website') as string) ?? '').trim(),
  }
}

function validateProfileFields(f: ReturnType<typeof readProfileFields>): string | null {
  if (!f.company_name) return 'Company name is required.'
  if (f.company_name.length > 200) return 'Company name must be 200 characters or fewer.'
  if (f.description.length > 2000) return 'Description must be 2000 characters or fewer.'
  if (f.website && (f.website.length > 500 || !isHttpsUrl(f.website))) return 'Website must be a full https:// URL.'
  return null
}

export async function createPublisherAccount(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const f = readProfileFields(formData)
    const invalid = validateProfileFields(f)
    if (invalid) return { error: invalid }

    const { data: existing } = await supabase.from('publisher_accounts').select('id').eq('user_id', user.id).maybeSingle()
    if (existing) return { error: 'You already have a publisher account.' }

    // `verified` and `plan` are not client-writable; the account starts unverified.
    const { data, error } = await supabase
      .from('publisher_accounts')
      .insert({ user_id: user.id, company_name: f.company_name, description: f.description || null, website: f.website || null })
      .select('id')
      .single()
    if (error || !data) return { error: 'Could not create the publisher account.' }
    return { success: true, id: data.id }
  } catch (e) {
    if (e && typeof e === 'object' && 'digest' in e) throw e
    return { error: 'An unexpected error occurred.' }
  }
}

export async function updatePublisherProfile(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sign in to continue.' }
    const f = readProfileFields(formData)
    const invalid = validateProfileFields(f)
    if (invalid) return { error: invalid }

    const { data, error } = await supabase
      .from('publisher_accounts')
      .update({ company_name: f.company_name, description: f.description || null, website: f.website || null })
      .eq('user_id', user.id)
      .select('id')
    if (error) return { error: 'Could not save your publisher profile.' }
    if (!data || data.length === 0) return { error: 'No publisher account found.' }
    revalidatePath('/publishers')
    revalidatePath(`/publishers/${data[0].id}`)
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

async function ownPublisherId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('publisher_accounts').select('id').eq('user_id', userId).maybeSingle()
  return data?.id ?? null
}

export async function createShortlist(name: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sign in to continue.' }
    const cleanName = stripDangerousUnicode(name.trim())
    if (!cleanName || cleanName.length > 100) return { error: 'Shortlist names must be 1–100 characters.' }
    const publisherId = await ownPublisherId(supabase, user.id)
    if (!publisherId) return { error: 'No publisher account found.' }

    const { data, error } = await supabase.from('publisher_shortlists').insert({ publisher_id: publisherId, name: cleanName }).select('id').single()
    if (error || !data) return { error: 'Could not create the shortlist.' }
    revalidatePath('/dashboard/publisher')
    return { success: true, id: data.id }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function addToShortlist(shortlistId: string, projectId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sign in to continue.' }
    const publisherId = await ownPublisherId(supabase, user.id)
    if (!publisherId) return { error: 'No publisher account found.' }

    const { data: shortlist } = await supabase.from('publisher_shortlists').select('id, items').eq('id', shortlistId).eq('publisher_id', publisherId).maybeSingle()
    if (!shortlist) return { error: 'Shortlist not found.' }
    const items: string[] = Array.isArray(shortlist.items) ? shortlist.items : []
    if (items.includes(projectId)) return { error: 'Already in this shortlist.' }

    // Public-only, unique and size limits are enforced by publisher_shortlists_guard.
    const { error } = await supabase.from('publisher_shortlists').update({ items: [...items, projectId] }).eq('id', shortlistId)
    if (error) return { error: friendly(error, 'Could not update the shortlist.') }
    revalidatePath('/dashboard/publisher')
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function removeFromShortlist(shortlistId: string, projectId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sign in to continue.' }
    const publisherId = await ownPublisherId(supabase, user.id)
    if (!publisherId) return { error: 'No publisher account found.' }

    const { data: shortlist } = await supabase.from('publisher_shortlists').select('id, items').eq('id', shortlistId).eq('publisher_id', publisherId).maybeSingle()
    if (!shortlist) return { error: 'Shortlist not found.' }
    const items: string[] = Array.isArray(shortlist.items) ? shortlist.items : []
    const { error } = await supabase.from('publisher_shortlists').update({ items: items.filter((i) => i !== projectId) }).eq('id', shortlistId)
    if (error) return { error: friendly(error, 'Could not update the shortlist.') }
    revalidatePath('/dashboard/publisher')
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

/** Contact a developer about one of their public projects. The project stays attached to the message. */
export async function contactDeveloper(developerId: string, projectId: string | null, message: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sign in to continue.' }

    const cleanMsg = stripDangerousUnicode((message ?? '').trim())
    if (!cleanMsg) return { error: 'Write a message first.' }
    if (cleanMsg.length > 2000) return { error: 'Message too long (max 2000 characters).' }
    const publisherId = await ownPublisherId(supabase, user.id)
    if (!publisherId) return { error: 'You need a publisher account to contact developers.' }

    // Verification, blocks, project ownership/visibility, duplicates, rate limit and the
    // developer's notification are handled by publisher_contacts_guard/_after.
    const { data, error } = await supabase
      .from('publisher_contacts')
      .insert({ publisher_id: publisherId, developer_id: developerId, project_id: projectId, message: cleanMsg })
      .select('id')
      .single()
    if (error || !data) return { error: friendly(error, 'Could not send your message. Try again.') }

    revalidatePath('/dashboard/publisher')
    return { success: true, id: data.id }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

/** Developer-side: read / replied / archived. The message itself can never be edited. */
export async function setContactStatus(contactId: string, status: 'read' | 'replied' | 'archived'): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sign in to continue.' }
    if (!['read', 'replied', 'archived'].includes(status)) return { error: 'Invalid status.' }

    const { data, error } = await supabase.from('publisher_contacts').update({ status }).eq('id', contactId).eq('developer_id', user.id).select('id')
    if (error) return { error: friendly(error, 'Could not update the message.') }
    if (!data || data.length === 0) return { error: 'Message not found.' }
    revalidatePath('/dashboard/publisher-contacts')
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}
