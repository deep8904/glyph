'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { stripDangerousUnicode } from '@/lib/utils'

type ActionResult = { error: string } | { success: true; id?: string }

export async function createPublisherAccount(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const company_name = stripDangerousUnicode((formData.get('company_name') as string ?? '').trim())
    if (!company_name) return { error: 'Company name is required.' }
    if (company_name.length > 200) return { error: 'Company name too long.' }

    const { data: existing } = await supabase.from('publisher_accounts').select('id').eq('user_id', user.id).maybeSingle()
    if (existing) return { error: 'You already have a publisher account.' }

    const { data, error } = await supabase
      .from('publisher_accounts')
      .insert({ user_id: user.id, company_name })
      .select('id')
      .single()

    if (error || !data) return { error: 'Failed to create publisher account.' }
    return { success: true, id: data.id }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function createShortlist(name: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated.' }

    const cleanName = stripDangerousUnicode(name.trim())
    if (!cleanName || cleanName.length > 100) return { error: 'Invalid shortlist name.' }

    const { data: publisher } = await supabase.from('publisher_accounts').select('id').eq('user_id', user.id).maybeSingle()
    if (!publisher) return { error: 'No publisher account found.' }

    const { data, error } = await supabase
      .from('publisher_shortlists')
      .insert({ publisher_id: publisher.id, name: cleanName })
      .select('id')
      .single()

    if (error || !data) return { error: 'Failed to create shortlist.' }
    return { success: true, id: data.id }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function addToShortlist(shortlistId: string, projectId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated.' }

    const { data: publisher } = await supabase.from('publisher_accounts').select('id').eq('user_id', user.id).maybeSingle()
    if (!publisher) return { error: 'No publisher account found.' }

    const { data: shortlist } = await supabase.from('publisher_shortlists').select('id, items, publisher_id').eq('id', shortlistId).maybeSingle()
    if (!shortlist || shortlist.publisher_id !== publisher.id) return { error: 'Shortlist not found.' }

    const items: string[] = Array.isArray(shortlist.items) ? shortlist.items : []
    if (items.includes(projectId)) return { error: 'Already in this shortlist.' }
    if (items.length >= 100) return { error: 'Shortlist is full (max 100 projects).' }

    const { error } = await supabase
      .from('publisher_shortlists')
      .update({ items: [...items, projectId] })
      .eq('id', shortlistId)

    if (error) return { error: 'Failed to update shortlist.' }
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function removeFromShortlist(shortlistId: string, projectId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated.' }

    const { data: publisher } = await supabase.from('publisher_accounts').select('id').eq('user_id', user.id).maybeSingle()
    if (!publisher) return { error: 'No publisher account found.' }

    const { data: shortlist } = await supabase.from('publisher_shortlists').select('id, items, publisher_id').eq('id', shortlistId).maybeSingle()
    if (!shortlist || shortlist.publisher_id !== publisher.id) return { error: 'Shortlist not found.' }

    const items: string[] = Array.isArray(shortlist.items) ? shortlist.items : []
    const { error } = await supabase
      .from('publisher_shortlists')
      .update({ items: items.filter((i) => i !== projectId) })
      .eq('id', shortlistId)

    if (error) return { error: 'Failed to update shortlist.' }
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function contactDeveloper(developerId: string, message: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated.' }

    const cleanMsg = stripDangerousUnicode(message.trim())
    if (!cleanMsg) return { error: 'Message is required.' }
    if (cleanMsg.length > 2000) return { error: 'Message too long (max 2000 characters).' }
    if (user.id === developerId) return { error: 'You cannot contact yourself.' }

    const { data: publisher } = await supabase.from('publisher_accounts').select('id').eq('user_id', user.id).maybeSingle()
    if (!publisher) return { error: 'No publisher account found.' }

    const { data: dev } = await supabase.from('profiles').select('id').eq('id', developerId).maybeSingle()
    if (!dev) return { error: 'Developer not found.' }

    const { error } = await supabase.from('publisher_contacts').insert({
      publisher_id: publisher.id,
      developer_id: developerId,
      message: cleanMsg,
    })

    if (error) return { error: 'Failed to send message.' }

    // Note: this insert was previously broken — wrong column (user_id
    // instead of recipient_id), a nonexistent `body` column, and a `type`
    // value ('publisher_contact') the notifications table's check
    // constraint doesn't allow. It silently failed every time, so no
    // developer ever received a notification for a publisher contact.
    // 'mention' is the closest existing type; entity_type/entity_id point
    // back to the publisher_contacts row so the UI can link to it later.
    await supabase.from('notifications').insert({
      recipient_id: developerId,
      actor_id: user.id,
      type: 'mention',
      entity_type: 'publisher_contact',
      entity_id: publisher.id,
    })

    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}
