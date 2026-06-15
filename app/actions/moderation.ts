'use server'

import { createClient } from '@/lib/supabase/server'
import { stripDangerousUnicode } from '@/lib/utils'

type ActionResult = { error: string } | { success: true }

export async function blockUser(targetId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated.' }
    if (user.id === targetId) return { error: 'You cannot block yourself.' }

    const { error } = await supabase.from('user_blocks').insert({ blocker_id: user.id, blocked_id: targetId })
    if (error) {
      if (error.code === '23505') return { error: 'Already blocked.' }
      return { error: 'Failed to block user.' }
    }
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function unblockUser(targetId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated.' }

    await supabase.from('user_blocks').delete().eq('blocker_id', user.id).eq('blocked_id', targetId)
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function muteUser(targetId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated.' }
    if (user.id === targetId) return { error: 'You cannot mute yourself.' }

    const { error } = await supabase.from('user_mutes').insert({ muter_id: user.id, muted_id: targetId })
    if (error) {
      if (error.code === '23505') return { error: 'Already muted.' }
      return { error: 'Failed to mute user.' }
    }
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function unmuteUser(targetId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated.' }

    await supabase.from('user_mutes').delete().eq('muter_id', user.id).eq('muted_id', targetId)
    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function banUser(userId: string, reason: string, expiresAt?: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated.' }

    const { data: adminUser } = await supabase.from('admin_users').select('id').eq('user_id', user.id).maybeSingle()
    if (!adminUser) return { error: 'Not authorized.' }

    const cleanReason = stripDangerousUnicode(reason.trim())
    if (!cleanReason || cleanReason.length > 1000) return { error: 'Invalid reason.' }

    const { error } = await supabase.from('user_bans').insert({
      user_id: userId,
      banned_by: adminUser.id,
      reason: cleanReason,
      expires_at: expiresAt ?? null,
    })

    if (error) {
      if (error.code === '23505') return { error: 'User is already banned.' }
      return { error: 'Failed to ban user.' }
    }

    await supabase.from('audit_log').insert({
      admin_id: adminUser.id,
      action: 'user_banned',
      target_type: 'profiles',
      target_id: userId,
      metadata: { reason: cleanReason, expires_at: expiresAt ?? null },
    })

    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function unbanUser(userId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated.' }

    const { data: adminUser } = await supabase.from('admin_users').select('id').eq('user_id', user.id).maybeSingle()
    if (!adminUser) return { error: 'Not authorized.' }

    await supabase.from('user_bans').delete().eq('user_id', userId)

    await supabase.from('audit_log').insert({
      admin_id: adminUser.id,
      action: 'user_unbanned',
      target_type: 'profiles',
      target_id: userId,
      metadata: {},
    })

    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}
