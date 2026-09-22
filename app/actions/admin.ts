'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { stripDangerousUnicode } from '@/lib/utils'

type ActionResult = { error: string } | { success: true }

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!adminUser) redirect('/')
  return { supabase, user, adminUser }
}

async function writeAuditLog(
  supabase: Awaited<ReturnType<typeof createClient>>,
  adminId: string,
  action: string,
  targetType: string | null,
  targetId: string | null,
  metadata: Record<string, unknown> = {}
) {
  await supabase.from('audit_log').insert({ admin_id: adminId, action, target_type: targetType, target_id: targetId, metadata })
}

export async function updateModerationStatus(
  itemId: string,
  status: 'reviewing' | 'actioned' | 'dismissed',
  resolution?: string
): Promise<ActionResult> {
  try {
    const { supabase, adminUser } = await requireAdmin()
    const res = stripDangerousUnicode(resolution?.trim() ?? '')

    const { error } = await supabase
      .from('moderation_queue')
      .update({
        status,
        resolution: res || null,
        resolved_at: status === 'actioned' || status === 'dismissed' ? new Date().toISOString() : null,
        assigned_to: adminUser.id,
      })
      .eq('id', itemId)

    if (error) return { error: 'Failed to update moderation item.' }

    await writeAuditLog(supabase, adminUser.id, `moderation_${status}`, 'moderation_queue', itemId, { resolution: res })
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function approveGameJam(jamId: string): Promise<ActionResult> {
  try {
    const { supabase, adminUser } = await requireAdmin()

    const { error } = await supabase.from('game_jams').update({ admin_approved: true }).eq('id', jamId)
    if (error) return { error: 'Failed to approve jam.' }

    await writeAuditLog(supabase, adminUser.id, 'jam_approved', 'game_jams', jamId)
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function verifyStudio(studioId: string): Promise<ActionResult> {
  try {
    const { supabase, adminUser } = await requireAdmin()

    // Verification is not client-writable; the admin-checked RPC is the only path.
    const { error } = await supabase.rpc('admin_set_verified', { p_kind: 'studio', p_id: studioId, p_verified: true })
    if (error) return { error: 'Failed to verify studio.' }

    await writeAuditLog(supabase, adminUser.id, 'studio_verified', 'studios', studioId)
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function verifyPublisher(publisherId: string): Promise<ActionResult> {
  try {
    const { supabase, adminUser } = await requireAdmin()

    const { error } = await supabase.rpc('admin_set_verified', { p_kind: 'publisher', p_id: publisherId, p_verified: true })
    if (error) return { error: 'Failed to verify publisher.' }

    await writeAuditLog(supabase, adminUser.id, 'publisher_verified', 'publisher_accounts', publisherId)
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function suspendUser(userId: string, reason: string): Promise<ActionResult> {
  try {
    const { supabase, adminUser } = await requireAdmin()
    const cleanReason = stripDangerousUnicode(reason.trim())
    if (!cleanReason) return { error: 'Reason required.' }
    if (cleanReason.length > 500) return { error: 'Reason too long.' }

    const { error } = await supabase
      .from('profiles')
      .update({ collaboration_status: 'closed' })
      .eq('id', userId)

    if (error) return { error: 'Failed to update user.' }

    await writeAuditLog(supabase, adminUser.id, 'user_suspended', 'profiles', userId, { reason: cleanReason })
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function toggleFeatureFlag(key: string, enabled: boolean): Promise<ActionResult> {
  try {
    const { supabase, adminUser } = await requireAdmin()

    const { error } = await supabase
      .from('feature_flags')
      .upsert({ key, enabled, updated_at: new Date().toISOString() }, { onConflict: 'key' })

    if (error) return { error: 'Failed to update feature flag.' }

    await writeAuditLog(supabase, adminUser.id, enabled ? 'flag_enabled' : 'flag_disabled', 'feature_flags', null, { key })
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function reportContent(
  entityType: string,
  entityId: string,
  reason: string,
  description?: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be signed in to report content.' }

    const validTypes = ['profile', 'project', 'devlog_post', 'comment', 'collaboration_post', 'event', 'studio']
    const validReasons = ['spam', 'harassment', 'csam', 'copyright', 'scam', 'other']
    if (!validTypes.includes(entityType)) return { error: 'Invalid entity type.' }
    if (!validReasons.includes(reason)) return { error: 'Invalid reason.' }

    const cleanDesc = stripDangerousUnicode(description?.trim() ?? '')
    if (cleanDesc.length > 2000) return { error: 'Description too long.' }

    const { error } = await supabase.from('moderation_queue').insert({
      entity_type: entityType,
      entity_id: entityId,
      reason,
      reported_by: user.id,
      description: cleanDesc || null,
    })

    if (error) return { error: 'Failed to submit report.' }
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}
